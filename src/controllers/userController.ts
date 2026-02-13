import { Request, Response } from "express";
import User from "../models/User";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import { Op } from "sequelize";
import { validators, ProfileUpdateInput } from "../validation/profileSchemas";
import { ZodError } from "zod";

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
        id: trip.id,
        role: "driver" as const,
        from: trip.from,
        to: trip.to,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        price: trip.price,
        availableSeats: trip.availableSeats,
        status: trip.status,
        description: trip.description,
        instantBooking: trip.instantBooking,
        maxTwoBackSeats: trip.maxTwoBackSeats,
        tripInfo: trip.tripInfo,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,

        bookings: (trip.bookings || []).map((booking) => ({
          id: booking.id,
          seats: booking.seats,
          status: booking.status,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
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
            : undefined,
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
            id: booking.trip.id,
            role: "passenger" as const,
            from: booking.trip.from,
            to: booking.trip.to,
            departureDate: booking.trip.departureDate,
            departureTime: booking.trip.departureTime,
            price: booking.trip.price,
            availableSeats: booking.trip.availableSeats,
            status: booking.trip.status,
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

// Обновить профиль пользователя (единый эндпоинт)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    // Запрещенные поля
    const forbiddenFields = [
      "id",
      "username",
      "password",
      "role",
      "rating",
      "isVerified",
      "verificationCode",
      "verificationCodeExpires",
      "isBanned",
      "banReason",
      "bannedUntil",
      "reports",
      "reviews",
      "activeTrips",
      "notifications",
      "tripHistory",
      "tripsCount",
      "car",
    ];

    // Проверяем нет ли запрещенных полей
    for (const field of forbiddenFields) {
      if (field in updates) {
        return res.status(403).json({
          success: false,
          message: `Вы не можете менять поле: ${field}`,
        });
      }
    }

    // Если нет полей для обновления
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Нет данных для обновления",
      });
    }

    // Валидируем каждое поле через словарь - O(1) доступ
    const validatedData: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const [key, value] of Object.entries(updates)) {
      const validator = validators[key];

      if (!validator) {
        // Если поле не в белом списке - игнорируем
        console.log(`Поле ${key} не поддерживается для обновления`);
        continue;
      }

      try {
        // Если value === undefined, пропускаем
        if (value === undefined) continue;

        const validated = validator.parse(value);
        validatedData[key] = validated;
      } catch (error) {
        if (error instanceof ZodError) {
          errors[key] = error.issues[0]?.message || `Ошибка валидации ${key}`;
        }
      }
    }

    // Если есть ошибки валидации
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ошибка валидации",
        errors,
      });
    }

    // Если нет валидных данных
    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Нет валидных данных для обновления",
      });
    }

    // Получаем пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    // Проверяем уникальность email/phone если они меняются
    if (validatedData.email && validatedData.email !== user.email) {
      const existing = await User.findOne({
        where: { email: validatedData.email, id: { [Op.ne]: userId } },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email уже используется",
        });
      }
      validatedData.emailVerified = false;
    }

    if (validatedData.phone && validatedData.phone !== user.phone) {
      const existing = await User.findOne({
        where: { phone: validatedData.phone, id: { [Op.ne]: userId } },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Телефон уже используется",
        });
      }
      validatedData.phoneVerified = false;
    }

    // Обновляем пользователя
    await user.update(validatedData);

    // Получаем обновленного пользователя
    const updatedUser = await User.findByPk(userId, {
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
    });

    res.json({
      success: true,
      message: "Профиль обновлен",
      data: {
        user: updatedUser,
        requiresVerification: {
          email: validatedData.email && validatedData.email !== user.email,
          phone: validatedData.phone && validatedData.phone !== user.phone,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};
