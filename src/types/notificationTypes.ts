import { ErrorCodes } from "../utils/errorCodes";

export type NotificationType =
  | "booking_request"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "trip_completed"
  | "payment_success"
  | "payment_failed"
  | "info"
  | "success"
  | "error";

export type NotificationCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// динамическия сообщения параметры
export interface NotificationParams {
  seats?: number;
  from?: string;
  to?: string;
  departureAt?: string | Date;
  passengerName?: string;
  driverName?: string;
  amount?: number;
  tripId?: string;
  reason?: string;
  date?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  type: NotificationType;
  code: NotificationCode;
  params?: NotificationParams;
  isRead: boolean;
  createdAt: Date;
  relatedBookingId?: string;
  relatedTripId?: string;
}
