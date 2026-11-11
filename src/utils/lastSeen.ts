import User from "../models/User";
import { logger } from "../config/logger";

const THROTTLE_MS = 10 * 60 * 1000;

/**
 * Отмечает активность пользователя (для статистики «сколько пользуется»).
 * Не чаще раза в 10 минут, без изменения updatedAt, не блокирует ответ.
 */
export const touchLastSeen = (user: Pick<User, "id"> & { lastSeenAt?: Date | null }) => {
  const last = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
  if (Date.now() - last < THROTTLE_MS) return;
  User.update({ lastSeenAt: new Date() }, { where: { id: user.id }, silent: true }).catch((err) =>
    logger.warn({ err, userId: user.id }, "lastSeenAt update failed"),
  );
};
