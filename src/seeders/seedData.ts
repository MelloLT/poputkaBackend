import sequelize from "../config/database";
import User from "../models/User";
import Trip from "../models/Trip";
import bcrypt from "bcryptjs";
import Booking from "../models/Booking";
import { generateId } from "../utils/idGenerator";

export const seedData = async () => {
  console.log("НАЧАЛО SEED");

  try {
    console.log("1. Синхронизация базы данных...");
    await sequelize.sync({ force: true });
    console.log("База данных синхронизирована");

    console.log("2. Создание пользователей...");
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Генерируем ID заранее чтобы использовать в отзывах
    const driver1Id = generateId();
    const driver2Id = generateId();
    const passenger1Id = generateId();

    // Водитель 1
    const driver1 = await User.create({
      id: driver1Id,
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
      notifications: [],
      car: {
        model: "Chevrolet Cobalt",
        color: "Белый",
        year: 2022,
        licensePlate: "01 A 123 AB",
        photos: ["/uploads/cars/default-car-1.jpg"],
      },
      reviews: [
        {
          author: "Сарвар Каримов",
          authorId: passenger1Id,
          text: "Отличный водитель, вовремя приехал, комфортная поездка",
          rating: 5,
          createdAt: new Date("2024-11-01"),
          tripId: "TRcompleted1",
        },
        {
          author: "Дилбар Ахмедова",
          authorId: driver2Id,
          text: "Вежливый и аккуратный водитель",
          rating: 4,
          createdAt: new Date("2024-10-15"),
          tripId: "TRcompleted2",
        },
      ],
    });
    console.log("Водитель 1 создан, ID:", driver1.id);

    // Водитель 2
    const driver2 = await User.create({
      id: driver2Id,
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
      notifications: [],
      car: {
        model: "Nexia 3",
        color: "Серебристый",
        year: 2020,
        licensePlate: "01 B 456 CD",
        photos: ["/uploads/cars/default-car-2.jpg"],
      },
      reviews: [
        {
          author: "Алишер Усманов",
          authorId: driver1Id,
          text: "Очень комфортная поездка, рекомендую",
          rating: 5,
          createdAt: new Date("2024-11-05"),
          tripId: "TRcompleted3",
        },
      ],
    });
    console.log("Водитель 2 создан, ID:", driver2.id);

    // Пассажир
    const passenger1 = await User.create({
      id: passenger1Id,
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
      notifications: [],
    });
    console.log("Пассажир создан, ID:", passenger1.id);

    console.log("3. Создание поездок...");

    // Поездка 1 - завершенная
    const trip1 = await Trip.create({
      id: "TRcompleted1",
      driverId: driver1Id,
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
      id: "TRcompleted2",
      driverId: driver2Id,
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

    // Поездка 3 - активная
    const trip3 = await Trip.create({
      id: "TRactive1",
      driverId: driver1Id,
      from: { cityKey: "samarkand", address: "Автовокзал Самарканд" },
      to: { cityKey: "bukhara", address: "Центральный автовокзал" },
      departureDate: "2024-12-26",
      departureTime: "14:00",
      price: 120000,
      availableSeats: 4,
      description: "Едем через живописные места",
      instantBooking: false,
      maxTwoBackSeats: true,
      status: "active",
      tripInfo: {
        distance: 270,
        duration: 180,
        coordinates: {
          from: { lat: 39.627, lon: 66.975 },
          to: { lat: 39.7756, lon: 64.4226 },
        },
      },
    });
    console.log("Поездка 3 создана, ID:", trip3.id);

    // Поездка 4 - активная
    const trip4 = await Trip.create({
      id: "TRactive2",
      driverId: driver2Id,
      from: { cityKey: "tashkent", address: "Северный вокзал" },
      to: { cityKey: "andijan", address: "Автовокзал Андижан" },
      departureDate: "2024-12-26",
      departureTime: "18:30",
      price: 180000,
      availableSeats: 1,
      description: "Вечерняя поездка, комфортные условия",
      instantBooking: true,
      maxTwoBackSeats: false,
      status: "active",
      tripInfo: {
        distance: 320,
        duration: 300,
        coordinates: {
          from: { lat: 41.2995, lon: 69.2401 },
          to: { lat: 40.7833, lon: 72.3333 },
        },
      },
    });
    console.log("Поездка 4 создана, ID:", trip4.id);

    console.log("4. Создание тестовых бронирований...");

    // Бронь 1 - завершенная
    const booking1 = await Booking.create({
      id: "BKcompleted1",
      passengerId: passenger1Id,
      tripId: trip1.id,
      seats: 2,
      status: "confirmed",
    });
    console.log("Бронь 1 создана, ID:", booking1.id);

    // Бронь 2 - завершенная
    const booking2 = await Booking.create({
      id: "BKcompleted2",
      passengerId: passenger1Id,
      tripId: trip2.id,
      seats: 1,
      status: "confirmed",
    });
    console.log("Бронь 2 создана, ID:", booking2.id);

    // Бронь 3 - активная
    const booking3 = await Booking.create({
      id: "BKactive1",
      passengerId: passenger1Id,
      tripId: trip3.id,
      seats: 1,
      status: "confirmed",
    });
    console.log("Бронь 3 создана, ID:", booking3.id);

    console.log("SEED УСПЕШНО ЗАВЕРШЕН");
    console.log("Пользователей: 3 (2 водителя, 1 пассажир)");
    console.log("Поездок: 4 (2 завершенные, 2 активные)");
    console.log("Броней: 3 (2 завершенные, 1 активная)");
  } catch (error: any) {
    console.log("ОШИБКА В SEED");
    console.error("Сообщение:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full error:", error);
  }
};

// Запускаем seed
seedData();
