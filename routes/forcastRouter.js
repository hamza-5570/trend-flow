import express from "express";
const routes = express.Router();
import checkToken from "../middleware/auth.js";
import forcastController from "../controller/forcastController.js";

routes.post("/create", forcastController.createForecast);
routes.get("/all", checkToken.checkToken, forcastController.findAll);
routes.delete(
  "/delete/:sku",
  checkToken.checkToken,
  forcastController.deleteForecast
);

export default routes;
