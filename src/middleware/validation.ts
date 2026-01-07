import { Request, Response, NextFunction } from "express";
import Trip from "../models/Trip";
import Booking from "../models/Booking";
import User from "../models/User";

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
  next: NextFunction
) => {
  try {
    const { tripId } = req.body;
    const userId = req.user!.id;

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }

    if (trip.driverId === userId) {
      return res.status(400).json({
        success: false,
        message: "Вы не можете забронировать свою собственную поездку",
      });
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки self-booking:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при проверке",
    });
  }
};

// Проверка, что поездка активна
export const checkTripActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tripId } = req.body;
    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }

    if (trip.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Поездка неактивна или уже завершена",
      });
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки активности поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при проверке",
    });
  }
};

// Проверка, что дата поездки в будущем
export const checkFutureTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { departureDate, departureTime } = req.body;

    if (departureDate && departureTime) {
      const tripDateTime = new Date(`${departureDate}T${departureTime}:00`);
      const now = new Date();

      if (tripDateTime <= now) {
        return res.status(400).json({
          success: false,
          message: "Дата и время поездки должны быть в будущем",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки даты:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при проверке даты",
    });
  }
};

// Проверка, что пользователь не оставляет отзыв самому себе
export const checkSelfReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user!.id;

    if (targetUserId === userId) {
      return res.status(400).json({
        success: false,
        message: "Вы не можете оставить отзыв самому себе",
      });
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки self-review:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при проверке",
    });
  }
};

// Проверка, что пользователь не повторно оставляет отзыв за поездку
export const checkDuplicateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tripId, targetUserId } = req.body;
    const userId = req.user!.id;

    const targetUser = await User.findByPk(targetUserId);
    if (targetUser && targetUser.reviews) {
      const existingReview = targetUser.reviews.find(
        (review) => review.authorId === userId && review.tripId === tripId
      );

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "Вы уже оставляли отзыв за эту поездку",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки дубликата отзыва:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при проверке",
    });
  }
};

// Проверка, что пользователь не редактирует чужой профиль
export const checkProfileOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (id !== userId && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Вы можете редактировать только свой профиль",
      });
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки владения профилем:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при проверке",
    });
  }
};

// Проверка максимального количества броней на поездку
export const checkMaxBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
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
      return res.status(400).json({
        success: false,
        message: "Вы уже забронировали эту поездку",
      });
    }

    next();
  } catch (error) {
    console.error("Ошибка проверки броней:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при проверке",
    });
  }
};
