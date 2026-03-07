import logger from "../util/logger.js";

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    // console.log(res);
    const isError = res.statusCode >= 400 ? "Error" : "Request";
    logger.http(`HTTP ${isError}`, {
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      duration: `${duration}ms`,
    });
  });
  next();
};

export default requestLogger;
