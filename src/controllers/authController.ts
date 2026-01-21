import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import { updateUserActiveTrips } from "../services/userTripsService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const generateToken = (userId: string, userRole: string) => {
  return jwt.sign({ userId, userRole }, JWT_SECRET, { expiresIn: "7d" });
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      username,
      email,
      phone,
      password,
      role,
      firstName,
      lastName,
      birthDate,
      avatar,
      gender,
      car,
    } = req.body;

    console.log("1. Проверка обязательных полей");
    const requiredFields = [
      "username",
      "email",
      "phone",
      "password",
      "role",
      "gender",
      "firstName",
      "lastName",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      console.log("Отсутствуют поля:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Не заполнены обязательные поля: ${missingFields.join(", ")}`,
      });
    }

    const validationErrors: string[] = [];

    // Валидация email
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
      validationErrors.push(
        "Адрес электронной почты недействительный. Попробуйте следующий формат: email@example.com.",
      );
    }

    // Валидация phone
    const phoneRegex = /^\+?[0-9]{11,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      validationErrors.push("Неверный формат номера телефона");
    }

    // Валидация password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._-]{10,18}$/;
    if (!passwordRegex.test(password)) {
      validationErrors.push(
        "Неверный формат пароля. Пароль должен содержать латинские буквы и цифры, точки и тире",
      );
    }
    // Валидация возраста
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );

    if (birthDateObj > minAgeDate) {
      validationErrors.push("Возраст должен быть не менее 18 лет");
    }

    if (birthDateObj > today) {
      validationErrors.push("Дата рождения не может быть в будущем");
    }

    // Валидация имени и фамилии
    const nameRegex = /^[A-Za-zА-Яа-яЁё\s]{1,20}$/;
    if (!nameRegex.test(firstName)) {
      validationErrors.push(
        "firstName должен состоять из букв и быть не длиннее 20 символов",
      );
    }
    if (!nameRegex.test(lastName)) {
      validationErrors.push(
        "lastName должен состоять из букв и быть не длиннее 20 символов",
      );
    }

    if (validationErrors.length > 0) {
      return res.status(422).json({
        success: false,
        message: validationErrors.join(". "),
      });
    }

    console.log("Проверка уникальности пользователя");
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }, { phone }],
      },
    });

    if (existingUser) {
      console.log("Найден существующий пользователь");
      const conflicts = [];
      if (existingUser.username === username) conflicts.push("логин");
      if (existingUser.email === email) conflicts.push("email");
      if (existingUser.phone === phone) conflicts.push("телефон");

      return res.status(400).json({
        success: false,
        message: `Пользователь с таким ${conflicts.join(", ")} уже существует`,
      });
    }

    console.log("Хэширование пароля");
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Создание пользователя в БД");
    const user = await User.create({
      username,
      email,
      phone,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      birthDate,
      avatar: avatar || undefined,
      gender: gender || undefined,
      car: car || undefined,
      rating: 0,
      isVerified: false,
      reviews: [],
      notifications: [],
    });

    res.status(201).json({
      success: true,
      message: "Пользователь успешно зарегистрирован",
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
          gender: user.gender,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          car: user.car,
        },
      },
    });
  } catch (error: any) {
    console.log("ОШИБКА РЕГИСТРАЦИИ");
    console.error("Тип ошибки:", typeof error);
    console.error("Сообщение ошибки:", error.message);
    console.error("Stack trace:", error.stack);
    console.error("Полная ошибка:", error);

    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err: any) => err.message);
      return res.status(422).json({
        success: false,
        message: validationErrors.join(". "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при регистрации",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { login: loginInput, password } = req.body;

    if (!loginInput || !password) {
      return res.status(400).json({
        success: false,
        message: "Логин/email и пароль обязательны",
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: loginInput }, { username: loginInput }],
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Неверный логин/email или пароль",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Неверный логин/email или пароль",
      });
    }

    const token = generateToken(user.id, user.role);

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      success: true,
      message: "Вход выполнен успешно",
      data: {
        token: token,
      },
    });
  } catch (error: any) {
    console.error("Ошибка при входе:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при входе",
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

<<<<<<< HEAD
=======
    // Получаем активные поездки пользователя
    let activeTrips = [];

    if (user.role === "driver") {
      // Для ВОДИТЕЛЯ: все его активные поездки со ВСЕМИ бронированиями
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

      // Форматируем для водителя
      activeTrips = driverTrips.map((trip) => ({
        id: trip.id,
        from: trip.from,
        to: trip.to,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        price: trip.price,
        availableSeats: trip.availableSeats,
        description: trip.description,
        instantBooking: trip.instantBooking,
        maxTwoBackSeats: trip.maxTwoBackSeats,
        status: trip.status,
        tripInfo: trip.tripInfo,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        bookings: (trip.bookings || []).map((booking) => ({
          id: booking.id,
          seats: booking.seats,
          status: booking.status,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
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
        })),
        meta: {
          totalBookings: trip.bookings?.length || 0,
          confirmedBookings:
            trip.bookings?.filter((b) => b.status === "confirmed").length || 0,
          pendingBookings:
            trip.bookings?.filter((b) => b.status === "pending").length || 0,
        },
      }));
    } else {
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

      // Форматируем для пассажира
      activeTrips = passengerBookings
        .map((booking) => {
          if (!booking.trip) return null;

          return {
            id: booking.trip.id,
            from: booking.trip.from,
            to: booking.trip.to,
            departureDate: booking.trip.departureDate,
            departureTime: booking.trip.departureTime,
            price: booking.trip.price,
            availableSeats: booking.trip.availableSeats,
            description: booking.trip.description,
            instantBooking: booking.trip.instantBooking,
            maxTwoBackSeats: booking.trip.maxTwoBackSeats,
            status: booking.trip.status,
            tripInfo: booking.trip.tripInfo,
            createdAt: booking.trip.createdAt,
            updatedAt: booking.trip.updatedAt,
            // Информация о водителе для пассажира
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
              : null,

            bookings: [
              {
                id: booking.id,
                seats: booking.seats,
                status: booking.status,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                isMyBooking: true,
              },
            ],
            meta: {
              isMyBooking: true,
              bookingId: booking.id,
            },
          };
        })
        .filter((trip) => trip !== null);
    }

    // Получаем уведомления (автоматически удаляем старые)
>>>>>>> ff4d327 (active trips in user's model)
    const notifications = user.notifications || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const freshNotifications = notifications.filter(
      (notification) => new Date(notification.createdAt) > thirtyDaysAgo,
    );

    if (freshNotifications.length !== notifications.length) {
      await user.update({ notifications: freshNotifications });
    }

    res.json({
      success: true,
      message: "Данные пользователя",
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
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          car: user.car,
          about: user.about,
          telegram: user.telegram,
          tripHistory: user.tripHistory || [],
          tripsCount: user.tripsCount,
          isBanned: user.isBanned,
          reports: user.reports || [],
          activeTrips: activeTrips,
        },
        notifications: freshNotifications,
      },
    });
  } catch (error: any) {
    console.error("Ошибка в getMe:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.json({
    success: true,
    message: "Выход выполнен успешно",
  });
};
