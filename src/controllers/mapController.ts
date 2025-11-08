import { Request, Response } from "express";
import { getTripInfo } from "../services/mapService";

export const calculateTripRoute = async (req: Request, res: Response) => {
  try {
    const { fromCity, toCity } = req.body;

    if (!fromCity || !toCity) {
      return res.status(400).json({
        success: false,
        message: "fromCity и toCity обязательны",
      });
    }

    const tripInfo = await getTripInfo(fromCity, toCity);

    if (!tripInfo) {
      return res.status(400).json({
        success: false,
        message: "Не удалось рассчитать маршрут",
      });
    }

    res.json({
      success: true,
      data: tripInfo,
    });
  } catch (error) {
    console.error("Error calculating route:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при расчете маршрута",
    });
  }
};
