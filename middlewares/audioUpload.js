import multer from 'multer';
import path from 'path';

export const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Max size: 10 MB per file
    fileFilter: (req, file, cb) => {
        const allowedAudioExtensions = /mp3|wav|aac|flac|mpeg/; // Added mpeg to allowed extensions
        const extName = path.extname(file.originalname).toLowerCase(); // Get file extension
        const mimeType = file.mimetype.toLowerCase(); // Get MIME type

        console.log('File Extension is this:', extName, 'MIME Type:', mimeType);

        const validAudioMimeTypes = /audio\/(mp3|wav|aac|flac|mpeg)/; // Added mpeg to MIME type check

        const isValidExtension = allowedAudioExtensions.test(extName);
        const isValidMimeType = validAudioMimeTypes.test(mimeType);

        if (isValidExtension && isValidMimeType) {
            cb(null, true); // File is valid
        } else {
            cb(new Error('Only audio files (mp3, wav, aac, flac, mpeg) are allowed!')); // Invalid file
        }
    },
});