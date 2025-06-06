import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import alertServices from "../services/alertService.js";
import Inventory from "../model/inventory.js";
import inventoryService from "../services/inventoryService.js";
import productService from "../services/productService.js";

class alertController {
  createAlert = async (req, res) => {
    try {
      const response = await alertServices.createAlert(req.body);
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findAll = async (req, res) => {
    try {
      console.log("req.query", req.userId);
      const response = await alertServices.findAll({
        user: req.userId,
        ...req.query,
      });
      if (response.alerts.length === 0) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }

      return Response.success(res, messageUtil.OK, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findAlert = async (req, res) => {
    try {
      const response = await alertServices.findAlert(req.params.alertId);
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  updateAlert = async (req, res) => {
    try {
      const response = await alertServices.updateAlert(
        req.params.alertId,
        req.body
      );
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  deleteAlert = async (req, res) => {
    try {
      const response = await alertServices.deleteAlert({
        sku: req.params.sku,
        user: req.userId,
        type: req.params.type,
      });
      if (!response) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  // delete all alerts with ids and type and userId

  deleteAllAlerts = async (req, res) => {
    try {
      const response = await alertServices.deleteAllAlerts({
        _id: { $in: req.body.ids },
        user: req.userId,
        type: req.body.type,
      });
      if (!response) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };
}

export default new alertController();
