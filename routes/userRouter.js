import express from "express";
const routes = express.Router();
import userController from "../controller/userController.js";
import validatior from "../validation/userValid.js";
import checkToken from "../middleware/auth.js";

routes.post("/signup", validatior.Signup, userController.SignUp);
routes.post("/login", validatior.login, userController.Login);
routes.get("/users", checkToken.checkToken, userController.getAllUser);
routes.get("/", checkToken.checkToken, userController.getOnlyId);
routes.patch("/:userId", userController.userUpdate);
routes.get("/getById/:userId", userController.getById);
routes.delete("/:userId", userController.userDelete);
routes.post("/forget-Password", userController.forgetPassword);
routes.post("/reset-Password/:token", userController.resetPassword);
routes.post("/change_password", userController.changePassword);

export default routes;
