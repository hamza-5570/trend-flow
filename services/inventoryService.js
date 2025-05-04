import inventorySchema from "../model/inventory.js";

class inventoryCRUD {
  createInventory = async (query) => {
    return await inventorySchema.create(query);
  };
  findAll = async (query) => {
    const inventory = await inventorySchema.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "sku",
          foreignField: "sku",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $match: query,
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
          product: 0, // remove the original product field if it still exists
          __v: 0, // optional: remove mongoose versioning fields
        },
      },
    ]);

    return inventory;
  };
  findInventory = async (query) => {
    return await inventorySchema.findOne(query);
  };
  findInventoryId = async (query) => {
    return await inventorySchema.findOne(query);
  };
  updateInventory = async (query, data) => {
    return await inventorySchema.findOneAndUpdate(query, data, { new: true });
  };
  deleteInventory = async (query) => {
    return await inventorySchema.findOneAndDelete(query);
  };
  filterFind = async (query) => {
    return await inventorySchema.findOne(query).populate("product", "name sku");
  };
}
export default new inventoryCRUD();
