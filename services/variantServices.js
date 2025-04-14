import variant from "../model/variant.js";

class variantCrud {
  createVariant = async (query) => {
    return await variant.create(query);
  };
  findVariant = async (variantId) => {
    return await variant.findOne({ _id: variantId });
  };
  findAll = async (query) => {
    return await variant.find(query).select("-__v");
  };
  updateVariant = async (query, data) => {
    return await variant.findByIdAndUpdate(query, data, { new: true });
  };
  deleteVariant = async (query) => {
    return await variant.findByIdAndDelete(query);
  };
}
export default new variantCrud();
