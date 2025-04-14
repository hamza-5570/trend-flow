import Category from '../model/category.js';
class categoryCrud {
  createCategory = async (query) => {
    return await Category.create(query);
  };
  findAll = async (query) => {
    return await Category.find(query);
  };
  findCategory = async (query) => {
    return await Category.findOne(query);
  };
  findcategoryId = async (categoryId) => {
    return await Category.findById(categoryId);
  };
  updateCategory = async (query, data) => {
    return await Category.findByIdAndUpdate(query, data);
  };
  delateCategory = async (query) => {
    return await Category.findByIdAndDelete(query);
  };
}
export default new categoryCrud();
