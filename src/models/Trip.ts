import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";

export interface Location {
  cityKey: string;
  address: string;
}

export interface TripAttributes {
  id: number;
  driverId: number;
  from: Location;
  to: Location;
  departureTime: Date;
  price: number;
  availableSeats: number;
  description?: string;
  instantBooking: boolean;
  maxTwoBackSeats: boolean;
  status: "active" | "completed" | "cancelled";
}

export interface TripCreationAttributes
  extends Optional<
    TripAttributes,
    "id" | "description" | "status" | "instantBooking" | "maxTwoBackSeats"
  > {}

class Trip
  extends Model<TripAttributes, TripCreationAttributes>
  implements TripAttributes
{
  public id!: number;
  public driverId!: number;
  public from!: Location;
  public to!: Location;
  public departureTime!: Date;
  public price!: number;
  public availableSeats!: number;
  public description?: string;
  public instantBooking!: boolean;
  public maxTwoBackSeats!: boolean;
  public status!: "active" | "completed" | "cancelled";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public driver?: User;
}

Trip.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    from: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidLocation(value: any) {
          if (!value.cityKey || !value.address) {
            throw new Error("Location must have city and address");
          }
        },
      },
    },
    to: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidLocation(value: any) {
          if (!value.Key || !value.address) {
            throw new Error("Location must have city and address");
          }
        },
      },
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    availableSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instantBooking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    maxTwoBackSeats: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("active", "completed", "cancelled"),
      defaultValue: "active",
    },
  },
  {
    tableName: "trips",
    sequelize,
    timestamps: true,
  }
);

Trip.belongsTo(User, { foreignKey: "driverId", as: "driver" });
User.hasMany(Trip, { foreignKey: "driverId" });

export default Trip;
