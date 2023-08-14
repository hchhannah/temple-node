const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const extMap = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/../public/img");
  },
  filename: (req, file, cb) => {
    const ext = extMap[file.mimetype]; // 利用 mimetype 決定副檔名
    cb(null, uuidv4() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  cb(null, !!extMap[file.mimetype]);
};

module.exports = multer({ fileFilter, storage });
