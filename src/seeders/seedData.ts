import sequelize from "../config/database";
import User from "../models/User";
import Trip from "../models/Trip";
import Booking from "../models/Booking";
import bcrypt from "bcryptjs";

export const seedData = async () => {
  console.log("НАЧАЛО SEED - ОБНОВЛЕНИЕ СТРУКТУРЫ БАЗЫ");

  try {
    console.log("1. ПЕРЕСОЗДАНИЕ базы данных...");
    await sequelize.sync({ force: true }); // force: true пересоздает таблицы
    console.log("База данных пересоздана с новой структурой");

    console.log("2. Создание пользователей с birthDate...");
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
      //birthDate: "1990-05-15", // ✅ ДОБАВЛЕНО
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

    // Водитель 2
    const driver2 = await User.create({
      username: "dilbar_driver",
      email: "dilbar@example.com",
      phone: "+998907654321",
      password: hashedPassword,
      role: "driver",
      firstName: "Дилбар",
      lastName: "Ахмедова",
      //birthDate: "1985-08-22",
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

    // Пассажир
    const passenger1 = await User.create({
      username: "sarvar_passenger",
      email: "sarvar@example.com",
      phone: "+998901112233",
      password: hashedPassword,
      role: "passenger",
      firstName: "Сарвар",
      lastName: "Каримов",
      //birthDate: "1995-12-10",
      gender: "male",
      rating: 4.5,
      isVerified: true,
      notifications: [],
    });

    // ... остальной код создания поездок и бронирований

    console.log("SEED УСПЕШНО ЗАВЕРШЕН - структура базы обновлена");
  } catch (error: any) {
    console.log("ОШИБКА В SEED:", error.message);
  }
};

seedData();
