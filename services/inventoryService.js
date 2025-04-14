import inventorySchema from '../model/inventory.js';

class inventoryCRUD {
  createInventory = async (query) => {
    return await inventorySchema.create(query);
  };
  findAll = async (query) => {
    return await inventorySchema
      .find(query)
      .populate('product', ' sku name price');
  };
  findInventory = async (query) => {
    return await inventorySchema.findOne(query).populate({
      path: 'product',
      match: {
        type: 'sku',
      },
    });
  };
  findInventoryId = async (query) => {
    return await inventorySchema
      .findOne(query)
      .populate('product', 'name price');
  };
  updateInventory = async (query, data) => {
    return await inventorySchema.findOneAndUpdate(query, data, { new: true });
  };
  deleteInventory = async (query) => {
    return await inventorySchema.findOneAndDelete(query);
  };
  filterFind = async (query) => {
    return await inventorySchema.findOne(query).populate('product', 'name sku');
  };
}
export default new inventoryCRUD();
