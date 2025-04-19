import mongoose from "mongoose";
import alertSchema from "../model/alert.js";
class alertCRUD {
  createAlert = async (query) => {
    return await alertSchema.create(query);
  };
  // findAll = async (query) => {
  //   console.log("query", query);
  //   const alerts = await alertSchema.aggregate([
  //     // Match alerts for a specific user
  //     {
  //       $match: {
  //         user: new mongoose.Types.ObjectId(query.user),
  //       },
  //     },

  //     // Lookup product information for these alerts (matching both user and SKU)
  //     {
  //       $lookup: {
  //         from: "products",
  //         let: { alertSku: "$sku", alertUser: "$user" },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [
  //                   { $eq: ["$user", "$$alertUser"] },
  //                   { $eq: ["$sku", "$$alertSku"] },
  //                 ],
  //               },
  //             },
  //           },
  //           // Include only the product fields you want
  //           {
  //             $project: {
  //               name: 1,
  //               description: 1,
  //               category: 1,
  //               subcategory: 1,
  //               material: 1,
  //             },
  //           },
  //         ],
  //         as: "product",
  //       },
  //     },

  //     // Unwind the product array (since there should be only one product per SKU)
  //     { $unwind: "$product" },

  //     // Project to shape the final output
  //     {
  //       $project: {
  //         _id: 1,
  //         sku: 1,
  //         type: 1,
  //         createdAt: 1,
  //         updatedAt: 1,
  //         // Include only the product fields you need
  //         product: {
  //           name: "$product.name",
  //           description: "$product.description",
  //           category: "$product.category",
  //           subcategory: "$product.subcategory",
  //           material: "$product.material",
  //         },
  //       },
  //     },

  //     // Optional: Sort by alert creation date (newest first)
  //     { $sort: { createdAt: -1 } },
  //   ]);
  //   console.log("alerts:", alerts);
  // };

  findAll = async (query) => {
    return await alertSchema.find(query);
  };
  findAlert = async (query) => {
    return await alertSchema.findOne(query);
  };
  updateAlert = async (query, data) => {
    return await alertSchema.findOneAndUpdate(query, data, { new: true });
  };
  deleteAlert = async (query) => {
    return await alertSchema.findOneAndDelete(query);
  };
  paginateResults = (data, page, limit) => {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    return {
      pagination: {
        totalItems: data.length,
        totalPages: Math.ceil(data.length / limit),
        currentPage: page,
      },
      data: data.slice(startIndex, endIndex),
    };
  };
}

export default new alertCRUD();
