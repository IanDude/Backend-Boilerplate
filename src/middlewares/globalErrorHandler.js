function globalErrorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";

  return res.sendError(err.message || "Something went wrong", err, status, code);
}

export default globalErrorHandler;
