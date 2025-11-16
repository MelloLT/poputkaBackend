import User from "./User";
import Trip from "./Trip";
import Booking from "./Booking";

export const setupAssociations = () => {
  // User associations
  User.hasMany(Trip, { foreignKey: "driverId", as: "trips" });
  User.hasMany(Booking, { foreignKey: "passengerId", as: "bookings" });

  // Trip associations
  Trip.belongsTo(User, { foreignKey: "driverId", as: "driver" });
  Trip.hasMany(Booking, { foreignKey: "tripId", as: "bookings" });

  // Booking associations
  Booking.belongsTo(User, { foreignKey: "passengerId", as: "passenger" });
  Booking.belongsTo(Trip, { foreignKey: "tripId", as: "trip" });
};
