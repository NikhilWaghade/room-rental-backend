import { supabase } from "../config/supabase.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Image - Cloudinary pe (HEIC bhi support)
export const uploadImageToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "room_images",
        resource_type: "image",
        format: "jpg", // HEIC → JPG convert ho jayega
      },
      (error, result) => {
        if (error) {
          console.log("❌ Image upload error:", error.message);
          reject(error);
        } else {
          console.log("✅ Image uploaded:", result.secure_url);
          resolve(result.secure_url);
        }
      },
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// ✅ Video - Cloudinary pe
export const uploadVideoToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "room_videos",
        resource_type: "video",
        chunk_size: 6000000,
        format: "mp4", // ✅ MOV → MP4 automatically convert
        transformation: [
          { quality: "auto" }, // ✅ size optimize
        ],
      },
      (error, result) => {
        if (error) {
          console.log("❌ Video upload error:", error.message);
          reject(error);
        } else {
          console.log("✅ Video uploaded:", result.secure_url);
          resolve(result.secure_url);
        }
      },
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};
