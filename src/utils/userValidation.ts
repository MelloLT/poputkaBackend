// Проверка данных регистрации. Возвращает ВСЕ ошибки сразу, у каждой — поле и код
// (тексты по коду подставляет sendError на языке пользователя).

export interface FieldError {
  field: string;
  code: string;
  [extra: string]: unknown;
}

export const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "mail.ru",
  "yandex.ru",
  "yahoo.com",
  "outlook.com",
  "icloud.com",
  "umail.uz",
];

export const MIN_AGE = 18;
export const MAX_AGE = 100;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[A-Za-z0-9_.]{3,30}$/;
// Буквы латиницы и кириллицы (включая узбекские Oʻ/Gʻ с апострофами), пробел и дефис
const NAME_RE = /^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ'ʻʼ‘’`\- ]{1,30}$/;
const PHONE_RE = /^\+?\d{11,15}$/;

export const normalizePhone = (phone: unknown) => String(phone ?? "").replace(/[\s\-()]/g, "");

/** Конкретная причина, почему пароль не подходит (или null, если подходит) */
export const passwordProblem = (password: unknown): string | null => {
  const p = String(password ?? "");
  if (p.length < 8) return "PASSWORD_TOO_SHORT";
  if (p.length > 18) return "PASSWORD_TOO_LONG";
  if (!/^[A-Za-z\d._-]+$/.test(p)) return "PASSWORD_INVALID_CHARS";
  if (!/[A-Za-z]/.test(p)) return "PASSWORD_NEEDS_LETTER";
  if (!/\d/.test(p)) return "PASSWORD_NEEDS_DIGIT";
  return null;
};

/** Возраст по дате YYYY-MM-DD; null если дата некорректна */
export const ageOn = (birthDate: unknown, now = new Date()): number | null => {
  const s = String(birthDate ?? "");
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) age -= 1;
  return age;
};

export const birthDateErrors = (birthDate: unknown, now = new Date()): FieldError[] => {
  if (birthDate === undefined || birthDate === null || String(birthDate).trim() === "")
    return [{ field: "birthDate", code: "FIELD_REQUIRED" }];
  const age = ageOn(birthDate, now);
  if (age === null) return [{ field: "birthDate", code: "BIRTH_DATE_INVALID" }];
  if (age < 0) return [{ field: "birthDate", code: "BIRTH_DATE_FUTURE" }];
  if (age < MIN_AGE) return [{ field: "birthDate", code: "AGE_REQUIRED_MIN_18", min: MIN_AGE }];
  if (age > MAX_AGE) return [{ field: "birthDate", code: "AGE_TOO_OLD", max: MAX_AGE }];
  return [];
};

export const validateRegistration = (
  body: Record<string, any>,
  { requireRoleGender = true, now = new Date() }: { requireRoleGender?: boolean; now?: Date } = {},
): FieldError[] => {
  const errors: FieldError[] = [];
  const str = (k: string) => (typeof body[k] === "string" ? body[k].trim() : body[k]);

  // /auth/check-register вызывается до выбора роли и пола — там они проверяются, только если переданы
  const required = ["firstName", "lastName", "username", "email", "phone", "password"];
  if (requireRoleGender || body.role !== undefined) required.push("role");
  if (requireRoleGender || body.gender !== undefined) required.push("gender");
  for (const f of required) {
    if (str(f) === undefined || str(f) === null || str(f) === "") errors.push({ field: f, code: "FIELD_REQUIRED" });
  }
  const has = (f: string) => !errors.some((e) => e.field === f);

  if (has("firstName") && !NAME_RE.test(str("firstName"))) errors.push({ field: "firstName", code: "INVALID_NAME_FORMAT" });
  if (has("lastName") && !NAME_RE.test(str("lastName"))) errors.push({ field: "lastName", code: "INVALID_NAME_FORMAT" });
  if (has("username") && !USERNAME_RE.test(str("username")))
    errors.push({ field: "username", code: "INVALID_USERNAME_FORMAT" });

  if (has("email")) {
    const email = String(str("email")).toLowerCase();
    const domain = email.split("@")[1] ?? "";
    if (!EMAIL_RE.test(email) || !(ALLOWED_EMAIL_DOMAINS.includes(domain) || domain.endsWith(".uz")))
      errors.push({ field: "email", code: "INVALID_EMAIL_FORMAT" });
  }

  if (has("phone") && !PHONE_RE.test(normalizePhone(body.phone)))
    errors.push({ field: "phone", code: "INVALID_PHONE_FORMAT" });

  if (has("password")) {
    const problem = passwordProblem(body.password);
    // code оставляем прежним (на него может опираться клиент), конкретика — в reason и message
    if (problem) errors.push({ field: "password", code: "INVALID_PASSWORD_FORMAT", reason: problem });
  }

  // Роль — только пассажир или водитель. Раньше роль бралась из запроса как есть,
  // и можно было зарегистрироваться сразу админом.
  if (required.includes("role") && has("role") && !["passenger", "driver"].includes(str("role"))) errors.push({ field: "role", code: "INVALID_ROLE" });
  if (required.includes("gender") && has("gender") && !["male", "female"].includes(str("gender"))) errors.push({ field: "gender", code: "INVALID_GENDER" });

  errors.push(...birthDateErrors(body.birthDate, now));
  return errors;
};
