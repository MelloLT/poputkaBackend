import { Request, Response } from "express";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import User from "../models/User";
import { updateTripParticipantsActiveTrips } from "../services/userTripsService";
import { io } from "../index";
import { pushNotification } from "../utils/notifications";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";
import { addNotification, createTripParams } from "../utils/notificationHelper";

// Получить все бронирования для поездок водителя
export const getDriverBookings = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;

    // Находим все поездки водителя
    const trips = await Trip.findAll({
      where: { driverId },
      attributes: ["id"],
    });

    const tripIds = trips.map((trip) => trip.id);

    // Находим все бронирования для этих поездок
    const bookings = await Booking.findAll({
      where: {
        tripId: tripIds,
        status: ["pending", "confirmed"],
      },
      include: [
        {
          model: User,
          as: "passenger",
          attributes: ["id", "firstName", "lastName", "avatar", "rating"],
        },
        {
          model: Trip,
          as: "trip",
          attributes: ["id", "from", "to", "departureAt"],
          include: [
            {
              model: User,
              as: "driver",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Ошибка получения бронирований:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении бронирований",
    });
  }
};

// Подтвердить бронирование
export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const driverId = req.user!.id;

    // Находим бронирование и проверяем что водитель владеет поездкой
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: Trip,
          as: "trip",
          where: { driverId },
          required: true,
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Бронь не найдена или у вас нет прав",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Бронь уже обработана",
      });
    }

    // Проверяем что есть достаточно мест
    const trip = await Trip.findByPk(booking.tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }
    if (trip.status === "created") {
      return res.status(402).json({
        success: false,
        code: "PAYMENT_REQUIRED",
        message:
          "Для подтверждения бронирования необходимо оплатить налог за поездку",
        data: {
          tripId: trip.id,
          status: trip.status,
          requiresPayment: true,
        },
      });
    }

    // Если поездка не в статусе paid, тоже отклоняем
    if (trip.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: `Поездка не готова к подтверждению. Текущий статус: ${trip.status}`,
      });
    }
    if (trip.availableSeats < booking.seats) {
      return res.status(400).json({
        success: false,
        message: "Недостаточно свободных мест",
      });
    }

    // Обновить бронирование
    await booking.update({ status: "confirmed" });

    // Обновить количество свободных мест
    await trip.update({
      availableSeats: trip.availableSeats - booking.seats,
    });

    await updateTripParticipantsActiveTrips(trip.id);

    // Добавить уведомление пассажиру
    const passenger = await User.findByPk(booking.passengerId);
    if (passenger) {
      const newNotification = {
        id: Date.now().toString(),
        type: "success" as const,
        title: "Бронь подтверждена",
        message: `Водитель подтвердил вашу бронь на поездку ${trip.from.cityKey} → ${trip.to.cityKey}`,
        isRead: false,
        createdAt: new Date(),
        relatedBookingId: booking.id,
      };

      const updatedNotifications = [
        ...(passenger.notifications || []),
        newNotification,
      ];
      pushNotification(io, passenger.id, newNotification);

      await passenger.update({ notifications: updatedNotifications });
    }

    res.json({
      success: true,
      message: "Бронь подтверждена",
      data: booking,
    });
  } catch (error) {
    console.error("Ошибка подтверждения брони:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при подтверждении брони",
    });
  }
};

// Отклонить бронирование
export const rejectBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const driverId = req.user!.id;

    // Нахождение бронирования и проверка что водитель владеет поездкой
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: Trip,
          as: "trip",
          where: { driverId },
          required: true,
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Бронь не найдена или у вас нет прав",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Бронь уже обработана",
      });
    }

    // Обновить бронирование
    await booking.update({ status: "rejected" });
    await updateTripParticipantsActiveTrips(booking.tripId);

    // Добавление уведомление пассажиру
    const passenger = await User.findByPk(booking.passengerId);
    if (passenger) {
      // Получаем данные поездки для уведомления
      const trip = await Trip.findByPk(booking.tripId);
      if (trip) {
        const newNotification = {
          id: Date.now().toString(),
          type: "error" as const,
          title: "Бронь отклонена",
          message: `Водитель отклонил вашу бронь на поездку ${trip.from.cityKey} → ${trip.to.cityKey}`,
          isRead: false,
          createdAt: new Date(),
          relatedBookingId: booking.id,
        };

        const updatedNotifications = [
          ...(passenger.notifications || []),
          newNotification,
        ];
        pushNotification(io, booking.passengerId, newNotification);

        await passenger.update({ notifications: updatedNotifications });
      }
    }

    res.json({
      success: true,
      message: "Бронь отклонена",
      data: booking,
    });
  } catch (error) {
    console.error("Ошибка отклонения брони:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при отклонении брони",
    });
  }
};

export const getDriverTripHistory = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { status = "completed" } = req.query;

    console.log(
      "Получаем историю поездок для водителя:",
      driverId,
      "статус:",
      status,
    );

    const trips = await Trip.findAll({
      where: {
        driverId,
        status: status.toString(),
      },
      include: [
        {
          model: User,
          as: "driver",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "avatar",
            "rating",
            "tripsCount",
          ],
        },
        {
          model: Booking,
          as: "bookings",
          include: [
            {
              model: User,
              as: "passenger",
              attributes: ["id", "firstName", "lastName", "avatar", "rating"],
            },
          ],
        },
      ],
      order: [["departureAt", "DESC"]],
    });

    console.log("Найдено поездок:", trips.length);

    res.json({
      success: true,
      data: trips,
      meta: {
        total: trips.length,
        role: "driver",
        status: status,
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения истории поездок водителя:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении истории поездок",
    });
  }
};
