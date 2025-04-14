import express from 'express';
const routes = express.Router();
import categoryController from '../controller/categoryController.js';

routes.post('/', categoryController.CategoryCreate);
routes.get('/', categoryController.getAllCategory);
routes.get('/:categoryId', categoryController.categoryById);
routes.patch('/:categoryId', categoryController.categoryUpdate);
routes.delete('/:categoryId', categoryController.categoryDelete);

export default routes;
