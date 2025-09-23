import { Request, Response } from "express";

// ПРОСТАЯ ФУНКЦИЯ ДЛЯ ТЕСТА - ВОЗВРАЩАЕМ ТЕСТОВЫЕ ДАННЫЕ
export const getTrips = async (req: Request, res: Response) => {
  console.log("✅ Кто-то запросил поездки!");

  // Просто возвращаем данные в формате который ждет фронтенд
  const mockTrips = [
    {
      departure: "Москва",
      arrival: "Киев",
      price: 19000,
      duration: "8 часов",
      departureTime: "19:30",
      arrivalTime: "25:30",
      seatsAvailable: 9,
      driver: {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwjvv_gWyyWWlFgnGJ1L8hfSpnYAaWmWiqAg&s",
        name: "Futa DOM",
        rating: 5,
        varified: true,
      },
      instantBooking: true,
      maxTwoBackSeats: true,
    },
    {
      departure: "Ташкент",
      arrival: "Самарканд",
      price: 150000,
      duration: "4 часа",
      departureTime: "08:00",
      arrivalTime: "12:00",
      seatsAvailable: 3,
      driver: {
        avatar: "https://example.com/avatar2.jpg",
        name: "Азиз",
        rating: 4,
        varified: true,
      },
      instantBooking: true,
      maxTwoBackSeats: false,
    },
  ];

  res.json(mockTrips);
};

// Остальные функции пока просто возвращают заглушки
export const createTrip = async (req: Request, res: Response) => {
  res.json({ message: "Создание поездки пока не работает" });
};

export const updateTrip = async (req: Request, res: Response) => {
  res.json({ message: "Обновление поездки пока не работает" });
};

export const deleteTrip = async (req: Request, res: Response) => {
  res.json({ message: "Удаление поездки пока не работает" });
};
