import { cities } from "../data/cities";

export const getAvailableCityKeys = (): string[] => {
  return Object.keys(cities.en);
};

// Проверяем, что переданный ключ города существует
export const isValidCityKey = (cityKey: string): boolean => {
  if (!cityKey || typeof cityKey !== "string") return false;

  const availableKeys = getAvailableCityKeys();
  return availableKeys.includes(cityKey.trim());
};

// Получаем названия города по ключу на всех языках
export const getCityNamesByKey = (
  cityKey: string
): {
  key: string;
  en: string;
  ru: string;
  uz: string;
} | null => {
  if (!isValidCityKey(cityKey)) return null;

  const key = cityKey.trim();
  return {
    key,
    en: cities.en[key as keyof typeof cities.en] || key,
    ru: cities.ru[key as keyof typeof cities.ru] || key,
    uz: cities.uz[key as keyof typeof cities.uz] || key,
  };
};

// Валидируем объект location (from/to)
export const validateLocation = (location: {
  cityKey: string;
  address?: string;
}) => {
  if (!location || !location.cityKey) {
    return { isValid: false, error: "cityKey обязателен" };
  }

  if (!isValidCityKey(location.cityKey)) {
    return {
      isValid: false,
      error: `Неверный ключ города: "${location.cityKey}". Используйте допустимые ключи из /cities/keys`,
    };
  }

  return { isValid: true };
};

// Получаем список всех городов в удобном формате для фронтенда
export const getAllCitiesFormatted = () => {
  return getAvailableCityKeys().map((key) => ({
    key,
    en: cities.en[key as keyof typeof cities.en],
    ru: cities.ru[key as keyof typeof cities.ru],
    uz: cities.uz[key as keyof typeof cities.uz],
  }));
};
