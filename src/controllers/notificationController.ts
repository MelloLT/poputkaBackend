import { Request, Response } from "express";
import User from "../models/User";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    // Автоматически удаляем старые уведомления (>30 дней)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const freshNotifications = (user.notifications || []).filter(
      (notification) => new Date(notification.createdAt) > thirtyDaysAgo
    );

    // Обновляем только если есть что удалить
    if (freshNotifications.length !== (user.notifications || []).length) {
      await user.update({ notifications: freshNotifications });
    }

    res.json({
      success: true,
      data: freshNotifications,
      meta: {
        total: freshNotifications.length,
        unread: freshNotifications.filter((n) => !n.isRead).length,
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения уведомлений:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении уведомлений",
    });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const notifications = user.notifications || [];
    const notificationIndex = notifications.findIndex(
      (n) => n.id === notificationId
    );

    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Уведомление не найдено",
      });
    }

    // Помечаем как прочитанное
    notifications[notificationIndex].isRead = true;

    await user.update({ notifications });

    res.json({
      success: true,
      message: "Уведомление помечено как прочитанное",
      data: notifications[notificationIndex],
    });
  } catch (error: any) {
    console.error("Ошибка обновления уведомления:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении уведомления",
    });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const notifications = (user.notifications || []).map((notification) => ({
      ...notification,
      isRead: true,
    }));

    await user.update({ notifications });

    res.json({
      success: true,
      message: "Все уведомления помечены как прочитанные",
      data: notifications,
    });
  } catch (error: any) {
    console.error("Ошибка обновления уведомлений:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении уведомлений",
    });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const notifications = (user.notifications || []).filter(
      (n) => n.id !== notificationId
    );

    await user.update({ notifications });

    res.json({
      success: true,
      message: "Уведомление удалено",
    });
  } catch (error: any) {
    console.error("Ошибка удаления уведомления:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении уведомления",
    });
  }
};
