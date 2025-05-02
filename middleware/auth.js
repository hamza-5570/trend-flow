"use strict";
import jwtHelper from "../utilities/jwt.js";

let checkToken = (req, res, next) => {
  let token = req.header("x-auth-token"); // in header token will be send in "x-auth-token" variable
  if (token) {
    const isVerified = jwtHelper.verify(token);

    if (isVerified) {
      req.userId = isVerified._id;
      next();
    } else {
      return res.status(401).json({
        success: "false",
        message: "Token is not valid",
      });
    }
  } else {
    return res.status(401).json({
      success: "false",
      message: "Token is not provided",
      missingParameters: ["login_token"],
    });
  }
};

export default {
  checkToken: checkToken,
};
