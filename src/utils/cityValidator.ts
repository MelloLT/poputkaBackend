import { cities } from "../data/cities";

export const isValidCityKey = (cityKey: string): boolean => {
  return (
    cities.en.hasOwnProperty(cityKey) ||
    cities.ru.hasOwnProperty(cityKey) ||
    cities.uz.hasOwnProperty(cityKey)
  );
};

export const getCityNames = (
  cityKey: string
): { en: string; ru: string; uz: string } | null => {
  if (!isValidCityKey(cityKey)) return null;

  return {
    en: cities.en[cityKey as keyof typeof cities.en] || cityKey,
    ru: cities.ru[cityKey as keyof typeof cities.ru] || cityKey,
    uz: cities.uz[cityKey as keyof typeof cities.uz] || cityKey,
  };
};

export const getAllCityKeys = (): string[] => {
  return Object.keys(cities.en);
};

export const getAllCitiesFormatted = () => {
  return getAllCityKeys().map((key) => ({
    key,
    en: cities.en[key as keyof typeof cities.en],
    ru: cities.ru[key as keyof typeof cities.ru],
    uz: cities.uz[key as keyof typeof cities.uz],
  }));
};

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
