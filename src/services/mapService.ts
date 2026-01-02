import {
  cityCoordinates,
  calculateDistance,
  calculateDuration,
  getCoordinates,
} from "./localMapService";

export const getTripInfo = (fromCity: string, toCity: string) => {
  try {
    const fromCoords = getCoordinates(fromCity);
    const toCoords = getCoordinates(toCity);

    if (!fromCoords || !toCoords) {
      throw new Error(
        `Could not find coordinates for cities: ${fromCity} or ${toCity}`
      );
    }

    const distance = calculateDistance(
      fromCoords[0],
      fromCoords[1],
      toCoords[0],
      toCoords[1]
    );
    const duration = calculateDuration(distance);

    return {
      distance, // км
      duration, // минуты
      coordinates: {
        from: { lat: fromCoords[0], lon: fromCoords[1] },
        to: { lat: toCoords[0], lon: toCoords[1] },
      },
    };
  } catch (error) {
    console.error("Error getting trip info:", error);
    return null;
  }
};

// Экспортируем вспомогательные функции если нужно
export {
  cityCoordinates,
  calculateDistance,
  calculateDuration,
  getCoordinates,
};
