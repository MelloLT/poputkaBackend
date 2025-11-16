import sequelize from "../config/database";
import User from "../models/User";
import Trip from "../models/Trip";
import bcrypt from "bcryptjs";
import Booking from "../models/Booking";

export const seedData = async () => {
  console.log("НАЧАЛО SEED");

  try {
    console.log("1. Синхронизация базы данных...");
    await sequelize.sync({ force: true }); // Это пересоздаст таблицы с правильными типами
    console.log("База данных синхронизирована");

    console.log("2. Создание пользователей...");
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Водитель 1
    const driver1 = await User.create({
      username: "ali_driver",
      email: "ali@example.com",
      phone: "+998901234567",
      password: hashedPassword,
      role: "driver",
      firstName: "Алишер",
      lastName: "Усманов",
      birthDate: "1990-05-15",
      about:
        "Опытный водитель с 5-летним стажем. Комфортные поездки по Узбекистану.",
      tripsCount: 47,
      gender: "male",
      avatar: "/uploads/avatars/default-male.jpg",
      rating: 4.8,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      notifications: [],
      car: {
        model: "Chevrolet Cobalt",
        color: "Белый",
        year: 2022,
        licensePlate: "01 A 123 AB",
        photos: ["/uploads/cars/default-car-1.jpg"],
      },
    });
    console.log("Водитель 1 создан, ID:", driver1.id);

    // Водитель 2
    const driver2 = await User.create({
      username: "dilbar_driver",
      email: "dilbar@example.com",
      phone: "+998907654321",
      password: hashedPassword,
      role: "driver",
      firstName: "Дилбар",
      lastName: "Ахмедова",
      birthDate: "1985-08-22",
      about:
        "Безопасные поездки для всех пассажиров. Особые условия для женщин.",
      tripsCount: 32,
      gender: "female",
      avatar: "/uploads/avatars/default-female.jpg",
      rating: 4.9,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      notifications: [],
      car: {
        model: "Nexia 3",
        color: "Серебристый",
        year: 2020,
        licensePlate: "01 B 456 CD",
        photos: ["/uploads/cars/default-car-2.jpg"],
      },
    });
    console.log("Водитель 2 создан, ID:", driver2.id);

    // Пассажир
    const passenger1 = await User.create({
      username: "sarvar_passenger",
      email: "sarvar@example.com",
      phone: "+998901112233",
      password: hashedPassword,
      role: "passenger",
      firstName: "Сарвар",
      lastName: "Каримов",
      birthDate: "1995-12-10",
      about: "Часто путешествую между городами. Ценю комфорт и пунктуальность.",
      tripsCount: 15,
      gender: "male",
      rating: 4.5,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      notifications: [],
    });
    console.log("Пассажир создан, ID:", passenger1.id);

    console.log("3. Создание поездок...");

    // Поездка 1 - завершенная
    const trip1 = await Trip.create({
      driverId: driver1.id, // Используем реальный ID водителя
      from: { cityKey: "tashkent", address: "Центральный автовокзал" },
      to: { cityKey: "samarkand", address: "Автовокзал Самарканд" },
      departureDate: "2024-11-01",
      departureTime: "08:00",
      price: 150000,
      availableSeats: 3,
      description: "Комфортная поездка, кондиционер",
      instantBooking: false,
      maxTwoBackSeats: true,
      status: "completed",
      tripInfo: {
        distance: 300,
        duration: 240,
        coordinates: {
          from: { lat: 41.2995, lon: 69.2401 },
          to: { lat: 39.627, lon: 66.975 },
        },
      },
    });
    console.log("Поездка 1 создана, ID:", trip1.id);

    // Поездка 2 - завершенная
    const trip2 = await Trip.create({
      driverId: driver2.id, // Используем реальный ID водителя
      from: { cityKey: "tashkent", address: "Южный вокзал" },
      to: { cityKey: "bukhara", address: "Автовокзал Бухара" },
      departureDate: "2024-11-02",
      departureTime: "10:30",
      price: 200000,
      availableSeats: 2,
      description: "Быстрая поездка по новой дороге",
      instantBooking: true,
      maxTwoBackSeats: false,
      status: "completed",
      tripInfo: {
        distance: 550,
        duration: 360,
        coordinates: {
          from: { lat: 41.2995, lon: 69.2401 },
          to: { lat: 39.7756, lon: 64.4226 },
        },
      },
    });
    console.log("Поездка 2 создана, ID:", trip2.id);

    console.log("4. Создание тестовых бронирований...");

    // Бронь 1 - завершенная
    const booking1 = await Booking.create({
      passengerId: passenger1.id, // Используем реальный ID пассажира
      tripId: trip1.id, // Используем реальный ID поездки
      seats: 2,
      status: "confirmed",
    });
    console.log("Бронь 1 создана, ID:", booking1.id);

    // Бронь 2 - завершенная
    const booking2 = await Booking.create({
      passengerId: passenger1.id,
      tripId: trip2.id,
      seats: 1,
      status: "confirmed",
    });
    console.log("Бронь 2 создана, ID:", booking2.id);

    console.log("5. Добавление отзывов после создания всех сущностей...");

    // Добавляем отзывы после того как все ID известны
    await driver1.update({
      reviews: [
        {
          author: "Сарвар Каримов",
          authorId: passenger1.id,
          text: "Отличный водитель, вовремя приехал, комфортная поездка",
          rating: 5,
          createdAt: new Date("2024-11-01"),
          tripId: trip1.id,
        },
      ],
    });

    await driver2.update({
      reviews: [
        {
          author: "Алишер Усманов",
          authorId: driver1.id,
          text: "Очень комфортная поездка, рекомендую",
          rating: 5,
          createdAt: new Date("2024-11-05"),
          tripId: trip2.id,
        },
      ],
    });

    console.log("SEED УСПЕШНО ЗАВЕРШЕН");
    console.log("Пользователей: 3 (2 водителя, 1 пассажир)");
    console.log("Поездок: 2 завершенные");
    console.log("Броней: 2 завершенные");
    console.log("Отзывов: 2");
  } catch (error: any) {
    console.log("ОШИБКА В SEED");
    console.error("Сообщение:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full error:", error);
  }
};

// Запускаем seed
seedData();
