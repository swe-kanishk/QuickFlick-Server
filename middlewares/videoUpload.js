import multer from "multer";

export const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // Max size: 50 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|mkv|avi|mov/;
        const extName = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);

        if (extName && mimeType) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'));
        }
    },
});
