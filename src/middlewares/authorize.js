import { ERROR_CODES } from "../util/APIError.js";

function authorize({ resource, action, getResource, ownerField }) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      const hasAccess = user.permissions.has(`${resource}:${action}`);
      const hasAccessAny = user.permissions.has(`${resource}:${action}_any`);
      const hasAccessAll = user.permissions.has(`${resource}:${action}_all`);

      console.log({
        hasAccess,
        hasAccessAny,
        hasAccessAll,
      });

      // No permissions at all
      if (!hasAccess && !hasAccessAny && !hasAccessAll) {
        return res.sendError(`${action} denied`, "Forbidden", 403);
      }

      let data = null;

      // Load resource if needed
      if (getResource) {
        data = await getResource(req);

        if (!data) {
          return res.sendError(`${resource} not found`, "Resource Not Found", 404);
        }

        req.resource = data;
      }

      // Determine if resource is collection
      const isCollection = Array.isArray(data);

      /*
        ACCESS RULES

        _all  -> full access to everything
        _any  -> access to single resources only
        base  -> owned resources only
      */

      // ADMIN
      if (hasAccessAll) {
        console.log("_all bypass");
        return next();
      }

      // MODERATOR
      if (hasAccessAny && !isCollection) {
        console.log("_any bypass");
        return next();
      }

      // Ownership validation
      if (data && ownerField) {
        if (isCollection) {
          for (const item of data) {
            if (item[ownerField] !== user.id) {
              return res.sendError(`No ${resource} found`, "Forbidden", 403);
            }
          }
        } else {
          if (data[ownerField] !== user.id) {
            return res.sendError(`No ${resource} found`, "Forbidden", 403);
          }
        }
      }

      console.log("Authorized");

      return next();
    } catch (err) {
      return res.sendError(err.message, err, err.status, err.code);
    }
  };
}

export default authorize;
