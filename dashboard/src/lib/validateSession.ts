import { jwtVerify, type JWTPayload } from "jose";

export type DashboardRole = "ADMIN" | "FINANCE" | "STAFF" | "AGEN" | "JAMAAH";

export interface ValidatedSession {
  userId: number;
  email: string;
  role: DashboardRole;
  fullName?: string;
  phone?: string | null;
  sub: string;
  exp?: number;
  iat?: number;
}

export interface SessionAuthUser {
  id: number;
  email: string;
  fullName: string;
  role: DashboardRole;
  phone: string | null;
}

const VALID_ROLES: DashboardRole[] = ["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH"];

const encoder = new TextEncoder();

const getSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured for dashboard session validation");
  }

  return encoder.encode(secret);
};

const isDashboardRole = (value: unknown): value is DashboardRole => {
  return typeof value === "string" && VALID_ROLES.includes(value as DashboardRole);
};

const normalizePayload = (payload: JWTPayload): ValidatedSession | null => {
  const rawUserId = payload.userId;
  const rawEmail = payload.email;
  const rawRole = payload.role;

  const parsedUserId =
    typeof rawUserId === "number"
      ? rawUserId
      : typeof rawUserId === "string"
        ? Number.parseInt(rawUserId, 10)
        : Number.NaN;

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return null;
  }

  if (typeof rawEmail !== "string" || !rawEmail.trim()) {
    return null;
  }

  if (!isDashboardRole(rawRole)) {
    return null;
  }

  return {
    userId: parsedUserId,
    email: rawEmail,
    role: rawRole,
    fullName: typeof payload.fullName === "string" ? payload.fullName : undefined,
    phone:
      typeof payload.phone === "string"
        ? payload.phone
        : payload.phone === null
          ? null
          : undefined,
    sub: String(parsedUserId),
    exp: payload.exp,
    iat: payload.iat,
  };
};

export const sessionToAuthUser = (session: ValidatedSession): SessionAuthUser => ({
  id: session.userId,
  email: session.email,
  fullName: session.fullName?.trim() || session.email,
  role: session.role,
  phone: session.phone ?? null,
});

export async function validateSession(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return normalizePayload(payload);
  } catch {
    return null;
  }
}
