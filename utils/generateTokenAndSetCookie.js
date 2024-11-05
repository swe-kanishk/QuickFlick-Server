import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });

    res.cookie("quickFlick-token", token, {
        httpOnly: true,
        secure: true,            // Ensures cookies are sent only over HTTPS
        sameSite: "none",         // Necessary for cross-domain cookies
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });    
    return token;
}