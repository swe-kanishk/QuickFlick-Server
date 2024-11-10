import dotenv from "dotenv";
dotenv.config({});

import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js"
import postRoutes from "./routes/post.routes.js"
import messageRoutes from "./routes/message.routes.js"
import storiesRoutes from "./routes/story.routes.js"
import { app, server } from "./socket/socket.js";

import connectDB from "./utils/connectDB.js"

const PORT = process.env.PORT || 3000;

// middlewares 
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json()); 
app.use(cookieParser())
app.use(urlencoded({extended: true}))

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/stories", storiesRoutes);

server.listen(PORT, () => {
    connectDB();
    console.log(`server is running at PORT : ${PORT}`)
})