import Notification from "../model/notification.js";
class notificationCRUD {
  createNotification = async (query) => {
    return await Notification.create(query);
  };
  findAll = async (query) => {
    return await Notification.find(query);
  };
  updateNotification = async (query, data) => {
    return await Notification.findOneAndUpdate(query, data, {
      new: true,
    });
  };
  delateNotification = async (query) => {
    return await Notification.findOneAndDelete(query);
  };
}
export default new notificationCRUD();
