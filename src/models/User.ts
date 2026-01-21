import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { generateId } from "../utils/idGenerator";

interface Location {
  cityKey: string;
  address: string;
}

interface UserAttributes {
  id: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: "driver" | "passenger" | "admin";
  firstName: string;
  lastName: string;
  birthDate: string;
  telegram?: string;
  about?: string;
  tripsCount: number;
  gender?: "male" | "female";
  avatar?: string | null;
  rating: number;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  isBanned: boolean;
  banReason?: string;
  bannedUntil?: Date;
  reviews: Array<{
    author: string;
    authorId: string;
    text: string;
    rating: number;
    createdAt: Date;
    tripId: string;
  }>;
  car?: {
    model: string;
    color: string;
    year: number;
    licensePlate: string;
    photos?: string[];
  };
  activeTrips: Array<{
    tripId: string;
    role: "driver" | "passenger";
    from: Location;
    to: Location;
    departureDate: string;
    departureTime: string;
    price: number;
    availableSeats: number;
    status: "active";
    // Только для водителя - все бронирования пассажиров
    bookings?: Array<{
      id: string;
      passengerId: string;
      passenger: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        rating: number;
        telegram?: string;
        phone?: string;
      };
      seats: number;
      status: "confirmed" | "pending";
      createdAt: Date;
    }>;
    // Только для пассажира - его собственное бронирование
    myBooking?: {
      id: string;
      seats: number;
      status: "confirmed" | "pending";
      createdAt: Date;
    };
    // Общая информация о второй стороне
    counterpart?: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      rating: number;
      car?: any;
      telegram?: string;
      phone?: string;
    };
  }>;
  notifications: Array<{
    id: string;
    type:
      | "booking_request"
      | "booking_confirmed"
      | "booking_rejected"
      | "info"
      | "success"
      | "error";
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    relatedBookingId?: string;
  }>;
  reports: Array<{
    id: string;
    reporterId: string;
    reason: string;
    details: string;
    createdAt: Date;
    status: "pending" | "reviewed" | "resolved";
    adminNote?: string;
    resolvedAt?: Date;
  }>;
  tripHistory: Array<{
    tripId: string;
    role: "driver" | "passenger";
    from: Location;
    to: Location;
    departureDate: string;
    departureTime: string;
    price: number;
    status: "completed" | "cancelled";
    completedAt: Date;
    withUser?: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    passengers?: Array<{
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      seats: number;
    }>;
  }>;
}

interface UserCreationAttributes extends Optional<
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
  | "activeTrips"
  | "notifications"
  | "about"
  | "tripsCount"
  | "emailVerified"
  | "phoneVerified"
  | "telegram"
  | "tripHistory"
  | "isBanned"
  | "reports"
> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public username!: string;
  public email!: string;
  public phone!: string;
  public password!: string;
  public role!: "driver" | "passenger" | "admin";
  public firstName!: string;
  public lastName!: string;
  public birthDate!: string;
  public telegram?: string;
  public about?: string;
  public tripsCount!: number;
  public gender?: "male" | "female";
  public avatar?: string | null;
  public rating!: number;
  public isVerified!: boolean;
  public emailVerified!: boolean;
  public phoneVerified!: boolean;
  public verificationCode?: string;
  public verificationCodeExpires?: Date;
  public isBanned!: boolean;
  public banReason?: string;
  public bannedUntil?: Date;

  public reviews!: Array<{
    author: string;
    authorId: string;
    text: string;
    rating: number;
    createdAt: Date;
    tripId: string;
  }>;
  public car?: {
    model: string;
    color: string;
    year: number;
    licensePlate: string;
    photos?: string[];
  };
  public activeTrips!: Array<{
    tripId: string;
    role: "driver" | "passenger";
    from: Location;
    to: Location;
    departureDate: string;
    departureTime: string;
    price: number;
    availableSeats: number;
    status: "active";
    bookings?: Array<{
      id: string;
      passengerId: string;
      passenger: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        rating: number;
        telegram?: string;
        phone?: string;
      };
      seats: number;
      status: "confirmed" | "pending";
      createdAt: Date;
    }>;
    myBooking?: {
      id: string;
      seats: number;
      status: "confirmed" | "pending";
      createdAt: Date;
    };
    counterpart?: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      rating: number;
      car?: any;
      telegram?: string;
      phone?: string;
    };
  }>;
  public notifications!: Array<{
    id: string;
    type:
      | "booking_request"
      | "booking_confirmed"
      | "booking_rejected"
      | "info"
      | "success"
      | "error";
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    relatedBookingId?: string;
  }>;
  public reports!: Array<{
    id: string;
    reporterId: string;
    reason: string;
    details: string;
    createdAt: Date;
    status: "pending" | "reviewed" | "resolved";
    adminNote?: string;
    resolvedAt?: Date;
  }>;
  public tripHistory!: Array<{
    tripId: string;
    role: "driver" | "passenger";
    from: Location;
    to: Location;
    departureDate: string;
    departureTime: string;
    price: number;
    status: "completed" | "cancelled";
    completedAt: Date;
    withUser?: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    passengers?: Array<{
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      seats: number;
    }>;
  }>;

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
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: generateId,
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
      type: DataTypes.ENUM("driver", "passenger", "admin"),
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
    birthDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telegram: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^@?[a-zA-Z0-9_]{5,32}$/,
      },
    },
    isBanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    banReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bannedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reports: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },
    tripsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tripHistory: {
      type: DataTypes.JSONB,
      defaultValue: [],
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
      defaultValue: 1.0,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phoneVerified: {
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
    activeTrips: {
      type: DataTypes.JSONB,
      defaultValue: [],
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
  },
);

export default User;
