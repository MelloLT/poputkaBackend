import sequelize from "../config/database";
import User from "../models/User";
import Trip from "../models/Trip";
import bcrypt from "bcryptjs";

export const seedData = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("✅ База данных готова");

    const hashedPassword = await bcrypt.hash("password123", 12);

    // Создаем водителей
    const driver1 = await User.create({
      username: "ali_driver",
      email: "ali@example.com",
      phone: "+998901234567",
      password: hashedPassword,
      role: "driver",
      firstName: "Алишер",
      lastName: "Усманов",
      avatar: "https://example.com/ali.jpg",
      rating: 4.8,
      isVerified: true,
      car: {
        model: "Chevrolet Cobalt",
        color: "Белый",
        licensePlate: "01 A 123 AB",
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
      avatar: "https://example.com/dilbar.jpg",
      rating: 4.9,
      isVerified: true,
      car: {
        model: "Nexia 3",
        color: "Серебристый",
        licensePlate: "01 B 456 CD",
      },
    });

    // Создаем поездки между узбекскими городами
    await Trip.create({
      driverId: driver1.id,
      from: { city: "Ташкент", address: "Центральный автовокзал" },
      to: { city: "Самарканд", address: "Автовокзал Самарканд" },
      departureTime: new Date("2024-12-20T08:00:00"),
      price: 150000,
      availableSeats: 3,
      description: "Комфортная поездка, кондиционер, багажник просторный",
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
      status: "active",
    });

    await Trip.create({
      driverId: driver2.id,
      from: { city: "Андижан", address: "Автовокзал Андижан" },
      to: { city: "Фергана", address: "Автовокзал Фергана" },
      departureTime: new Date("2024-12-23T09:15:00"),
      price: 80000,
      availableSeats: 1,
      description: "Утренняя поездка, свежий воздух",
      status: "active",
    });

    await Trip.create({
      driverId: driver1.id,
      from: { city: "Наманган", address: "Автовокзал Наманган" },
      to: { city: "Андижан", address: "Автовокзал Андижан" },
      departureTime: new Date("2024-12-24T16:45:00"),
      price: 70000,
      availableSeats: 2,
      description: "Вечерняя поездка после работы",
      status: "active",
    });

    console.log("✅ Узбекские поездки созданы!");
    console.log(
      "🗺️  Маршруты: Ташкент→Самарканд, Ташкент→Бухара, Самарканд→Бухара, Андижан→Фергана, Наманган→Андижан"
    );
  } catch (error) {
    console.error("❌ Ошибка:", error);
  }
};

// Добавь эти строки в самый конец файла:
console.log("📢 Функция seedData определена, запускаем...");

seedData()
  .then(() => {
    console.log("✅ Seed завершен успешно!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Ошибка при выполнении seed:", error);
    process.exit(1);
  });
