import { success, error } from "../util/responses.js";

export const responseWrapper = (req, res, next) => {
  //create a method for sending consistent response structures
  res.sendSuccess = (message, data, statusCode) => {
    if (typeof data === "number") {
      //checks if data is a number and treats it as a status code
      return success(res, message, null, data);
    }
    return success(res, message, data || null, statusCode || 200);
  };

  res.sendError = (message, err, statusCode, code) => {
    if (typeof err === "number") {
      return error(res, message, null, err, code);
    }
    return error(res, message, err || null, statusCode || 400, code);
  };

  next();
};
