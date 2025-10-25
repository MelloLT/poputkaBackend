import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const generateToken = (userId: number, userRole: string) => {
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

    console.log("2. Проверка уникальности пользователя");
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

    console.log("3. Хэширование пароля");
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("4. Создание пользователя в БД");
    const user = await User.create({
      username,
      email,
      phone,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      avatar: avatar || undefined,
      gender: gender || undefined,
      car: car || undefined,
      rating: 0,
      isVerified: false,
      reviews: [],
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
          gender: user.gender,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
          car: user.car,
        },
      },
    });
  } catch (error: any) {
    console.log("=== ОШИБКА РЕГИСТРАЦИИ ===");
    console.error("Тип ошибки:", typeof error);
    console.error("Сообщение ошибки:", error.message);
    console.error("Stack trace:", error.stack);
    console.error("Полная ошибка:", error);

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
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.json({
      success: true,
      message: "Вход выполнен успешно",
      data: {
        token: token, // ✅ ТОЛЬКО ТОКЕН
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
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
          car: user.car,
        },
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
