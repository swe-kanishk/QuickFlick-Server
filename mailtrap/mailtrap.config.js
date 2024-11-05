import { MailtrapClient } from "mailtrap";
import dotenv from 'dotenv';

dotenv.config()

export const mailTrapClient = new MailtrapClient({
  token: process.env.MAILTRAP_API_TOKEN,
});

export const sender = {
  email: "hello@demomailtrap.com",
  name: "QuickFlick",
};
