import jwt from "jsonwebtoken";

export const isAuthenticated = async(req, res, next) => {
    const token = req.cookies["quickFlick-token"]
    console.log(token)
    if(!token) return res.status(401).json({success: false, message: "Unauthorized - no token provided"});
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded) return res.status(401).json({success: false, message: "Unauthorized - invalid token"});
        req.userId = decoded.userId
        next();
    } catch (error) {
        console.log("Error in verifyToken", error);
        return res.status(500).json({success: false, message: "Server error"})
    }
}