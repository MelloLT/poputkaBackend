// src/seeders/seedData.ts
import sequelize from "../config/database";
import User from "../models/User";
import Trip from "../models/Trip";
import bcrypt from "bcryptjs";
import Booking from "../models/Booking";

export const seedData = async () => {
  console.log("НАЧАЛО SEED ДАННЫХ");

  try {
    console.log("1. Синхронизация базы данных...");
    await sequelize.sync({ force: true });
    console.log("База данных синхронизирована");

    console.log("\n2. Создание пользователей...");
    const hashedPassword = await bcrypt.hash("Password123", 12);

    // Водитель 1 - проверенный
    const driver1 = await User.create({
      username: "ali_driver",
      email: "ali@example.com",
      phone: "+998901234567",
      password: hashedPassword,
      role: "driver",
      firstName: "Алишер",
      lastName: "Усманов",
      birthDate: "1990-05-15",
      telegram: "@alisher_driver",
      about: "Опытный водитель с 5-летним стажем",
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
      tripHistory: [],
      reviews: [],
      reports: [],
    });
    console.log(`Водитель 1 создан: ${driver1.firstName} ${driver1.lastName}`);

    // Водитель 2 - не проверенный
    const driver2 = await User.create({
      username: "dilbar_driver",
      email: "dilbar@example.com",
      phone: "+998907654321",
      password: hashedPassword,
      role: "driver",
      firstName: "Дилбар",
      lastName: "Ахмедова",
      birthDate: "1985-08-22",
      telegram: "@dilbar_driver",
      about: "Безопасные поездки для всех пассажиров",
      tripsCount: 32,
      gender: "female",
      avatar: "/uploads/avatars/default-female.jpg",
      rating: 4.9,
      isVerified: false,
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
      tripHistory: [],
      reviews: [],
      reports: [],
    });
    console.log(`Водитель 2 создан: ${driver2.firstName} ${driver2.lastName}`);

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
      telegram: "@sarvar_traveler",
      about: "Часто путешествую между городами",
      tripsCount: 15,
      gender: "male",
      avatar: "/uploads/avatars/default-male.jpg",
      rating: 4.5,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      notifications: [],
      tripHistory: [],
      reviews: [],
      reports: [],
    });
    console.log(
      `Пассажир создан: ${passenger1.firstName} ${passenger1.lastName}`,
    );

    // Администратор
    const admin = await User.create({
      username: "admin",
      email: "admin@poputka.uz",
      phone: "+998903333333",
      password: hashedPassword,
      role: "admin",
      firstName: "Администратор",
      lastName: "Системы",
      birthDate: "1980-01-01",
      telegram: "@poputka_admin",
      about: "Системный администратор Poputka",
      tripsCount: 0,
      gender: "male",
      avatar: "/uploads/avatars/default-male.jpg",
      rating: 5,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      notifications: [],
      tripHistory: [],
      reviews: [],
      reports: [],
    });
    console.log(`Администратор создан: admin@poputka.uz`);

    console.log("\n3. Создание поездок...");

    // Поездка 1 - от проверенного водителя, обычное бронирование
    const trip1 = await Trip.create({
      driverId: driver1.id,
      from: { cityKey: "toshkent", address: "Центральный автовокзал" },
      to: { cityKey: "samarqand", address: "Автовокзал Самарканд" },
      departureAt: new Date("2026-01-15T08:00:00+05:00"),
      price: 150000,
      availableSeats: 3,
      description: "Комфортная поездка, кондиционер",
      instantBooking: false,
      maxTwoBackSeats: true,
      status: "active",
      tripInfo: {
        distance: 300,
        duration: 240,
        coordinates: {
          from: { lat: 41.2995, lon: 69.2401 },
          to: { lat: 39.627, lon: 66.975 },
        },
      },
    });
    console.log(`Поездка 1: Ташкент → Самарканд, 15.01.2026 08:00`);

    // Поездка 2 - от проверенного водителя, мгновенное бронирование
    const trip2 = await Trip.create({
      driverId: driver1.id,
      from: { cityKey: "toshkent", address: "Аэропорт" },
      to: { cityKey: "buxoro", address: "Автовокзал Бухара" },
      departureAt: new Date("2026-01-16T10:30:00+05:00"),
      price: 200000,
      availableSeats: 2,
      description: "Быстрая поездка по новой дороге",
      instantBooking: true,
      maxTwoBackSeats: false,
      status: "active",
      tripInfo: {
        distance: 550,
        duration: 360,
        coordinates: {
          from: { lat: 41.2995, lon: 69.2401 },
          to: { lat: 39.7756, lon: 64.4226 },
        },
      },
    });
    console.log(
      `Поездка 2: Ташкент → Бухара, 16.01.2026 10:30 (мгновенное бронирование)`,
    );

    // Поездка 3 - от непроверенного водителя, обычное бронирование
    const trip3 = await Trip.create({
      driverId: driver2.id,
      from: { cityKey: "toshkent", address: "Южный вокзал" },
      to: { cityKey: "fargona", address: "Автовокзал Фергана" },
      departureAt: new Date("2026-01-17T07:00:00+05:00"),
      price: 180000,
      availableSeats: 4,
      description: "Утренняя поездка",
      instantBooking: false,
      maxTwoBackSeats: true,
      status: "active",
      tripInfo: {
        distance: 320,
        duration: 250,
        coordinates: {
          from: { lat: 41.2995, lon: 69.2401 },
          to: { lat: 40.3864, lon: 71.7864 },
        },
      },
    });
    console.log(
      `Поездка 3: Ташкент → Фергана, 17.01.2026 07:00 (непроверенный водитель)`,
    );

    // Поездка 4 - дешевая, от проверенного водителя
    const trip4 = await Trip.create({
      driverId: driver1.id,
      from: { cityKey: "toshkent", address: "Чиланзар" },
      to: { cityKey: "andijon", address: "Центр" },
      departureAt: new Date("2026-01-18T15:30:00+05:00"),
      price: 120000,
      availableSeats: 3,
      description: "Эконом вариант",
      instantBooking: true,
      maxTwoBackSeats: false,
      status: "active",
      tripInfo: {
        distance: 350,
        duration: 280,
        coordinates: {
          from: { lat: 41.2995, lon: 69.2401 },
          to: { lat: 40.7665, lon: 72.3522 },
        },
      },
    });
    console.log(
      `Поездка 4: Ташкент → Андижан, 18.01.2026 15:30 (самая дешевая)`,
    );

    console.log("\n4. Создание бронирований...");

    const booking1 = await Booking.create({
      passengerId: passenger1.id,
      tripId: trip1.id,
      seats: 2,
      status: "pending",
    });
    console.log(`Бронь 1: пассажир → Ташкент-Самарканд (ожидает)`);

    const booking2 = await Booking.create({
      passengerId: passenger1.id,
      tripId: trip2.id,
      seats: 1,
      status: "confirmed",
    });
  } catch (error: any) {
    console.log("\nОШИБКА");
    console.error("Сообщение:", error.message);
    console.error("Stack:", error.stack);
  }
};

seedData()
  .then(() => {
    console.log("\nSeed завершен!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nОшибка", error);
    process.exit(1);
  });
