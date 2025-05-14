import inventorySchema from "../model/inventory.js";

class inventoryCRUD {
  createInventory = async (query) => {
    return await inventorySchema.create(query);
  };
  findAll = async (query) => {
    console.log("query", query);
    let currentPage = 1;
    let page = query.page;
    if (page) {
      currentPage = page;
    }
    let skip = (currentPage - 1) * 10;
    delete query.page;
    let inventory = await inventorySchema.find(query).skip(skip).limit(10);
    let total = await inventorySchema.countDocuments(query);
    let totalPages = Math.ceil(total / 10);
    return { inventory, totalPages };
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

  updateMany = async (data) => {
    return await inventorySchema.updateMany({}, data);
  };
}
export default new inventoryCRUD();
