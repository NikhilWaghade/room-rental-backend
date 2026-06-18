import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* JWT TOKENS */
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

/* REFRESH TOKEN */
export const refreshTokenController = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token missing",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const accessToken = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({
      message: "Invalid refresh token",
    });
  }
};

/* REGISTER USER */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    /* VALIDATE */

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
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
        message: "User already exists",
      });
    }

    /* HASH PASSWORD */

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
          provider: "local",

          email_verified: false,

          verification_token: verificationToken,

          verification_token_expire: verificationExpire,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json(error);
    }

    const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail(
      email,
      "Verify Your Email",
      `
    <h2>Email Verification</h2>

    <p>
      Thank you for registering.
    </p>

    <p>
      Click the button below to verify your email:
    </p>

    <a href="${verifyLink}">
      Verify Email
    </a>

    <p>
      This link will expire in 24 hours.
    </p>
  `,
    );

    res.status(201).json({
      message: "User registered successfully",
      user: data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

/* LOGIN USER */
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    /* VALIDATE */

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required",
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
        message: "User not found",
      });
    }

    // email varify message checkar
    // if (user.provider === "local" && !user.email_verified) {
    //   return res.status(403).json({
    //     message: "Please verify your email before login",
    //   });
    // }

    /* GOOGLE ACCOUNT CHECK */

    if (user.provider === "google") {
      return res.status(400).json({
        message: "Please login using Google",
      });
    }

    /* ROLE CHECK */

    if (user.role !== role) {
      return res.status(403).json({
        message: "Role mismatch",
      });
    }

    /* PASSWORD CHECK */

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    /* TOKENS */

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile_image: user.profile_image,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

/* GOOGLE LOGIN */
export const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;

    /* CHECK TOKEN */

    if (!credential) {
      return res.status(400).json({
        message: "Google credential missing",
      });
    }

    /* CHECK ROLE */

    if (!role || !["user", "owner"].includes(role)) {
      return res.status(400).json({
        message: "Please select a valid role",
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
    const picture = payload.picture;

    /* CHECK EXISTING USER */

    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    /* IF USER EXISTS CHECK ROLE */

    if (user) {
      if (user.role !== role) {
        return res.status(400).json({
          message: `This account is already registered as ${user.role}`,
        });
      }
    }

    /* CREATE USER */

    if (!user) {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            name,
            email,
            profile_image: picture,
            password: "google-auth-user",
            role: role, // selected role from frontend
            provider: "google",
          },
        ])
        .select()
        .single();

      if (error) {
        console.log(error);

        return res.status(400).json({
          message: error.message,
        });
      }

      user = newUser;
    }

    /* GENERATE TOKENS */

    const { accessToken, refreshToken } = generateTokens(user);

    /* RESPONSE */

    return res.status(200).json({
      message: "Google Login Successful",

      accessToken,

      refreshToken,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_image: user.profile_image,
      },
    });
  } catch (error) {
    console.log("GOOGLE LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Google Login Failed",
      error: error.message,
    });
  }
};

// forgate password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expireTime = new Date(Date.now() + 15 * 60 * 1000);

    const { error } = await supabase
      .from("users")
      .update({
        reset_token: hashedToken,
        reset_token_expire: expireTime,
      })
      .eq("id", user.id);

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Reset Password",
      `
      <h2>Password Reset</h2>

      <p>Click the button below to reset your password.</p>

      <a href="${resetLink}">
        Reset Password
      </a>

      <p>This link will expire in 15 minutes.</p>
      `,
    );

    res.json({
      message: "Password reset link sent successfully",
    });
  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:");
    console.log(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("reset_token", hashedToken)
      .single();

    if (!user) {
      return res.status(400).json({
        message: "Invalid reset token",
      });
    }

    if (
      !user.reset_token_expire ||
      new Date(user.reset_token_expire) < new Date()
    ) {
      return res.status(400).json({
        message: "Reset token expired",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expire: null,
      })
      .eq("id", user.id);

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.json({
      message: "Password reset successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

//email varification
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("verification_token", token)
      .single();

    if (!user) {
      return res.status(400).json({
        message: "Invalid verification token",
      });
    }

    if (
      !user.verification_token_expire ||
      new Date(user.verification_token_expire) < new Date()
    ) {
      return res.status(400).json({
        message: "Verification link expired",
      });
    }

    const { error } = await supabase
      .from("users")
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expire: null,
      })
      .eq("id", user.id);

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
