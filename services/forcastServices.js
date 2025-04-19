import forcastSchema from "../model/forcast.js";

class forcastCRUD {
  createForcast = async (query) => {
    return await forcastSchema.create(query);
  };
  findAll = async (query) => {
    let currentPage = 1;
    let page = query.page;
    if (page) {
      currentPage = page;
    }
    let skip = (currentPage - 1) * 10;
    // give time range
    if (query.startDate && query.endDate) {
      query.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
      delete query.startDate;
      delete query.endDate;
    }
    delete query.page;
    let forcast = await forcastSchema.find(query).skip(skip).limit(10);
    let total = await forcastSchema.countDocuments(query);
    let totalPages = Math.ceil(total / 10);
    return { forcast, totalPages };
  };
  findForcast = async (query) => {
    return await forcastSchema.findOne(query);
  };
  updateForcast = async (query, data) => {
    return await forcastSchema.findOneAndUpdate(query, data, { new: true });
  };
  deleteForcast = async (query) => {
    return await forcastSchema.findOneAndDelete(query);
  };
}
export default new forcastCRUD();
