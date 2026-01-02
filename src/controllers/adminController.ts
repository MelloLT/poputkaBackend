import { Request, Response } from "express";
import User from "../models/User";
import Trip from "../models/Trip";
import Booking from "../models/Booking";
import { Op } from "sequelize";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Получить всех пользователей для админки
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const whereClause: any = {};

    if (role) {
      whereClause.role = role.toString();
    }

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit.toString()),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        totalPages: Math.ceil(count / parseInt(limit.toString())),
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения пользователей:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Заблокировать пользователя
export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason, days } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    // Исправляем сравнение ролей
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Нельзя заблокировать администратора",
      });
    }

    const updateData: any = {
      isBanned: true,
      banReason: reason || "Нарушение правил сервиса",
    };

    if (days) {
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + parseInt(days));
      updateData.bannedUntil = bannedUntil;
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: days
        ? `Пользователь заблокирован на ${days} дней`
        : "Пользователь заблокирован навсегда",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isBanned: true,
          banReason: updateData.banReason,
          bannedUntil: updateData.bannedUntil,
        },
      },
    });
  } catch (error: any) {
    console.error("Ошибка блокировки пользователя:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Разблокировать пользователя
export const unbanUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    await user.update({
      isBanned: false,
      banReason: undefined,
      bannedUntil: undefined,
    });

    res.json({
      success: true,
      message: "Пользователь разблокирован",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isBanned: false,
        },
      },
    });
  } catch (error: any) {
    console.error("Ошибка разблокировки пользователя:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Удалить пользователя
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    // Исправляем сравнение ролей
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Нельзя удалить администратора",
      });
    }

    // Удаляем связанные данные
    await Trip.destroy({ where: { driverId: userId } });
    await Booking.destroy({ where: { passengerId: userId } });
    await user.destroy();

    res.json({
      success: true,
      message: "Пользователь и все связанные данные удалены",
    });
  } catch (error: any) {
    console.error("Ошибка удаления пользователя:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Пожаловаться на пользователя
export const reportUser = async (req: Request, res: Response) => {
  try {
    const reporterId = req.user!.id;
    const { targetUserId, reason, details } = req.body;

    if (!targetUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: "ID пользователя и причина жалобы обязательны",
      });
    }

    if (targetUserId === reporterId) {
      return res.status(400).json({
        success: false,
        message: "Нельзя пожаловаться на самого себя",
      });
    }

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const newReport = {
      id: `RP${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      reporterId,
      reason,
      details: details || "",
      createdAt: new Date(),
      status: "pending" as const,
    };

    const updatedReports = [newReport, ...(targetUser.reports || [])];

    await targetUser.update({ reports: updatedReports });

    res.json({
      success: true,
      message: "Жалоба отправлена администрации",
      data: {
        report: newReport,
      },
    });
  } catch (error: any) {
    console.error("Ошибка отправки жалобы:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Получить все жалобы
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;

    // Получаем всех пользователей с жалобами
    const users = await User.findAll({
      where: {
        reports: {
          [Op.ne]: [], // Проверяем, что массив не пустой
        },
      },
      attributes: [
        "id",
        "username",
        "email",
        "firstName",
        "lastName",
        "reports",
      ],
    });

    // Собираем все жалобы в один массив
    let allReports: any[] = [];

    users.forEach((user) => {
      const userReports = (user.reports || [])
        .filter((report: any) => status === "all" || report.status === status)
        .map((report: any) => ({
          ...report,
          targetUser: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        }));

      allReports = [...allReports, ...userReports];
    });

    // Сортируем по дате
    allReports.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Пагинация
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
    const paginatedReports = allReports.slice(
      offset,
      offset + parseInt(limit.toString())
    );

    res.json({
      success: true,
      data: paginatedReports,
      meta: {
        total: allReports.length,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        totalPages: Math.ceil(allReports.length / parseInt(limit.toString())),
        status,
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения жалоб:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Обновить статус жалобы
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { userId, reportId } = req.params;
    const { status, adminNote } = req.body;

    console.log(
      `Обновление статуса жалобы: userId=${userId}, reportId=${reportId}`
    );

    // Ищем пользователя, на которого поступила жалоба (target user)
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    console.log(
      `Найден пользователь: ${targetUser.username}, reports:`,
      targetUser.reports?.length || 0
    );

    const reports = targetUser.reports || [];
    const reportIndex = reports.findIndex((r: any) => r.id === reportId);

    console.log(`Индекс жалобы: ${reportIndex}`);

    if (reportIndex === -1) {
      // Пробуем найти жалобу во всех пользователях
      console.log(`Жалоба не найдена у пользователя ${userId}, ищем у всех...`);

      const allUsers = await User.findAll({
        where: {
          reports: {
            [Op.ne]: [],
          },
        },
      });

      let foundUser: User | null = null;
      let foundReportIndex = -1;

      for (const user of allUsers) {
        const userReports = user.reports || [];
        const idx = userReports.findIndex((r: any) => r.id === reportId);
        if (idx !== -1) {
          foundUser = user;
          foundReportIndex = idx;
          break;
        }
      }

      if (!foundUser) {
        return res.status(404).json({
          success: false,
          message: "Жалоба не найдена",
        });
      }

      // Обновляем жалобу у найденного пользователя
      const foundReports = foundUser.reports || [];
      foundReports[foundReportIndex] = {
        ...foundReports[foundReportIndex],
        status: status,
        adminNote: adminNote,
        resolvedAt: new Date(),
      };

      await foundUser.update({ reports: foundReports });

      console.log(`Жалоба обновлена у пользователя ${foundUser.id}`);

      return res.json({
        success: true,
        message: `Статус жалобы обновлен на: ${status}`,
        data: {
          report: foundReports[foundReportIndex],
          targetUser: {
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email,
          },
        },
      });
    }

    // Если жалоба найдена у указанного пользователя
    reports[reportIndex] = {
      ...reports[reportIndex],
      status: status,
      adminNote: adminNote,
      resolvedAt: new Date(),
    };

    await targetUser.update({ reports });

    console.log(`Жалоба обновлена у пользователя ${targetUser.id}`);

    res.json({
      success: true,
      message: `Статус жалобы обновлен на: ${status}`,
      data: {
        report: reports[reportIndex],
        targetUser: {
          id: targetUser.id,
          username: targetUser.username,
          email: targetUser.email,
        },
      },
    });
  } catch (error: any) {
    console.error("Ошибка обновления статуса жалобы:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};
// Статистика для админки
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.count();
    const totalDrivers = await User.count({ where: { role: "driver" } });
    const totalPassengers = await User.count({ where: { role: "passenger" } });
    const totalTrips = await Trip.count();
    const activeTrips = await Trip.count({ where: { status: "active" } });
    const completedTrips = await Trip.count({ where: { status: "completed" } });
    const totalBookings = await Booking.count();
    const bannedUsers = await User.count({ where: { isBanned: true } });

    const recentUsers = await User.findAll({
      limit: 10,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "username", "email", "role", "createdAt"],
    });

    const usersWithReports = await User.findAll({
      where: {
        reports: {
          [Op.ne]: [],
        },
      },
    });

    let totalPendingReports = 0;
    usersWithReports.forEach((user) => {
      totalPendingReports += (user.reports || []).filter(
        (r: any) => r.status === "pending"
      ).length;
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          drivers: totalDrivers,
          passengers: totalPassengers,
          banned: bannedUsers,
        },
        trips: {
          total: totalTrips,
          active: activeTrips,
          completed: completedTrips,
        },
        bookings: totalBookings,
        reports: {
          pending: totalPendingReports,
        },
        recentUsers,
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения статистики:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};
