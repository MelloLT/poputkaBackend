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
    const hashedPassword = await bcrypt.hash("Password123", 12);

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
      telegram: "@alisher_driver",
      about: "Опытный водитель с 5-летним стажем.",
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
      telegram: "@dilbar_driver",
      about: "Безопасные поездки для всех пассажиров.",
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
      tripHistory: [],
      reviews: [],
      reports: [],
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
      telegram: "@sarvar_traveler",
      about: "Часто путешествую между городами.",
      tripsCount: 15,
      gender: "male",
      rating: 4.5,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      notifications: [],
      tripHistory: [],
      reviews: [],
      reports: [],
    });
    console.log("Пассажир создан, ID:", passenger1.id);

    // Администратор
    const adminPassword = "Password123";
    const adminHashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await User.create({
      username: "admin",
      email: "admin@poputka.uz",
      phone: "+998903333333",
      password: adminHashedPassword,
      role: "admin",
      firstName: "Администратор",
      lastName: "Системы",
      birthDate: "1980-01-01",
      telegram: "@poputka_admin",
      about: "Системный администратор Poputka",
      tripsCount: 0,
      gender: "male",
      rating: 5,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      notifications: [],
      // Для админа car не нужен, оставляем undefined
      tripHistory: [],
      reviews: [],
      reports: [],
    });
    console.log("Администратор создан, ID:", admin.id);
    console.log("Данные администратора:");
    console.log("- Email: admin@poputka.uz");
    console.log("- Пароль: Password123");

    console.log("3. Создание поездок...");

    // Поездка 1 - завершенная
    const trip1 = await Trip.create({
      driverId: driver1.id,
      from: { cityKey: "toshkent", address: "Центральный автовокзал" },
      to: { cityKey: "samarqand", address: "Автовокзал Самарканд" },
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
      driverId: driver2.id,
      from: { cityKey: "toshkent", address: "Южный вокзал" },
      to: { cityKey: "buxoro", address: "Автовокзал Бухара" },
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
      driverId: driver1.id,
      from: { cityKey: "toshkent", address: "Аэропорт" },
      to: { cityKey: "fargona", address: "Автовокзал Фергана" },
      departureDate: "2024-12-30",
      departureTime: "07:00",
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
    console.log("Поездка 3 создана (активная), ID:", trip3.id);

    console.log("4. Создание тестовых бронирований...");

    // Бронь 1 - завершенная
    const booking1 = await Booking.create({
      passengerId: passenger1.id,
      tripId: trip1.id,
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

    console.log("5. Добавляем историю поездок и отзывы...");

    // Получаем аватары как строки (без null)
    const driver1Avatar = driver1.avatar || undefined;
    const driver2Avatar = driver2.avatar || undefined;
    const passenger1Avatar = passenger1.avatar || undefined;

    // Добавляем историю поездок и отзывы для driver1
    await driver1.update({
      tripHistory: [
        {
          tripId: trip1.id,
          role: "driver",
          from: trip1.from,
          to: trip1.to,
          departureDate: trip1.departureDate,
          departureTime: trip1.departureTime,
          price: trip1.price,
          status: "completed",
          completedAt: new Date("2024-11-01T12:00:00.000Z"),
          passengers: [
            {
              id: passenger1.id,
              firstName: passenger1.firstName,
              lastName: passenger1.lastName,
              avatar: passenger1Avatar,
              seats: 2,
            },
          ],
        },
      ],
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

    // Добавляем историю поездок и отзывы для driver2
    await driver2.update({
      tripHistory: [
        {
          tripId: trip2.id,
          role: "driver",
          from: trip2.from,
          to: trip2.to,
          departureDate: trip2.departureDate,
          departureTime: trip2.departureTime,
          price: trip2.price,
          status: "completed",
          completedAt: new Date("2024-11-02T16:00:00.000Z"),
          passengers: [
            {
              id: passenger1.id,
              firstName: passenger1.firstName,
              lastName: passenger1.lastName,
              avatar: passenger1Avatar,
              seats: 1,
            },
          ],
        },
      ],
      reviews: [
        {
          author: "Сарвар Каримов",
          authorId: passenger1.id,
          text: "Очень комфортная поездка, рекомендую",
          rating: 5,
          createdAt: new Date("2024-11-05"),
          tripId: trip2.id,
        },
      ],
    });

    // Добавляем историю поездок для passenger1
    await passenger1.update({
      tripHistory: [
        {
          tripId: trip1.id,
          role: "passenger",
          from: trip1.from,
          to: trip1.to,
          departureDate: trip1.departureDate,
          departureTime: trip1.departureTime,
          price: trip1.price,
          status: "completed",
          completedAt: new Date("2024-11-01T12:00:00.000Z"),
          withUser: {
            id: driver1.id,
            firstName: driver1.firstName,
            lastName: driver1.lastName,
            avatar: driver1Avatar,
          },
        },
        {
          tripId: trip2.id,
          role: "passenger",
          from: trip2.from,
          to: trip2.to,
          departureDate: trip2.departureDate,
          departureTime: trip2.departureTime,
          price: trip2.price,
          status: "completed",
          completedAt: new Date("2024-11-02T16:00:00.000Z"),
          withUser: {
            id: driver2.id,
            firstName: driver2.firstName,
            lastName: driver2.lastName,
            avatar: driver2Avatar,
          },
        },
      ],
    });

    console.log("\nSEED УСПЕШНО ЗАВЕРШЕН");
    console.log("=========================");
    console.log("Пользователей: 4 (2 водителя, 1 пассажир, 1 админ)");
    console.log("Поездок: 3 (2 завершенные, 1 активная)");
    console.log("Броней: 2 завершенные");
    console.log("Отзывов: 2");
    console.log("\nТестовые данные для входа:");
    console.log("----------------------------");
    console.log("Администратор:");
    console.log("- Email: admin@poputka.uz");
    console.log("- Пароль: Password123");
    console.log("- Роль: admin");
    console.log("\nВодитель 1:");
    console.log("- Email: ali@example.com");
    console.log("- Пароль: Password123");
    console.log("\nВодитель 2:");
    console.log("- Email: dilbar@example.com");
    console.log("- Пароль: Password123");
    console.log("\nПассажир:");
    console.log("- Email: sarvar@example.com");
    console.log("- Пароль: Password123");
    console.log("\n🚗 Активная поездка для тестирования:");
    console.log("- ID: " + trip3.id);
    console.log("- Маршрут: Ташкент → Фергана");
    console.log("- Цена: 180,000 UZS");
    console.log("- Свободных мест: 4");
  } catch (error: any) {
    console.log("\nОШИБКА В SEED");
    console.error("Сообщение:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full error:", error);
  }
};

// Запускаем seed только если файл выполняется напрямую
if (require.main === module) {
  seedData();
}
