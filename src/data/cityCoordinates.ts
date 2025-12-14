export interface CityCoordinates {
  lat: number;
  lon: number;
}

export const cityCoordinates: Record<string, CityCoordinates> = {
  toshkent: { lat: 41.26, lon: 69.22 },
  olmaliq: { lat: 40.84, lon: 69.6 },
  angren: { lat: 41.02, lon: 70.14 },
  andijon: { lat: 40.78, lon: 72.34 },
  asaka: { lat: 40.64, lon: 72.24 },
  bekobod: { lat: 40.22, lon: 69.27 },
  beruni: { lat: 41.69, lon: 60.75 },
  buxoro: { lat: 39.77, lon: 64.43 },
  guliston: { lat: 40.49, lon: 68.78 },
  denov: { lat: 38.27, lon: 67.9 },
  jizzax: { lat: 40.12, lon: 67.84 },
  kogon: { lat: 39.72, lon: 64.55 },
  qarshi: { lat: 38.86, lon: 65.79 },
  "kattaqo'rg'on": { lat: 39.9, lon: 66.26 },
  "qo'qon": { lat: 40.53, lon: 70.94 },
  koson: { lat: 39.04, lon: 65.59 },
  "marg'ilon": { lat: 40.47, lon: 71.72 },
  navoiy: { lat: 40.08, lon: 65.38 },
  namangan: { lat: 41.0, lon: 71.67 },
  nukus: { lat: 42.45, lon: 59.61 },
  samarqand: { lat: 39.65, lon: 66.96 },
  termiz: { lat: 37.22, lon: 67.28 },
  urganch: { lat: 41.55, lon: 60.63 },
  "farg'ona": { lat: 40.38, lon: 71.78 },
  xiva: { lat: 41.38, lon: 60.36 },
  "xo'jayli": { lat: 42.4, lon: 59.46 },
  chirchiq: { lat: 41.47, lon: 69.58 },
  chust: { lat: 41.0, lon: 71.24 },
  shahrisabz: { lat: 39.06, lon: 66.83 },
  "yangiyo'l": { lat: 41.11, lon: 69.05 },

  akkurgan: { lat: 41.35, lon: 69.3 },
  alat: { lat: 39.62, lon: 63.8 },
  ahangaran: { lat: 40.9, lon: 69.35 },
  baysun: { lat: 38.22, lon: 67.2 },
  baht: { lat: 40.93, lon: 72.98 },
  beshariq: { lat: 40.43, lon: 70.61 },
  beshkent: { lat: 40.02, lon: 70.77 },
  buka: { lat: 40.81, lon: 72.0 },
  bulungur: { lat: 39.77, lon: 67.27 },
  bustan: { lat: 40.85, lon: 68.0 },
  vobkent: { lat: 39.62, lon: 64.52 },
  gagarin: { lat: 40.66, lon: 68.17 },
  gazalkent: { lat: 41.56, lon: 69.77 },
  gazli: { lat: 40.13, lon: 63.45 },
  galaasiya: { lat: 40.55, lon: 71.78 },
  gallaorol: { lat: 40.84, lon: 68.45 },
  gijduvon: { lat: 40.1, lon: 64.68 },
  guzar: { lat: 38.62, lon: 66.25 },
  dashtobod: { lat: 40.13, lon: 68.49 },
  jalakuduk: { lat: 40.86, lon: 69.7 },
  jomboy: { lat: 39.7, lon: 67.09 },
  jarkurgan: { lat: 37.49, lon: 67.41 },
  juma: { lat: 39.72, lon: 66.66 },
  dustobod: { lat: 40.52, lon: 68.04 },
  dustlik: { lat: 40.52, lon: 68.04 },
  zarafshon: { lat: 41.58, lon: 64.2 },
  ishtixon: { lat: 39.97, lon: 66.51 },
  qamashi: { lat: 38.82, lon: 66.45 },
  "qorako'l": { lat: 39.5, lon: 63.85 },
  qorasuv: { lat: 40.73, lon: 72.87 },
  qoroulbozor: { lat: 39.5, lon: 64.8 },
  kosonsoy: { lat: 41.25, lon: 71.55 },
  keles: { lat: 41.36, lon: 69.23 },
  kitob: { lat: 39.12, lon: 66.88 },
  quva: { lat: 40.52, lon: 72.07 },
  quvasoy: { lat: 40.3, lon: 71.98 },
  "qumqo'rg'on": { lat: 37.83, lon: 67.58 },
  "qo'ng'irot": { lat: 43.07, lon: 58.9 },
  "qo'rg'ontepa": { lat: 40.73, lon: 72.76 },
  qiziltepa: { lat: 40.03, lon: 64.85 },
  "mang'it": { lat: 42.12, lon: 60.07 },
  marhamat: { lat: 40.5, lon: 72.32 },
  muborak: { lat: 39.27, lon: 65.15 },
  moynoq: { lat: 43.77, lon: 59.02 },
  nurobod: { lat: 39.39, lon: 66.28 },
  nurota: { lat: 40.56, lon: 65.69 },
  nurafshon: { lat: 40.93, lon: 69.37 },
  payoriq: { lat: 40.03, lon: 66.25 },
  paytug: { lat: 40.9, lon: 72.24 },
  pop: { lat: 40.87, lon: 71.11 },
  parkent: { lat: 41.29, lon: 69.68 },
  paxtaobod: { lat: 40.93, lon: 72.5 },
  paxtakor: { lat: 40.32, lon: 67.95 },
  pitnak: { lat: 40.44, lon: 65.97 },
  peshkent: { lat: 40.9, lon: 69.35 },
  rishton: { lat: 40.36, lon: 71.28 },
  romitan: { lat: 39.93, lon: 64.38 },
  sirdaryo: { lat: 40.86, lon: 68.66 },
  talimarjon: { lat: 37.24, lon: 67.27 },
  taxiatosh: { lat: 41.58, lon: 60.6 },
  tinchlik: { lat: 40.93, lon: 71.19 },
  "turoqurg'on": { lat: 40.99, lon: 71.51 },
  "to'rtko'l": { lat: 41.55, lon: 61.0 },
  urgut: { lat: 39.4, lon: 67.25 },
  uchquduq: { lat: 42.15, lon: 63.55 },
  "uchqo'rg'on": { lat: 41.11, lon: 72.08 },
  haqqulobod: { lat: 40.87, lon: 72.12 },
  xolqobod: { lat: 40.86, lon: 69.6 },
  xonobod: { lat: 40.8, lon: 72.98 },
  "xo'jaobod": { lat: 40.67, lon: 72.56 },
  chortoq: { lat: 41.07, lon: 71.82 },
  chelak: { lat: 39.92, lon: 66.86 },
  chimboy: { lat: 42.93, lon: 59.78 },
  chinoz: { lat: 40.94, lon: 68.76 },
  chiroqchi: { lat: 39.03, lon: 66.57 },
  shargun: { lat: 38.62, lon: 67.0 },
  shofirkon: { lat: 40.12, lon: 64.5 },
  shahrixon: { lat: 40.72, lon: 72.06 },
  sherobod: { lat: 37.67, lon: 67.02 },
  shirin: { lat: 37.18, lon: 67.94 },
  shumanay: { lat: 42.72, lon: 59.62 },
  shurchi: { lat: 38.0, lon: 67.79 },
  yaypan: { lat: 40.38, lon: 70.82 },
  yakkabog: { lat: 38.98, lon: 66.68 },
  yangiobod: { lat: 41.12, lon: 69.05 },
  yangiyer: { lat: 40.28, lon: 68.82 },
  yanginishon: { lat: 40.03, lon: 65.36 },
  yangirabot: { lat: 40.03, lon: 65.36 },
};

