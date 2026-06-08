import express from "express";
import { getAllCitiesFormatted, getAllCityKeys } from "../utils/cityValidator";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

const router = express.Router();

// Получить все города с названиями
router.get("/", (req, res) => {
  try {
    const cities = getAllCitiesFormatted();

    return sendSuccess(res, cities, ErrorCodes.CITIES_FETCH_SUCCESS, 200, {
      total: cities.length,
    });
  } catch (error: any) {
    console.error("Ошибка получения городов:", error.message);
    return sendError(res, ErrorCodes.CITIES_FETCH_ERROR, 500);
  }
});

// Получить ключи городов
router.get("/keys", (req, res) => {
  try {
    const cityKeys = getAllCityKeys();

    return sendSuccess(
      res,
      cityKeys,
      ErrorCodes.CITIES_KEYS_FETCH_SUCCESS,
      200,
    );
  } catch (error: any) {
    console.error("Ошибка получения ключей городов:", error.message);
    return sendError(res, ErrorCodes.CITIES_KEYS_FETCH_ERROR, 500);
  }
});

// Получить информацию о городе по ключу
router.get("/:cityKey", (req, res) => {
  try {
    const { cityKey } = req.params;
    const cityInfo = getCityNames(cityKey);

    if (!cityInfo) {
      return res.status(404).json({
        success: false,
        message: `Город с ключом "${cityKey}" не найден`,
      });
    }

    return sendSuccess(res, cityInfo, ErrorCodes.CITY_INFO_FETCH_SUCCESS, 200);
  } catch (error: any) {
    console.error("Ошибка получения города:", error.message);
    return sendError(res, ErrorCodes.CITY_INFO_FETCH_ERROR, 500);
  }
});

// Нужно импортировать getCityNames
import { getCityNames } from "../utils/cityValidator";

export default router;
