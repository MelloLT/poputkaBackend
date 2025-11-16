import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import { generateBookingId } from "../utils/idGenerator";
import Trip from "./Trip";

export interface BookingAttributes {
  id: string;
  passengerId: string;
  tripId: string;
  seats: number;
  status: "confirmed" | "cancelled" | "pending" | "rejected";
}

export interface BookingCreationAttributes
  extends Optional<BookingAttributes, "id" | "status"> {}

class Booking
  extends Model<BookingAttributes, BookingCreationAttributes>
  implements BookingAttributes
{
  public id!: string;
  public passengerId!: string;
  public tripId!: string;
  public seats!: number;
  public status!: "confirmed" | "cancelled" | "pending" | "rejected";

  public readonly passenger?: User;
  public readonly trip?: Trip;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Booking.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: generateBookingId,
    },
    passengerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    tripId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Trip,
        key: "id",
      },
    },
    seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    status: {
      type: DataTypes.ENUM("confirmed", "cancelled", "pending", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "bookings",
    sequelize,
    timestamps: true,
  }
);

// Связи
Booking.belongsTo(User, { foreignKey: "passengerId", as: "passenger" });
Booking.belongsTo(Trip, { foreignKey: "tripId", as: "trip" });
User.hasMany(Booking, { foreignKey: "passengerId" });
Trip.hasMany(Booking, { foreignKey: "tripId" });

export default Booking;
