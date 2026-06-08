import { Request, Response, NextFunction } from "express";
import Trip from "../models/Trip";
import Booking from "../models/Booking";
import User from "../models/User";
import { sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Проверка, что пользователь не бронирует свою поездку
export const checkSelfBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.body;
    const userId = req.user!.id;

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND, 404);
    }

    if (trip.driverId === userId) {
      return sendError(res, ErrorCodes.CANNOT_BOOK_OWN_TRIP, 400);
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки self-booking:", error);
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 500);
  }
};

// Проверка, что поездка активна
export const checkTripActive = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.body;
    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND, 404);
    }

    if (trip.status !== "created" && trip.status !== "paid") {
      return sendError(res, ErrorCodes.TRIP_NOT_ACTIVE, 400);
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки активности поездки:", error);
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 500);
  }
};

// Проверка, что дата поездки в будущем
export const checkFutureTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { departureAt } = req.body;

    if (departureAt) {
      const tripDateTime = new Date(departureAt);
      const now = new Date();

      if (isNaN(tripDateTime.getTime())) {
        return sendError(res, ErrorCodes.INVALID_DATE_FORMAT, 400);
      }

      if (tripDateTime <= now) {
        return sendError(res, ErrorCodes.TRIP_DATETIME_FUTURE_REQUIRED, 400);
      }
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки даты:", error);
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 500);
  }
};

// Проверка, что пользователь не оставляет отзыв самому себе
export const checkSelfReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user!.id;

    if (targetUserId === userId) {
      return sendError(res, ErrorCodes.CANNOT_REVIEW_SELF, 400);
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки self-review:", error);
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 500);
  }
};

// Проверка, что пользователь не повторно оставляет отзыв за поездку
export const checkDuplicateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId, targetUserId } = req.body;
    const userId = req.user!.id;

    const targetUser = await User.findByPk(targetUserId);
    if (targetUser && targetUser.reviews) {
      const existingReview = targetUser.reviews.find(
        (review: any) => review.authorId === userId && review.tripId === tripId,
      );

      if (existingReview) {
        return sendError(res, ErrorCodes.REVIEW_ALREADY_EXISTS, 400);
      }
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки дубликата отзыва:", error);
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 500);
  }
};

// Проверка, что пользователь не редактирует чужой профиль
export const checkProfileOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (id !== userId && req.user!.role !== "admin") {
      return sendError(res, ErrorCodes.EDIT_ONLY_OWN_PROFILE, 403);
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки владения профилем:", error);
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 500);
  }
};

// Проверка максимального количества броней на поездку
export const checkMaxBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.body;
    const userId = req.user!.id;

    const existingBooking = await Booking.findOne({
      where: {
        tripId,
        passengerId: userId,
        status: ["pending", "confirmed"],
      },
    });

    if (existingBooking) {
      return sendError(res, ErrorCodes.ALREADY_BOOKED, 400);
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки броней:", error);
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 500);
  }
};
