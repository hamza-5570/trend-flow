import messageUtil from "../utilities/message.js";
import Response from "../utilities/response.js";
import Product from "../model/product.js";
import mongoose from "mongoose";
import csv from "csv-parser";
import fs from "fs";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

import productService from "../services/productService.js";

class productController {
  newProduct = async (req, res) => {
    try {
      // check the CSV file uploades or not
      if (!req.file) {
        return Response.badRequest(res, "No CSV file uploaded");
        // return res.status(400).json({ message: 'No CSV file uploaded' });
      }
      //
      const products = [];
      const filePath = req.file.path; // Retrieves the file path of the uploaded file from the request
      // create the data to read the file
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          products.push({
            SKU: row.SKU,
            user: req.body.user,
            name: row.name,
            price: row.price,
            description: row.description,
          });
        })
        .on("end", async () => {
          try {
            // store the data into the database
            await Product.insertMany(products, { ordered: false });
            return Response.success(res, messageUtil.OK, products); // return the response
            // res.json({
            //   message: 'CSV Products created successfully!',
            //   products,
            // });
          } catch (error) {
            return Response.serverError(res, error);
            // res
            //   .status(500)
            //   .json({ message: 'Error inserting products', error });
          }
        });
    } catch (error) {
      // return the response of server error
      return Response.serverError(res, error);
      // console.error(error);
      // res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  createProduct = async (req, res) => {
    try {
      // Create a new product
      const product = await productService.createProduct({
        ...req.body,
        user: req.userId,
      });
      // Return the response
      return Response.success(res, messageUtil.OK, product);
    } catch (error) {
      // Return the response for error
      return Response.serverError(res, error);
    }
  };
  getAllProduct = async (req, res) => {
    try {
      // Find all the product in data base
      let product = await productService.findAll(req.body);
      // heck products in datbase or not
      if (product.length === 0) {
        // return the response
        return Response.notfound(res, messageUtil.NOT_FOUND);
      } else {
        // retuen the response for success
        return Response.success(res, messageUtil.OK, product);
      }
    } catch (error) {
      // retuen the response for error
      return Response.serverError(res, error);
    }
  };

  getUserProducts = async (req, res) => {
    try {
      // Extracts the inventoryId parameter from the request URL
      const { userId } = req.params;
      // find the all products by userId to the database
      const products = await productService.findAll({ user: userId });
      // check the data
      if (products.length === 0) {
        // return thr response
        return Response.notfound(res, messageUtil.NOT_FOUND);
      } else {
        return Response.success(res, messageUtil.OK, products);
      }
    } catch (error) {
      // return thr response for error
      return Response.serverError(res, error);
    }
  };

  getByID = async (req, res) => {
    try {
      // Extracts the inventoryId parameter from the request URL
      const id = req.params.productId;
      let products = await productService.findProductId(id, req.productId);
      // check the product present or not
      if (!products) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
        // return the response
      } else {
        return Response.success(res, messageUtil.OK, products);
      }
    } catch (error) {
      // return the response of error
      return Response.serverError(res, error);
    }
  };
  productUpdate = async (req, res) => {
    try {
      // Extracts the inventoryId parameter from the request URL
      const id = req.params.productId;
      // Validate ObjectId
      let objectId;
      try {
        objectId = new mongoose.Types.ObjectId(id);
      } catch (error) {
        return Response.badRequest(res, "Invalid Product ID");
      }

      //  Find the product
      let product = await productService.findProductId(objectId);
      if (!product) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }

      // Update the product
      product = await productService.updateProduct(
        { _id: objectId }, //  Use the correct variable
        req.body
      );

      if (!product) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }

      return Response.success(res, messageUtil.OK, product);
    } catch (error) {
      console.error("Error updating product:", error);
      return Response.serverError(res, error);
    }
  };
  productDelete = async (req, res) => {
    try {
      // Extracts the inventoryId parameter from the request URL
      const { productId } = req.params;
      // find the product by id
      let product = await productService.findProductId({ _id: productId });
      // check the product present or not
      if (!product) {
        return Response.notfound(res, messageUtil.NOT_FOUND); // return response
      }
      // delete the product
      product = await productService.deleteProduct({ _id: productId });
      return Response.success(res, messageUtil.OK); // return response
    } catch (error) {
      // return response of error
      return Response.serverError(res, error);
    }
  };

  SalesSkus = async (req, res) => {
    try {
      console.log("GetTopSkus called"); // Debugging line
      const topSkus = await productService.getTopSkus({});
      if (topSkus.length === 0) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      return Response.success(res, messageUtil.OK, topSkus);
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
}
export default new productController();
