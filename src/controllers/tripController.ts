import { Request, Response } from "express";
import { Op } from "sequelize";
import Trip from "../models/Trip";
import User from "../models/User";
import Booking from "../models/Booking";
import { getTripInfo } from "../services/mapService";
import { isValidCityKey } from "../utils/cityValidator";
import {
  updateTripParticipantsActiveTrips,
  updateUserActiveTrips,
} from "../services/userTripsService";
import { pushNotification } from "../utils/notifications";
import { io } from "../index";
import { sendSuccess, sendError } from "../utils/responseHelper";
export const addNotification = async (
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
  relatedBookingId?: string,
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

    const limitedNotifications = updatedNotifications.slice(0, 100);
    await user.update({ notifications: limitedNotifications });

    console.log(`Уведомление добавлено пользователю ${userId}: ${title}`);
    pushNotification(io, userId, newNotification);
    return newNotification;
  } catch (error) {
    console.error("Ошибка добавления уведомления:", error);
    return null;
  }
};

export const getTrips = async (req: Request, res: Response) => {
  try {
    const {
      from,
      to,
      departureAt,
      minPrice,
      maxPrice,
      seats,
      timeFrom,
      timeTo,
      driverGender,
      sortBy = "earliest",
      instantBookingOnly = false,
      verifiedOnly = false,
    } = req.query;

    console.log("Фильтры запроса:", {
      from,
      to,
      departureAt,
      minPrice,
      maxPrice,
      seats,
      timeFrom,
      timeTo,
      driverGender,
      sortBy,
      instantBookingOnly,
      verifiedOnly,
    });

    const whereClause: any = { status: { [Op.in]: ["created", "paid"] } };
    const includeClause: any = [
      {
        model: User,
        as: "driver",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "avatar",
          "rating",
          "isVerified",
          "car",
          "gender",
        ],
      },
    ];

    // Фильтр по городу отправления
    if (from) {
      whereClause.from = {
        [Op.contains]: { cityKey: from.toString() },
      };
    }

    // Фильтр по городу назначения
    if (to) {
      whereClause.to = {
        [Op.contains]: { cityKey: to.toString() },
      };
    }

    // Фильтр по дате отправления
    if (departureAt) {
      const date = new Date(departureAt as string);
      if (!isNaN(date.getTime())) {
        // Ищем поездки на эту дату (в течение дня)
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        whereClause.departureAt = {
          [Op.between]: [startOfDay, endOfDay],
        };
      }
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) {
        whereClause.price[Op.gte] = parseFloat(minPrice.toString());
      }
      if (maxPrice) {
        whereClause.price[Op.lte] = parseFloat(maxPrice.toString());
      }
    }

    // Фильтр по количеству мест
    if (seats) {
      whereClause.availableSeats = {
        [Op.gte]: parseInt(seats.toString()),
      };
    }

    // Фильтр по полу водителя
    if (driverGender) {
      includeClause[0].where = {
        gender: driverGender.toString(),
      };
    }

    // Фильтр "Только с подтвержденным профилем"
    if (verifiedOnly === "true") {
      includeClause[0].where = {
        ...includeClause[0].where,
        isVerified: true,
      };
    }

    // Фильтр "Мгновенное бронирование"
    if (instantBookingOnly === "true") {
      whereClause.instantBooking = true;
    }

    console.log("Условия поиска:", JSON.stringify(whereClause, null, 2));

    let order: any[] = [];
    if (sortBy === "cheapest") {
      order = [["price", "ASC"]];
    } else {
      // По умолчанию - самые ранние
      order = [["departureAt", "ASC"]];
    }

    const trips = await Trip.findAll({
      where: whereClause,
      include: includeClause,
      order,
    });

    console.log(`Найдено поездок: ${trips.length}`);

    res.json({
      success: true,
      data: trips,
      meta: {
        total: trips.length,
        filters: {
          from,
          to,
          departureAt,
          minPrice,
          maxPrice,
          seats,
          timeFrom,
          timeTo,
          driverGender,
          verifiedOnly: verifiedOnly === "true",
          instantBookingOnly: instantBookingOnly === "true",
          sortBy,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка при поиске поездок:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске поездок",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findByPk(id, {
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
            "isVerified",
            "car",
            "gender",
          ],
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Ошибка при получении поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;

    const {
      from,
      to,
      departureAt,
      price,
      availableSeats,
      description,
      instantBooking = false,
      maxTwoBackSeats = false,
    } = req.body;

    console.log("Создаем поездку для водителя:", driverId, req.body);

    const requiredFields = [
      "from",
      "to",
      "departureAt",
      "price",
      "availableSeats",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Не заполнены обязательные поля: ${missingFields.join(", ")}`,
      });
    }

    if (!isValidCityKey(from.cityKey)) {
      return res.status(400).json({
        success: false,
        message: `Неверный город отправления: ${from.cityKey}`,
      });
    }

    if (!isValidCityKey(to.cityKey)) {
      return res.status(400).json({
        success: false,
        message: `Неверный город назначения: ${to.cityKey}`,
      });
    }

    const departureDateTime = new Date(departureAt);
    const now = new Date();

    if (departureDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Дата и время поездки должны быть в будущем",
      });
    }

    // Автоматически рассчитываем информацию о маршруте
    let tripInfo = null;
    try {
      tripInfo = await getTripInfo(from.cityKey, to.cityKey);
      console.log("Calculated trip info:", tripInfo);
    } catch (error) {
      console.log("Could not calculate trip info, continuing without it");
    }

    const newTrip = await Trip.create({
      driverId: driverId.toString(),
      from,
      to,
      departureAt: departureDateTime,
      price: parseFloat(price),
      availableSeats: parseInt(availableSeats),
      description: description || "",
      instantBooking: Boolean(instantBooking),
      maxTwoBackSeats: Boolean(maxTwoBackSeats),
      status: "created",
      tripInfo: tripInfo || undefined,
    });

    const tripWithDriver = await Trip.findByPk(newTrip.id, {
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
            "isVerified",
            "car",
          ],
        },
      ],
    });

    console.log("Поездка создана, ID:", newTrip.id);

    await updateUserActiveTrips(driverId);
    res.status(201).json({
      success: true,
      message: "Поездка создана успешно",
      data: tripWithDriver,
    });
  } catch (error) {
    console.error("Ошибка при создании поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании поездки",
    });
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user!.id;
    const updateData = req.body;

    console.log("Обновляем поездку ID:", id, "для водителя:", driverId);

    const trip = await Trip.findOne({
      where: { id, driverId },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена или у вас нет прав для редактирования",
      });
    }

    if (updateData.departureAt) {
      updateData.departureAt = new Date(updateData.departureAt);
    }

    await trip.update(updateData);
    await updateTripParticipantsActiveTrips(id);

    res.json({
      success: true,
      message: "Поездка обновлена успешно",
      data: trip,
    });
  } catch (error) {
    console.error("Ошибка при обновлении поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении поездки",
    });
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user!.id;

    console.log("Отменяем поездку ID:", id, "для водителя:", driverId);

    const trip = await Trip.findOne({
      where: { id, driverId },
      include: [
        {
          model: Booking,
          as: "bookings",
          where: { status: "confirmed" },
          include: [
            {
              model: User,
              as: "passenger",
              attributes: ["id", "firstName", "lastName", "avatar"],
            },
          ],
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена или у вас нет прав для удаления",
      });
    }

    // Обновляем статус поездки
    await trip.update({ status: "cancelled" });
    await updateTripParticipantsActiveTrips(id);

    // Добавляем в историю участников как отмененную поездку
    const tripData = {
      tripId: trip.id,
      from: trip.from,
      to: trip.to,
      departureAt: trip.departureAt,
      price: trip.price,
      status: "cancelled" as const,
      completedAt: new Date(),
    };

    // 1. Водителю
    const driver = await User.findByPk(driverId);
    if (driver) {
      const driverHistoryEntry = {
        ...tripData,
        role: "driver" as const,
        passengers: (trip.bookings || []).map((booking) => ({
          id: booking.passenger?.id || booking.passengerId,
          firstName: booking.passenger?.firstName || "Пассажир",
          lastName: booking.passenger?.lastName || "",
          avatar: booking.passenger?.avatar,
          seats: booking.seats,
        })),
      };

      const updatedDriverHistory = [
        driverHistoryEntry,
        ...(driver.tripHistory || []),
      ];

      await driver.update({ tripHistory: updatedDriverHistory });
    }

    // 2. Пассажирам
    for (const booking of trip.bookings || []) {
      const passenger = await User.findByPk(booking.passengerId);
      if (passenger) {
        const passengerHistoryEntry = {
          ...tripData,
          role: "passenger" as const,
        };

        const updatedPassengerHistory = [
          passengerHistoryEntry,
          ...(passenger.tripHistory || []),
        ];

        await passenger.update({ tripHistory: updatedPassengerHistory });

        // Добавляем уведомление пассажиру
        await addNotification(
          booking.passengerId,
          "error",
          "Поездка отменена",
          `Водитель отменил поездку ${trip.from.cityKey} → ${trip.to.cityKey}`,
          booking.id,
        );
      }
    }

    res.json({
      success: true,
      message: "Поездка отменена",
    });
  } catch (error: any) {
    console.error("Ошибка при удалении поездки:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении поездки",
    });
  }
};

export const completeTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user!.id;

    console.log("Завершаем поездку ID:", id, "для водителя:", driverId);

    // Находим поездку с бронированиями и пассажирами
    const trip = await Trip.findOne({
      where: { id, driverId },
      include: [
        {
          model: Booking,
          as: "bookings",
          where: { status: "confirmed" }, // Только подтвержденные брони
          include: [
            {
              model: User,
              as: "passenger",
              attributes: ["id", "firstName", "lastName", "avatar"],
            },
          ],
        },
        {
          model: User,
          as: "driver",
          attributes: ["id", "firstName", "lastName", "avatar"],
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена или у вас нет прав",
      });
    }

    if (trip.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Поездка уже завершена",
      });
    }

    if (trip.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Нельзя завершить отмененную поездку",
      });
    }

    // Обновляем статус поездки
    await trip.update({ status: "completed" });
    await updateTripParticipantsActiveTrips(id);

    // Подготавливаем базовые данные поездки
    const tripData = {
      tripId: trip.id,
      from: trip.from,
      to: trip.to,
      departureAt: trip.departureAt,
      price: trip.price,
      status: "completed" as const,
      completedAt: new Date(),
    };

    // 1. Обновляем историю ВОДИТЕЛЯ
    const driver = await User.findByPk(driverId);
    if (driver && trip.driver) {
      // Подготавливаем информацию о пассажирах
      const passengers = (trip.bookings || []).map((booking) => ({
        id: booking.passenger?.id || booking.passengerId,
        firstName: booking.passenger?.firstName || "Пассажир",
        lastName: booking.passenger?.lastName || "",
        avatar: booking.passenger?.avatar,
        seats: booking.seats,
      }));

      const driverHistoryEntry = {
        ...tripData,
        role: "driver" as const,
        passengers: passengers,
      };

      const updatedDriverHistory = [
        driverHistoryEntry,
        ...(driver.tripHistory || []),
      ];

      await driver.update({
        tripHistory: updatedDriverHistory,
        tripsCount: (driver.tripsCount || 0) + 1,
      });

      console.log(
        `История водителя ${driver.id} обновлена, добавлена поездка ${trip.id}`,
      );
    }

    // 2. Обновляем историю каждого ПАССАЖИРА
    for (const booking of trip.bookings || []) {
      if (!booking.passenger) continue;

      const passenger = await User.findByPk(booking.passengerId);
      if (passenger && trip.driver) {
        const passengerHistoryEntry = {
          ...tripData,
          role: "passenger" as const,
          withUser: {
            id: trip.driver.id,
            firstName: trip.driver.firstName,
            lastName: trip.driver.lastName,
            avatar: trip.driver.avatar,
          },
        };

        const updatedPassengerHistory = [
          passengerHistoryEntry,
          ...(passenger.tripHistory || []),
        ];

        await passenger.update({
          tripHistory: updatedPassengerHistory,
          tripsCount: (passenger.tripsCount || 0) + 1,
        });

        console.log(
          `История пассажира ${passenger.id} обновлена, добавлена поездка ${trip.id}`,
        );
      }
    }

    // Получаем обновленную поездку для ответа
    const updatedTrip = await Trip.findByPk(id, {
      include: [
        {
          model: User,
          as: "driver",
          attributes: ["id", "firstName", "lastName", "avatar", "rating"],
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
    });

    res.json({
      success: true,
      message: "Поездка успешно завершена и добавлена в историю участников",
      data: updatedTrip,
    });
  } catch (error: any) {
    console.error("Ошибка при завершении поездки:", error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при завершении поездки",
    });
  }
};
export const checkTripPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user!.id;

    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return sendError(res, "TRIP_NOT_FOUND", 404);
    }

    // Проверяем, что пользователь - водитель этой поездки
    if (trip.driverId !== userId) {
      return sendError(res, "ACCESS_DENIED", 403);
    }

    sendSuccess(res, {
      tripId: trip.id,
      status: trip.status,
      isPaid: trip.status === "paid",
      requiresPayment: trip.status === "created",
    });
  } catch (error: any) {
    console.error("Check payment status error:", error.message);
    sendError(res, "CHECK_STATUS_ERROR", 500);
  }
};
