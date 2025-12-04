export type NotificationType =
  | "booking_request"
  | "booking_confirmed"
  | "booking_rejected"
  | "info"
  | "success"
  | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedBookingId?: string;
}
