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

    // Хэшируем пароль правильно
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("password123", saltRounds);

    // Водитель 1 - мужчина
    const driver1 = await User.create({
      username: "ali_driver",
      email: "ali@example.com",
      phone: "+998901234567",
      password: hashedPassword,
      role: "driver",
      firstName: "Алишер",
      lastName: "Усманов",
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

    // Водитель 2 - женщина
    const driver2 = await User.create({
      username: "dilbar_driver",
      email: "dilbar@example.com",
      phone: "+998907654321",
      password: hashedPassword, // ХЭШИРОВАННЫЙ ПАРОЛЬ
      role: "driver",
      firstName: "Дилбар",
      lastName: "Ахмедова",
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
      password: hashedPassword, // ХЭШИРОВАННЫЙ ПАРОЛЬ
      role: "passenger",
      firstName: "Сарвар",
      lastName: "Каримов",
      gender: "male",
      rating: 4.5,
      isVerified: true,
      notifications: [],
    });
    console.log("Пассажир создан, ID:", passenger1.id);

    // Остальной код сидера без изменений...
  } catch (error: any) {
    console.log("ОШИБКА В SEED");
    console.error("Сообщение:", error.message);
    console.error("Stack:", error.stack);
  }
};

seedData();
