import { DataTypes, Model } from "sequelize";
import Message from "./Message";
import sequelize from "../config/database";
import User from "./User";

class Chat extends Model {
  public id!: string;
  public user1Id!: string;
  public user2Id!: string;
  public messages?: Message[];
}

Chat.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user1Id: { type: DataTypes.STRING, allowNull: false },
    user2Id: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: "chats" }
);

export default Chat;
