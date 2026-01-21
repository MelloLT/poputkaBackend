import User from "../models/User";
import Trip from "../models/Trip";
import Booking from "../models/Booking";

interface Location {
  cityKey: string;
  address: string;
}

export const updateUserActiveTrips = async (userId: string) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    const activeTripsData: Array<{
      tripId: string;
      role: "driver" | "passenger";
      from: Location;
      to: Location;
      departureDate: string;
      departureTime: string;
      price: number;
      availableSeats: number;
      status: "active";
      bookings?: Array<{
        id: string;
        passengerId: string;
        passenger: {
          id: string;
          firstName: string;
          lastName: string;
          avatar?: string;
          rating: number;
          telegram?: string;
          phone?: string;
        };
        seats: number;
        status: "confirmed" | "pending";
        createdAt: Date;
      }>;
      myBooking?: {
        id: string;
        seats: number;
        status: "confirmed" | "pending";
        createdAt: Date;
      };
      counterpart?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        rating: number;
        car?: any;
        telegram?: string;
        phone?: string;
      };
    }> = [];

    if (user.role === "driver") {
      // Для водителя: все его активные поездки с бронированиями
      const driverTrips = await Trip.findAll({
        where: {
          driverId: userId,
          status: "active",
        },
        include: [
          {
            model: Booking,
            as: "bookings",
            where: { status: ["confirmed", "pending"] },
            required: false,
            include: [
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
                ],
              },
            ],
          },
        ],
        order: [
          ["departureDate", "ASC"],
          ["departureTime", "ASC"],
        ],
      });

      for (const trip of driverTrips) {
        const bookingsData: Array<{
          id: string;
          passengerId: string;
          passenger: {
            id: string;
            firstName: string;
            lastName: string;
            avatar?: string;
            rating: number;
            telegram?: string;
            phone?: string;
          };
          seats: number;
          status: "confirmed" | "pending";
          createdAt: Date;
        }> = [];

        for (const booking of trip.bookings || []) {
          if (booking.passenger) {
            bookingsData.push({
              id: booking.id,
              passengerId: booking.passengerId,
              passenger: {
                id: booking.passenger.id,
                firstName: booking.passenger.firstName || "",
                lastName: booking.passenger.lastName || "",
                avatar: booking.passenger.avatar || undefined,
                rating: booking.passenger.rating || 1,
                telegram: booking.passenger.telegram || undefined,
                phone: booking.passenger.phone || undefined,
              },
              seats: booking.seats,
              status: booking.status as "confirmed" | "pending",
              createdAt: booking.createdAt,
            });
          }
        }

        const tripData = {
          tripId: trip.id,
          role: "driver" as const,
          from: trip.from,
          to: trip.to,
          departureDate: trip.departureDate,
          departureTime: trip.departureTime,
          price: trip.price,
          availableSeats: trip.availableSeats,
          status: "active" as const,
          bookings: bookingsData,
        };
        activeTripsData.push(tripData);
      }
    } else {
      // Для пассажира: только его активные бронирования
      const passengerBookings = await Booking.findAll({
        where: {
          passengerId: userId,
          status: ["confirmed", "pending"],
        },
        include: [
          {
            model: Trip,
            as: "trip",
            where: { status: "active" },
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
                ],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      for (const booking of passengerBookings) {
        if (!booking.trip || !booking.trip.driver) continue;

        const tripData = {
          tripId: booking.trip.id,
          role: "passenger" as const,
          from: booking.trip.from,
          to: booking.trip.to,
          departureDate: booking.trip.departureDate,
          departureTime: booking.trip.departureTime,
          price: booking.trip.price,
          availableSeats: booking.trip.availableSeats,
          status: "active" as const,
          myBooking: {
            id: booking.id,
            seats: booking.seats,
            status: booking.status as "confirmed" | "pending",
            createdAt: booking.createdAt,
          },
          counterpart: {
            id: booking.trip.driver.id,
            firstName: booking.trip.driver.firstName || "",
            lastName: booking.trip.driver.lastName || "",
            avatar: booking.trip.driver.avatar || undefined,
            rating: booking.trip.driver.rating || 1,
            car: booking.trip.driver.car || undefined,
            telegram: booking.trip.driver.telegram || undefined,
            phone: booking.trip.driver.phone || undefined,
          },
        };
        activeTripsData.push(tripData);
      }
    }

    // Обновляем поле activeTrips в пользователе
    await user.update({ activeTrips: activeTripsData });

    return activeTripsData;
  } catch (error) {
    console.error("Ошибка обновления активных поездок:", error);
    return null;
  }
};

// Обновить активные поездки для всех участников поездки
export const updateTripParticipantsActiveTrips = async (tripId: string) => {
  try {
    const trip = await Trip.findByPk(tripId, {
      include: [
        {
          model: Booking,
          as: "bookings",
          where: { status: ["confirmed", "pending"] },
          required: false,
          include: [
            {
              model: User,
              as: "passenger",
            },
          ],
        },
        {
          model: User,
          as: "driver",
        },
      ],
    });

    if (!trip) return;

    // Обновляем активные поездки водителя
    await updateUserActiveTrips(trip.driverId);

    // Обновляем активные поездки всех пассажиров
    for (const booking of trip.bookings || []) {
      if (booking.passengerId) {
        await updateUserActiveTrips(booking.passengerId);
      }
    }
  } catch (error) {
    console.error("Ошибка обновления активных поездок участников:", error);
  }
};
