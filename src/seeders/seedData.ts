import sequelize from "../config/database";
import User from "../models/User";
import Trip from "../models/Trip";
import bcrypt from "bcryptjs";

export const seedData = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("База данных готова");

    const hashedPassword = await bcrypt.hash("password123", 12);

    // Создаем водителей с новыми полями
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

    // Создаем пассажиров
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

    // Создаем поездки с новыми полями
    await Trip.create({
      driverId: driver1.id,
      from: { city: "Ташкент", address: "Центральный автовокзал" },
      to: { city: "Самарканд", address: "Автовокзал Самарканд" },
      departureTime: new Date("2024-12-20T08:00:00"),
      price: 150000,
      availableSeats: 3,
      description: "Комфортная поездка, кондиционер",
      instantBooking: true,
      maxTwoBackSeats: true,
      status: "active",
    });

    await Trip.create({
      driverId: driver2.id,
      from: { city: "Ташкент", address: "Южный вокзал" },
      to: { city: "Бухара", address: "Автовокзал Бухара" },
      departureTime: new Date("2024-12-21T10:30:00"),
      price: 200000,
      availableSeats: 2,
      description: "Быстрая поездка по новой дороге",
      instantBooking: false,
      maxTwoBackSeats: false,
      status: "active",
    });

    await Trip.create({
      driverId: driver1.id,
      from: { city: "Самарканд", address: "Автовокзал Самарканд" },
      to: { city: "Бухара", address: "Центральный автовокзал" },
      departureTime: new Date("2024-12-22T14:00:00"),
      price: 120000,
      availableSeats: 4,
      description: "Едем через живописные места",
      instantBooking: true,
      maxTwoBackSeats: true,
      status: "active",
    });

    console.log("Тестовые данные созданы с новыми полями!");
    console.log("Пользователей: 3 (2 водителя, 1 пассажир)");
    console.log("Поездок: 3");
  } catch (error) {
    console.error("Ошибка:", error);
  }
};
