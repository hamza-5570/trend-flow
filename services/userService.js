import User from "../model/user.js";
class userCrud {
  createUser = async (query) => {
    return await User.create(query);
  };
  findUser = async (userId) => {
    return await User.findOne(userId);
  };
  findUserId = async (userId) => {
    return await User.findOne({ _id: userId }).select("-password");
  };
  findAll = async (query) => {
    return await User.find(query).select("-password");
  };
  updateUser = async (query, data) => {
    return await User.findByIdAndUpdate(query, data, { new: true });
  };
  deleteUser = async (query) => {
    return await User.findByIdAndDelete(query);
  };
}
export default new userCrud();
