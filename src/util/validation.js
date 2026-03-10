import { z } from "zod";

export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("validateBody - Request body:", JSON.stringify(req.body, null, 2));
      }
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      console.error("validateBody - Validation error", {
        errorType: error.constructor.name,
        isZodError: error instanceof z.ZodError,
        errorMessage: error.message,
        hasErrors: error.errors !== undefined,
        errorsIsArray: Array.isArray(error.errors),
      });
      if (error instanceof z.ZodError) {
        const errorList = error.issues || error.errors || [];
        console.log("DEBUG - Using error list", {
          hasIssues: !!error.issues,
          hasErrors: !!error.errors,
          issuesLength: error.issues?.length,
          errorsLength: error.errors?.length,
          usingProperty: error.issues ? "issues" : "errors",
        });

        console.log({
          success: false,
          message: "Validation failed",
          error: errorList,
        });

        try {
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errorList.map((err) => ({
              fields: err.path.join(","),
              message: err.message,
            })),
          });
        } catch (mapError) {
          console.error("Failed to map ZodError:", {
            mapError: mapError.message,
            issues: error.issues,
            errors: mapError.errors,
            errorList: errorList,
          });
        }

        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errorList,
        });
      }
    }
  };
};

export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.validatedQuery = parsed;
      Object.keys(parsed).forEach((key) => {
        req.query[key] = parsed[key];
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorList = error.issues || error.errors || [];
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: errorList.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("validateParams - Request Params:", JSON.stringify(req.params, null, 2));
      }
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        if (!Array.isArray(error.errors)) {
          console.error("ZodError.errors is not an array:", error);
          return res.status(400).json({
            success: false,
            message: "Invalid parameters",
            errors: [],
          });
        }

        res.status(400).json({
          success: false,
          message: "Invalid parameters",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};