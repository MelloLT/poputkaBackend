import { Request, Response } from "express";
import User from "../models/User";
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
    console.error("❌ Ошибка при получении пользователей:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Получить пользователя по ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Ошибка при получении пользователя:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
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
    console.error("❌ Ошибка при получении водителей:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
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
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        success: false,
        message: "Вы можете обновлять только свой профиль",
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
    console.error("❌ Ошибка при обновлении пользователя:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};
