import Product from "../model/product.js";
class productCRUD {
  createProduct = async (query) => {
    return await Product.create(query);
  };
  findAll = async (query) => {
    return await Product.find(query).populate("userId category", "name email");
  };
  findProduct = async (query) => {
    return await Product.findOne(query);
  };
  findProductId = async (productId) => {
    return await Product.findById(productId).populate(
      "user category",
      "name email"
    );
  };
  updateProduct = async (query, data) => {
    return await Product.findByIdAndUpdate(query, data, { new: true });
  };
  deleteProduct = async (query) => {
    return await Product.findOneAndDelete(query);
  };
  getTopSkus = async () => {
    return await Product.aggregate([
      {
        $lookup: {
          from: "sales", // Make sure this matches your actual collection name in MongoDB
          localField: "_id",
          foreignField: "productId",
          as: "salesData",
        },
      },
      {
        $unwind: {
          path: "$salesData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          sku: { $first: "$sku" },
          totalSales: { $sum: "$salesData.sales" },
        },
      },
      {
        $sort: { totalSales: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          sku: 1,
          name: 1,
          totalSales: 1,
        },
      },
    ]);
  };
}
export default new productCRUD();
