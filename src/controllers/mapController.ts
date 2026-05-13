import { Request, Response } from "express";
import { getTripInfo } from "../services/mapService";
import { sendError, sendSuccess } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

export const calculateTripRoute = async (req: Request, res: Response) => {
  try {
    const { fromCity, toCity } = req.body;

    if (!fromCity || !toCity) {
      return sendError(res, ErrorCodes.FROM_TO_REQUIRED, 400);
    }

    const tripInfo = await getTripInfo(fromCity, toCity);

    if (!tripInfo) {
      return sendError(res, ErrorCodes.ROUTE_CALC_FAILED, 400);
    }
    return sendSuccess(res, { tripInfo }, ErrorCodes.ROUTE_CALC_SUCCESS);
  } catch (error) {
    return sendError(res, ErrorCodes.ROUTE_CALC_ERROR, 500);
  }
};
