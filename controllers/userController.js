import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";

/* GET PROFILE */

export const getProfile = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        phone,
        role,
        image,
        provider
      `)
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.json(data);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* UPDATE PROFILE */

export const updateProfile = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      image
    } = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        email,
        phone,
        image,
      })
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.json({
      message: "Profile Updated Successfully",
      user: data,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* CHANGE PASSWORD */

export const changePassword = async (req, res) => {
  try {

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.provider === "google") {
      return res.status(400).json({
        message:
          "Google users cannot change password here",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
      })
      .eq("id", req.user.id);

    if (updateError) {
      return res.status(400).json({
        message: updateError.message,
      });
    }

    res.json({
      message: "Password Changed Successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};