import messageUtil from '../utilities/message.js';
import Response from '../utilities/response.js';
import categoryService from '../services/categoryService.js';
import mongoose from 'mongoose';

class categoryController {
  CategoryCreate = async (req, res) => {
    try {
      // creating category in database
      const category = await categoryService.createCategory({
        ...req.body,
      });
      // sendng response
      return Response.success(res, messageUtil.OK, category);
    } catch (error) {
      return Response.success(res, error);
    }
  };
  getAllCategory = async (req, res) => {
    try {
      // get all Category from the database
      const docs = await categoryService.findAll(req.body);
      // Return the Response
      return Response.success(res, messageUtil.OK, docs);
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
  categoryById = async (req, res) => {
    try {
      const id = req.params.categoryId;
      // get the category by id
      let category = await categoryService.findcategoryId(id, req.categoryId);
      // check category is present or not
      if (!category) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      } else {
        // retuen the response
        return Response.success(res, messageUtil.OK, category);
      }
    } catch (error) {
      // return the error
      return Response.serverError(res, error);
    }
  };
  categoryUpdate = async (req, res) => {
    try {
      const { categoryId } = req.params;

      // Validate ObjectId
      if (!mongoose.isValidObjectId(categoryId)) {
        return Response.badRequest(res, 'Invalid category ID');
      }

      // Find the category
      let category = await categoryService.findCategory({ _id: categoryId });
      if (!category) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }

      // Update the category
      const updatedCategory = await categoryService.updateCategory(
        { _id: categoryId },
        req.body // Assuming req.body contains the updated data
      );
      // return the response
      return Response.success(res, messageUtil.OK, updatedCategory);
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
  categoryDelete = async (req, res) => {
    try {
      const { categoryId } = req.params;
      // find the category by Id
      let category = await categoryService.findCategory({ _id: categoryId });
      if (!category) {
        // return the response
        return await Response.notfound(res, messageUtil.NOT_FOUND);
      }
      // dellete the category by ID
      category = await categoryService.delateCategory({ _id: categoryId });
      return Response.success(res, messageUtil.OK, category);
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
}

export default new categoryController();
