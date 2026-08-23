import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
const JWT_SECRET = "1a8c501f305c9a289d82a609a6df34500fab870fb4acb480c9b5c60d97cd8e38a9774a3c848eefbdd2502b8376f0fbeaa7f0b3b74f845f86ace93a033878f8aa"
const JWT_REFRESH_SECRET = "ec8131ccdf81436cd06494a42b0bdda06a0059cce4c97dd12c4450a7cec369ae3d00c6c240cfd408df8afaa461e0d1ea06157f088de33d530f635146b1e79373"

 interface AuthPayload extends JwtPayload {
  id: string;
  role: "user" | "admin";
}
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "user" | "admin";
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authCheck = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  try {
    // Get access token
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      return res.status(401).json({
        message: "Access token missing",
      });
    }
    try {
      const decoded = jwt.verify(
        accessToken,
        JWT_SECRET
      ) as AuthPayload;
      
      req.user = decoded;
      return next();
    } catch {
      // Access token expired
      const refreshToken = req.cookies?.refreshToken;
       
      if (!refreshToken) {
        return res.status(401).json({
          message: "Refresh token missing",
        });
      }
    
      try {
       
        const decodedRefresh = jwt.verify(
          refreshToken,
          JWT_REFRESH_SECRET
        ) as AuthPayload;
        
        const newAccessToken = jwt.sign(
          {
            id: decodedRefresh.id,
            role: decodedRefresh.role,
          },
          JWT_SECRET,
          {
            expiresIn:
              process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
          }
        );
        
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        req.user = decodedRefresh;

        return next();
      } catch(error:any) {
        console.error("Refresh Token Error:", error);
        return res.status(403).json({
          message: "Refresh token expired or invalid",
        });
      }
    }
  } catch {
    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

export const authorized =
  (...authorizedRoles: ("user" | "admin")[]) =>
  (req: Request, res: Response, next: NextFunction): Response | void => {
    const role = req.user?.role;

    if (!role || !authorizedRoles.includes(role)) {
      return res.status(403).json({
        message: "Forbidden: Access denied!",
      });
    }

    next();
  };

export default authCheck;