import ExcelJS from "exceljs";
import { QueryTypes } from "sequelize";
import sequelize from "../config/database";

// Все даты в отчёте — по Ташкенту
const TZ = "Asia/Tashkent";

type Row = Record<string, any>;
const q = async (sql: string): Promise<Row[]> =>
  (await sequelize.query(sql, { type: QueryTypes.SELECT })) as Row[];

const num = (v: unknown) => Number(v ?? 0);

/** Сводные цифры (используются и в Excel, и в JSON /admin/stats/growth) */
export const getUserGrowthStats = async () => {
  const [summary = {}] = await q(`
    SELECT
      COUNT(*) FILTER (WHERE role <> 'admin')                                              AS total,
      COUNT(*) FILTER (WHERE role = 'driver')                                              AS drivers,
      COUNT(*) FILTER (WHERE role = 'passenger')                                           AS passengers,
      COUNT(*) FILTER (WHERE role <> 'admin' AND "isBanned")                               AS banned,
      COUNT(*) FILTER (WHERE role <> 'admin' AND ("createdAt" AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date) AS new_today,
      COUNT(*) FILTER (WHERE role <> 'admin' AND "createdAt" >= now() - interval '7 days')  AS new_7d,
      COUNT(*) FILTER (WHERE role <> 'admin' AND "createdAt" >= now() - interval '30 days') AS new_30d,
      COUNT(*) FILTER (WHERE role <> 'admin' AND "lastSeenAt" >= now() - interval '1 day')  AS active_1d,
      COUNT(*) FILTER (WHERE role <> 'admin' AND "lastSeenAt" >= now() - interval '7 days') AS active_7d,
      COUNT(*) FILTER (WHERE role <> 'admin' AND "lastSeenAt" >= now() - interval '30 days') AS active_30d,
      MIN("lastSeenAt")                                                                     AS activity_tracked_since
    FROM users
  `);

  const [usage = {}] = await q(`
    SELECT
      (SELECT COUNT(DISTINCT "passengerId") FROM bookings)                      AS passengers_with_bookings,
      (SELECT COUNT(DISTINCT "driverId") FROM trips)                            AS drivers_with_trips,
      (SELECT COUNT(*) FROM trips)                                              AS trips_total,
      (SELECT COUNT(*) FROM trips WHERE "createdAt" >= now() - interval '30 days') AS trips_30d,
      (SELECT COUNT(*) FROM bookings)                                           AS bookings_total,
      (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed')                AS bookings_confirmed,
      (SELECT COUNT(*) FROM bookings WHERE "createdAt" >= now() - interval '30 days') AS bookings_30d
  `);

  return {
    users: {
      total: num(summary.total),
      drivers: num(summary.drivers),
      passengers: num(summary.passengers),
      banned: num(summary.banned),
    },
    newUsers: { today: num(summary.new_today), last7d: num(summary.new_7d), last30d: num(summary.new_30d) },
    activeUsers: {
      last1d: num(summary.active_1d),
      last7d: num(summary.active_7d),
      last30d: num(summary.active_30d),
      trackedSince: summary.activity_tracked_since as Date | null,
    },
    usage: {
      passengersWithBookings: num(usage.passengers_with_bookings),
      driversWithTrips: num(usage.drivers_with_trips),
      tripsTotal: num(usage.trips_total),
      trips30d: num(usage.trips_30d),
      bookingsTotal: num(usage.bookings_total),
      bookingsConfirmed: num(usage.bookings_confirmed),
      bookings30d: num(usage.bookings_30d),
    },
  };
};

const registrationsBy = (unit: "day" | "month", days?: number) =>
  q(`
    WITH reg AS (
      SELECT date_trunc('${unit}', "createdAt" AT TIME ZONE '${TZ}') AS period, role
      FROM users WHERE role <> 'admin'
    ),
    periods AS (
      SELECT generate_series(
        ${days ? `date_trunc('${unit}', (now() AT TIME ZONE '${TZ}') - interval '${days - 1} days')` : `(SELECT MIN(period) FROM reg)`},
        date_trunc('${unit}', now() AT TIME ZONE '${TZ}'),
        interval '1 ${unit}'
      ) AS period
    )
    SELECT
      to_char(p.period, 'YYYY-MM-DD') AS period,
      COUNT(r.role)                                  AS new_total,
      COUNT(r.role) FILTER (WHERE r.role = 'driver')    AS new_drivers,
      COUNT(r.role) FILTER (WHERE r.role = 'passenger') AS new_passengers,
      (SELECT COUNT(*) FROM reg r2 WHERE r2.period <= p.period) AS cumulative
    FROM periods p
    LEFT JOIN reg r ON r.period = p.period
    GROUP BY p.period
    ORDER BY p.period
  `);

const usersList = () =>
  q(`
    SELECT
      u.id, u.username, u."firstName", u."lastName", u.role, u.gender, u.phone, u.email,
      u."createdAt", u."lastSeenAt", u.rating, u."isVerified", u."phoneVerified", u."emailVerified", u."isBanned",
      u.car->>'model' AS car_model,
      (SELECT COUNT(*) FROM trips t WHERE t."driverId" = u.id)         AS trips_published,
      (SELECT COUNT(*) FROM bookings b WHERE b."passengerId" = u.id)   AS bookings_made
    FROM users u
    WHERE u.role <> 'admin'
    ORDER BY u."createdAt" DESC
  `);

// ---------- Оформление ----------
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1565D8" } };

const styleHeader = (ws: ExcelJS.Worksheet) => {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle" };
  row.height = 22;
  ws.views = [{ state: "frozen", ySplit: 1 }];
};

