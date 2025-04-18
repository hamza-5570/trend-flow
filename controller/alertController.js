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
      console.log("response", response);
      // if (response.alert.length === 0) {
      //   return Response.notfound(res, messageUtil.NOT_FOUND);
      // }

      return Response.success(res, response, messageUtil.SUCCESS);
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
      const response = await alertServices.deleteAlert(req.params.alertId);
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };
}

export default new alertController();
