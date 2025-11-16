import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { generateTripId } from "../utils/idGenerator";

export interface Location {
  cityKey: string;
  address: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface TripAttributes {
  id: string;
  driverId: string;
  from: Location;
  to: Location;
  departureDate: string;
  departureTime: string;
  price: number;
  availableSeats: number;
  description?: string;
  instantBooking: boolean;
  maxTwoBackSeats: boolean;
  status: "active" | "completed" | "cancelled";
  tripInfo?: {
    distance: number;
    duration: number;
    coordinates: {
      from: Coordinates;
      to: Coordinates;
    };
  };
}

export interface TripCreationAttributes
  extends Optional<
    TripAttributes,
    | "id"
    | "description"
    | "status"
    | "instantBooking"
    | "maxTwoBackSeats"
    | "tripInfo"
  > {}

class Trip
  extends Model<TripAttributes, TripCreationAttributes>
  implements TripAttributes
{
  public id!: string;
  public driverId!: string;
  public from!: Location;
  public to!: Location;
  public departureDate!: string;
  public departureTime!: string;
  public price!: number;
  public availableSeats!: number;
  public description?: string;
  public instantBooking!: boolean;
  public maxTwoBackSeats!: boolean;
  public status!: "active" | "completed" | "cancelled";
  public tripInfo?: {
    distance: number;
    duration: number;
    coordinates: {
      from: Coordinates;
      to: Coordinates;
    };
  };

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Убрали явные объявления связей чтобы избежать циклических зависимостей
  public driver?: any;
  public bookings?: any[];
}

Trip.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: generateTripId,
    },
    driverId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    from: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    to: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    departureDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    departureTime: {
      type: DataTypes.STRING,
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
        min: 0,
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
    tripInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "trips",
    sequelize,
    timestamps: true,
  }
);

export default Trip;
