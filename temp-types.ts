
import { getMe } from "./src/controllers/authController";
import { getUserById } from "./src/controllers/userController";

type GetMeData = Awaited<ReturnType<typeof getMe>> extends { data: infer D } ? D : never;
type GetUserByIdData = Awaited<ReturnType<typeof getUserById>> extends { data: infer D } ? D : never;

type ActiveTripMe = GetMeData['user']['activeTrips'][0];
type MyBookingMe = GetMeData['myBookings'][0];
type ActiveTripProfile = GetUserByIdData['data']['user']['activeTrips'][0];
type MyBookingProfile = GetUserByIdData['data']['myBookings'][0];
