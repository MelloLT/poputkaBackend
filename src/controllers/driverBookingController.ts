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
      return sendError(res, ErrorCodes.BOOKING_NOT_FOUND, 404);
    }

    if (booking.status !== "pending") {
      return sendError(res, ErrorCodes.BOOKING_ALREADY_PROCESSED, 400);
    }

    const trip = await Trip.findByPk(booking.tripId);
    if (!trip) {
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND, 404);
    }

    // Проверка статуса поездки для оплаты
    if (trip.status === "created") {
      return sendError(res, ErrorCodes.PAYMENT_REQUIRED, 402, {
        tripId: trip.id,
        requiresPayment: true,
      });
    }

    if (trip.status !== "paid") {
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND, 400, {
        currentStatus: trip.status,
        expectedStatus: "paid",
      });
    }

    if (trip.availableSeats < booking.seats) {
      return sendError(res, ErrorCodes.NO_AVAILABLE_SEATS, 400, {
        availableSeats: trip.availableSeats,
        requestedSeats: booking.seats,
      });
    }

    // Подтверждаем бронь
    await booking.update({ status: "confirmed" });
    await trip.update({
      availableSeats: trip.availableSeats - booking.seats,
    });

    await updateTripParticipantsActiveTrips(trip.id);

    // Уведомление пассажиру
    await addNotification(
      booking.passengerId,
      "booking_confirmed",
      ErrorCodes.NOTIFICATION_BOOKING_CONFIRMED_TO_PASSENGER,
      {
        seats: booking.seats,
        from: trip.from.cityKey,
        to: trip.to.cityKey,
        departureAt: trip.departureAt,
        driverName: `${req.user!.firstName} ${req.user!.lastName}`,
      },
      booking.id,
      trip.id,
    );

    return sendSuccess(
      res,
      { booking, trip },
      ErrorCodes.BOOKING_CONFIRMED_SUCCESS,
    );
  } catch (error: any) {
    console.error("Confirm booking error:", error.message);
    return sendError(res, ErrorCodes.BOOKING_CONFIRM_ERROR, 500);
  }
};

// Функция rejectBooking
export const rejectBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const driverId = req.user!.id;

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
      return sendError(res, ErrorCodes.BOOKING_NOT_FOUND, 404);
    }

    if (booking.status !== "pending") {
      return sendError(res, ErrorCodes.BOOKING_ALREADY_PROCESSED, 400);
    }

    await booking.update({ status: "rejected" });
    await updateTripParticipantsActiveTrips(booking.tripId);

    const trip = await Trip.findByPk(booking.tripId);

    // Уведомление пассажиру
    await addNotification(
      booking.passengerId,
      "booking_rejected",
      ErrorCodes.NOTIFICATION_BOOKING_REJECTED_TO_PASSENGER,
      {
        seats: booking.seats,
        from: trip?.from.cityKey,
        to: trip?.to.cityKey,
      },
      booking.id,
      booking.tripId,
    );

    return sendSuccess(res, { booking }, ErrorCodes.BOOKING_REJECTED_SUCCESS);
  } catch (error: any) {
    console.error("Reject booking error:", error.message);
    return sendError(res, ErrorCodes.BOOKING_REJECT_ERROR, 500);
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
