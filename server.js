import express from "express";
const app = express();
import cors from "cors";
import routes from "./routes/routes.js";
import connectDB from "./config/database.js";

connectDB();
app.use(express.json({ urlencoded: true }));
app.use(cors("*"));

app.get("/", (req, res) => {
  res.send("Welcome to Ecommerce APIs");
});

const PORT = process.env.PORT || 3001;
app.use("/", routes);
app.listen(PORT, () => {
  console.log(`Server in running and listening on ${PORT}`);
});
