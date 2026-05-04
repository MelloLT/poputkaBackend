import User from "../models/User";
import { NotificationType } from "../types/notificationTypes";

const generateNotificationId = (): string => {
  return `NT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
};

export const addNotification = async (
  userId: any,
  type: NotificationType,
  code: string,
  params: Record<string, any> = {},
  relatedBookingId?: string,
  relatedTripId?: string,
): Promise<void> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.log(`[NOTIFICATION] User ${userId} not found`);
      return;
    }

    const newNotification = {
      id: generateNotificationId(),
      type,
      code,
      params,
      isRead: false,
      createdAt: new Date(),
      relatedBookingId,
      relatedTripId,
    };

    const currentNotifications = user.notifications || [];
    const updatedNotifications = [
      newNotification,
      ...currentNotifications,
    ].slice(0, 100);

    await user.update({ notifications: updatedNotifications });

    console.log(`[NOTIFICATION] Sent to ${userId}: ${code}`, params);
  } catch (error) {
    console.error("[NOTIFICATION] Error:", error);
  }
};

export const createTripParams = (
  trip: any,
  extra?: any,
): Record<string, any> => {
  return {
    from: trip.from?.cityKey || trip.from,
    to: trip.to?.cityKey || trip.to,
    departureAt: trip.departureAt,
    ...extra,
  };
};
