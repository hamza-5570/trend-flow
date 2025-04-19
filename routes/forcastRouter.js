import express from "express";
const routes = express.Router();
import middleware from "../middleware/auth.js";
import forcastController from "../controller/forcastController.js";

routes.post("/create", forcastController.createForecast);
routes.get("/all", middleware.authenticateToken, forcastController.findAll);

export default routes;
