import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { config } from "../configs/Config";
import _ from "lodash";
import userPermissions from "./userPermissions.json";
import httpStatus from "http-status";
import { userService } from "../services/UserService";
interface AccessControl {
  apiGroups: {
    [key: string]: string[];
  },
  roles: {
    [key: string]: string[];
  }
}

const accessControl: AccessControl = userPermissions;

const errorHandler = (statusCode: number, message: string, req: Request, res: Response) => {
  const errorMapping: Record<number, { errCode: string, code: string }> = {
    401: {
      errCode: httpStatus["401_NAME"],
      code: "UNAUTHORIZED ACCESS",
    },
    403: {
      errCode: httpStatus["403_NAME"],
      code: "FORBIDDEN ACCESS",
    },
  };

  const { errCode, code } = errorMapping[statusCode];

  return ResponseHandler.errorResponse(
    {
      statusCode,
      errCode,
      message,
      code,
    },
    req,
    res
  );
};


const checkAccess = (decoded: any, action: string, req: Request, res: Response) => {
  if (decoded.roles) {
    const hasAccess = decoded.roles.some((role: string) => {
      const apiGroups = accessControl.roles[role];
      return apiGroups?.some((apiGroup: string) =>
        accessControl.apiGroups[apiGroup]?.includes(action)
      );
    });

    if (hasAccess) {
      return true;
    } else {
      const rolesWithAccess = Object.keys(accessControl.roles).filter(role => {
        const apiGroups = accessControl.roles[role];
        return apiGroups?.some(apiGroup => accessControl.apiGroups[apiGroup]?.includes(action));
      });

      const rolesMessage = rolesWithAccess.length > 0
        ? `The following roles have access to this action: ${rolesWithAccess.join(", ")}`
        : "No roles have this action";

      const errorMessage = `Access denied. User does not have permission to perform this action. ${rolesMessage}.`;
      errorHandler(403, errorMessage, req, res);
      return false;
    }
  }

  errorHandler(403, "Access denied. User does not have permission to perform this action.", req, res);
  return false;
};

const basicToken = (token: string, req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = jwt.verify(token, config.user_token_public_key, { algorithms: ['RS256'] });

    if (!decoded || !_.isObject(decoded)) {
      return errorHandler(401, "Token verification failed or invalid token", req, res);
    }

    (req as any).userID = decoded.id;
    const action = (req as any).id;

    if (checkAccess(decoded, action, req, res)) {
      return next();
    }
  } catch (error) {
    return errorHandler(401, "Token verification error", req, res);
  }
};

const keycloakTokenVerify = async (token: string, req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && _.isObject(decoded)) {
      (req as any).userID = decoded.sub;
      const action = (req as any).id;
      const userCondition = { id: decoded.sub };
      const userDetails = ["roles", "user_name"];
      const user = await userService.getUser(userCondition, userDetails);

      if (!user) {
        return errorHandler(404, "User not found", req, res);
      }

      if (checkAccess(user, action, req, res)) {
        return next();
      }
    }
  } catch (error) {
    return errorHandler(401, "Token decode error", req, res);
  }
};

export default {
  name: "rbac:middleware",
  handler: () => async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (_.lowerCase(config.is_RBAC_enabled) === "false") {
        (req as any).userID = "SYSTEM";
        return next();
      }
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return errorHandler(401, "No token provided", req, res);
      }

      const decoded = jwt.decode(token);
      if (decoded && _.isObject(decoded) && decoded.roles) {
        return basicToken(token, req, res, next);
      } else {
        return await keycloakTokenVerify(token, req, res, next);
      }
    } catch (error) {
      return next(error);
    }
  },
};
