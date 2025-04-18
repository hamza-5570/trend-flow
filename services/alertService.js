import mongoose from "mongoose";
import alertSchema from "../model/alert.js";

class alertCRUD {
  createAlert = async (query) => {
    return await alertSchema.create(query);
  };
  findAll = async (query) => {
    const { page = 1, limit = 10, ...filters } = query;

    // Convert string ID to ObjectId
    if (filters.user) {
      filters.user = new mongoose.Types.ObjectId(filters.user);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const totalItems = await alertSchema.countDocuments(filters);

    const alerts = await alertSchema.aggregate([
      {
        $match: filters,
      },
      {
        $lookup: {
          from: "products",
          localField: "sku",
          foreignField: "sku",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: false, // change to true for non-strict matching
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$product", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          product: 0,
          __v: 0,
        },
      },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ]);
    return { data: alerts, totalPages: Math.ceil(totalItems / limitNum) };
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
