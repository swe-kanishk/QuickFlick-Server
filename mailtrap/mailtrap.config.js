import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

// Debug: Log the token to ensure it’s loaded
console.log("Mailtrap API Token:", process.env.MAILTRAP_API_TOKEN);

if (!process.env.MAILTRAP_API_TOKEN) {
  throw new Error("MAILTRAP_API_TOKEN is not defined in .env");
}

export const mailTrapClient = new MailtrapClient({
  token: process.env.MAILTRAP_API_TOKEN,
});

export const sender = {
  email: "hello@demomailtrap.com", // For testing; change to your domain for real sending
  name: "QuickFlick",
};
