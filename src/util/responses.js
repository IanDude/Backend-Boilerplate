//Response handlers for consistent format of responses
export const success = (res, message, data, statusCode) => {
  return res.status(statusCode).json({
    success: true, //returns that operation is successful
    message, //return success message
    data, //returns data
  });
};

export const error = (res, message, error, statusCode, code = "INTERNAL_ERROR") => {
  return res.status(statusCode).json({
    success: false, //returns that operation failed
    message, //returns error message
    code, //returns error code
    error, //return actual error
  });
};
