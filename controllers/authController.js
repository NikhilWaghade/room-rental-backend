import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// jwt token 
export const generateTokens = (user) => {

    const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };

};

export const refreshTokenController = (req, res) => {

    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token missing" });
    }

    try {

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ accessToken });

    } catch (error) {

        res.status(403).json({ message: "Invalid refresh token" });

    }

};


/* REGISTER USER */

export const registerUser = async (req, res) => {
    try {

        const { name, email, password, phone, role } = req.body;

        /* Validate fields */

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Name, email, password and role are required"
            });
        }

        /* Check if user exists */

        const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        /* Hash password */

        const hashedPassword = await bcrypt.hash(password, 10);

        /* Insert user */

        const { data, error } = await supabase
            .from("users")
            .insert([
                {
                    name,
                    email,
                    password: hashedPassword,
                    phone,
                    role
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json(error);
        }

        res.status(201).json({
            message: "User registered successfully",
            user: data
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};
/* LOGIN USER */

export const loginUser = async (req, res) => {
    try {

        const { email, password, role } = req.body;

        /* Validate */

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Email, password and role are required"
            });
        }

        /* Find user */

        const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        /* Check role */

        if (user.role !== role) {
            return res.status(403).json({
                message: "Role mismatch"
            });
        }

        /* Check password */

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        /* Generate token */

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};