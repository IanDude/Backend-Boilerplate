import { ERROR_CODES } from "../util/APIError.js";

function authorize({ resource, action, getResource, ownerField }) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      const hasAccessAny = user.permissions.has(`${resource}:${action}_any`);
      const hasAccessAll = user.permissions.has(`${resource}:${action}_all`);
      const hasAccess = user.permissions.has(`${resource}:${action}`);

      console.log({ hasAccessAny, hasAccessAll, hasAccess });

      // Global permission check (admin/moderator)
      if (hasAccessAll || hasAccessAny) {
        if (getResource) {
          console.log("Fetching resource...");
          const data = await getResource(req);
          console.log("Data fetched successfully");
          if (!data)
            return res.sendError(`${resource} not found`, "Resource Not Found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
          req.resource = data;
        }
        console.log("Role Bypass - Skip ownership checks");
        return next();
      }

      // Basic permission check
      if (!hasAccess) {
        return res.sendError(`${action} denied`, "Resource not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      // Ownership check (if resource exists)
      if (getResource) {
        console.log("Fetching Data in getResource()");
        const data = await getResource(req);
        console.log("Data Fetched Successfully");
        if (!ownerField)
          return res.sendError(
            "Failed to validate ownership",
            "ownerField required",
            400,
            ERROR_CODES.VALIDATION_FAILED,
          );

        if (!data) {
          return res.sendError("No Resource Found", "Resource Not Found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
        }

        //Check if data is array
        const isDataArray = Array.isArray(data);
        if (isDataArray) {
          // If its array, check ownership of each file
          for (const file of data) {
            if (file[ownerField] !== user.id)
              return res.sendError("No Resource Found", "Resource Not Found", 403, ERROR_CODES.RESOURCE_NOT_FOUND);
          }
        } else {
          if (data[ownerField] !== user.id) {
            return res.sendError("No Resource Found", "Resource Not Found", 403, ERROR_CODES.RESOURCE_NOT_FOUND);
          }
        }

        req.resource = data;
      }
      console.log("Authorized");
      return next();
    } catch (err) {
      return res.sendError("Server error", 500);
    }
  };
}

export default authorize;
