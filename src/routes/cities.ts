import express from "express";
import {
  getAvailableCityKeys,
  getAllCitiesFormatted,
  getCityNamesByKey,
} from "../utils/cityValidator";

const router = express.Router();

// Получить все города с ключами и названиями
router.get("/", (req, res) => {
  try {
    const cities = getAllCitiesFormatted();

    res.json({
      success: true,
      data: cities,
      meta: {
        total: cities.length,
      },
    });
  } catch (error) {
    console.error("Ошибка получения городов:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении списка городов",
    });
  }
});

// Получить только ключи городов
router.get("/keys", (req, res) => {
  try {
    const cityKeys = getAvailableCityKeys();

    res.json({
      success: true,
      data: cityKeys,
    });
  } catch (error) {
    console.error("Ошибка получения ключей городов:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении ключей городов",
    });
  }
});

// Получить информацию о городе по ключу
router.get("/:cityKey", (req, res) => {
  try {
    const { cityKey } = req.params;
    const cityInfo = getCityNamesByKey(cityKey);

    if (!cityInfo) {
      return res.status(404).json({
        success: false,
        message: `Город с ключом "${cityKey}" не найден`,
      });
    }

    res.json({
      success: true,
      data: cityInfo,
    });
  } catch (error) {
    console.error("Ошибка получения города:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении информации о городе",
    });
  }
});

export default router;
