import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { error } from '../utils/apiResponse';

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'superadmin';
  };
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return error(res, 'Not authorized to access this resource', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'winsoft_super_secret_dev_key_2026') as any;
    req.admin = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return error(res, 'Invalid token, authorization denied', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return error(res, `Role '${req.admin?.role || 'unknown'}' is not authorized to access this route`, 403);
    }
    next();
  };
};
