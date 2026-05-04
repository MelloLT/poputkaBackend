import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface OtpCodeAttributes {
  phone: string;
  type: "login" | "register" | "payment";
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
}

export interface OtpCodeCreationAttributes extends Optional<
  OtpCodeAttributes,
  "attempts" | "maxAttempts"
> {}

class OtpCode
  extends Model<OtpCodeAttributes, OtpCodeCreationAttributes>
  implements OtpCodeAttributes
{
  public phone!: string;
  public type!: "login" | "register" | "payment";
  public codeHash!: string;
  public attempts!: number;
  public maxAttempts!: number;
  public expiresAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OtpCode.init(
  {
    phone: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM("login", "register", "payment"),
      primaryKey: true,
    },
    codeHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "code_hash",
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      field: "max_attempts",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
  },
  {
    tableName: "otp_codes",
    sequelize,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["phone", "type"], // 👉 важно для UPSERT
      },
    ],
  },
);

export default OtpCode;
