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
      // let inventory = await inventoryService.findAll(req.query);

      // const response = await axios.post(
      //   "http://0.0.0.0:8000/make-forecast",
      //   inventory.map((item) => {
      //     return {
      //       sku: item.sku,
      //       product_title: item.description,
      //       category: item.category,
      //       subcategory: item.subcategory,
      //       price: item.price,
      //       material: item.material,
      //       gender_age: item.gender_age,
      //       current_inventory: item.stock,
      //       start_day: Date.now(),
      //       end_day: Date.now() + 1000 * 60 * 60 * 24 * 90,
      //     };
      //   }),
      //   {
      //     headers: {
      //       authorization: "hashbin2",
      //     },
      //   }
      // );
      // const forcast = await forecastServices.findAll(req.query);
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
