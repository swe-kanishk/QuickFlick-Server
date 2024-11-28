import multer from 'multer';
import path from 'path';

export const postUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // Limit: 20 MB per file
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /jpeg|jpg|png|gif|mp3|wav|mpeg/; // Allowed extensions
        const extName = path.extname(file.originalname).toLowerCase(); // Get file extension
        const mimeType = file.mimetype.toLowerCase(); // Get MIME type

        console.log('File Extension:', extName, 'MIME Type:', mimeType);

        const validImageExtensions = /jpeg|jpg|png|gif/;
        const validAudioExtensions = /mp3|wav|mpeg/;

        const validImageMimeTypes = /image\/(jpeg|jpg|png|gif)/;
        const validAudioMimeTypes = /audio\/(mp3|wav|mpeg)/;

        const isValidExtension = allowedExtensions.test(extName);
        const isValidMimeType = validImageMimeTypes.test(mimeType) || validAudioMimeTypes.test(mimeType);

        if (isValidExtension && isValidMimeType) {
            cb(null, true); 
        } else {
            cb(new Error('Only images and audio files are allowed!')); 
        }
    },
});
