import Notification from '../model/notification.js';
class notificationCRUD {
  createNotification = async (query) => {
    return await Notification.create(query);
  };
  findAll = async (query) => {
    return await Notification.find(query);
  };
  delateNotification = async (query) => {
    return await Notification.findOneAndDelete(query);
  };
}
export default new notificationCRUD();
