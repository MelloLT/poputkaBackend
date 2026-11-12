import type { Request } from "express";

/**
 * Человекочитаемые тексты ошибок на ru / uz / en.
 *
 * Бэкенд отвечает кодами (INVALID_PASSWORD_FORMAT и т.п.), а клиент показывал `message`,
 * которого не было, — пользователь видел "invalid_password_format: undefined".
 * Теперь в каждом ответе с ошибкой есть `message` на языке пользователя, а у ошибок
 * валидации — `message` у каждого поля в meta.errors.
 */

export type Lang = "ru" | "uz" | "en";
type Text = Record<Lang, string>;

const T: Record<string, Text> = {
  // ---------- Общие ----------
  VALIDATION_ERROR: {
    ru: "Проверьте правильность заполнения полей",
    uz: "Maydonlar to‘g‘ri to‘ldirilganini tekshiring",
    en: "Please check the highlighted fields",
  },
  MISSING_REQUIRED_FIELDS: {
    ru: "Заполните обязательные поля",
    uz: "Majburiy maydonlarni to‘ldiring",
    en: "Please fill in the required fields",
  },
  EMPTY_OR_UNPARSED_REQUEST_BODY: {
    ru: "Заполните обязательные поля",
    uz: "Majburiy maydonlarni to‘ldiring",
    en: "Please fill in the required fields",
  },
  FIELD_REQUIRED: { ru: "Обязательное поле", uz: "Majburiy maydon", en: "This field is required" },
  TOO_MANY_REQUESTS_IP: {
    ru: "Слишком много запросов. Попробуйте через несколько минут",
    uz: "Juda ko‘p so‘rov. Bir necha daqiqadan so‘ng urinib ko‘ring",
    en: "Too many requests. Please try again in a few minutes",
  },
  TOO_MANY_LOGIN_ATTEMPTS: {
    ru: "Слишком много попыток. Попробуйте через 15 минут",
    uz: "Juda ko‘p urinish. 15 daqiqadan so‘ng urinib ko‘ring",
    en: "Too many attempts. Please try again in 15 minutes",
  },
  NOT_FOUND: { ru: "Не найдено", uz: "Topilmadi", en: "Not found" },
  INTERNAL_SERVER_ERROR: {
    ru: "Что-то пошло не так. Попробуйте ещё раз",
    uz: "Nimadir xato ketdi. Qayta urinib ko‘ring",
    en: "Something went wrong. Please try again",
  },

  // ---------- Вход и сессия ----------
  LOGIN_PASSWORD_REQUIRED: {
    ru: "Введите логин и пароль",
    uz: "Login va parolni kiriting",
    en: "Enter your login and password",
  },
  INVALID_LOGIN_PASSWORD: {
    ru: "Неверный логин или пароль",
    uz: "Login yoki parol noto‘g‘ri",
    en: "Incorrect login or password",
  },
  TOKEN_NOT_PROVIDED: { ru: "Войдите в аккаунт", uz: "Hisobingizga kiring", en: "Please log in" },
  AUTHORIZATION_REQUIRED: { ru: "Войдите в аккаунт", uz: "Hisobingizga kiring", en: "Please log in" },
  INVALID_OR_EXPIRED_TOKEN: {
    ru: "Сессия истекла, войдите снова",
    uz: "Sessiya tugadi, qayta kiring",
    en: "Your session has expired, please log in again",
  },
  ADMIN_RIGHTS_REQUIRED: { ru: "Недостаточно прав", uz: "Huquqlar yetarli emas", en: "Access denied" },
  ROLE_REQUIRED: { ru: "Недостаточно прав", uz: "Huquqlar yetarli emas", en: "Access denied" },
  USER_NOT_FOUND: { ru: "Пользователь не найден", uz: "Foydalanuvchi topilmadi", en: "User not found" },
  USER_BANNED_PERMANENT: { ru: "Аккаунт заблокирован", uz: "Hisob bloklangan", en: "Your account is blocked" },
  USER_BANNED_TEMPORARY: {
    ru: "Аккаунт временно заблокирован",
    uz: "Hisob vaqtincha bloklangan",
    en: "Your account is temporarily blocked",
  },

  // ---------- Регистрация: поля ----------
  USER_ALREADY_EXISTS: {
    ru: "Пользователь с такими данными уже зарегистрирован",
    uz: "Bunday ma’lumotlarga ega foydalanuvchi allaqachon ro‘yxatdan o‘tgan",
    en: "A user with these details already exists",
  },
  USERNAME_TAKEN: { ru: "Этот логин уже занят", uz: "Bu login band", en: "This username is taken" },
  EMAIL_TAKEN: { ru: "Этот email уже зарегистрирован", uz: "Bu email ro‘yxatdan o‘tgan", en: "This email is already registered" },
  PHONE_TAKEN: {
    ru: "Этот номер уже зарегистрирован",
    uz: "Bu raqam ro‘yxatdan o‘tgan",
    en: "This phone number is already registered",
  },
  EMAIL_ALREADY_IN_USE: { ru: "Этот email уже зарегистрирован", uz: "Bu email ro‘yxatdan o‘tgan", en: "This email is already registered" },
  PHONE_ALREADY_IN_USE: {
    ru: "Этот номер уже зарегистрирован",
    uz: "Bu raqam ro‘yxatdan o‘tgan",
    en: "This phone number is already registered",
  },
  INVALID_USERNAME_FORMAT: {
    ru: "Логин: 3–30 символов, латинские буквы, цифры, точка или _",
    uz: "Login: 3–30 belgi, lotin harflari, raqamlar, nuqta yoki _",
    en: "Username: 3–30 characters, Latin letters, digits, dot or _",
  },
  INVALID_EMAIL_FORMAT: {
    ru: "Неверный email. Поддерживаются gmail.com, mail.ru, yandex.ru, icloud.com, outlook.com, yahoo.com и адреса .uz",
    uz: "Email noto‘g‘ri. gmail.com, mail.ru, yandex.ru, icloud.com, outlook.com, yahoo.com va .uz manzillari qo‘llab-quvvatlanadi",
    en: "Invalid email. Supported: gmail.com, mail.ru, yandex.ru, icloud.com, outlook.com, yahoo.com and .uz addresses",
  },
  INVALID_EMAIL: {
    ru: "Неверный email",
    uz: "Email noto‘g‘ri",
    en: "Invalid email",
  },
  INVALID_PHONE_FORMAT: {
    ru: "Номер телефона в формате +998XXXXXXXXX",
    uz: "Telefon raqami +998XXXXXXXXX formatida",
    en: "Phone number in the format +998XXXXXXXXX",
  },
  INVALID_PHONE: {
    ru: "Номер телефона в формате +998XXXXXXXXX",
    uz: "Telefon raqami +998XXXXXXXXX formatida",
    en: "Phone number in the format +998XXXXXXXXX",
  },
  INVALID_PASSWORD_FORMAT: {
    ru: "Пароль: 8–18 символов, латинские буквы и хотя бы одна цифра",
    uz: "Parol: 8–18 belgi, lotin harflari va kamida bitta raqam",
    en: "Password: 8–18 characters, Latin letters and at least one digit",
  },
  PASSWORD_TOO_SHORT: {
    ru: "Пароль слишком короткий — нужно минимум 8 символов",
    uz: "Parol juda qisqa — kamida 8 ta belgi kerak",
    en: "Password is too short — at least 8 characters",
  },
  PASSWORD_TOO_LONG: {
    ru: "Пароль слишком длинный — максимум 18 символов",
    uz: "Parol juda uzun — ko‘pi bilan 18 ta belgi",
    en: "Password is too long — 18 characters at most",
  },
  PASSWORD_NEEDS_LETTER: {
    ru: "В пароле должна быть хотя бы одна латинская буква",
    uz: "Parolda kamida bitta lotin harfi bo‘lishi kerak",
    en: "Password must contain at least one Latin letter",
  },
  PASSWORD_NEEDS_DIGIT: {
    ru: "В пароле должна быть хотя бы одна цифра",
    uz: "Parolda kamida bitta raqam bo‘lishi kerak",
    en: "Password must contain at least one digit",
  },
  PASSWORD_INVALID_CHARS: {
    ru: "Пароль может содержать только латинские буквы, цифры и символы . _ -",
    uz: "Parol faqat lotin harflari, raqamlar va . _ - belgilaridan iborat bo‘lishi mumkin",
    en: "Password may contain only Latin letters, digits and . _ -",
  },
  PASSWORD_VALIDATION_ERROR: {
    ru: "Пароль: 8–18 символов, латинские буквы и хотя бы одна цифра",
    uz: "Parol: 8–18 belgi, lotin harflari va kamida bitta raqam",
    en: "Password: 8–18 characters, Latin letters and at least one digit",
  },
  INVALID_NAME_FORMAT: {
    ru: "Имя и фамилия: только буквы, до 30 символов",
    uz: "Ism va familiya: faqat harflar, 30 belgigacha",
    en: "First and last name: letters only, up to 30 characters",
  },
  INVALID_NAME: {
    ru: "Имя и фамилия: только буквы, до 30 символов",
    uz: "Ism va familiya: faqat harflar, 30 belgigacha",
    en: "First and last name: letters only, up to 30 characters",
  },
  INVALID_ROLE: {
    ru: "Выберите роль: пассажир или водитель",
    uz: "Rolni tanlang: yo‘lovchi yoki haydovchi",
    en: "Choose a role: passenger or driver",
  },
  INVALID_GENDER: { ru: "Укажите пол", uz: "Jinsingizni ko‘rsating", en: "Please select your gender" },
  BIRTH_DATE_INVALID: {
    ru: "Укажите дату рождения в формате ГГГГ-ММ-ДД",
    uz: "Tug‘ilgan sanani YYYY-MM-DD formatida kiriting",
    en: "Enter your date of birth as YYYY-MM-DD",
  },
  BIRTH_DATE_FUTURE: {
    ru: "Дата рождения не может быть в будущем",
    uz: "Tug‘ilgan sana kelajakda bo‘lishi mumkin emas",
    en: "Date of birth cannot be in the future",
  },
  AGE_REQUIRED_MIN_18: {
    ru: "Сервисом можно пользоваться с 18 лет",
    uz: "Xizmatdan 18 yoshdan boshlab foydalanish mumkin",
    en: "You must be at least 18 years old",
  },
  INVALID_AGE: {
    ru: "Сервисом можно пользоваться с 18 лет",
    uz: "Xizmatdan 18 yoshdan boshlab foydalanish mumkin",
    en: "You must be at least 18 years old",
  },
  AGE_TOO_OLD: {
    ru: "Проверьте дату рождения",
    uz: "Tug‘ilgan sanani tekshiring",
    en: "Please check your date of birth",
  },

  // ---------- Поездки ----------
  PRICE_INVALID: {
    ru: "Укажите цену числом",
    uz: "Narxni raqam bilan kiriting",
    en: "Enter the price as a number",
  },
  PRICE_OUT_OF_RANGE: {
    ru: "Цена за место — от {min} до {max} UZS",
    uz: "Bir joy narxi — {min} dan {max} UZS gacha",
    en: "Price per seat must be between {min} and {max} UZS",
  },
  SEATS_OUT_OF_RANGE: {
    ru: "Количество мест — от {min} до {max}",
    uz: "Joylar soni — {min} dan {max} gacha",
    en: "Number of seats must be between {min} and {max}",
  },
  TEXT_TOO_LONG: {
    ru: "Слишком длинный текст — максимум {max} символов",
    uz: "Matn juda uzun — ko‘pi bilan {max} belgi",
    en: "Text is too long — {max} characters at most",
  },
  SAME_CITY: {
    ru: "Город отправления и назначения совпадают",
    uz: "Jo‘nash va borish shahri bir xil",
    en: "Departure and destination cities are the same",
  },
  INVALID_CITY_KEY: { ru: "Выберите город из списка", uz: "Ro‘yxatdan shaharni tanlang", en: "Choose a city from the list" },
  INVALID_DATE_FORMAT: { ru: "Неверная дата", uz: "Sana noto‘g‘ri", en: "Invalid date" },
  TRIP_DATETIME_FUTURE_REQUIRED: {
    ru: "Время отправления должно быть в будущем",
    uz: "Jo‘nash vaqti kelajakda bo‘lishi kerak",
    en: "Departure time must be in the future",
  },
  TRIP_NOT_FOUND: { ru: "Поездка не найдена", uz: "Safar topilmadi", en: "Ride not found" },
  TRIP_NOT_FOUND_OR_NO_ACCESS: { ru: "Поездка не найдена", uz: "Safar topilmadi", en: "Ride not found" },
  TRIP_NOT_ACTIVE: {
    ru: "Эту поездку уже нельзя забронировать",
    uz: "Bu safarni endi band qilib bo‘lmaydi",
    en: "This ride can no longer be booked",
  },
  TRIP_CREATE_ERROR: {
    ru: "Не удалось создать поездку. Попробуйте ещё раз",
    uz: "Safarni yaratib bo‘lmadi. Qayta urinib ko‘ring",
    en: "Could not create the ride. Please try again",
  },
  TRIP_UPDATE_ERROR: {
    ru: "Не удалось сохранить изменения",
    uz: "O‘zgarishlarni saqlab bo‘lmadi",
    en: "Could not save the changes",
  },

  // ---------- Брони ----------
  ALREADY_BOOKED: {
    ru: "Вы уже забронировали эту поездку",
    uz: "Siz bu safarni allaqachon band qilgansiz",
    en: "You have already booked this ride",
  },
  CANNOT_BOOK_OWN_TRIP: {
    ru: "Нельзя бронировать свою поездку",
    uz: "O‘z safaringizni band qilib bo‘lmaydi",
    en: "You can’t book your own ride",
  },
  NO_AVAILABLE_SEATS: {
    ru: "Недостаточно свободных мест",
    uz: "Bo‘sh joylar yetarli emas",
    en: "Not enough seats available",
  },
  TRIP_ID_SEATS_REQUIRED: {
    ru: "Укажите количество мест",
    uz: "Joylar sonini ko‘rsating",
    en: "Please specify the number of seats",
  },
  BOOKING_NOT_FOUND: { ru: "Бронь не найдена", uz: "Bron topilmadi", en: "Booking not found" },
  BOOKING_ACCESS_DENIED: { ru: "Нет доступа к этой брони", uz: "Bu bronga ruxsat yo‘q", en: "No access to this booking" },
  BOOKING_ALREADY_PROCESSED: {
    ru: "Заявка уже обработана",
    uz: "So‘rov allaqachon ko‘rib chiqilgan",
    en: "This request has already been processed",
  },
  PAYMENT_REQUIRED: {
    ru: "Чтобы принимать заявки, сначала оплатите публикацию поездки",
    uz: "So‘rovlarni qabul qilish uchun avval safar e’lonini to‘lang",
    en: "Pay for publishing the ride before accepting requests",
  },

  // ---------- Профиль и машина ----------
  DRIVERS_ONLY_CAN_ADD_CAR: {
    ru: "Автомобиль могут добавить только водители",
    uz: "Faqat haydovchilar avtomobil qo‘sha oladi",
    en: "Only drivers can add a car",
  },
  NO_DATA_TO_UPDATE: { ru: "Нет изменений для сохранения", uz: "Saqlash uchun o‘zgarishlar yo‘q", en: "Nothing to update" },
  FILE_NOT_UPLOADED: { ru: "Выберите файл", uz: "Faylni tanlang", en: "Please choose a file" },

  // ---------- OTP и сброс пароля ----------
  OTP_REQUIRED_FIELDS: {
    ru: "Проверьте номер телефона",
    uz: "Telefon raqamini tekshiring",
    en: "Please check the phone number",
  },
  OTP_SEND_ERROR: {
    ru: "Не удалось отправить SMS. Попробуйте позже",
    uz: "SMS yuborib bo‘lmadi. Keyinroq urinib ko‘ring",
    en: "Could not send the SMS. Please try later",
  },
  OTP_NOT_FOUND: { ru: "Сначала запросите код", uz: "Avval kodni so‘rang", en: "Request a code first" },
  OTP_EXPIRED: {
    ru: "Код истёк, запросите новый",
    uz: "Kod muddati tugadi, yangisini so‘rang",
    en: "The code has expired, request a new one",
  },
  OTP_TOO_MANY_ATTEMPTS: {
    ru: "Слишком много попыток, запросите новый код",
    uz: "Juda ko‘p urinish, yangi kod so‘rang",
    en: "Too many attempts, request a new code",
  },
  OTP_INVALID_CODE: { ru: "Неверный код", uz: "Kod noto‘g‘ri", en: "Incorrect code" },
};

