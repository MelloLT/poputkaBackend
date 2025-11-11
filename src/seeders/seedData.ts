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

    // Водитель 1
    const driver1 = await User.create({
      username: "ali_driver",
      email: "ali@example.com",
      phone: "+998901234567",
      password: hashedPassword,
      role: "driver",
      firstName: "Алишер",
      lastName: "Усманов",
      birthDate: "1995-12-10",
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
      birthDate: "1999-12-10",
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
      birthDate: "2004-12-10",
      gender: "male",
      rating: 4.5,
      isVerified: true,
      notifications: [],
    });
    console.log("Пассажир создан, ID:", passenger1.id);

    console.log("3. Создание поездок...");

    // Поездка 1
    const trip1 = await Trip.create({
      driverId: driver1.id,
      from: { cityKey: "tashkent", address: "Центральный автовокзал" },
      to: { cityKey: "samarkand", address: "Автовокзал Самарканд" },
      departureDate: "2024-12-25",
      departureTime: "08:00",
      price: 150000,
      availableSeats: 3,
      description: "Комфортная поездка, кондиционер",
      instantBooking: false,
      maxTwoBackSeats: true,
      status: "active",
    });
    console.log("Поездка 1 создана, ID:", trip1.id);

    // Поездка 2
    const trip2 = await Trip.create({
      driverId: driver2.id,
      from: { cityKey: "tashkent", address: "Южный вокзал" },
      to: { cityKey: "bukhara", address: "Автовокзал Бухара" },
      departureDate: "2024-12-25",
      departureTime: "10:30",
      price: 200000,
      availableSeats: 2,
      description: "Быстрая поездка по новой дороге",
      instantBooking: true,
      maxTwoBackSeats: false,
      status: "active",
    });
    console.log("Поездка 2 создана, ID:", trip2.id);

    // Поездка 3
    const trip3 = await Trip.create({
      driverId: driver1.id,
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
    });
    console.log("Поездка 3 создана, ID:", trip3.id);

    // Поездка 4
    const trip4 = await Trip.create({
      driverId: driver2.id,
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
    });
    console.log("Поездка 4 создана, ID:", trip4.id);

    console.log("4. Создание тестовых бронирований...");

    // Бронь 1
    const booking1 = await Booking.create({
      passengerId: passenger1.id,
      tripId: trip1.id,
      seats: 2,
      status: "pending",
    });
    console.log("Бронь 1 создана, ID:", booking1.id);

    // Бронь 2
    const booking2 = await Booking.create({
      passengerId: passenger1.id,
      tripId: trip2.id,
      seats: 1,
      status: "confirmed",
    });
    console.log("Бронь 2 создана, ID:", booking2.id);

    console.log("SEED УСПЕШНО ЗАВЕРШЕН");
    console.log("Пользователей: 3 (2 водителя, 1 пассажир)");
    console.log("Поездок: 4");
    console.log("Броней: 2");
  } catch (error: any) {
    console.log("ОШИБКА В SEED");
    console.error("Сообщение:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full error:", error);
  }
};

// Запускаем seed
seedData();
