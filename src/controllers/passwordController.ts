import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../models/User";
import { ErrorCodes } from "../utils/errorCodes";
import { sendError, sendSuccess } from "../utils/responseHelper";
import { passwordFingerprint, verifyResetToken } from "../utils/token";
import { logger } from "../config/logger";

const resetSchema = z.object({
  resetToken: z.string().min(10),
  newPassword: z
    .string()
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._-]{8,}$/, "weak password"),
});

// Сброс пароля: требует resetToken, выданный после проверки OTP (/otp/verify, type=recover)
export const resetPassword = async (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 400);
  }
  const { resetToken, newPassword } = parsed.data;

  let phone: string;
  let pwv: string;
  try {
    ({ phone, pwv } = verifyResetToken(resetToken));
  } catch {
    return sendError(res, ErrorCodes.INVALID_OR_EXPIRED_TOKEN, 401);
  }

  try {
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
    }
    // Токен уже использован (пароль сменился после его выдачи)
    if (passwordFingerprint(user.password) !== pwv) {
      return sendError(res, ErrorCodes.INVALID_OR_EXPIRED_TOKEN, 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    return sendSuccess(res, null, ErrorCodes.PASSWORD_RESET_SUCCESS, 200);
  } catch (error) {
    logger.error({ err: error }, "password reset failed");
    return sendError(res, ErrorCodes.PASSWORD_RESET_ERROR, 500);
  }
};
