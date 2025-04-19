import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import notificationService from "../services/notificationService.js";
class notificationController {
  createNotification = async (req, res) => {
    try {
      const { message } = req.body;
      const notification = await notificationService.createNotification({
        message,
        userId: req.userId,
      });
      return Response.success(res, messageUtil.CREATED, notification);
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
  getUserNotifications = async (req, res) => {
    try {
      const notifications = await notificationService.findAll({
        userId: req.user._id,
      });
      // .sort({ createdAt: -1 });
      return Response.success(res, messageUtil.OK, notifications);
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
  deleteNotification = async (req, res) => {
    try {
      const deleted = await notificationService.delateNotification({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!deleted) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      return Response.success(res, { message: "Notification deleted" });
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
}
export default new notificationController();
