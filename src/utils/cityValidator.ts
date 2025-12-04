import { cities } from "../data/cities";

export const isValidCityKey = (cityKey: string): boolean => {
  // Приводим к нижнему регистру для поиска
  const normalizedKey = cityKey.toLowerCase().trim();

  // Проверяем все три языка
  return (
    cities.en.hasOwnProperty(normalizedKey) ||
    cities.ru.hasOwnProperty(normalizedKey) ||
    cities.uz.hasOwnProperty(normalizedKey)
  );
};

export const getCityNames = (
  cityKey: string
): { en: string; ru: string; uz: string } | null => {
  const normalizedKey = cityKey.toLowerCase().trim();

  if (!isValidCityKey(normalizedKey)) return null;

  return {
    en: cities.en[normalizedKey as keyof typeof cities.en] || cityKey,
    ru: cities.ru[normalizedKey as keyof typeof cities.ru] || cityKey,
    uz: cities.uz[normalizedKey as keyof typeof cities.uz] || cityKey,
  };
};

// Функция для получения ключа по имени города (для обратного поиска)
export const findCityKeyByName = (cityName: string): string | null => {
  const normalizedName = cityName.toLowerCase().trim();

  // Ищем в английских названиях
  for (const [key, name] of Object.entries(cities.en)) {
    if (name.toLowerCase() === normalizedName) return key;
  }

  // Ищем в русских названиях
  for (const [key, name] of Object.entries(cities.ru)) {
    if (name.toLowerCase() === normalizedName) return key;
  }

  // Ищем в узбекских названиях
  for (const [key, name] of Object.entries(cities.uz)) {
    if (name.toLowerCase() === normalizedName) return key;
  }

  return null;
};

export const getAllCityKeys = (): string[] => {
  return Object.keys(cities.en);
};

// Функция для получения всех городов в удобном формате
export const getAllCities = () => {
  return Object.entries(cities.en).map(([key, enName]) => ({
    key,
    en: enName,
    ru: cities.ru[key as keyof typeof cities.ru],
    uz: cities.uz[key as keyof typeof cities.uz],
  }));
};
