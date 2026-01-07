import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Chat from "./Chat";
import User from "./User";

class Message extends Model {
  public id!: string;
  public chatId!: string;
  public senderId!: string;
  public text!: string;
  public createdAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    chatId: { type: DataTypes.STRING, allowNull: false },
    senderId: { type: DataTypes.STRING, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: "messages", timestamps: true }
);

Message.belongsTo(Chat, { foreignKey: "chatId" });
Message.belongsTo(User, { foreignKey: "senderId" });

export default Message;
