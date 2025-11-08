import { Request, Response } from "express";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import User from "../models/User";

export const createBooking = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user!.id;
    const { tripId, seats } = req.body;

    if (!tripId || !seats) {
      return res.status(400).json({
        success: false,
        message: "tripId и seats обязательны",
      });
    }

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }

    // ПРОВЕРКА: нельзя бронировать если 0 мест
    if (trip.availableSeats === 0) {
      return res.status(400).json({
        success: false,
        message: "В этой поездке нет свободных мест",
      });
    }

    if (trip.availableSeats < seats) {
      return res.status(400).json({
        success: false,
        message: `Недостаточно свободных мест. Доступно: ${trip.availableSeats}`,
      });
    }

    // Определяем статус брони
    let bookingStatus: "pending" | "confirmed" = "pending";

    // Если instantBooking = true, то сразу confirmed
    if (trip.instantBooking) {
      bookingStatus = "confirmed";

      // Сразу уменьшаем места
      await trip.update({
        availableSeats: trip.availableSeats - seats,
      });
    }

    const booking = await Booking.create({
      passengerId,
      tripId,
      seats: parseInt(seats),
      status: bookingStatus,
    });

    // Добавляем уведомление пассажиру
    const passenger = await User.findByPk(passengerId);
    if (passenger && trip.instantBooking) {
      const newNotification = {
        id: Date.now().toString(),
        type: "success" as const,
        title: "Бронь создана",
        message: `Вы забронировали поездку ${trip.from.cityKey} → ${trip.to.cityKey}`,
        isRead: false,
        createdAt: new Date(),
        relatedBookingId: booking.id,
      };

      const updatedNotifications = [
        ...(passenger.notifications || []),
        newNotification,
      ];
      await passenger.update({ notifications: updatedNotifications });
    }

    // Добавляем уведомление водителю о новой брони
    const driver = await User.findByPk(trip.driverId);
    if (driver && !trip.instantBooking) {
      const newNotification = {
        id: Date.now().toString(),
        type: "info" as const,
        title: "Новая бронь",
        message: `Пассажир хочет забронировать ${seats} мест в вашей поездке`,
        isRead: false,
        createdAt: new Date(),
        relatedBookingId: booking.id,
      };

      const updatedNotifications = [
        ...(driver.notifications || []),
        newNotification,
      ];
      await driver.update({ notifications: updatedNotifications });
    }

    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        {
          model: Trip,
          as: "trip",
          include: [
            {
              model: User,
              as: "driver",
              attributes: ["id", "firstName", "lastName", "avatar", "rating"],
            },
          ],
        },
        {
          model: User,
          as: "passenger",
          attributes: ["id", "firstName", "lastName", "avatar"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: trip.instantBooking
        ? "Бронь создана успешно"
        : "Запрос на бронь отправлен. Ожидайте подтверждения водителя",
      data: bookingWithDetails,
    });
  } catch (error: any) {
    console.error("Ошибка при создании брони:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании брони",
    });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user!.id;

    const bookings = await Booking.findAll({
      where: { passengerId },
      include: [
        {
          model: Trip,
          as: "trip",
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
                "car",
              ],
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
  } catch (error: any) {
    console.error("Ошибка при получении броней:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении броней",
    });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const passengerId = req.user!.id;

    const booking = await Booking.findOne({
      where: { id, passengerId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Бронь не найдена",
      });
    }

    const trip = await Trip.findByPk(booking.tripId);
    if (trip) {
      await trip.update({
        availableSeats: trip.availableSeats + booking.seats,
      });
    }

    await booking.update({ status: "cancelled" });

    res.json({
      success: true,
      message: "Бронь отменена успешно",
    });
  } catch (error: any) {
    console.error("Ошибка при отмене брони:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при отмене брони",
    });
  }
};