// Получить координаты города по ключу
export const getCoordinatesByCityKey = (
  cityKey: string
): CityCoordinates | null => {
  return cityCoordinates[cityKey] || null;
};

// Функция для расчета примерного расстояния между городами (в км)
export const calculateDistance = (
  from: CityCoordinates,
  to: CityCoordinates
): { distance: number; duration: number } => {
  // Формула гаверсинусов для расчета расстояния по большой окружности
  const R = 6371; // Радиус Земли в км

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLon = ((to.lon - from.lon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Расстояние в км

  // Примерное время в пути (предполагаем среднюю скорость 80 км/ч)
  const averageSpeed = 80; // км/ч
  const duration = Math.round((distance / averageSpeed) * 60); // В минутах

  return {
    distance: Math.round(distance),
    duration: duration,
  };
};

// Получить информацию о маршруте между двумя городами
export const getTripInfo = (fromCityKey: string, toCityKey: string) => {
  const fromCoords = getCoordinatesByCityKey(fromCityKey);
  const toCoords = getCoordinatesByCityKey(toCityKey);

  if (!fromCoords || !toCoords) {
    return null;
  }

  const routeInfo = calculateDistance(fromCoords, toCoords);

  return {
    distance: routeInfo.distance,
    duration: routeInfo.duration,
    coordinates: {
      from: fromCoords,
      to: toCoords,
    },
  };
};