const tashkent = (d: Date | string | null) =>
  d ? new Date(d).toLocaleString("ru-RU", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }) : "";

const ROLE: Record<string, string> = { driver: "Водитель", passenger: "Пассажир" };
const yesNo = (v: unknown) => (v ? "да" : "нет");

/** Excel-отчёт по пользователям: сводка, динамика по дням/месяцам, список */
export const buildUsersWorkbook = async () => {
  const [stats, daily, monthly, users] = await Promise.all([
    getUserGrowthStats(),
    registrationsBy("day", 90),
    registrationsBy("month"),
    usersList(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Pop-utka";
  wb.created = new Date();

  // --- Сводка ---
  const s = wb.addWorksheet("Сводка");
  s.columns = [
    { header: "Показатель", key: "k", width: 52 },
    { header: "Значение", key: "v", width: 22 },
  ];
  const tracked = stats.activeUsers.trackedSince;
  const rows: [string, string | number][] = [
    ["Отчёт сформирован", tashkent(new Date())],
    ["", ""],
    ["Всего пользователей", stats.users.total],
    ["  водителей", stats.users.drivers],
    ["  пассажиров", stats.users.passengers],
    ["  заблокировано", stats.users.banned],
    ["", ""],
    ["Новых сегодня", stats.newUsers.today],
    ["Новых за 7 дней", stats.newUsers.last7d],
    ["Новых за 30 дней", stats.newUsers.last30d],
    ["", ""],
    ["Заходили за последние сутки", stats.activeUsers.last1d],
    ["Заходили за 7 дней", stats.activeUsers.last7d],
    ["Заходили за 30 дней", stats.activeUsers.last30d],
    ["  (активность учитывается с)", tracked ? tashkent(tracked) : "ещё нет данных"],
    ["", ""],
    ["Пассажиров, сделавших хотя бы 1 бронь", stats.usage.passengersWithBookings],
    ["Водителей, опубликовавших хотя бы 1 поездку", stats.usage.driversWithTrips],
    ["Поездок всего", stats.usage.tripsTotal],
    ["Поездок за 30 дней", stats.usage.trips30d],
    ["Броней всего", stats.usage.bookingsTotal],
    ["  из них подтверждено", stats.usage.bookingsConfirmed],
    ["Броней за 30 дней", stats.usage.bookings30d],
  ];
  rows.forEach(([k, v]) => s.addRow({ k, v }));
  styleHeader(s);
  s.getColumn("v").alignment = { horizontal: "right" };

  // --- По дням / по месяцам ---
  const periodSheet = (name: string, data: Row[], fmt: string) => {
    const ws = wb.addWorksheet(name);
    ws.columns = [
      { header: name === "По дням" ? "Дата" : "Месяц", key: "period", width: 14, style: { numFmt: fmt } },
      { header: "Новых всего", key: "new_total", width: 14 },
      { header: "Водителей", key: "new_drivers", width: 12 },
      { header: "Пассажиров", key: "new_passengers", width: 12 },
      { header: "Всего на конец периода", key: "cumulative", width: 24 },
    ];
    data.forEach((r) =>
      ws.addRow({
        // строка YYYY-MM-DD -> дата в UTC, чтобы Excel не сдвинул день из-за пояса сервера
        period: new Date(`${r.period}T00:00:00Z`),
        new_total: num(r.new_total),
        new_drivers: num(r.new_drivers),
        new_passengers: num(r.new_passengers),
        cumulative: num(r.cumulative),
      }),
    );
    styleHeader(ws);
  };
  periodSheet("По дням", daily, "dd.mm.yyyy");
  periodSheet("По месяцам", monthly, "mmmm yyyy");

  // --- Пользователи ---
  const u = wb.addWorksheet("Пользователи");
  u.columns = [
    { header: "Дата регистрации", key: "createdAt", width: 18 },
    { header: "Имя", key: "firstName", width: 16 },
    { header: "Фамилия", key: "lastName", width: 18 },
    { header: "Логин", key: "username", width: 18 },
    { header: "Роль", key: "role", width: 11 },
    { header: "Пол", key: "gender", width: 8 },
    { header: "Телефон", key: "phone", width: 16 },
    { header: "Email", key: "email", width: 28 },
    { header: "Последняя активность", key: "lastSeenAt", width: 20 },
    { header: "Опубликовал поездок", key: "trips", width: 12 },
    { header: "Сделал броней", key: "bookings", width: 12 },
    { header: "Рейтинг", key: "rating", width: 9 },
    { header: "Авто", key: "car", width: 18 },
    { header: "Профиль подтверждён", key: "verified", width: 12 },
    { header: "Заблокирован", key: "banned", width: 12 },
    { header: "ID", key: "id", width: 16 },
  ];
  users.forEach((r) =>
    u.addRow({
      createdAt: tashkent(r.createdAt),
      firstName: r.firstName,
      lastName: r.lastName,
      username: r.username,
      role: ROLE[r.role] ?? r.role,
      gender: r.gender === "male" ? "М" : r.gender === "female" ? "Ж" : "",
      phone: r.phone,
      email: r.email,
      lastSeenAt: tashkent(r.lastSeenAt),
      trips: num(r.trips_published),
      bookings: num(r.bookings_made),
      rating: num(r.rating),
      car: r.car_model ?? "",
      verified: yesNo(r.isVerified),
      banned: yesNo(r.isBanned),
      id: r.id,
    }),
  );
  styleHeader(u);
  u.autoFilter = { from: "A1", to: "P1" };

  return wb;
};
