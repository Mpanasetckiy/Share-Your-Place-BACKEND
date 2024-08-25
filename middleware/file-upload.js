const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const stream = require("stream");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

// Initialize Google Cloud Storage with your project and credentials
const storage = new Storage({
  projectId: "be-nc-news-d8278", // Replace with your actual project ID
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Ensure this environment variable is set correctly
});

const bucket = storage.bucket("share_your_place"); // Ensure this bucket name is correct

const multerMemoryStorage = multer.memoryStorage();

exports.fileUpload = multer({
  storage: multerMemoryStorage,
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    const error = isValid ? null : new Error("Invalid mime type.");
    cb(error, isValid);
  },
  limits: {
    fileSize: 5000000,
  },
});

exports.uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(`${uuidv4()}.${MIME_TYPE_MAP[file.mimetype]}`);
    const blobStream = blob.createWriteStream();

    blobStream.on("error", (err) => {
      reject(err);
    });

    blobStream.on("finish", () => {
      resolve(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
    });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);
    bufferStream.pipe(blobStream);
  });
};
