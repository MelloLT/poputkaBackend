import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
    } = req.body;

    if (
      !username ||
      !email ||
      !phone ||
      !password ||
      !role ||
      !firstName ||
      !lastName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Все поля обязательны: username, email, phone, password, role, firstName, lastName",
      });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Пользователь с таким логином уже существует",
      });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Пользователь с таким email уже существует",
      });
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Пользователь с таким телефоном уже существует",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      phone,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      avatar: avatar || undefined,
      rating: 0,
      isVerified: false,
      reviews: [],
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
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
          fullName: user.fullName,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при регистрации",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Логин/email и пароль обязательны",
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: login }, { username: login }],
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

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Вход выполнен успешно",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Ошибка при входе:", error);
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
          fullName: user.fullName,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка в getMe:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};
