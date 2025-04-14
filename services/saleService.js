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

  topSellingProducts = async () => {
    const topSellingSKUs = await Sale.aggregate([
      // Optional: Filter by date
      // {
      //   $match: {
      //     saleDate: { $gte: new Date("2024-01-01"), $lte: new Date("2024-12-31") }
      //   }
      // },

      // Step 1: Group by SKU
      {
        $group: {
          _id: "$sku",
          totalUnitsSold: { $sum: "$unitsSold" },
          totalSalesAmount: { $sum: "$salesAmount" },
        },
      },

      // Step 2: Sort & limit
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 10 },

      // Step 3: Join with Inventory (has size, color, price, productId)
      {
        $lookup: {
          from: "inventories",
          localField: "sku",
          foreignField: "sku",
          as: "inventory",
        },
      },
      { $unwind: "$inventory" },

      // Step 4: Join with Product
      {
        $lookup: {
          from: "products",
          localField: "inventory.productId",
          foreignField: "productId",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // Step 5: Final shape
      {
        $project: {
          sku: "$_id",
          totalUnitsSold: 1,
          totalSalesAmount: 1,

          // From Inventory
          size: "$inventory.size",
          color: "$inventory.color",
          price: "$inventory.price",
          currentInventory: "$inventory.currentInventory",

          // From Product
          productTitle: "$product.title",
          category: "$product.category",
          subcategory: "$product.subcategory",
          material: "$product.material",
          genderAge: "$product.genderAge",
        },
      },
    ]);
    return topSellingSKUs;
  };
}
export default new saleCRUD();
