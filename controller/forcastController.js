import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import forecastServices from "../services/forcastServices.js";

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
      const response = await forecastServices.findAll(req.query);
      if (response.length === 0) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      return Response.success(res, messageUtil.SUCCESS, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findForecast = async (req, res) => {
    try {
      const response = await forecastServices.findForecast(
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
      const response = await forecastServices.deleteForecast(
        req.params.forecastId
      );
      Response.success(res, messageUtil.SUCCESS, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };
}

export default new forecastController();
