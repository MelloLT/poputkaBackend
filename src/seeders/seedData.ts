import sequelize from "../config/database";
import User from "../models/User";
import Trip from "../models/Trip";
import bcrypt from "bcryptjs";
import Booking from "../models/Booking";

export const seedData = async () => {
  console.log("НАЧАЛО SEED");

  try {
    console.log("1. Синхронизация базы данных...");
    await sequelize.sync({ force: true });
    console.log("База данных синхронизирована");

    console.log("2. Создание пользователей...");
    const hashedPassword = await bcrypt.hash("password123", 12);

    const driver1 = await User.create({
      username: "ali_driver",
      email: "ali@example.com",
      phone: "+998901234567",
      password: hashedPassword,
      role: "driver",
      firstName: "Алишер",
      lastName: "Усманов",
      gender: "male",
      avatar: "https://example.com/ali.jpg",
      rating: 4.8,
      isVerified: true,
      car: {
        model: "Chevrolet Cobalt",
        color: "Белый",
        year: 2022,
        licensePlate: "01 A 123 AB",
        photos: ["https://example.com/car1.jpg"],
      },
    });
    console.log("Водитель 1 создан");

    const driver2 = await User.create({
      username: "dilbar_driver",
      email: "dilbar@example.com",
      phone: "+998907654321",
      password: hashedPassword,
      role: "driver",
      firstName: "Дилбар",
      lastName: "Ахмедова",
      gender: "female",
      avatar: "https://example.com/dilbar.jpg",
      rating: 4.9,
      isVerified: true,
      car: {
        model: "Nexia 3",
        color: "Серебристый",
        year: 2020,
        licensePlate: "01 B 456 CD",
        photos: ["https://example.com/car2.jpg"],
      },
    });
    console.log("Водитель 2 создан");

    const passenger1 = await User.create({
      username: "sarvar_passenger",
      email: "sarvar@example.com",
      phone: "+998901112233",
      password: hashedPassword,
      role: "passenger",
      firstName: "Сарвар",
      lastName: "Каримов",
      gender: "male",
      rating: 4.5,
      isVerified: true,
    });
    console.log("Пассажир создан");

    console.log("3. Создание поездок...");
    await Trip.create({
      driverId: driver1.id,
      from: { cityKey: "Ташкент", address: "Центральный автовокзал" },
      to: { cityKey: "Самарканд", address: "Автовокзал Самарканд" },
      departureTime: new Date("2024-12-20T08:00:00"),
      price: 150000,
      availableSeats: 3,
      description: "Комфортная поездка, кондиционер",
      instantBooking: true,
      maxTwoBackSeats: true,
      status: "active",
    });
    console.log("Поездка 1 создана");

    await Trip.create({
      driverId: driver2.id,
      from: { cityKey: "Ташкент", address: "Южный вокзал" },
      to: { cityKey: "Бухара", address: "Автовокзал Бухара" },
      departureTime: new Date("2024-12-21T10:30:00"),
      price: 200000,
      availableSeats: 2,
      description: "Быстрая поездка по новой дороге",
      instantBooking: false,
      maxTwoBackSeats: false,
      status: "active",
    });
    console.log("Поездка 2 создана");

    await Trip.create({
      driverId: driver1.id,
      from: { cityKey: "Самарканд", address: "Автовокзал Самарканд" },
      to: { cityKey: "Бухара", address: "Центральный автовокзал" },
      departureTime: new Date("2024-12-22T14:00:00"),
      price: 120000,
      availableSeats: 4,
      description: "Едем через живописные места",
      instantBooking: true,
      maxTwoBackSeats: true,
      status: "active",
    });
    console.log("Поездка 3 создана");

    console.log("4. Создание тестовых бронирований...");
    await Booking.create({
      passengerId: passenger1.id,
      tripId: 1,
      seats: 2,
      status: "confirmed",
    });
    console.log("Бронь 1 создана");

    await Booking.create({
      passengerId: passenger1.id,
      tripId: 2,
      seats: 1,
      status: "pending",
    });
    console.log("Бронь 2 создана");

    console.log("SEED УСПЕШНО ЗАВЕРШЕН");
    console.log("Пользователей: 3 (2 водителя, 1 пассажир)");
    console.log("Поездок: 3");
    console.log("Броней: 2");
  } catch (error: any) {
    console.log("ОШИБКА В SEED");
    console.error("Сообщение:", error.message);
    console.error("Stack:", error.stack);
  }
};

// Запускаем seed
seedData();
