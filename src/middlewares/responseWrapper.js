import logger from "../util/logger.js";
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
    const errorObj = err instanceof Error ? err : new Error(err);
    const finalStatus = statusCode || 400;
    if (typeof err === "number") {
      return error(res, message, null, err, code);
    }
    // console.log("Log from Logger");
    // console.log("Status Code:", statusCode);
    logger.error("Request Error", {
      route: req.originalUrl,
      id: req.requestId,
      method: req.method,
      status: finalStatus,
      error: errorObj.stack,
    });

    return error(res, message, errorObj.message, finalStatus, code);
  };

  next();
};
