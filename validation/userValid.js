import Joi from 'joi';
import messageUtil from '../utilities/message.js';
import Response from '../utilities/response.js';
class userValidation {
  Signup = (req, res, next) => {
    try {
      const schema = Joi.object({
        name: Joi.string().required().messages({
          'string.base': messageUtil.NAME_STRING_BASE,
          'string.empty': messageUtil.NAME_STRING_EMPTY,
          'any.required': messageUtil.NAME_REQUIRED,
        }),
        email: Joi.string().email().required().messages({
          'string.base': messageUtil.EMAIL_STRING_BASE,
          'string.empty': messageUtil.EMAIL_STRING_EMPTY,
          'string.email': messageUtil.EMAIL_NOT_VALID,
          'any.required': messageUtil.EMAIL_REQUIRED,
        }),
        password: Joi.string().required().messages({
          'string.base': messageUtil.PASSWORD_STRING_BASE,
          'string.empty': messageUtil.PASSWORD_STRING_EMPTY,
          'any.required': messageUtil.PASSWORD_REQUIRED,
        }),
      });

      const { error } = schema.validate(req.body, { abortEarly: false }); // Prevent early stopping to catch all errors

      if (error) {
        return Response.badRequest(
          res,
          error.details.map((detail) => detail.message) // Extract proper error messages
        );
      }

      next();
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
  login = (req, res, next) => {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required().messages({
          'string.base': messageUtil.EMAIL_STRING_BASE,
          'string.empty': messageUtil.EMAIL_STRING_EMPTY,
          'string.email': messageUtil.EMAIL_NOT_VALID,
          'any.required': messageUtil.EMAIL_REQUIRED,
        }),
        password: Joi.string().required().messages({
          'string.base': messageUtil.PASSWORD_STRING_BASE,
          'string.empty': messageUtil.PASSWORD_STRING_EMPTY,
          'any.required': messageUtil.PASSWORD_REQUIRED,
        }),
      });
      const { error } = schema.validate(req.body);
      // send response
      if (error) {
        return Response.badRequest(
          res,
          error.details ? error.details[0].message : error.message
        );
      }
      next();
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
}
export default new userValidation();
