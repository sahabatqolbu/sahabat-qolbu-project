// backend/src/middlewares/roleMiddleware.js
import { forbiddenResponse } from "../utils/response.js";

// =====================================================
// ROLE-BASED ACCESS CONTROL
// =====================================================
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, "Authentication required");
    }

    // Convert single role to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return forbiddenResponse(
        res,
        `Akses ditolak. Role yang diizinkan: ${roles.join(", ")}`
      );
    }

    next();
  };
};

// =====================================================
// SHORTHAND HELPERS
// =====================================================
export const requireAdmin = authorize(["ADMIN"]);
export const requireFinance = authorize(["FINANCE"]);
export const requireAgen = authorize(["AGEN"]);
export const requireJamaah = authorize(["JAMAAH"]);

// Multiple roles
export const requireAdminOrFinance = authorize(["ADMIN", "FINANCE"]);
export const requireAdminOrAgen = authorize(["ADMIN", "AGEN"]);