// Запасные тексты по классу ошибки, если кода нет в словаре
const FALLBACK_4XX: Text = {
  ru: "Не удалось выполнить действие. Проверьте данные",
  uz: "Amalni bajarib bo‘lmadi. Ma’lumotlarni tekshiring",
  en: "Couldn’t complete the action. Please check your data",
};
const FALLBACK_5XX = T.INTERNAL_SERVER_ERROR;

const SUPPORTED: Lang[] = ["ru", "uz", "en"];
const pick = (v: unknown): Lang | null => {
  const s = String(v ?? "").toLowerCase().slice(0, 2);
  return (SUPPORTED as string[]).includes(s) ? (s as Lang) : null;
};

/**
 * Язык ответа: X-Lang -> ?lang= -> cookie lang -> Accept-Language -> ru.
 * Клиенту достаточно слать заголовок X-Lang с выбранным в интерфейсе языком.
 */
export const resolveLang = (req?: Request): Lang => {
  if (!req) return "ru";
  const fromHeader = pick(req.headers["x-lang"]);
  if (fromHeader) return fromHeader;
  const fromQuery = pick((req.query as any)?.lang);
  if (fromQuery) return fromQuery;
  const fromCookie = pick((req as any).cookies?.lang);
  if (fromCookie) return fromCookie;
  const accept = String(req.headers["accept-language"] ?? "");
  for (const part of accept.split(",")) {
    const l = pick(part.trim());
    if (l) return l;
  }
  return "ru";
};

const fmt = (n: unknown) =>
  typeof n === "number" ? n.toLocaleString("ru-RU").replace(/ /g, " ") : String(n ?? "");

/** Текст для кода ошибки. params подставляются в {min}, {max} и т.п. */
export const messageFor = (
  code: string,
  lang: Lang,
  status = 400,
  params: Record<string, unknown> = {},
): string => {
  const tpl = T[code]?.[lang] ?? (status >= 500 ? FALLBACK_5XX[lang] : FALLBACK_4XX[lang]);
  return tpl.replace(/\{(\w+)\}/g, (_, k) => fmt(params[k]));
};

export const hasMessage = (code: string) => Boolean(T[code]);
