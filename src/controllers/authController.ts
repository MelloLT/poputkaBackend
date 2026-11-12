import { FieldError, normalizePhone, validateRegistration } from "../utils/userValidation";
import { touchLastSeen } from "../utils/lastSeen";
import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User";
import bcrypt from "bcrypt";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

import { generateToken, authCookieOptions, authCookieMaxAgeMs } from "../utils/token";

/** Какие из логин / email / телефон уже заняты — ошибки по полям */
const findConflicts = async (u: { username: string; email: string; phone: string }) => {
  const existing = await User.findAll({
    where: { [Op.or]: [{ username: u.username }, { email: u.email }, { phone: u.phone }] },
    attributes: ["username", "email", "phone"],
  });
  const errors: FieldError[] = [];
  if (existing.some((e) => e.username === u.username)) errors.push({ field: "username", code: "USERNAME_TAKEN" });
  if (existing.some((e) => e.email?.toLowerCase() === u.email)) errors.push({ field: "email", code: "EMAIL_TAKEN" });
  if (existing.some((e) => e.phone === u.phone)) errors.push({ field: "phone", code: "PHONE_TAKEN" });
  return errors;
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

    // Все ошибки сразу, с кодом и текстом у каждого поля (тексты добавляет sendError)
    const validationErrors = validateRegistration(req.body);
    if (validationErrors.length > 0) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 422, { errors: validationErrors });
    }

    const normalized = {
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      phone: normalizePhone(phone),
    };
    const conflicts = await findConflicts(normalized);
    if (conflicts.length > 0) {
      return sendError(res, ErrorCodes.USER_ALREADY_EXISTS, 400, {
        conflicts: conflicts.map((c) => c.field),
        errors: conflicts,
      });
    }

    console.log("Хэширование пароля");
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Создание пользователя в БД");
    const user = await User.create({
      ...normalized,
      password: hashedPassword,
      role, // уже проверено: только passenger | driver
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      birthDate: String(birthDate).slice(0, 10),
      gender,
      // аватар и машина задаются отдельными эндпоинтами (/upload/avatar, /users/me/car)
      rating: 0,
      isVerified: false,
      reviews: [],
      notifications: [],
    });

    return sendSuccess(
      res,
      {
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
      ErrorCodes.USER_REGISTERED,
      201,
    );
  } catch (error: any) {
    console.log("ОШИБКА РЕГИСТРАЦИИ");
    console.error("Тип ошибки:", typeof error);
    console.error("Сообщение ошибки:", error.message);
    console.error("Stack trace:", error.stack);
    console.error("Полная ошибка:", error);

    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err: any) => err.message);
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 422, {
        errors: validationErrors,
      });
    }

    return sendError(res, ErrorCodes.REGISTRATION_SERVER_ERROR, 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { login: loginInput, password } = req.body;

    if (!loginInput || !password) {
      return sendError(res, ErrorCodes.LOGIN_PASSWORD_REQUIRED, 400);
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: loginInput }, { username: loginInput }],
      },
    });

    if (!user) {
      return sendError(res, ErrorCodes.INVALID_LOGIN_PASSWORD, 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, ErrorCodes.INVALID_LOGIN_PASSWORD, 400);
    }

    const token = generateToken(user.id, user.role);
    touchLastSeen(user);

    res.cookie("accessToken", token, {
      ...authCookieOptions(),
      maxAge: authCookieMaxAgeMs,
    });

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
      },
      ErrorCodes.LOGIN_SUCCESS,
    );
  } catch (error: any) {
    console.error("Ошибка при входе:", error.message);

    return sendError(res, ErrorCodes.LOGIN_SERVER_ERROR, 500);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    let activeTrips = [];

    if (user.role === "driver") {
      const driverTrips = await Trip.findAll({
        where: {
          driverId: user.id,
          status: {
            [Op.in]: ["created", "paid"],
          },
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
        order: [["departureAt", "ASC"]],
      });

      activeTrips = driverTrips.map((trip) => ({
        id: trip.id,
        role: "driver" as const,
        from: trip.from,
        to: trip.to,
        departureAt: trip.departureAt,
        price: trip.price,
        availableSeats: trip.availableSeats,
        description: trip.description,
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

          passengerId: booking.passengerId,
        })),
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
            where: {
              status: { [Op.in]: ["created", "paid"] },
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
            departureAt: booking.trip.departureAt,
            price: booking.trip.price,
            availableSeats: booking.trip.availableSeats,
            description: booking.trip.description,
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
                }
              : null,
            myBooking: {
              id: booking.id,
              seats: booking.seats,
              status: booking.status as "confirmed" | "pending",
              createdAt: booking.createdAt,
            },
          };
        })
        .filter((trip) => trip !== null);
    }

    const myBookings = await Booking.findAll({
      where: { passengerId: user.id },
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

    const notifications = user.notifications || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const freshNotifications = notifications.filter(
      (notification) => new Date(notification.createdAt) > thirtyDaysAgo,
    );

    if (freshNotifications.length !== notifications.length) {
      await user.update({ notifications: freshNotifications });
    }
    console.log(
      "ACTIVE_TRIPS_STRUCTURE:",
      JSON.stringify(activeTrips[0], null, 2),
    );
    console.log(
      "MY_BOOKINGS_STRUCTURE:",
      JSON.stringify(myBookings[0], null, 2),
    );
    return sendSuccess(
      res,
      {
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
          myBookings: myBookings,
        },

        notifications: freshNotifications,
      },
      ErrorCodes.USER_DATA,
      200,
    );
  } catch (error: any) {
    console.error("Ошибка в getMe:", error.message);
    return sendError(res, ErrorCodes.USERS_FETCH_ERROR, 500);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken", authCookieOptions());
  return sendSuccess(res, {}, ErrorCodes.LOGOUT_SUCCESS);
};

