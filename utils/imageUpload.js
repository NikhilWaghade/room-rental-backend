import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

/* =========================
   CLOUDINARY CONFIG
========================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =========================
   IMAGE UPLOAD
========================= */

export const uploadImageToCloudinary = (file) => {

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(

      {
        folder: "room_images",

        resource_type: "image",

        format: "jpg", // HEIC → JPG auto convert
      },

      (error, result) => {

        if (error) {

          console.log(
            "❌ Image upload error:",
            error.message
          );

          reject(error);

        } else {

          console.log(
            "✅ Image uploaded:",
            result.secure_url
          );

          resolve(result.secure_url);

        }

      }
    );

    streamifier
      .createReadStream(file.buffer)
      .pipe(stream);

  });

};

/* =========================
   VIDEO UPLOAD
========================= */

export const uploadVideoToCloudinary = (file) => {

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(

      {
        folder: "room_videos",

        resource_type: "video",

        chunk_size: 6000000,

        format: "mp4", // MOV → MP4 auto convert

        transformation: [
          {
            quality: "auto",
          },
        ],
      },

      (error, result) => {

        if (error) {

          console.log(
            "❌ Video upload error:",
            error.message
          );

          reject(error);

        } else {

          console.log(
            "✅ Video uploaded:",
            result.secure_url
          );

          resolve(result.secure_url);

        }

      }
    );

    streamifier
      .createReadStream(file.buffer)
      .pipe(stream);

  });

};