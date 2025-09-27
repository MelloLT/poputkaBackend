import { Request, Response } from "express";
import { Op } from "sequelize";
import Trip from "../models/Trip";
import User from "../models/User";

export const getTrips = async (req: Request, res: Response) => {
  try {
    const { from, to, date, price, seats } = req.query;
    console.log("📋 Фильтры запроса:", { from, to, date, price, seats });

    // Базовые условия - только активные поездки
    const whereClause: any = { status: "active" };

    // 🔍 Фильтр по городу отправления
    if (from) {
      whereClause.from = {
        [Op.contains]: { city: from.toString() },
      };
    }

    // 🎯 Фильтр по городу назначения
    if (to) {
      whereClause.to = {
        [Op.contains]: { city: to.toString() },
      };
    }

    // 📅 Фильтр по дате отправления
    if (date) {
      const searchDate = new Date(date.toString());
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.departureTime = {
        [Op.between]: [searchDate, nextDay],
      };
    }

    // 💰 Фильтр по максимальной цене
    if (price) {
      whereClause.price = {
        [Op.lte]: parseFloat(price.toString()),
      };
    }

    // 👥 Фильтр по количеству мест
    if (seats) {
      whereClause.availableSeats = {
        [Op.gte]: parseInt(seats.toString()),
      };
    }

    console.log("🔍 Условия поиска:", JSON.stringify(whereClause, null, 2));

    // Ищем поездки с учетом фильтров
    const trips = await Trip.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "driver",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "avatar",
            "rating",
            "isVerified",
          ],
        },
      ],
      order: [["departureTime", "ASC"]],
    });

    console.log(`✅ Найдено поездок: ${trips.length}`);

    // Форматируем данные для ответа
    const formattedTrips = trips.map((trip) => ({
      id: trip.id,
      departure: trip.from.city,
      arrival: trip.to.city,
      price: trip.price,
      departureTime: trip.departureTime,
      seatsAvailable: trip.availableSeats,
      driver: {
        avatar: trip.driver?.avatar || "/images/default-avatar.png",
        name: `${trip.driver?.firstName || "Водитель"} ${
          trip.driver?.lastName || ""
        }`.trim(),
        rating: trip.driver?.rating || 5,
        varified: trip.driver?.isVerified || false,
      },
      from: trip.from,
      to: trip.to,
      description: trip.description,
      status: trip.status,
    }));

    res.json({
      success: true,
      data: formattedTrips,
      meta: {
        total: trips.length,
        filters: { from, to, date, price, seats },
      },
    });
  } catch (error) {
    console.error("❌ Ошибка при поиске поездок:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске поездок",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    console.log("📝 Создаем поездку:", req.body);

    const { from, to, departureTime, price, availableSeats, description } =
      req.body;

    // Простая валидация
    if (!from || !to || !departureTime || !price || !availableSeats) {
      return res.status(400).json({
        success: false,
        message: "Все поля обязательны",
      });
    }

    // Создаем поездку с фиксированным driverId (для теста)
    const trip = await Trip.create({
      driverId: 1, // Просто используем первого водителя
      from,
      to,
      departureTime: new Date(departureTime),
      price: parseFloat(price),
      availableSeats: parseInt(availableSeats),
      description: description || "Описание не указано",
      status: "active",
    });

    console.log("✅ Поездка создана:", trip.id);

    res.status(201).json({
      success: true,
      message: "Поездка создана успешно",
      data: trip,
    });
  } catch (error) {
    console.error("❌ Ошибка при создании поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("✏️ Обновляем поездку:", id, updateData);

    const trip = await Trip.findByPk(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }

    await trip.update(updateData);

    res.json({
      success: true,
      message: "Поездка обновлена",
      data: trip,
    });
  } catch (error) {
    console.error("❌ Ошибка при обновлении:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Удаляем поездку:", id);

    const trip = await Trip.findByPk(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }

    await trip.update({ status: "cancelled" });

    res.json({
      success: true,
      message: "Поездка отменена",
    });
  } catch (error) {
    console.error("❌ Ошибка при удалении:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};
