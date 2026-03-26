import { Request, Response } from "express";
import User from "../models/User";
import Trip from "../models/Trip";
import Booking from "../models/Booking";

export const createReview = async (req: Request, res: Response) => {
  try {
    const authorId = req.user!.id;
    const { tripId, targetUserId, driving, cleanliness, politeness, text } =
      req.body;

    // Валидация
    if (
      !tripId ||
      !targetUserId ||
      !driving ||
      !cleanliness ||
      !politeness ||
      !text
    ) {
      return res.status(400).json({
        success: false,
        message: "Все поля обязательны",
      });
    }

    // Проверка рейтингов (от 1 до 5)
    const ratings = [driving, cleanliness, politeness];
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Рейтинг должен быть от 1 до 5",
        });
      }
    }

    //  средняя оценка отзыва
    const averageRating = (driving + cleanliness + politeness) / 3;

    // проверка поездка завершена
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.status !== "completed") {
      return res.status(403).json({
        success: false,
        message: "Отзыв можно оставить только после завершения поездки",
      });
    }

    let isParticipant = false;

    if (trip.driverId === authorId) {
      // Автор - водитель, цель - пассажир
      const booking = await Booking.findOne({
        where: { tripId, passengerId: targetUserId, status: "confirmed" },
      });
      isParticipant = !!booking;
    } else if (trip.driverId === targetUserId) {
      // Автор - пассажир, цель - водитель
      const booking = await Booking.findOne({
        where: { tripId, passengerId: authorId, status: "confirmed" },
      });
      isParticipant = !!booking;
    } else {
      // Оба пассажиры
      const authorBooking = await Booking.findOne({
        where: { tripId, passengerId: authorId, status: "confirmed" },
      });
      const targetBooking = await Booking.findOne({
        where: { tripId, passengerId: targetUserId, status: "confirmed" },
      });
      isParticipant = !!(authorBooking && targetBooking);
    }

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Вы можете оставить отзыв только участникам поездки",
      });
    }

    // Проверка на повторный отзыв
    const targetUser = await User.findByPk(targetUserId);
    const existingReview = targetUser?.reviews?.find(
      (review: any) => review.authorId === authorId && review.tripId === tripId,
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Вы уже оставляли отзыв за эту поездку",
      });
    }

    const author = await User.findByPk(authorId);

    // Новый отзыв
    const newReview = {
      author: author!.fullName,
      authorId: authorId,
      text: text.trim(),
      rating: averageRating,
      driving,
      cleanliness,
      politeness,
      createdAt: new Date(),
      tripId: tripId,
    };

    // Обновляем массив отзывов
    const updatedReviews = [...(targetUser?.reviews || []), newReview];

    // Пересчитываем общий рейтинг пользователя
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverageRating = totalRating / updatedReviews.length;

    await targetUser!.update({
      reviews: updatedReviews,
      rating: parseFloat(newAverageRating.toFixed(1)), // общий рейтинг
    });

    res.status(201).json({
      success: true,
      message: "Отзыв добавлен успешно",
      data: {
        review: newReview,
        newRating: newAverageRating,
      },
    });
  } catch (error: any) {
    console.error("Ошибка создания отзыва:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании отзыва",
    });
  }
};

export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const user = await User.findByPk(userId, {
      attributes: ["id", "firstName", "lastName", "rating", "reviews", "role"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const reviews = user.reviews || [];
    const total = reviews.reduce(
      (acc, r) => ({
        driving: acc.driving + (r.driving || r.rating),
        cleanliness: acc.cleanliness + (r.cleanliness || r.rating),
        politeness: acc.politeness + (r.politeness || r.rating),
      }),
      { driving: 0, cleanliness: 0, politeness: 0 },
    );

    const count = reviews.length;

    // рейтинги от лица водителя
    const detailedRatings =
      count > 0
        ? {
            driving: parseFloat((total.driving / count).toFixed(1)),
            cleanliness: parseFloat((total.cleanliness / count).toFixed(1)),
            politeness: parseFloat((total.politeness / count).toFixed(1)),
            average: user.rating,
            count: count,
          }
        : {
            driving: 0,
            cleanliness: 0,
            politeness: 0,
            average: 0,
            count: 0,
          };

    const isOwner = currentUserId === userId;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          rating: user.rating,
          role: user.role,
          ...(isOwner && { detailedRatings }),
        },
        reviews: reviews.map((r) => ({
          ...r,
          average: r.rating,
          ...(isOwner && {
            driving: r.driving,
            cleanliness: r.cleanliness,
            politeness: r.politeness,
          }),
        })),
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения отзывов:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении отзывов",
    });
  }
};
