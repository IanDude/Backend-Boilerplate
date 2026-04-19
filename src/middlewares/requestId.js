import { v4 as uuidv4 } from "uuid";

export const requestIdMiddleware = (req, res, next) => {
  const existingId = req.headers["x-request-id"] || req.headers["x-correlation-id"] || req.headers["x-trace-id"];

  const requestId = existingId || uuidv4();

  req.requestId = requestId;

  req.correlationId = requestId;

  res.setHeader("X-Request-Id", requestId);

  next();
};

export const getRequestId = (req) => {
  return req?.requestId || req?.correlationId || "unknown";
};

export default requestIdMiddleware;
