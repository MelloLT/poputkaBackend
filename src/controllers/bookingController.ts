import { Request, Response } from "express";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import User from "../models/User";

// Вспомогательная функция для добавления уведомлений
const addNotification = async (
  userId: string,
  type:
    | "booking_request"
    | "booking_confirmed"
    | "booking_rejected"
    | "info"
    | "success"
    | "error",
  title: string,
  message: string,
  relatedBookingId?: string
) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    const newNotification = {
      id: `NT${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date(),
      relatedBookingId,
    };

    const updatedNotifications = [
      newNotification,
      ...(user.notifications || []),
    ];

    // Ограничиваем количество хранимых уведомлений (последние 100)
    const limitedNotifications = updatedNotifications.slice(0, 100);

    await user.update({ notifications: limitedNotifications });
    console.log(`Уведомление добавлено пользователю ${userId}: ${title}`);
  } catch (error) {
    console.error("Ошибка добавления уведомления:", error);
  }
};

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
      passengerId: req.user!.id,
      tripId,
      seats: parseInt(seats),
      status: bookingStatus,
    });

    // Получаем обновленные данные для уведомлений
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

    // Добавляем уведомление пассажиру
    if (trip.instantBooking) {
      await addNotification(
        passengerId,
        "booking_confirmed",
        "Бронь создана",
        `Вы забронировали ${seats} место(а) в поездке ${trip.from.cityKey} → ${trip.to.cityKey}. Поездка подтверждена автоматически.`,
        booking.id
      );
    } else {
      await addNotification(
        passengerId,
        "booking_request",
        "Запрос отправлен",
        `Ваш запрос на бронирование ${seats} места(а) в поездке ${trip.from.cityKey} → ${trip.to.cityKey} отправлен водителю. Ожидайте подтверждения.`,
        booking.id
      );
    }

    // Добавляем уведомление водителю
    if (!trip.instantBooking) {
      await addNotification(
        trip.driverId,
        "booking_request",
        "Новый запрос на бронирование",
        `${req.user!.firstName} ${
          req.user!.lastName
        } хочет забронировать ${seats} место(а) в вашей поездке.`,
        booking.id
      );
    } else {
      await addNotification(
        trip.driverId,
        "booking_confirmed",
        "Автоматическое бронирование",
        `${req.user!.firstName} ${
          req.user!.lastName
        } забронировал(а) ${seats} место(а) в вашей поездке через мгновенное бронирование.`,
        booking.id
      );
    }

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

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await Booking.findByPk(id, {
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
                "telegram",
                "phone",
                "phoneVerified",
              ],
            },
          ],
        },
        {
          model: User,
          as: "passenger",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "avatar",
            "rating",
            "telegram",
            "phone",
            "phoneVerified",
          ],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Бронирование не найдено",
      });
    }

    // Проверяем, что пользователь имеет доступ к этому бронированию
    const isDriver =
      req.user!.role === "driver" && booking.trip?.driverId === userId;
    const isPassenger = booking.passengerId === userId;

    if (!isDriver && !isPassenger) {
      return res.status(403).json({
        success: false,
        message: "У вас нет доступа к этому бронированию",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error("Ошибка при получении бронирования:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении бронирования",
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

    // Добавляем уведомление водителю об отмене
    if (trip) {
      await addNotification(
        trip.driverId,
        "booking_rejected",
        "Бронь отменена",
        `${req.user!.firstName} ${
          req.user!.lastName
        } отменил(а) бронирование на ${
          booking.seats
        } место(а) в вашей поездке.`,
        booking.id
      );
    }

    // Добавляем уведомление пассажиру
    await addNotification(
      passengerId,
      "info",
      "Бронь отменена",
      `Вы отменили бронирование на ${booking.seats} место(а) в поездке ${trip?.from.cityKey} → ${trip?.to.cityKey}.`,
      booking.id
    );

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

export const getPassengerTripHistory = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user!.id;
    const { status = "confirmed" } = req.query;

    const bookings = await Booking.findAll({
      where: {
        passengerId,
        status: status.toString(),
      },
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

    const trips = bookings
      .map((booking) => {
        if (!booking.trip) return null;

        return {
          ...booking.trip.toJSON(),
          bookingInfo: {
            seats: booking.seats,
            status: booking.status,
            bookedAt: booking.createdAt,
          },
        };
      })
      .filter((trip) => trip !== null);

    res.json({
      success: true,
      data: trips,
      meta: {
        total: trips.length,
        role: "passenger",
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения истории поездок пассажира:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении истории поездок",
    });
  }
};

export const getPassengerActiveTrips = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user!.id;

    const bookings = await Booking.findAll({
      where: {
        passengerId,
        status: "confirmed",
      },
      include: [
        {
          model: Trip,
          as: "trip",
          where: {
            status: "active", // Только активные поездки
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
                "car",
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const trips = bookings
      .map((booking) => {
        if (!booking.trip) return null;

        return {
          ...booking.trip.toJSON(),
          bookingInfo: {
            id: booking.id,
            seats: booking.seats,
            status: booking.status,
            bookedAt: booking.createdAt,
          },
        };
      })
      .filter((trip) => trip !== null);

    res.json({
      success: true,
      data: trips,
      meta: {
        total: trips.length,
        role: "passenger",
        status: "active",
      },
    });
  } catch (error: any) {
    console.error(
      "Ошибка получения активных поездок пассажира:",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении активных поездок",
    });
  }
};
