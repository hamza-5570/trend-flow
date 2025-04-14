import alertSchema from "../model/alert.js";

class alertCRUD {
  createAlert = async (query) => {
    return await alertSchema.create(query);
  };
  findAll = async (query) => {
    let currentPage = 1;
    let page = query.page;
    if (page) {
      currentPage = page;
    }
    let skip = (currentPage - 1) * 10;
    delete query.page;
    let alert = await alertSchema
      .find(query)
      .populate({
        path: "user",
        select: "name email",
      })
      .populate({
        path: "inventory",
        select: "productId stock stockOutDate stockInDate weeklyDemand",
        populate: {
          path: "productId",
          select: "sku name",
        },
      })
      .skip(skip)
      .limit(10)
      .select("-__v");
    let total = await alertSchema.countDocuments(query);
    let totalPages = Math.ceil(total / 10);
    return { alert, totalPages };
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
