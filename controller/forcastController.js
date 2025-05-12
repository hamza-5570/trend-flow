import axios from "axios";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import forecastServices from "../services/forcastServices.js";
import inventoryService from "../services/inventoryService.js";
class forecastController {
  createForecast = async (req, res) => {
    try {
      const response = await forecastServices.createForcast(req.body);
      Response.success(res, messageUtil.SUCCESS, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findAll = async (req, res) => {
    try {
      const forcast = await forecastServices.findAll({
        ...req.query,
        userId: req.userId,
      });
      if (forcast.length === 0) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      return Response.success(res, messageUtil.SUCCESS, forcast);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findForecast = async (req, res) => {
    try {
      const response = await forecastServices.findForcast(
        req.params.forecastId
      );
      Response.success(res, messageUtil.SUCCESS, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  updateForecast = async (req, res) => {
    try {
      const response = await forecastServices.updateForecast(
        req.params.forecastId,
        req.body
      );
      Response.success(res, messageUtil.SUCCESS, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  deleteForecast = async (req, res) => {
    try {
      const response = await forecastServices.deleteForcast({
        sku: req.params.sku,
        userId: req.userId,
      });
      if (!response) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      Response.success(res, messageUtil.SUCCESS, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };
}

export default new forecastController();
