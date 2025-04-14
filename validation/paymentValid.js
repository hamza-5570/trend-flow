import Joi from 'joi';
import messageUtil from '../utilities/message.js';
import Response from '../utilities/response.js';

class paymentValidation {
  createPayment = (req, res, next) => {
    try {
      const schema = Joi.object({
        amount: Joi.number().integer().min(1).required().messages({
          'number.base': messageUtil.AMOUNT_NUMBER_BASE,
          'number.empty': messageUtil.AMOUNT_NUMBER_EMPTY,
          'number.positive': messageUtil.AMOUNT_POSITIVE,
          'any.required': messageUtil.AMOUNT_REQUIRED,
        }),
        currency: Joi.string().required().messages({
          'string.base': messageUtil.CURRENCY_STRING_BASE,
          'string.empty': messageUtil.CURRENCY_STRING_EMPTY,
          // 'string.length': messageUtil.CURRENCY_LENGTH,
          'any.required': messageUtil.CURRENCY_REQUIRED,
        }),
        paymentMethodId: Joi.string().required().messages({
          'string.base': messageUtil.TRANSACTION_STRING_BASE,
          'string.empty': messageUtil.TRANSACTION_STRING_EMPTY,
          'any.required': messageUtil.TRANSACTION_REQUIRED,
        }),
        userId: Joi.string().required().messages({
          'string.base': messageUtil.USER_STRING_BASE,
          'string.empty': messageUtil.USER_STRING_EMPTY,
          'any.required': messageUtil.USER_REQUIRED,
        }),
        type: Joi.string().optional().messages({
          'string.base': messageUtil.TYPE_STRING_BASE,
          'string.empty': messageUtil.TYPE_STRING_EMPTY,
          'any.required': messageUtil.TYPE_REQUIRED,
          'any.only': messageUtil.TYPE_INVALID,
        }),
      });

      const { error, value } = schema.validate(req.body);

      if (error) {
        return Response.badRequest(res, error.details[0].message);
      }

      // Attach validated value to the request body for later usage
      req.body = value;

      next();
    } catch (error) {
      console.error('Validation Error:', error);
      return Response.serverError(res, error);
    }
  };
}

export default new paymentValidation();
