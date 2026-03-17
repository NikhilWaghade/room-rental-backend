import multer from "multer";

/* Storage */

const storage = multer.memoryStorage();

/* File validation */

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(new Error("Only image files (jpeg, png, webp) are allowed"), false);

    }

};

/* Multer Config */

export const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter

});