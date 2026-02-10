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

// Обновить профиль пользователя (единый эндпоинт)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      about,
      firstName,
      lastName,
      gender,
      telegram,
      phone,
      email,
      birthDate,
      avatar,
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const updateData: any = {};

    // Базовые поля профиля (всегда можно менять)
    if (about !== undefined) {
      if (typeof about !== "string" || about.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Поле 'about' должно быть строкой не более 1000 символов",
        });
      }
      updateData.about = about.trim();
    }

    if (firstName !== undefined) {
      if (
        typeof firstName !== "string" ||
        firstName.length < 2 ||
        firstName.length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Имя должно быть от 2 до 50 символов",
        });
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (
        typeof lastName !== "string" ||
        lastName.length < 2 ||
        lastName.length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Фамилия должна быть от 2 до 50 символов",
        });
      }
      updateData.lastName = lastName.trim();
    }

    if (gender !== undefined) {
      if (!["male", "female"].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Пол должен быть 'male' или 'female'",
        });
      }
      updateData.gender = gender;
    }

    if (telegram !== undefined) {
      if (telegram !== null && telegram !== "") {
        const telegramRegex = /^@?[a-zA-Z0-9_]{5,32}$/;
        if (!telegramRegex.test(telegram)) {
          return res.status(400).json({
            success: false,
            message: "Неверный формат Telegram username",
          });
        }
        updateData.telegram = telegram.startsWith("@")
          ? telegram
          : `@${telegram}`;
      } else {
        updateData.telegram = null;
      }
    }

    // Дата рождения
    if (birthDate !== undefined) {
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      const minAgeDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate(),
      );

      if (isNaN(birthDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Неверный формат даты рождения",
        });
      }

      if (birthDateObj > minAgeDate) {
        return res.status(400).json({
          success: false,
          message: "Возраст должен быть не менее 18 лет",
        });
      }

      if (birthDateObj > today) {
        return res.status(400).json({
          success: false,
          message: "Дата рождения не может быть в будущем",
        });
      }

      updateData.birthDate = birthDate;
    }

    // Аватар
    if (avatar !== undefined) {
      if (avatar && typeof avatar !== "string") {
        return res.status(400).json({
          success: false,
          message: "Avatar должен быть строкой (URL)",
        });
      }
      updateData.avatar = avatar || null;
    }

    // Email (требует верификации)
    if (email !== undefined && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const allowedDomains = [
        "gmail.com",
        "mail.ru",
        "yandex.ru",
        "yahoo.com",
        "outlook.com",
        "icloud.com",
        "uz",
        "umail.uz",
      ];
      const emailDomain = email.split("@")[1];

      if (
        !emailRegex.test(email) ||
        !allowedDomains.includes(emailDomain?.toLowerCase())
      ) {
        return res.status(400).json({
          success: false,
          message: "Неверный формат email",
        });
      }

      // Проверяем уникальность
      const existingUser = await User.findOne({
        where: { email, id: { [Op.ne]: userId } },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Этот email уже используется другим пользователем",
        });
      }

      updateData.email = email;
      updateData.emailVerified = false; // Требует повторной верификации
    }

    // Телефон (требует верификации)
    if (phone !== undefined && phone !== user.phone) {
      const phoneRegex = /^\+?[0-9]{11,15}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return res.status(400).json({
          success: false,
          message: "Неверный формат номера телефона",
        });
      }

      // Проверяем уникальность
      const existingUser = await User.findOne({
        where: { phone, id: { [Op.ne]: userId } },
      });

      if (existingUser) {
        return res.status(404).json({
          success: false,
          message: "Этот номер телефона уже используется другим пользователем",
        });
      }

      updateData.phone = phone;
      updateData.phoneVerified = false; // Требует повторной верификации
    }

    // Запрещаем менять системные поля
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
      "car", // car меняется через отдельный эндпоинт
    ];

    for (const field of forbiddenFields) {
      if (req.body[field] !== undefined) {
        return res.status(403).json({
          success: false,
          message: `Вы не можете менять поле: ${field}`,
        });
      }
    }

    // Если нет полей для обновления
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Нет данных для обновления",
      });
    }

    await user.update(updateData);

    // Получаем обновленного пользователя
    const updatedUser = await User.findByPk(userId, {
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
    });

    // Определяем, нужно ли отправлять верификацию
    const requiresVerification = {
      email: email !== undefined && email !== user.email,
      phone: phone !== undefined && phone !== user.phone,
    };

    res.json({
      success: true,
      message: "Профиль обновлен успешно",
      data: {
        user: updatedUser,
        requiresVerification,
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
