import { Request, Response } from "express";
import User from "../models/User";
import { ErrorCodes } from "../utils/errorCodes";
import { sendError, sendSuccess } from "../utils/responseHelper";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
    }

    // Автоматически удаляем старые уведомления (>30 дней)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const freshNotifications = (user.notifications || []).filter(
      (notification) => new Date(notification.createdAt) > thirtyDaysAgo,
    );

    console.log(`Уведомления пользователя ${userId}:`);
    console.log(`Всего в БД: ${user.notifications?.length || 0}`);
    console.log(`После фильтрации (>30 дней): ${freshNotifications.length}`);
    console.log(
      `Непрочитанных: ${freshNotifications.filter((n) => !n.isRead).length}`,
    );

    // Логируем все уведомления для отладки
    freshNotifications.forEach((n, i) => {
      console.log(
        `  [${i}] ID: ${n.id}, Тип: ${n.type}, Прочитано: ${n.isRead}, Дата: ${n.createdAt}`,
      );
    });

    // Обновляем только если есть что удалить
    if (freshNotifications.length !== (user.notifications || []).length) {
      console.log(
        `Удаляем ${(user.notifications || []).length - freshNotifications.length} старых уведомлений`,
      );
      await user.update({ notifications: freshNotifications });
    }

    return sendSuccess(
      res,
      { freshNotifications },
      ErrorCodes.NOTIFICATIONS_FETCH_SUCCESS,
      200,
      {
        total: freshNotifications.length,
        unread: freshNotifications.filter((n) => !n.isRead).length,
      },
    );
  } catch (error: any) {
    return sendError(res, ErrorCodes.NOTIFICATIONS_FETCH_ERROR, 500);
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    console.log(
      `Пометить как прочитанное: userId=${userId}, notificationId=${notificationId}`,
    );

    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
    }

    const notifications = user.notifications || [];
    console.log(`Всего уведомлений: ${notifications.length}`);

    // Ищем уведомление
    const notificationIndex = notifications.findIndex(
      (n) => n.id === notificationId,
    );

    if (notificationIndex === -1) {
      console.log(`Уведомление ${notificationId} не найдено`);

      sendError(res, ErrorCodes.NOTIFICATION_NOT_FOUND, 404);
    }

    console.log(`Найдено уведомление по индексу: ${notificationIndex}`);
    console.log(`Текущий статус: ${notifications[notificationIndex].isRead}`);

    // Создаем копию массива с обновленным уведомлением
    const updatedNotifications = [...notifications];
    updatedNotifications[notificationIndex] = {
      ...updatedNotifications[notificationIndex],
      isRead: true,
    };

    console.log(
      `Обновляем уведомление, новый статус: ${updatedNotifications[notificationIndex].isRead}`,
    );

    // Обновляем пользователя
    await user.update({
      notifications: updatedNotifications,
    });

    // Получаем обновленного пользователя для проверки
    const updatedUser = await User.findByPk(userId);
    const checkNotification = updatedUser?.notifications?.find(
      (n) => n.id === notificationId,
    );

    console.log(`Проверка после обновления: ${checkNotification?.isRead}`);

    return sendSuccess(
      res,
      {
        notification: updatedNotifications[notificationIndex],
        total: updatedNotifications.length,
        unread: updatedNotifications.filter((n) => !n.isRead).length,
      },
      ErrorCodes.NOTIFICATIONS_MARKED_READ,
      200,
    );
  } catch (error: any) {
    console.error("Ошибка обновления уведомления:", error);
    return sendError(res, ErrorCodes.NOTIFICATION_UPDATE_ERROR, 500);
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
    }

    const notifications = (user.notifications || []).map((notification) => ({
      ...notification,
      isRead: true,
    }));

    await user.update({ notifications });

    return sendSuccess(
      res,
      { notifications },
      ErrorCodes.NOTIFICATIONS_MARKED_READ,
      200,
    );
  } catch (error: any) {
    console.error("Ошибка обновления уведомлений:", error);

    return sendError(res, ErrorCodes.NOTIFICATIONS_UPDATE_ERROR, 500);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
    }

    const notifications = (user.notifications || []).filter(
      (n) => n.id !== notificationId,
    );

    await user.update({ notifications });

    return sendSuccess(res, null, ErrorCodes.NOTIFICATION_DELETED, 200);
  } catch (error: any) {
    console.error("Ошибка удаления уведомления:", error);
    return sendError(res, ErrorCodes.NOTIFICATION_DELETE_ERROR, 500);
  }
};
