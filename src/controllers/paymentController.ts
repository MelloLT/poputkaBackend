import { Request, Response } from "express";
import Trip from "../models/Trip";
import { sendSuccess, sendError } from "../utils/responseHelper";

export const paymentCallback = async (req: Request, res: Response) => {
  try {
    const { tripId, paymentId, userId } = req.body;

    console.log("Payment callback received:", { tripId, paymentId, userId });

    if (!tripId) {
      return sendError(res, "TRIP_ID_REQUIRED", 400);
    }

    // Находим поездку
    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      console.log(`Trip not found: ${tripId}`);
      return sendError(res, "TRIP_NOT_FOUND", 404);
    }

    // Обновляем статус поездки на paid
    await trip.update({
      status: "paid",
      isPaid: true,
    });

    console.log(`Trip ${tripId} status updated to paid`);

    sendSuccess(res, {
      tripId: trip.id,
      status: trip.status,
      message: "Trip status updated to paid",
    });
  } catch (error: any) {
    console.error("Payment callback error:", error.message);
    sendError(res, "PAYMENT_CALLBACK_ERROR", 500);
  }
};
