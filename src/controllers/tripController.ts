import { Request, Response } from "express";
import { Op } from "sequelize";
import Trip from "../models/Trip";
import User from "../models/User";
import { getTripInfo } from "../services/mapService";

export const getTrips = async (req: Request, res: Response) => {
  try {
    const {
      from,
      to,
      date,
      minPrice,
      maxPrice,
      seats,
      timeFrom,
      timeTo,
      driverGender,
    } = req.query;

    console.log("📋 Фильтры запроса:", {
      from,
      to,
      date,
      minPrice,
      maxPrice,
      seats,
      timeFrom,
      timeTo,
      driverGender,
    });

    const whereClause: any = { status: "active" };
    const includeClause: any = [
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
          "car",
          "gender",
        ],
      },
    ];

    // Фильтр по городу отправления
    if (from) {
      whereClause.from = {
        [Op.contains]: { cityKey: from.toString() },
      };
    }

    // Фильтр по городу назначения
    if (to) {
      whereClause.to = {
        [Op.contains]: { cityKey: to.toString() },
      };
    }

    // ФИКС: Фильтр по дате (теперь сравниваем строки)
    if (date) {
      whereClause.departureDate = date.toString();
    }

    // ФИКС: Фильтр по времени (сравниваем строки "HH:mm")
    if (timeFrom || timeTo) {
      whereClause.departureTime = {};
      if (timeFrom) whereClause.departureTime[Op.gte] = timeFrom.toString();
      if (timeTo) whereClause.departureTime[Op.lte] = timeTo.toString();
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) {
        whereClause.price[Op.gte] = parseFloat(minPrice.toString());
      }
      if (maxPrice) {
        whereClause.price[Op.lte] = parseFloat(maxPrice.toString());
      }
    }

    // Фильтр по количеству мест
    if (seats) {
      whereClause.availableSeats = {
        [Op.gte]: parseInt(seats.toString()),
      };
    }

    // Фильтр по полу водителя
    if (driverGender) {
      includeClause[0].where = {
        gender: driverGender.toString(),
      };
    }

    console.log("Условия поиска:", JSON.stringify(whereClause, null, 2));

    const trips = await Trip.findAll({
      where: whereClause,
      include: includeClause,
      order: [
        ["departureDate", "ASC"],
        ["departureTime", "ASC"],
      ], // ФИКС: сортировка
    });

    console.log(`Найдено поездок: ${trips.length}`);

    res.json({
      success: true,
      data: trips,
      meta: {
        total: trips.length,
        filters: {
          from,
          to,
          date,
          minPrice,
          maxPrice,
          seats,
          timeFrom,
          timeTo,
          driverGender,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка при поиске поездок:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске поездок",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findByPk(id, {
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
            "car",
            "gender",
          ],
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена",
      });
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Ошибка при получении поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;

    const {
      from,
      to,
      departureDate,
      departureTime,
      price,
      availableSeats,
      description,
      instantBooking = false,
      maxTwoBackSeats = false,
    } = req.body;

    console.log("Создаем поездку для водителя:", driverId, req.body);

    const requiredFields = [
      "from",
      "to",
      "departureDate",
      "departureTime",
      "price",
      "availableSeats",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Не заполнены обязательные поля: ${missingFields.join(", ")}`,
      });
    }

    const tripDateTime = new Date(`${departureDate}T${departureTime}:00`);
    const now = new Date();

    if (tripDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Дата и время поездки должны быть в будущем",
      });
    }

    // Автоматически рассчитываем информацию о маршруте
    let tripInfo = null;
    try {
      tripInfo = await getTripInfo(from.cityKey, to.cityKey);
      console.log("Calculated trip info:", tripInfo);
    } catch (error) {
      console.log("Could not calculate trip info, continuing without it");
    }

    const newTrip = await Trip.create({
      driverId,
      from,
      to,
      departureDate,
      departureTime,
      price: parseFloat(price),
      availableSeats: parseInt(availableSeats),
      description: description || "",
      instantBooking: Boolean(instantBooking),
      maxTwoBackSeats: Boolean(maxTwoBackSeats),
      status: "active",
      tripInfo: tripInfo || undefined,
    });

    const tripWithDriver = await Trip.findByPk(newTrip.id, {
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
            "car",
          ],
        },
      ],
    });

    console.log("Поездка создана, ID:", newTrip.id);

    res.status(201).json({
      success: true,
      message: "Поездка создана успешно",
      data: tripWithDriver,
    });
  } catch (error) {
    console.error("Ошибка при создании поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании поездки",
    });
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user!.id;
    const updateData = req.body;

    console.log("Обновляем поездку ID:", id, "для водителя:", driverId);

    const trip = await Trip.findOne({
      where: { id, driverId },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена или у вас нет прав для редактирования",
      });
    }

    await trip.update(updateData);

    res.json({
      success: true,
      message: "Поездка обновлена успешно",
      data: trip,
    });
  } catch (error) {
    console.error("Ошибка при обновлении поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении поездки",
    });
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user!.id;

    console.log("Удаляем поездку ID:", id, "для водителя:", driverId);

    const trip = await Trip.findOne({
      where: { id, driverId },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Поездка не найдена или у вас нет прав для удаления",
      });
    }

    await trip.update({ status: "cancelled" });

    res.json({
      success: true,
      message: "Поездка отменена успешно",
    });
  } catch (error) {
    console.error("Ошибка при удалении поездки:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении поездки",
    });
  }
};
