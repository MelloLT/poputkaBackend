import express from "express";
import { getAllCitiesFormatted, getAllCityKeys } from "../utils/cityValidator";

const router = express.Router();

// Получить все города с названиями
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
  } catch (error: any) {
    console.error("Ошибка получения городов:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении списка городов",
    });
  }
});

// Получить ключи городов
router.get("/keys", (req, res) => {
  try {
    const cityKeys = getAllCityKeys();

    res.json({
      success: true,
      data: cityKeys,
    });
  } catch (error: any) {
    console.error("Ошибка получения ключей городов:", error.message);
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
    const cityInfo = getCityNames(cityKey);

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
  } catch (error: any) {
    console.error("Ошибка получения города:", error.message);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении информации о городе",
    });
  }
});

// Нужно импортировать getCityNames
import { getCityNames } from "../utils/cityValidator";

export default router;
