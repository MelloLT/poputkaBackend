import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { generateBookingId } from "../utils/idGenerator";

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

  // Убрали явные объявления связей чтобы избежать циклических зависимостей
  public passenger?: any;
  public trip?: any;

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
    },
    tripId: {
      type: DataTypes.STRING,
      allowNull: false,
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

export default Booking;
