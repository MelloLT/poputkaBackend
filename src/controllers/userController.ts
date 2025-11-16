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
    const { about, firstName, lastName, gender } = req.body;

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

export const incrementTripsCount = async (userId: string) => {
  try {
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({
        tripsCount: (user.tripsCount || 0) + 1,
      });
    }
  } catch (error) {
    console.error("Ошибка увеличения счетчика поездок:", error);
  }
};
