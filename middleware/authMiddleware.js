import jwt from "jsonwebtoken";

/* JWT AUTH */

export const protect = (req, res, next) => {


    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

/* ROLE CHECK */

export const isOwner = (req, res, next) => {

    if (!req.user || req.user.role !== "owner") {

        return res.status(403).json({
            message: "Only owners can perform this action"
        });

    }

    next();

};