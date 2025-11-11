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
  birthday?: string;
  gender?: "male" | "female";
  avatar?: string | null;
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
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    relatedBookingId?: number;
  }>;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "rating"
    | "isVerified"
    | "reviews"
    | "avatar"
    | "gender"
    | "car"
    | "verificationCode"
    | "verificationCodeExpires"
    | "notifications"
    | "birthday"
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
  public birthday?: string;
  public gender?: "male" | "female";
  public avatar?: string | null;
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
  public notifications!: Array<{
    id: string;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    relatedBookingId?: number;
  }>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get age(): number | null {
    if (!this.birthday) return null;
    const birthDate = new Date(this.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
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
    birthday: {
      type: DataTypes.DATEONLY, // Формат YYYY-MM-DD
      allowNull: true,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString().split("T")[0],
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
    notifications: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    tableName: "users",
    sequelize,
    timestamps: true,
  }
);

export default User;
