// middleware/csvUpload.js
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to sanitize BOM from headers
const sanitizeHeaders = (row) => {
  const sanitized = {};
  for (const key in row) {
    const cleanKey = key.replace(/^\uFEFF/, "").trim(); // Remove BOM and trim
    sanitized[cleanKey] = row[key];
  }
  return sanitized;
};

// Middleware to parse CSV
const parseCSV = (req, res, next) => {
  if (!req.file) {
    console.log("ider aya");
    next();
  } else {
    const results = [];
    const readable = new Readable();
    readable._read = () => {};
    readable.push(req.file.buffer);
    readable.push(null);

    readable
      .pipe(csv())
      .on("data", (data) => results.push(sanitizeHeaders(data)))
      .on("end", () => {
        req.csvData = results;
        next();
      })
      .on("error", (err) => {
        console.error("CSV Parse Error:", err);
        res.status(500).json({ error: "Error parsing CSV file" });
      });
  }
};

export const csvUploadMiddleware = [upload.single("file"), parseCSV];
