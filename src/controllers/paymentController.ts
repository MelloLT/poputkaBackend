import { Request, Response } from "express";
import Trip from "../models/Trip";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";
import { logger } from "../config/logger";

export const paymentCallback = async (req: Request, res: Response) => {
  try {
    const { tripId, paymentId, userId } = req.body;

    logger.info({ tripId, paymentId, userId }, "payment callback received");

    if (!tripId) {
      return sendError(res, "TRIP_ID_REQUIRED", 400);
    }

    // Находим поездку
    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return sendError(res, "TRIP_NOT_FOUND", 404);
    }

    // Обновляем статус поездки на paid
    await trip.update({
      status: "paid",
      isPaid: true,
    });

    return sendSuccess(
      res,
      {
        tripId: trip.id,
        status: trip.status,
      },
      ErrorCodes.TRIP_PAID_SUCCESS,
    );
  } catch (error: any) {
    logger.error({ err: error }, "payment callback failed");
    return sendError(res, ErrorCodes.PAYMENT_CALLBACK_ERROR, 500);
  }
};
