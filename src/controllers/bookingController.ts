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

    if (trip.availableSeats < seats) {
      return res.status(400).json({
        success: false,
        message: `Недостаточно свободных мест. Доступно: ${trip.availableSeats}`,
      });
    }

    const booking = await Booking.create({
      passengerId,
      tripId,
      seats: parseInt(seats),
      status: "pending",
    });

    await trip.update({
      availableSeats: trip.availableSeats - seats,
    });

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
      message: "Бронь создана успешно",
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
