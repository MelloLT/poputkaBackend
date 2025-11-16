import { customAlphabet } from "nanoid";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 12);

export const generateId = (): string => {
  return nanoid();
};

export const generateTripId = (): string => {
  return `TR${nanoid(10)}`;
};

export const generateBookingId = (): string => {
  return `BK${nanoid(10)}`;
};

export const generateReviewId = (): string => {
  return `RV${nanoid(10)}`;
};
