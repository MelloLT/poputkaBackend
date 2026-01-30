import { Request, Response } from "express";
import User from "../models/User";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import { Op } from "sequelize";

// Получить всех пользователей
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    const whereClause: any = {};
    if (role) {
      whereClause.role = role.toString();
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: users,
      meta: {
        total: users.length,
        role: role || "all",
      },
    });
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении пользователей",
    });
  }
};

// Добавление и редактирование тачки
export const updateCar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    console.log("User ID:", userId);
    console.log("Request Body:", req.body);
    console.log("Request Headers:", req.headers);
    console.log("Content-Type:", req.headers["content-type"]);

    const { model, color, year, licensePlate } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Тело запроса пустое или не распарсено",
      });
    }

    const missingFields = [];
    if (!model) missingFields.push("model");
    if (!color) missingFields.push("color");
    if (!year) missingFields.push("year");
    if (!licensePlate) missingFields.push("licensePlate");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Не заполнены обязательные поля: ${missingFields.join(", ")}`,
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    if (user.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Только водители могут добавлять автомобиль",
      });
    }

    const updatedCar = {
      model: model.toString().trim(),
      color: color.toString().trim(),
      year: parseInt(year.toString()),
      licensePlate: licensePlate.toString().trim(),
      photos: user.car?.photos || [],
    };

    await user.update({ car: updatedCar });

    // Получаем обновленного пользователя
    const updatedUser = await User.findByPk(userId);

    res.json({
      success: true,
      message: "Данные автомобиля обновлены",
      data: {
        car: updatedCar,
        user: {
          id: updatedUser!.id,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          car: updatedUser!.car,
        },
      },
    });
  } catch (error: any) {
    console.error("Ошибка обновления автомобиля:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении автомобиля",
    });
  }
};

// Получить пользователя по ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: [
          "password",
          "verificationCode",
          "verificationCodeExpires",
          "notifications",
          "reports",
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    let activeTrips = [];

    if (user.role === "driver") {
      const driverTrips = await Trip.findAll({
        where: {
          driverId: user.id,
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

      activeTrips = driverTrips.map((trip) => ({
        tripId: trip.id,
        role: "driver" as const,
        from: trip.from,
        to: trip.to,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        price: trip.price,
        availableSeats: trip.availableSeats,
        status: "active" as const,
        description: trip.description,
        instantBooking: trip.instantBooking,
        maxTwoBackSeats: trip.maxTwoBackSeats,
        tripInfo: trip.tripInfo,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        bookings: (trip.bookings || []).map((booking) => ({
          id: booking.id,
          passengerId: booking.passengerId,
          passenger: booking.passenger
            ? {
                id: booking.passenger.id,
                firstName: booking.passenger.firstName,
                lastName: booking.passenger.lastName,
                avatar: booking.passenger.avatar,
                rating: booking.passenger.rating,
                telegram: booking.passenger.telegram,
                phone: booking.passenger.phone,
              }
            : null,
          seats: booking.seats,
          status: booking.status as "confirmed" | "pending",
          createdAt: booking.createdAt,
        })),
      }));
    } else {
      // Для пассажира
      const passengerBookings = await Booking.findAll({
        where: {
          passengerId: user.id,
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

      activeTrips = passengerBookings
        .map((booking) => {
          if (!booking.trip) return null;

          return {
            tripId: booking.trip.id,
            role: "passenger" as const,
            from: booking.trip.from,
            to: booking.trip.to,
            departureDate: booking.trip.departureDate,
            departureTime: booking.trip.departureTime,
            price: booking.trip.price,
            availableSeats: booking.trip.availableSeats,
            status: "active" as const,
            description: booking.trip.description,
            instantBooking: booking.trip.instantBooking,
            maxTwoBackSeats: booking.trip.maxTwoBackSeats,
            tripInfo: booking.trip.tripInfo,
            createdAt: booking.trip.createdAt,
            updatedAt: booking.trip.updatedAt,
            myBooking: {
              id: booking.id,
              seats: booking.seats,
              status: booking.status as "confirmed" | "pending",
              createdAt: booking.createdAt,
            },
            counterpart: booking.trip.driver
              ? {
                  id: booking.trip.driver.id,
                  firstName: booking.trip.driver.firstName,
                  lastName: booking.trip.driver.lastName,
                  avatar: booking.trip.driver.avatar,
                  rating: booking.trip.driver.rating,
                  car: booking.trip.driver.car,
                  telegram: booking.trip.driver.telegram,
                  phone: booking.trip.driver.phone,
                }
              : undefined,
          };
        })
        .filter((trip) => trip !== null);
    }

    // Получаем myBookings
    const myBookings = await Booking.findAll({
      where: { passengerId: id },
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
              ],
            },
          ],
        },
        {
          model: User,
          as: "passenger",
          attributes: ["id", "firstName", "lastName", "avatar", "rating"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
          car: user.car,
          about: user.about,
          telegram: user.telegram,
          tripsCount: user.tripsCount,
          activeTrips: activeTrips,
        },
        myBookings: myBookings,
      },
    });
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении пользователя",
    });
  }
};

// Получить всех водителей
export const getDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await User.findAll({
      where: { role: "driver" },
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
      order: [["rating", "DESC"]],
    });

    res.json({
      success: true,
      data: drivers,
      meta: {
        total: drivers.length,
      },
    });
  } catch (error) {
    console.error("Ошибка при получении водителей:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении водителей",
    });
  }
};

// Обновить профиль пользователя
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    // Пользователь может обновлять только свой профиль
    if (req.user!.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Вы можете редактировать только свой профиль",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    // Не позволяем менять пароль через этот эндпоинт
    if (updateData.password) {
      delete updateData.password;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
    });

    res.json({
      success: true,
      message: "Профиль обновлен успешно",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Ошибка при обновлении пользователя:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении пользователя",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { about, firstName, lastName, gender, telegram } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const updateData: any = {};
    if (about !== undefined) updateData.about = about;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (gender !== undefined) updateData.gender = gender;
    if (telegram !== undefined) updateData.telegram = telegram;

    await user.update(updateData);

    res.json({
      success: true,
      message: "Профиль обновлен успешно",
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          about: user.about,
          gender: user.gender,
          telegram: user.telegram,
        },
      },
    });
  } catch (error: any) {
    console.error("Ошибка обновления профиля:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении профиля",
    });
  }
};
