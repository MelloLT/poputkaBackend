import { logger } from "../config/logger";
import { EDITABLE_TRIP_FIELDS, validateTripInput } from "../utils/tripValidation";
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
import { sendSuccess, sendError } from "../utils/responseHelper";
import { addNotification } from "../utils/notificationHelper";
import { ErrorCodes } from "../utils/errorCodes";

export const getTrips = async (req: Request, res: Response) => {
  try {
    const {
      from,
      to,
      departureAt: departureAtParam,
      date,
      minPrice,
      maxPrice,
      seats,
      timeFrom,
      timeTo,
      driverGender,
      sortBy = "earliest",
      verifiedOnly = false,
    } = req.query;

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

    // Фильтр по дате отправления. Фронтенд шлёт ?date=YYYY-MM-DD (раньше игнорировалось — ждали departureAt).
    // День считаем по Ташкенту (UTC+5, без перехода на летнее время), а не по UTC.
    const departureAt = (date ?? departureAtParam) as string | undefined;
    const now = new Date();
    if (departureAt) {
      const ymd = /^\d{4}-\d{2}-\d{2}$/.test(departureAt)
        ? departureAt
        : new Date(departureAt).toISOString().slice(0, 10);
      const startOfDay = new Date(`${ymd}T00:00:00+05:00`);
      if (!isNaN(startOfDay.getTime())) {
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
        whereClause.departureAt = {
          [Op.between]: [startOfDay < now ? now : startOfDay, endOfDay],
        };
      }
    } else {
      // Без даты показываем только будущие поездки (раньше в выдачу попадали прошедшие)
      whereClause.departureAt = { [Op.gte]: now };
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


    let order: any[] = [];
    if (sortBy === "cheapest") {
      order = [["price", "ASC"]];
    } else {
      // По умолчанию - самые ранние
      order = [["departureAt", "ASC"]];
    }

    const allTrips = await Trip.findAll({
      where: whereClause,
      include: includeClause,
      order,
    });

    // Фильтр по времени отправления (HH:MM по Ташкенту). Раньше параметры принимались, но игнорировались.
    const toMinutes = (v: unknown) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(String(v ?? ""));
      return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    };
    const fromMin = toMinutes(timeFrom);
    const toMin = toMinutes(timeTo);
    const trips =
      fromMin === null && toMin === null
        ? allTrips
        : allTrips.filter((t) => {
            const tashkent = new Date(new Date(t.departureAt).getTime() + 5 * 60 * 60 * 1000);
            const mins = tashkent.getUTCHours() * 60 + tashkent.getUTCMinutes();
            return (fromMin === null || mins >= fromMin) && (toMin === null || mins <= toMin);
          });


    return sendSuccess(res, trips, ErrorCodes.TRIPS_FETCH_SUCCESS, 200, {
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
        sortBy,
      },
    });
  } catch (error) {
    console.error("Ошибка при поиске поездок:", error);
    return sendError(res, ErrorCodes.TRIPS_SEARCH_ERROR, 500, {
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
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND, 404);
    }

    return sendSuccess(res, trip, ErrorCodes.TRIP_FETCH_SUCCESS, 200);
  } catch (error) {
    console.error("Ошибка при получении поездки:", error);
    return sendError(res, ErrorCodes.TRIP_FETCH_ERROR, 500);
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
      maxTwoBackSeats = false,
    } = req.body;

    // Все ошибки полей сразу, с текстами (цена, места, города, дата, длина текстов)
    const validationErrors = validateTripInput(req.body);
    if (validationErrors.length > 0) {
      const onlyMissing = validationErrors.every((e) => e.code === "FIELD_REQUIRED");
      return sendError(
        res,
        onlyMissing ? ErrorCodes.MISSING_REQUIRED_FIELDS : ErrorCodes.VALIDATION_ERROR,
        400,
        { errors: validationErrors, missingFields: validationErrors.filter((e) => e.code === "FIELD_REQUIRED").map((e) => e.field) },
      );
    }
    const departureDateTime = new Date(departureAt);

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
      from: { cityKey: from.cityKey, address: String(from.address ?? "").trim() },
      to: { cityKey: to.cityKey, address: String(to.address ?? "").trim() },
      departureAt: departureDateTime,
      price: Math.round(Number(price)),
      availableSeats: Number(availableSeats),
      description: String(description ?? "").trim(),
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
    return sendSuccess(
      res,
      { trip: tripWithDriver },
      ErrorCodes.TRIP_CREATED_SUCCESS,
      201,
    );
  } catch (error) {
    console.error("Ошибка при создании поездки:", error);
    return sendError(res, ErrorCodes.TRIP_CREATE_ERROR, 500);
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user!.id;

    // Только разрешённые поля. Раньше в поездку записывалось всё тело запроса:
    // водитель мог сам поставить status "paid" (обойти оплату), сменить driverId и т.п.
    const updateData: Record<string, any> = {};
    for (const f of EDITABLE_TRIP_FIELDS) {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    }
    if (Object.keys(updateData).length === 0) {
      return sendError(res, ErrorCodes.NO_DATA_TO_UPDATE, 400);
    }

    const validationErrors = validateTripInput(updateData, { partial: true });
    if (validationErrors.length > 0) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 400, { errors: validationErrors });
    }

    const trip = await Trip.findOne({
      where: { id, driverId },
    });

    if (!trip) {
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND_OR_NO_ACCESS, 404);
    }

    // Город отправления и назначения не должны совпасть после частичного обновления
    const fromKey = updateData.from?.cityKey ?? trip.from?.cityKey;
    const toKey = updateData.to?.cityKey ?? trip.to?.cityKey;
    if (fromKey && fromKey === toKey) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 400, { errors: [{ field: "to", code: "SAME_CITY" }] });
    }

    if (updateData.departureAt) updateData.departureAt = new Date(updateData.departureAt);
    if (updateData.price !== undefined) updateData.price = Math.round(Number(updateData.price));
    if (updateData.availableSeats !== undefined) updateData.availableSeats = Number(updateData.availableSeats);
    if (updateData.maxTwoBackSeats !== undefined) updateData.maxTwoBackSeats = Boolean(updateData.maxTwoBackSeats);

    await trip.update(updateData);
    await updateTripParticipantsActiveTrips(String(id));

    return sendSuccess(res, trip, ErrorCodes.TRIP_UPDATED_SUCCESS, 200);
  } catch (error) {
    logger.error({ err: error }, "trip update failed");
    return sendError(res, ErrorCodes.TRIP_UPDATE_ERROR, 500);
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
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND_OR_NO_ACCESS, 404);
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
          ErrorCodes.NOTIFICATION_INFO_GENERAL,
          {
            from: trip.from.cityKey,
            to: trip.to.cityKey,
            reason: "driver_cancelled",
          },
          booking.id,
          trip.id,
        );
      }
    }

    return sendSuccess(res, null, ErrorCodes.TRIP_CANCELLED_SUCCESS, 200);
  } catch (error: any) {
    console.error("Ошибка при удалении поездки:", error.message);
    return sendError(res, ErrorCodes.TRIP_DELETE_ERROR, 500);
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
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND_OR_NO_ACCESS, 404);
    }

    if (trip.status === "completed") {
      return sendError(res, ErrorCodes.TRIP_ALREADY_FINISHED, 400);
    }

    if (trip.status === "cancelled") {
      return sendError(res, ErrorCodes.CANNOT_FINISH_CANCELLED_TRIP, 400);
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

    return sendSuccess(res, updatedTrip, ErrorCodes.TRIP_FINISHED_SUCCESS, 200);
  } catch (error: any) {
    console.error("Ошибка при завершении поездки:", error.message);
    console.error(error.stack);
    return sendError(res, ErrorCodes.TRIP_FINISH_ERROR, 500);
  }
};
export const checkTripPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user!.id;

    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND, 404);
    }

    // Проверяем, что пользователь - водитель этой поездки
    if (trip.driverId !== userId) {
      return sendError(res, ErrorCodes.BOOKING_ACCESS_DENIED, 403);
    }

    sendSuccess(res, {
      tripId: trip.id,
      status: trip.status,
      isPaid: trip.status === "paid",
      requiresPayment: trip.status === "created",
    });
  } catch (error: any) {
    console.error("Check payment status error:", error.message);
    return sendError(res, ErrorCodes.TRIP_FETCH_ERROR, 500);
  }
};
