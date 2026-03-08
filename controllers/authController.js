import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
        .from("users")
        .insert([{ name, email, password: hashedPassword }])
        .select();

    if (error) return res.status(400).json({ error });

    res.json(data);
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

    if (!data) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, data.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: data.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.json({ token, user: data });
};