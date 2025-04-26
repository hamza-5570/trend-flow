import express from "express";
const app = express();
import cors from "cors";
import routes from "./routes/routes.js";
import connectDB from "./config/database.js";
import multer from "multer";
import morgan from "morgan";

connectDB();

// app.use(express.json());
app.use(express.json({ urlencoded: true }));

app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
  })
);

// app.use(cors({ origin: 'https://tren-flow.vercel.app' }));
app.use(morgan("tiny"));

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Welcome to Ecommerce APIs");
});

const PORT = process.env.PORT || 3001;
app.use("/", routes);
app.listen(PORT, () => {
  console.log(`Server in running and listening on ${PORT}`);
});
