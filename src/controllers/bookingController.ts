import { Request, Response } from "express";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import User from "../models/User";
import { updateTripParticipantsActiveTrips } from "../services/userTripsService";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";
import { io } from "../index";
import { pushNotification } from "../utils/notifications";

// функция для добавления уведомлений
const addNotification = async (
  userId: string,
  type:
    | "booking_request"
    | "booking_confirmed"
    | "booking_rejected"
    | "booking_cancelled"
    | "trip_completed"
    | "payment_success"
    | "payment_failed"
    | "info"
    | "success"
    | "error",
  code: string,
  params: Record<string, any>,
  relatedBookingId?: string,
  relatedTripId?: string,
) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    const newNotification = {
      id: `NT${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      type,
      code,
      params,
      isRead: false,
      createdAt: new Date(),
      relatedBookingId,
      relatedTripId,
    };

    const updatedNotifications = [
      newNotification,
      ...(user.notifications || []),
    ];

    const limitedNotifications = updatedNotifications.slice(0, 100);

    await user.update({ notifications: limitedNotifications });
    pushNotification(io, userId, newNotification);
    console.log(`Уведомление добавлено пользователю ${userId}: code=${code}`);
  } catch (error) {
    console.error("Ошибка добавления уведомления:", error);
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user!.id;
    const { tripId, seats } = req.body;

    if (!tripId || !seats) {
      return sendError(res, ErrorCodes.TRIP_ID_SEATS_REQUIRED, 400);
    }

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return sendError(res, ErrorCodes.TRIP_NOT_FOUND, 404);
    }

    // ПРОВЕРКА: нельзя бронировать если 0 мест
    if (trip.availableSeats === 0) {
      return sendError(res, ErrorCodes.NO_AVAILABLE_SEATS, 400);
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

    await updateTripParticipantsActiveTrips(tripId);

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

    if (trip.instantBooking) {
      await addNotification(
        passengerId,
        "booking_confirmed",
        ErrorCodes.NOTIFICATION_BOOKING_CONFIRMED_AUTO_TO_PASSENGER,
        {
          seats: seats,
          from: trip.from.cityKey,
          to: trip.to.cityKey,
        },
        booking.id,
        trip.id,
      );
    } else {
      await addNotification(
        passengerId,
        "booking_request",
        ErrorCodes.NOTIFICATION_BOOKING_REQUEST_TO_PASSENGER,
        {
          seats: seats,
          from: trip.from.cityKey,
          to: trip.to.cityKey,
        },
        booking.id,
        trip.id,
      );
    }

    // Добавляем уведомление водителю
    if (!trip.instantBooking) {
      await addNotification(
        trip.driverId,
        "booking_request",
        ErrorCodes.NOTIFICATION_BOOKING_REQUEST_TO_DRIVER,
        {
          passengerName: `${req.user!.firstName} ${req.user!.lastName}`,
          seats: seats,
          from: trip.from.cityKey,
          to: trip.to.cityKey,
        },
        booking.id,
        trip.id,
      );
    } else {
      await addNotification(
        trip.driverId,
        "booking_confirmed",
        ErrorCodes.NOTIFICATION_BOOKING_CONFIRMED_AUTO_TO_DRIVER,
        {
          seats: seats,
          passengerName: `${req.user!.firstName} ${req.user!.lastName}`,
        },
        booking.id,
        trip.id,
      );
    }

    if (trip.instantBooking) {
      return sendSuccess(
        res,
        { booking: bookingWithDetails },
        ErrorCodes.BOOKING_CREATED,
        201,
        { instantBooking: true },
      );
    } else {
      return sendSuccess(
        res,
        { booking: bookingWithDetails },
        ErrorCodes.BOOKING_PENDING,
        201,
        { requiresConfirmation: true },
      );
    }
  } catch (error: any) {
    console.error("Ошибка при создании брони:", error.message);
    return sendError(res, ErrorCodes.BOOKING_CREATE_ERROR, 500);
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
    return sendError(res, ErrorCodes.BOOKING_FETCH_ERROR, 500);
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
      return sendError(res, ErrorCodes.BOOKING_NOT_FOUND, 404);
    }

    // Проверяем, что пользователь имеет доступ к этому бронированию
    const isDriver =
      req.user!.role === "driver" && booking.trip?.driverId === userId;
    const isPassenger = booking.passengerId === userId;

    if (!isDriver && !isPassenger) {
      return sendError(res, ErrorCodes.BOOKING_ACCESS_DENIED, 403);
    }

    const response = {
      success: true,
      data: {
        id: booking.id,
        passengerId: booking.passengerId,
        tripId: booking.tripId,
        seats: booking.seats,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        trip: booking.trip
          ? {
              id: booking.trip.id,
              driverId: booking.trip.driverId,
              from: booking.trip.from,
              to: booking.trip.to,
              departureAt: booking.trip.departureAt,
              price: booking.trip.price,
              availableSeats: booking.trip.availableSeats,
              description: booking.trip.description,
              instantBooking: booking.trip.instantBooking,
              maxTwoBackSeats: booking.trip.maxTwoBackSeats,
              status: booking.trip.status,
              tripInfo: booking.trip.tripInfo,
              createdAt: booking.trip.createdAt,
              updatedAt: booking.trip.updatedAt,
              driver: booking.trip.driver
                ? {
                    id: booking.trip.driver.id,
                    firstName: booking.trip.driver.firstName,
                    lastName: booking.trip.driver.lastName,
                    avatar: booking.trip.driver.avatar,
                    rating: booking.trip.driver.rating,
                    car: booking.trip.driver.car,
                    telegram: booking.trip.driver.telegram,
                    phone: booking.trip.driver.phone,
                    phoneVerified: booking.trip.driver.phoneVerified,
                  }
                : null,
            }
          : null,
        passenger: booking.passenger
          ? {
              id: booking.passenger.id,
              firstName: booking.passenger.firstName,
              lastName: booking.passenger.lastName,
              avatar: booking.passenger.avatar,
              rating: booking.passenger.rating,
              telegram: booking.passenger.telegram,
              phone: booking.passenger.phone,
              phoneVerified: booking.passenger.phoneVerified,
            }
          : null,

        currentUserRole: isDriver ? "driver" : "passenger",
        counterpart: isDriver
          ? booking.passenger
            ? {
                id: booking.passenger.id,
                firstName: booking.passenger.firstName,
                lastName: booking.passenger.lastName,
                avatar: booking.passenger.avatar,
                rating: booking.passenger.rating,
                telegram: booking.passenger.telegram,
                phone: booking.passenger.phone,
                phoneVerified: booking.passenger.phoneVerified,
              }
            : null
          : booking.trip?.driver
            ? {
                id: booking.trip.driver.id,
                firstName: booking.trip.driver.firstName,
                lastName: booking.trip.driver.lastName,
                avatar: booking.trip.driver.avatar,
                rating: booking.trip.driver.rating,
                car: booking.trip.driver.car,
                telegram: booking.trip.driver.telegram,
                phone: booking.trip.driver.phone,
                phoneVerified: booking.trip.driver.phoneVerified,
              }
            : null,
      },
      source: "database",
    };

    res.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error("Ошибка при получении бронирования:", error.message);
    return sendError(res, ErrorCodes.BOOKING_FETCH_ERROR, 500);
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
    await updateTripParticipantsActiveTrips(booking.tripId);

    // Добавляем уведомление водителю об отмене
    if (trip) {
      await addNotification(
        trip.driverId,
        "booking_rejected",
        ErrorCodes.NOTIFICATION_BOOKING_CANCELLED_BY_PASSENGER_TO_DRIVER,
        {
          seats: booking.seats,
          passengerName: `${req.user!.firstName} ${req.user!.lastName}`,
        },
        booking.id,
        trip.id,
      );
    }

    // Добавляем уведомление пассажиру
    await addNotification(
      passengerId,
      "info",
      ErrorCodes.NOTIFICATION_BOOKING_CANCELLED_BY_PASSENGER_TO_PASSENGER,
      {
        seats: booking.seats,
        from: trip?.from.cityKey,
        to: trip?.to.cityKey,
      },
      booking.id,
      trip?.id,
    );

    return sendSuccess(res, null, ErrorCodes.BOOKING_CANCELLED);
  } catch (error: any) {
    console.error("Ошибка при отмене брони:", error.message);
    return sendError(res, ErrorCodes.BOOKING_CANCEL_ERROR, 500);
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
            status: "active",
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
      error.message,
    );
    return sendError(res, ErrorCodes.ACTIVE_TRIPS_FETCH_ERROR, 500);
  }
};
