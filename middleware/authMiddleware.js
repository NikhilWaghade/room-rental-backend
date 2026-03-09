import multer from "multer";
import jwt from "jsonwebtoken";


/* ============================= */
/* IMAGE UPLOAD MIDDLEWARE */
/* ============================= */

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


/* ============================= */
/* JWT AUTH MIDDLEWARE */
/* ============================= */

export const protect = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(401).json({
            message: "Not authorized, token missing"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }
};



/* ============================= */
/* ROLE CHECK MIDDLEWARE */
/* ============================= */

export const isOwner = (req, res, next) => {

    if (req.user.role !== "owner") {

        return res.status(403).json({
            message: "Only owners can perform this action"
        });

    }

    next();
};