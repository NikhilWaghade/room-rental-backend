import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

    console.log("📁 Field:", file.fieldname, "| Mimetype:", file.mimetype);

    // ✅ Images
    if (file.fieldname === "images") {
        const allowedImages = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/heic",           // ✅ iPhone HEIC
            "image/heif",           // ✅ iPhone HEIF
            "image/gif",
            "application/octet-stream", // ✅ generic fallback
        ];

        if (allowedImages.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.log("❌ Image rejected:", file.mimetype);
            cb(new Error("Only jpeg, png, webp, heic images allowed"), false);
        }
        return;
    }

    // ✅ Video
    if (file.fieldname === "video") {
        const allowedVideos = [
            "video/mp4",
            "video/quicktime",          // ✅ iPhone MOV
            "video/x-msvideo",          // .avi
            "video/webm",
            "video/mpeg",
            "video/3gpp",               // Android
            "video/3gpp2",
            "video/x-matroska",         // .mkv
            "application/octet-stream", // ✅ generic fallback
        ];

        const isVideo =
            file.mimetype.startsWith("video/") ||
            allowedVideos.includes(file.mimetype);

        if (isVideo) {
            cb(null, true);
        } else {
            console.log("❌ Video rejected:", file.mimetype);
            cb(new Error("Only video files allowed"), false);
        }
        return;
    }

    cb(new Error("Unknown field"), false);
};

export const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter
});

export const uploadFields = upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
]);