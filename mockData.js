// Просто скопируй это в backend/mockData.js
module.exports = {
  getMockTrips: () => [
    {
      departure: "Москва",
      arrival: "Киев",
      price: 19000,
      duration: "8 часов",
      departureTime: "19:30",
      arrivalTime: "25:30",
      seatsAvailable: 9,
      driver: {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwjvv_gWyyWWlFgnGJ1L8hfSpnYAaWmWiqAg&s",
        name: "Futa DOM",
        rating: 5,
        varified: true,
      },
      instantBooking: true,
      maxTwoBackSeats: true,
    },
  ],
};