export const checkRegister = async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password, firstName, lastName, birthDate } =
      req.body;

    const validationErrors = validateRegistration(req.body, { requireRoleGender: false });
    if (validationErrors.length > 0) {
      // Совместимость: раньше здесь был один конкретный код со статусом 400 — сохраняем его
      // на верхнем уровне, а все ошибки с текстами отдаём в meta.errors
      const first = validationErrors[0]!;
      const legacy: Record<string, string> = {
        email: ErrorCodes.INVALID_EMAIL,
        phone: ErrorCodes.INVALID_PHONE,
        password: ErrorCodes.INVALID_PASSWORD_FORMAT,
        firstName: ErrorCodes.INVALID_NAME,
        lastName: ErrorCodes.INVALID_NAME,
        birthDate: ErrorCodes.INVALID_AGE,
      };
      const code =
        first.code === "FIELD_REQUIRED"
          ? ErrorCodes.MISSING_REQUIRED_FIELDS
          : (legacy[first.field] ?? first.code);
      return sendError(res, code, 400, {
        errors: validationErrors,
        missingFields: validationErrors.filter((e) => e.code === "FIELD_REQUIRED").map((e) => e.field),
      });
    }

    const conflicts = await findConflicts({
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      phone: normalizePhone(phone),
    });
    if (conflicts.length > 0) {
      return sendError(res, ErrorCodes.USER_ALREADY_EXISTS, 400, {
        conflicts: conflicts.map((c) => c.field),
        errors: conflicts,
      });
    }

    // Всё ок
    return sendSuccess(res, { valid: true }, "REGISTER_CHECK_SUCCESS", 200);
  } catch (error) {
    console.error("Check register error:", error);
    return sendError(res, ErrorCodes.REGISTER_CHECK_ERROR, 500);
  }
};

// Проверка перед восстановлением пароля
export const checkRecover = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return sendError(res, ErrorCodes.PHONE_REQUIRED, 400);
    }

    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
    }

    return sendSuccess(
      res,
      { valid: true, userId: user.id },
      "RECOVER_CHECK_SUCCESS",
      200,
    );
  } catch (error) {
    console.error("Check recover error:", error);
    return sendError(res, ErrorCodes.RECOVER_CHECK_ERROR, 500);
  }
};
