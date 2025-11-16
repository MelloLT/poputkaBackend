import { Request, Response } from "express";
import User from "../models/User";
import Trip from "../models/Trip";
import Booking from "../models/Booking";

export const createReview = async (req: Request, res: Response) => {
  try {
    const authorId = req.user!.id;
    const { tripId, targetUserId, rating, text } = req.body;

    if (!tripId || !targetUserId || !rating || !text) {
      return res.status(400).json({
        success: false,
        message: "Все поля обязательны: tripId, targetUserId, rating, text",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Рейтинг должен быть от 1 до 5",
      });
    }

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }

    const booking = await Booking.findOne({
      where: {
        tripId,
        passengerId: authorId,
        status: "confirmed",
      },
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: "Вы не можете оставить отзыв для этой поездки",
      });
    }

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const author = await User.findByPk(authorId);
    const newReview = {
      author: author!.fullName,
      authorId: authorId,
      text: text.trim(),
      rating: parseInt(rating),
      createdAt: new Date(),
      tripId: tripId,
    };

    const updatedReviews = [...(targetUser.reviews || []), newReview];

    const averageRating =
      updatedReviews.reduce((sum, review) => sum + review.rating, 0) /
      updatedReviews.length;

    await targetUser.update({
      reviews: updatedReviews,
      rating: parseFloat(averageRating.toFixed(1)),
    });

    res.status(201).json({
      success: true,
      message: "Отзыв добавлен успешно",
      data: {
        review: newReview,
        newAverageRating: averageRating,
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

    const user = await User.findByPk(userId, {
      attributes: ["id", "firstName", "lastName", "rating", "reviews"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          rating: user.rating,
        },
        reviews: user.reviews || [],
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
