import express from 'express';
const routes = express.Router();
import multer from 'multer';
import inventoryController from '../controller/inventoryController.js';
// import inventoryValid from "../validation/inventoryValid.js";
import middleware from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

routes.post(
  '/create',
  middleware.authenticateToken,
  //   inventoryValid.createInventory,
  inventoryController.createInventory
);
routes.get('/all', inventoryController.findAll);
routes.get('/find', inventoryController.findInventoryId);
routes.patch('/:inventoryId', inventoryController.updateInventory);
routes.delete('/:inventoryId', inventoryController.deleteInventory);
routes.post(
  '/upload',
  upload.single('file'),
  middleware.authenticateUser,
  inventoryController.updateInventoryByCSV
);
routes.get('/lowstock', inventoryController.LowStock);
routes.post('/update', inventoryController.UpdateStock);
routes.get('/find-inventory/:productId', inventoryController.findInventory);
routes.get('/high-stock', inventoryController.HighStock);
export default routes;
