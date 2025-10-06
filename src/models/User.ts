import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: "driver" | "passenger";
  firstName: string;
  lastName: string;
  gender?: "male" | "female";
  avatar?: string;
  rating: number;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  reviews: Array<{
    author: string;
    text: string;
    rating: number;
  }>;
  car?: {
    model: string;
    color: string;
    year: number;
    licensePlate: string;
    photos?: string[];
  };
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "rating"
    | "isVerified"
    | "reviews"
    | "avatar"
    | "car"
    | "gender"
    | "verificationCode"
    | "verificationCodeExpires"
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public username!: string;
  public email!: string;
  public phone!: string;
  public password!: string;
  public role!: "driver" | "passenger";
  public firstName!: string;
  public lastName!: string;
  public gender?: "male" | "female";
  public avatar?: string;
  public rating!: number;
  public isVerified!: boolean;
  public verificationCode?: string;
  public verificationCodeExpires?: Date;
  public reviews!: Array<{
    author: string;
    text: string;
    rating: number;
  }>;
  public car?: {
    model: string;
    color: string;
    year: number;
    licensePlate: string;
    photos?: string[];
  };

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 20],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("driver", "passenger"),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    gender: {
      type: DataTypes.ENUM("male", "female"),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationCodeExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviews: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    car: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    sequelize,
    timestamps: true,
  }
);

export default User;
