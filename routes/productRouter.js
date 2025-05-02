import express from "express";
const routes = express.Router();
import multer from "multer";
import productController from "../controller/productcontroller.js";
import checkToken from "../middleware/auth.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

routes.post("/upload", upload.single("csvFile"), productController.newProduct);
routes.post("/create", checkToken.checkToken, productController.createProduct);
routes.get("/top", productController.SalesSkus);
routes.get("/", productController.getAllProduct);
routes.get("/:productId", productController.getByID);
routes.patch("/:productId", productController.productUpdate);
routes.delete("/:productId", productController.productDelete);
routes.get("/user-products/:userId", productController.getUserProducts);
routes.get(
  "/userproducts/:userId",
  checkToken.checkToken,
  productController.getUserProducts
);

export default routes;
