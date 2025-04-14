import express from "express";
const routes = express.Router();
import forcastController from "../controller/forcastController.js";

routes.post("/create", forcastController.createForecast);
routes.get("/all", forcastController.findAll);

export default routes;
