
import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* JWT TOKENS */

export const generateTokens = (user) => {

    const accessToken = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        {
            id: user.id
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };

};

/* REFRESH TOKEN */

export const refreshTokenController = (req, res) => {

    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token missing"
        });
    }

    try {

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_SECRET
        );

        const accessToken = jwt.sign(
            {
                id: decoded.id
            },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ accessToken });

    } catch (error) {

        res.status(403).json({
            message: "Invalid refresh token"
        });

    }

};

/* REGISTER USER */

export const registerUser = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone,
            role
        } = req.body;

        /* VALIDATE */

        if (!name || !email || !password || !role) {

            return res.status(400).json({
                message: "Name, email, password and role are required"
            });

        }

        /* CHECK EXISTING USER */

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

        /* HASH PASSWORD */

        const hashedPassword = await bcrypt.hash(password, 10);

        /* INSERT USER */

        const { data, error } = await supabase
            .from("users")
            .insert([
                {
                    name,
                    email,
                    password: hashedPassword,
                    phone,
                    role,
                    provider: "local"
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

        const {
            email,
            password,
            role
        } = req.body;

        /* VALIDATE */

        if (!email || !password || !role) {

            return res.status(400).json({
                message: "Email, password and role are required"
            });

        }

        /* FIND USER */

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

        /* GOOGLE ACCOUNT CHECK */

        if (user.provider === "google") {

            return res.status(400).json({
                message: "Please login using Google"
            });

        }

        /* ROLE CHECK */

        if (user.role !== role) {

            return res.status(403).json({
                message: "Role mismatch"
            });

        }

        /* PASSWORD CHECK */

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {

            return res.status(400).json({
                message: "Invalid password"
            });

        }

        /* TOKENS */

        const { accessToken, refreshToken } =
            generateTokens(user);

        res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
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

/* GOOGLE LOGIN */

export const googleLogin = async (req, res) => {

    try {

        const { credential, role } = req.body;

        if (!credential) {

            return res.status(400).json({
                message: "Google credential missing"
            });

        }

        /* VERIFY GOOGLE TOKEN */

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        const email = payload.email;
        const name = payload.name;

        /* CHECK EXISTING USER */

        let { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        /* CREATE USER IF NOT EXISTS */

        if (!user) {

            const { data: newUser, error } = await supabase
                .from("users")
                .insert([
                    {
                        name,
                        email,
                        password: null,
                        role: role || "user",
                        provider: "google"
                    }
                ])
                .select()
                .single();

            if (error) {

                return res.status(400).json(error);

            }

            user = newUser;

        }

        /* TOKEN */

        const { accessToken, refreshToken } =
            generateTokens(user);

        res.json({
            message: "Google Login Successful",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Google Login Failed"
        });

    }

};

