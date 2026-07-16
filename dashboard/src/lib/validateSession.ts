import { jwtVerify, type JWTPayload } from "jose";

export type DashboardRole =
  | "ADMIN"
  | "FINANCE"
  | "STAFF"
  | "AGEN"
  | "JAMAAH"
  | "CALON_JAMAAH";

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

const VALID_ROLES: DashboardRole[] = [
  "ADMIN",
  "FINANCE",
  "STAFF",
  "AGEN",
  "JAMAAH",
  "CALON_JAMAAH",
];

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

const normalizeApiUser = (user: unknown): ValidatedSession | null => {
  if (!user || typeof user !== "object") {
    return null;
  }

  const record = user as Record<string, unknown>;
  const parsedUserId =
    typeof record.id === "number"
      ? record.id
      : typeof record.id === "string"
        ? Number.parseInt(record.id, 10)
        : Number.NaN;

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return null;
  }

  if (typeof record.email !== "string" || !record.email.trim()) {
    return null;
  }

  if (!isDashboardRole(record.role)) {
    return null;
  }

  return {
    userId: parsedUserId,
    email: record.email,
    role: record.role,
    fullName: typeof record.fullName === "string" ? record.fullName : undefined,
    phone:
      typeof record.phone === "string"
        ? record.phone
        : record.phone === null
          ? null
          : undefined,
    sub: String(parsedUserId),
  };
};

const getApiBaseUrl = () => {
  const productionApiUrl = "https://api.sahabatqolbu.com/api";
  const fallbackDevApiUrl = "http://localhost:5000/api";
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!envApiUrl) return productionApiUrl;

    try {
      const parsed = new URL(envApiUrl);
      const isDashboardOrigin = parsed.hostname === "dashboard.sahabatqolbu.com";
      return (isDashboardOrigin ? productionApiUrl : envApiUrl).replace(/\/+$/, "");
    } catch {
      return productionApiUrl;
    }
  }

  if (!envApiUrl) return fallbackDevApiUrl;

  try {
    const parsed = new URL(envApiUrl);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    return (isLocal ? envApiUrl : fallbackDevApiUrl).replace(/\/+$/, "");
  } catch {
    return fallbackDevApiUrl;
  }
};

const validateSessionViaBackend = async (token: string) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
      headers: {
        Cookie: `access_token=${encodeURIComponent(token)}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return normalizeApiUser(payload?.data);
  } catch {
    return null;
  }
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
    const session = normalizePayload(payload);
    if (session) return session;
  } catch {
    // Fall back to backend validation. This keeps dashboard auth working when
    // dashboard JWT_SECRET is missing/stale while backend remains source of truth.
  }

  return validateSessionViaBackend(token);
}
