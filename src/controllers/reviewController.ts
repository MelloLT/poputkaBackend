import { Request, Response } from "express";
import User from "../models/User";
import Trip from "../models/Trip";
import Booking from "../models/Booking";
import { ErrorCodes } from "../utils/errorCodes";
import { sendError, sendSuccess } from "../utils/responseHelper";

export const createReview = async (req: Request, res: Response) => {
  try {
    const authorId = req.user!.id;
    const {
      tripId,
      targetUserId,
      driving,
      cleanliness,
      politeness,
      text,
      rating,
    } = req.body;

    // Валидация общих полей
    if (!tripId || !targetUserId || !text) {
      return sendError(res, ErrorCodes.REVIEW_FIELDS_REQUIRED, 400);
    }

    // Получаем целевого пользователя (кому отзыв)
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
    }

    let averageRating: number;

    // Логика в зависимости от роли получателя
    if (targetUser.role === "driver") {
      // ✅ Водителю нужны 3 оценки
      if (!driving || !cleanliness || !politeness) {
        return sendError(res, ErrorCodes.REVIEW_FIELDS_REQUIRED, 400, {
          required: ["driving", "cleanliness", "politeness"],
        });
      }

      // Проверка рейтингов (от 1 до 5)
      const ratings = [driving, cleanliness, politeness];
      for (const r of ratings) {
        if (r < 1 || r > 5) {
          return sendError(res, ErrorCodes.REVIEW_RATING_INVALID, 400);
        }
      }

      averageRating = (driving + cleanliness + politeness) / 3;
    } else {
      // ✅ Пассажиру нужна 1 общая оценка
      if (!rating) {
        return sendError(res, ErrorCodes.REVIEW_FIELDS_REQUIRED, 400, {
          required: ["rating"],
        });
      }

      if (rating < 1 || rating > 5) {
        return sendError(res, ErrorCodes.REVIEW_RATING_INVALID, 400);
      }

      averageRating = rating;
    }

    // Проверка поездка завершена
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.status !== "completed") {
      return sendError(res, ErrorCodes.REVIEW_NOT_ALLOWED, 403);
    }

    // Проверка участия в поездке
    let isParticipant = false;

    if (trip.driverId === authorId) {
      const booking = await Booking.findOne({
        where: { tripId, passengerId: targetUserId, status: "confirmed" },
      });
      isParticipant = !!booking;
    } else if (trip.driverId === targetUserId) {
      const booking = await Booking.findOne({
        where: { tripId, passengerId: authorId, status: "confirmed" },
      });
      isParticipant = !!booking;
    } else {
      const authorBooking = await Booking.findOne({
        where: { tripId, passengerId: authorId, status: "confirmed" },
      });
      const targetBooking = await Booking.findOne({
        where: { tripId, passengerId: targetUserId, status: "confirmed" },
      });
      isParticipant = !!(authorBooking && targetBooking);
    }

    if (!isParticipant) {
      return sendError(res, ErrorCodes.REVIEW_NOT_ALLOWED, 403);
    }

    // Проверка на повторный отзыв
    const existingReview = targetUser.reviews?.find(
      (review: any) => review.authorId === authorId && review.tripId === tripId,
    );

    if (existingReview) {
      return sendError(res, ErrorCodes.REVIEW_ALREADY_EXISTS, 400);
    }

    const author = await User.findByPk(authorId);

    // Создаем новый отзыв
    const newReview: any = {
      author: author!.fullName,
      authorId: authorId,
      text: text.trim(),
      rating: averageRating,
      createdAt: new Date(),
      tripId: tripId,
    };

    // Добавляем детальные оценки только для водителя
    if (targetUser.role === "driver") {
      newReview.driving = driving;
      newReview.cleanliness = cleanliness;
      newReview.politeness = politeness;
    }

    // Обновляем массив отзывов
    const updatedReviews = [...(targetUser.reviews || []), newReview];

    const totalRating = updatedReviews.reduce(
      (sum: number, r: any) => sum + r.rating,
      0,
    );
    const newAverageRating = parseFloat(
      (totalRating / updatedReviews.length).toFixed(1),
    );

    await targetUser.update({
      reviews: updatedReviews,
      rating: newAverageRating,
    });

    return sendSuccess(
      res,
      {
        review: newReview,
        newRating: newAverageRating,
      },
      ErrorCodes.REVIEW_ADDED_SUCCESS,
      201,
    );
  } catch (error: any) {
    console.error("Ошибка создания отзыва:", error);
    return sendError(res, ErrorCodes.REVIEW_CREATE_ERROR, 500);
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
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
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

    return sendSuccess(
      res,
      {
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
      ErrorCodes.REVIEWS_FETCH_SUCCESS,
      200,
    );
  } catch (error: any) {
    console.error("Ошибка получения отзывов:", error);
    return sendError(res, ErrorCodes.REVIEWS_FETCH_ERROR, 500);
  }
};
