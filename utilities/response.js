import messageUtil from './message.js';
import StatusCodes from 'http-status-codes';
class Response {
  ExistallReady = async (res, message) => {
    res.status(StatusCodes.CONFLICT, messageUtil.ALL_READY_EXIST).send({
      success: false,
      message,
    });
  };

  success = (res, message, data, token) => {
    const response = {
      success: true,
      message,
    };
    if (data) {
      response.data = data;
      response.token = token;
    }
    res.status(StatusCodes.OK).send(response);
  };
  authorizationError = (res, message) => {
    res.status(StatusCodes.UNAUTHORIZED).send({
      success: false,
      message,
    });
  };
  serverError = (res, error) => {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      success: false,
      error: error.toString(),
      message: messageUtil.serverError,
    });
  };
  notfound = (res, message) => {
    res.status(StatusCodes.NOT_FOUND).send({
      success: false,
      message,
    });
  };

  badRequest = (res, message) => {
    res.status(StatusCodes.BAD_REQUEST).send({
      success: false,
      message,
    });
  };
}
export default new Response();
