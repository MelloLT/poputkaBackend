import axios from "axios";

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface RouteInfo {
  distance: number;
  duration: number;
}

export const getCoordinates = async (
  cityName: string
): Promise<Coordinates | null> => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: cityName,
          format: "json",
          limit: 1,
          countrycodes: "uz",
          addressdetails: 1,
        },
      }
    );

    if (response.data && response.data.length > 0) {
      const result = response.data[0];

      // Дополнительная проверка что найденный город действительно в Узбекистане
      if (result.address && result.address.country_code === "uz") {
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting coordinates:", error);
    return null;
  }
};

export const calculateRoute = async (
  from: Coordinates,
  to: Coordinates
): Promise<RouteInfo | null> => {
  try {
    const response = await axios.get(
      `http://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}`,
      {
        params: {
          overview: "false",
          geometries: "geojson",
        },
      }
    );

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const route = response.data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
      };
    }
    return null;
  } catch (error) {
    console.error("Error calculating route:", error);
    return null;
  }
};

export const getTripInfo = async (fromCity: string, toCity: string) => {
  try {
    const fromCoords = await getCoordinates(fromCity);
    const toCoords = await getCoordinates(toCity);

    if (!fromCoords || !toCoords) {
      throw new Error("Could not find coordinates for cities");
    }

    const routeInfo = await calculateRoute(fromCoords, toCoords);

    if (!routeInfo) {
      throw new Error("Could not calculate route");
    }

    // Возвращаем данные в формате который ожидает модель Trip
    return {
      distance: Math.round(routeInfo.distance / 1000), // км
      duration: Math.round(routeInfo.duration / 60), // минуты
      coordinates: {
        from: fromCoords,
        to: toCoords,
      },
    };
  } catch (error) {
    console.error("Error getting trip info:", error);
    return null;
  }
};
