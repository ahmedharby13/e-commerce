import multer, { StorageEngine } from "multer";

const storage: StorageEngine = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage });

export default upload;
