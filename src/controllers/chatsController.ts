import Chat from "../models/Chat";
import User from "../models/User";
import Message from "../models/Message";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

export const getChats = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: [
        {
          model: User,
          as: "user1",
          attributes: ["id", "username", "firstName", "lastName", "avatar"],
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "username", "firstName", "lastName", "avatar"],
        },
        {
          model: Message,
          as: "messages",
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "username", "firstName", "lastName", "avatar"],
            },
          ],
          order: [["createdAt", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: chats });
  } catch (err: any) {
    console.error("Ошибка при получении чатов:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const getChatByID = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByPk(id, {
      include: [
        {
          model: User,
          as: "user1",
          attributes: ["id", "username", "firstName", "lastName", "avatar"],
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "username", "firstName", "lastName", "avatar"],
        },
        {
          model: Message,
          as: "messages",
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "username", "firstName", "lastName", "avatar"],
            },
          ],
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    if (!chat) {
      return sendError(res, ErrorCodes.CHAT_NOT_FOUND, 404);
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Ошибка при получении поездки:", error);
    return sendError(res, ErrorCodes.CHAT_SERVER_ERROR, 500);
  }
};
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, text } = req.body;
    const userId = req.user!.id;

    if (!chatId || !text?.trim()) {
      return sendError(res, ErrorCodes.CHATID_TEXT_REQUIRED, 400);
    }

    // проверяем, что пользователь участвует в этом чате
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return sendError(res, ErrorCodes.CHAT_NOT_FOUND, 404);
    }

    if (userId !== chat.user1Id && userId !== chat.user2Id) {
      return sendError(res, ErrorCodes.CHAT_ACCESS_DENIED, 403);
    }

    // создаём сообщение
    const message = await Message.create({
      chatId,
      senderId: userId,
      text,
    });

    return sendSuccess(res, { message: message }, "MESSAGE_SENT", 201);
  } catch (error: any) {
    console.error("Ошибка отправки сообщения:", error.message);
    return sendError(res, ErrorCodes.CHAT_SEND_ERROR, 500);
  }
};

export const createChat = async (req: Request, res: Response) => {
  try {
    const user1Id = req.user!.id;
    const { user2Id } = req.body;

    if (!user2Id) {
      return sendError(res, ErrorCodes.SECOND_USER_MISSING, 400);
    }

    const existingChat = await Chat.findOne({
      where: {
        [Op.or]: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
    });

    if (existingChat) {
      return sendSuccess(res, existingChat, ErrorCodes.CHAT_ALREADY_EXISTS);
    }

    const chat = await Chat.create({ user1Id, user2Id });

    return res.status(201).json({
      success: true,
      data: chat,
    });
  } catch (error: any) {
    console.error("Ошибка создания чата:", error.message);
    return sendError(res, ErrorCodes.CHAT_SERVER_ERROR, 500);
  }
};
