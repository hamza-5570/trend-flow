import mongoose from "mongoose";
import Sale from "../model/sale.js";
class saleCRUD {
  createSale = async (query) => {
    return await Sale.create(query);
  };
  findAll = async (query) => {
    return await Sale.find(query);
  };
  findSale = async (query) => {
    return await Sale.findOne(query);
  };
  updateSale = async (query, data) => {
    return await Sale.findByIdAndUpdate(query, data, { new: true });
  };
  deleteSale = async (query) => {
    return await Sale.findOneAndDelete(query);
  };
  findTopSellSUK = async () => {
    return await Sale.aggregate([
      // 1. Group sales by ProductId and calculate total sales
      {
        $group: {
          _id: "$SKU",
          totalSales: { $sum: "$Sales" },
        },
      },
      // 2. Lookup the Product document to get the SKU
      {
        $lookup: {
          from: "products", // name of the products collection
          localField: "_id", // _id from group stage = ProductId
          foreignField: "_id", // product _id in Product collection
          as: "product",
        },
      },
      {
        $unwind: "$product", // Flatten the product array
      },
      // 3. Project required fields
      {
        $project: {
          _id: 0,
          productId: "$productId",
          sku: "$SKU",
          name: "$product.name",
          totalSales: 1,
        },
      },
      // 4. Sort by totalSales descending
      {
        $sort: { totalSales: -1 },
      },
      // 5. Optional: Limit to top N results
      {
        $limit: 10,
      },
    ]);
  };

  topSellingProducts = async (query) => {
    try {
      console.log("Query in topSellingProducts:", query.userId);
      const topSellingSKUs = await Sale.aggregate([
        // Optional: Date filter
        {
          $match: {
            // saleDate: { $gte: new Date("2024-01-01"), $lte: new Date("2024-12-31") }
            userId: new mongoose.Types.ObjectId(query.userId),
          },
        },

        // Step 1: Group by SKU
        {
          $group: {
            _id: "$sku",
            totalUnitsSold: { $sum: "$unitsSold" },
            totalSalesAmount: { $sum: "$sales" },
          },
        },

        // Step 2: Sort and limit
        { $sort: { totalUnitsSold: -1 } },
        { $limit: 10 },

        // Step 3: Join with Inventory (one match per SKU)
        {
          $lookup: {
            from: "inventories",
            let: { sku: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$sku", "$$sku"] } } },
              { $limit: 1 },
            ],
            as: "inventory",
          },
        },
        { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true } },

        // Step 4: Join with Product (one match per SKU)
        {
          $lookup: {
            from: "products",
            let: { sku: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$sku", "$$sku"] } } },
              { $limit: 1 },
            ],
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },

        // Step 5: Final projection
        {
          $project: {
            sku: "$_id",
            totalUnitsSold: 1,
            totalSalesAmount: 1,

            // Inventory fields
            size: "$inventory.size",
            color: "$inventory.color",
            price: "$inventory.price",
            stock: "$inventory.stock",
            currentInventory: "$inventory.currentInventory",
            stockInDate: "$inventory.stockInDate",
            // Product fields
            productTitle: "$product.title",
            category: "$product.category",
            subcategory: "$product.subcategory",
            material: "$product.material",
            genderAge: "$product.genderAge",
          },
        },
      ]);
      return topSellingSKUs;
    } catch (err) {
      console.error("Error in topSellingProducts:", err);
      return [];
    }
  };
  // delete many sales
  deleteManySales = async (query) => {
    return await Sale.deleteMany(query);
  };
}
export default new saleCRUD();
