import User from "./User";
import Trip from "./Trip";
import Booking from "./Booking";
import Chat from "./Chat";
import Message from "./Message";
export const setupAssociations = () => {
  // User associations
  User.hasMany(Trip, { foreignKey: "driverId", as: "trips" });
  User.hasMany(Booking, { foreignKey: "passengerId", as: "bookings" });
  User.hasMany(Message, { foreignKey: "senderId", as: "messages" });

  // Trip associations
  Trip.belongsTo(User, { foreignKey: "driverId", as: "driver" });
  Trip.hasMany(Booking, { foreignKey: "tripId", as: "bookings" });

  // Booking associations
  Booking.belongsTo(User, { foreignKey: "passengerId", as: "passenger" });
  Booking.belongsTo(Trip, { foreignKey: "tripId", as: "trip" });
  // Chat ↔ Users
  Chat.belongsTo(User, { as: "user1", foreignKey: "user1Id" });
  Chat.belongsTo(User, { as: "user2", foreignKey: "user2Id" });
  User.hasMany(Chat, { foreignKey: "user1Id", as: "chatsAsUser1" });
  User.hasMany(Chat, { foreignKey: "user2Id", as: "chatsAsUser2" });

  // Chat ↔ Messages
  Chat.hasMany(Message, { foreignKey: "chatId", as: "messages" });
  Message.belongsTo(Chat, { foreignKey: "chatId", as: "chat" });

  // Message ↔ User (Sender)
  User.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });
  Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });
};
