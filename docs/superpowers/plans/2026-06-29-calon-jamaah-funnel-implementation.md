# Calon Jamaah Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-ready `CALON_JAMAAH` registration, dashboard, package interest, admin follow-up, conversion, and database-backed landing content flow.

**Architecture:** Implement this as vertical slices across the existing backend, dashboard, and frontend apps. Backend remains the source of truth for roles, prospects, interests, conversion, and public content; dashboard owns auth/admin/calon-jamaah UX; landing stays a public marketing surface that links to dashboard auth and renders public database content.

**Tech Stack:** Node/Express, Drizzle ORM, MySQL, Next.js App Router, React, TanStack Query, Zustand, Tailwind, existing dashboard UI components.

---

## Execution Rules

- Do not mix unrelated dirty worktree changes into commits.
- Commit each task or small group of related steps separately.
- Before every commit, run the relevant checks listed in the task.
- Use database migrations, not `db:push`, for production schema changes.
- Keep auth forms on `dashboard.sahabatqolbu.com`; do not add credential forms to the landing domain.
- Public registration must never accept a client-provided role.

## Existing Context To Preserve

- `JAMAAH` already exists in backend role enum and dashboard route access.
- Existing jamaah self-service API is mounted under `/api/jamaah`.
- Existing jamaah dashboard exists under `dashboard/src/app/(mobile)/jamaah`.
- Existing package public API is under `/api/public/packages`.
- Existing admin content menu already has FAQ and Gallery entries.
- Worktree may contain unrelated dirty frontend files; ignore them unless they block this plan.

---

### Task 1: Add Backend Role And Prospect Schema

**Files:**
- Modify: `backend/src/db/schema.js`
- Create: `backend/drizzle/migrations/0012_add_calon_jamaah_prospects.sql`
- Modify: `backend/src/validators/index.js`
- Modify: `backend/src/middlewares/roleMiddleware.js`
- Test: `backend/src/tests/calon-jamaah-schema.test.js`

- [ ] **Step 1: Write backend schema test**

Create `backend/src/tests/calon-jamaah-schema.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { userSchemas } from "../validators/index.js";

test("public user create schema allows CALON_JAMAAH role internally", () => {
  const parsed = userSchemas.create.parse({
    email: "Lead@Example.com",
    password: "StrongPass1!",
    fullName: "Calon Jamaah",
    phone: "081234567890",
    role: "CALON_JAMAAH",
  });

  assert.equal(parsed.email, "lead@example.com");
  assert.equal(parsed.role, "CALON_JAMAAH");
});

test("public user create schema still rejects unknown roles", () => {
  assert.throws(() =>
    userSchemas.create.parse({
      email: "lead@example.com",
      password: "StrongPass1!",
      fullName: "Calon Jamaah",
      phone: "081234567890",
      role: "SUPERADMIN",
    }),
  );
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
cd backend
npm test -- src/tests/calon-jamaah-schema.test.js
```

Expected: FAIL because `CALON_JAMAAH` is not in the role enum.

- [ ] **Step 3: Update role enum and add prospect tables**

In `backend/src/db/schema.js`, update `users.role` enum:

```js
role: mysqlEnum("role", ["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH", "CALON_JAMAAH"])
  .notNull()
  .default("JAMAAH"),
```

Add the following tables after `users` or near the jamaah-related tables:

```js
export const prospectJamaah = mysqlTable(
  "prospect_jamaah",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    followUpStatus: mysqlEnum("follow_up_status", [
      "BARU",
      "DIHUBUNGI",
      "TERTARIK",
      "BELUM_RESPON",
      "CONVERTED",
    ])
      .notNull()
      .default("BARU"),
    sourceType: mysqlEnum("source_type", ["GENERAL", "AGENT", "REFERRAL"]).default("GENERAL"),
    sourceSlug: varchar("source_slug", { length: 150 }),
    sourceAgentId: int("source_agent_id").references(() => users.id),
    convertedJamaahId: int("converted_jamaah_id"),
    convertedAt: datetime("converted_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    statusIdx: index("status_idx").on(table.followUpStatus),
    sourceIdx: index("source_idx").on(table.sourceType, table.sourceSlug),
  }),
);

export const prospectPackageInterests = mysqlTable(
  "prospect_package_interests",
  {
    id: int("id").primaryKey().autoincrement(),
    prospectId: int("prospect_id")
      .notNull()
      .references(() => prospectJamaah.id, { onDelete: "cascade" }),
    packageId: int("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    actionType: mysqlEnum("action_type", [
      "SAVED",
      "WHATSAPP_CONSULT",
      "CONVERT_REQUEST",
    ]).notNull(),
    sourcePath: varchar("source_path", { length: 500 }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    prospectIdx: index("prospect_idx").on(table.prospectId),
    packageIdx: index("package_idx").on(table.packageId),
    actionIdx: index("action_idx").on(table.actionType),
  }),
);

export const prospectFollowUps = mysqlTable(
  "prospect_follow_ups",
  {
    id: int("id").primaryKey().autoincrement(),
    prospectId: int("prospect_id")
      .notNull()
      .references(() => prospectJamaah.id, { onDelete: "cascade" }),
    actorUserId: int("actor_user_id")
      .notNull()
      .references(() => users.id),
    status: mysqlEnum("status", [
      "BARU",
      "DIHUBUNGI",
      "TERTARIK",
      "BELUM_RESPON",
      "CONVERTED",
    ]).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    prospectIdx: index("prospect_idx").on(table.prospectId),
    actorIdx: index("actor_idx").on(table.actorUserId),
    statusIdx: index("status_idx").on(table.status),
  }),
);
```

- [ ] **Step 4: Update validators and role helpers**

In `backend/src/validators/index.js`, update both role enums:

```js
role: z.enum(["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH", "CALON_JAMAAH"]).default("JAMAAH"),
```

```js
role: z.enum(["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH", "CALON_JAMAAH"]),
```

In `backend/src/middlewares/roleMiddleware.js`, add:

```js
export const requireCalonJamaah = authorize(["CALON_JAMAAH"]);
```

- [ ] **Step 5: Create production migration**

Create `backend/drizzle/migrations/0012_add_calon_jamaah_prospects.sql`:

```sql
ALTER TABLE `users`
  MODIFY COLUMN `role` enum('ADMIN','FINANCE','STAFF','AGEN','JAMAAH','CALON_JAMAAH') NOT NULL DEFAULT 'JAMAAH';

CREATE TABLE `prospect_jamaah` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` int NOT NULL,
  `follow_up_status` enum('BARU','DIHUBUNGI','TERTARIK','BELUM_RESPON','CONVERTED') NOT NULL DEFAULT 'BARU',
  `source_type` enum('GENERAL','AGENT','REFERRAL') DEFAULT 'GENERAL',
  `source_slug` varchar(150),
  `source_agent_id` int,
  `converted_jamaah_id` int,
  `converted_at` datetime,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `prospect_jamaah_user_id_unique` UNIQUE(`user_id`)
);

CREATE INDEX `prospect_jamaah_user_idx` ON `prospect_jamaah` (`user_id`);
CREATE INDEX `prospect_jamaah_status_idx` ON `prospect_jamaah` (`follow_up_status`);
CREATE INDEX `prospect_jamaah_source_idx` ON `prospect_jamaah` (`source_type`, `source_slug`);

CREATE TABLE `prospect_package_interests` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `prospect_id` int NOT NULL,
  `package_id` int NOT NULL,
  `action_type` enum('SAVED','WHATSAPP_CONSULT','CONVERT_REQUEST') NOT NULL,
  `source_path` varchar(500),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX `prospect_package_interests_prospect_idx` ON `prospect_package_interests` (`prospect_id`);
CREATE INDEX `prospect_package_interests_package_idx` ON `prospect_package_interests` (`package_id`);
CREATE INDEX `prospect_package_interests_action_idx` ON `prospect_package_interests` (`action_type`);

CREATE TABLE `prospect_follow_ups` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `prospect_id` int NOT NULL,
  `actor_user_id` int NOT NULL,
  `status` enum('BARU','DIHUBUNGI','TERTARIK','BELUM_RESPON','CONVERTED') NOT NULL,
  `note` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX `prospect_follow_ups_prospect_idx` ON `prospect_follow_ups` (`prospect_id`);
CREATE INDEX `prospect_follow_ups_actor_idx` ON `prospect_follow_ups` (`actor_user_id`);
CREATE INDEX `prospect_follow_ups_status_idx` ON `prospect_follow_ups` (`status`);
```

- [ ] **Step 6: Update migration journal**

Update `backend/drizzle/migrations/meta/_journal.json` by appending an entry for migration `0012_add_calon_jamaah_prospects`. Match the existing journal format exactly.

- [ ] **Step 7: Run backend tests**

Run:

```bash
cd backend
npm test
npm run check:migrations
```

Expected: both commands pass.

- [ ] **Step 8: Commit**

```bash
git add backend/src/db/schema.js backend/src/validators/index.js backend/src/middlewares/roleMiddleware.js backend/src/tests/calon-jamaah-schema.test.js backend/drizzle/migrations/0012_add_calon_jamaah_prospects.sql backend/drizzle/migrations/meta/_journal.json
git commit -m "feat: add calon jamaah prospect schema"
```

---

### Task 2: Add Public Calon Jamaah Registration And Auth Hardening Hooks

**Files:**
- Modify: `backend/src/validators/index.js`
- Modify: `backend/src/controllers/authController.js`
- Modify: `backend/src/routes/auth.js`
- Modify: `backend/src/middlewares/rateLimiter.js`
- Test: `backend/src/tests/calon-jamaah-auth.test.js`

- [ ] **Step 1: Add validation schema**

In `backend/src/validators/index.js`, add under `authSchemas`:

```js
registerCalonJamaah: z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(255),
  email: z
    .string()
    .min(1, messages.email.required)
    .email(messages.email.invalid)
    .transform((val) => val.toLowerCase().trim()),
  phone: z.string().regex(patterns.phone, "Format nomor WhatsApp tidak valid"),
  password: z
    .string()
    .min(8, messages.password.min)
    .max(128, messages.password.max)
    .regex(patterns.password, messages.password.pattern),
  confirmPassword: z.string(),
  sourceType: z.enum(["GENERAL", "AGENT", "REFERRAL"]).optional().default("GENERAL"),
  sourceSlug: z.string().max(150).optional().nullable(),
  honeypot: z.string().max(0).optional().default(""),
  formStartedAt: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      path: ["confirmPassword"],
      code: z.ZodIssueCode.custom,
      message: "Konfirmasi password tidak sama",
    });
  }
});
```

- [ ] **Step 2: Add backend controller**

In `backend/src/controllers/authController.js`, import new tables:

```js
import { users, prospectJamaah } from "../db/schema.js";
```

Add controller:

```js
export const registerCalonJamaah = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      sourceType = "GENERAL",
      sourceSlug = null,
      formStartedAt,
    } = req.validatedBody || req.body;

    const normalizedEmail = normalizeEmail(email);
    const elapsedMs = formStartedAt ? Date.now() - Number(formStartedAt) : 0;
    if (elapsedMs > 0 && elapsedMs < 1500) {
      logger.security("Calon jamaah register blocked - submit too fast", {
        email: normalizedEmail,
        ip: req.ip,
      });
      return errorResponse(res, "Permintaan terlalu cepat. Silakan coba lagi.", 400);
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return errorResponse(res, "Email sudah terdaftar. Silakan login.", 409);
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
        phone,
        role: "CALON_JAMAAH",
        otp,
        otpExpiry,
        isActive: true,
        isEmailVerified: false,
      })
      .$returningId();

    const userId = Number(newUser.id);
    await db.insert(prospectJamaah).values({
      userId,
      followUpStatus: "BARU",
      sourceType,
      sourceSlug,
    });

    const emailResult = await sendOTPEmail(
      { id: userId, email: normalizedEmail, fullName },
      otp,
    );

    if (!emailResult.success) {
      logger.error("Failed to send calon jamaah register OTP", emailResult.error, { userId });
      return errorResponse(res, "Akun dibuat, tetapi OTP gagal dikirim. Silakan request ulang OTP.", 500);
    }

    logger.security("Calon jamaah registered", { userId, email: normalizedEmail });

    return successResponse(
      res,
      {
        email: normalizedEmail,
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} menit`,
      },
      "Registrasi berhasil. Silakan cek email Anda untuk kode OTP",
      201,
    );
  } catch (error) {
    logger.error("Calon jamaah registration error", error);
    next(error);
  }
};
```

- [ ] **Step 3: Add route and limiter**

In `backend/src/routes/auth.js`, import `registerCalonJamaah` and add route before login:

```js
router.post(
  "/register/calon-jamaah",
  authLimiter,
  validate(authSchemas.registerCalonJamaah),
  registerCalonJamaah,
);
```

In `backend/src/middlewares/rateLimiter.js`, verify `authLimiter` is strict enough. If it is permissive, add a `registerLimiter` at 5 requests per 15 minutes per IP and use it for the register route.

- [ ] **Step 4: Add tests**

Create `backend/src/tests/calon-jamaah-auth.test.js` with unit-level assertions for:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { authSchemas } from "../validators/index.js";

test("calon jamaah registration rejects mismatched password confirmation", () => {
  assert.throws(() =>
    authSchemas.registerCalonJamaah.parse({
      fullName: "Calon Jamaah",
      email: "lead@example.com",
      phone: "081234567890",
      password: "StrongPass1!",
      confirmPassword: "StrongPass2!",
      honeypot: "",
      formStartedAt: Date.now() - 3000,
    }),
  );
});

test("calon jamaah registration accepts valid payload and normalizes email", () => {
  const parsed = authSchemas.registerCalonJamaah.parse({
    fullName: "Calon Jamaah",
    email: "Lead@Example.com",
    phone: "081234567890",
    password: "StrongPass1!",
    confirmPassword: "StrongPass1!",
    honeypot: "",
    formStartedAt: Date.now() - 3000,
  });

  assert.equal(parsed.email, "lead@example.com");
  assert.equal(parsed.sourceType, "GENERAL");
});
```

- [ ] **Step 5: Run backend tests**

```bash
cd backend
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/validators/index.js backend/src/controllers/authController.js backend/src/routes/auth.js backend/src/middlewares/rateLimiter.js backend/src/tests/calon-jamaah-auth.test.js
git commit -m "feat: add calon jamaah registration"
```

---

### Task 3: Update Dashboard Auth For Register Tab And Role Redirect

**Files:**
- Modify: `dashboard/src/lib/validateSession.ts`
- Modify: `dashboard/src/lib/routeAccess.ts`
- Modify: `dashboard/src/services/authService.ts`
- Modify: `dashboard/src/stores/otpStore.ts`
- Modify: `dashboard/src/app/login/page.tsx`
- Modify: `dashboard/src/app/verify-otp/page.tsx`
- Test: `dashboard/src/scripts/check-menu-routes.mjs`

- [ ] **Step 1: Add dashboard role type**

In `dashboard/src/lib/validateSession.ts`:

```ts
export type DashboardRole =
  | "ADMIN"
  | "FINANCE"
  | "STAFF"
  | "AGEN"
  | "JAMAAH"
  | "CALON_JAMAAH";
```

Update `VALID_ROLES`:

```ts
const VALID_ROLES: DashboardRole[] = [
  "ADMIN",
  "FINANCE",
  "STAFF",
  "AGEN",
  "JAMAAH",
  "CALON_JAMAAH",
];
```

- [ ] **Step 2: Add role route access**

In `dashboard/src/lib/routeAccess.ts`:

```ts
CALON_JAMAAH: "/calon-jamaah",
```

and:

```ts
CALON_JAMAAH: ["/calon-jamaah"],
```

- [ ] **Step 3: Extend auth service**

In `dashboard/src/services/authService.ts`:

```ts
export interface RegisterCalonJamaahRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  sourceType?: "GENERAL" | "AGENT" | "REFERRAL";
  sourceSlug?: string | null;
  honeypot: string;
  formStartedAt: number;
}
```

Add service method:

```ts
registerCalonJamaah: async (data: RegisterCalonJamaahRequest) => {
  const response = await api.post<LoginResponse>("/auth/register/calon-jamaah", data);
  return response.data;
},
```

- [ ] **Step 4: Preserve next URL through OTP**

In `dashboard/src/stores/otpStore.ts`, add `nextPath`:

```ts
interface OTPState {
  email: string;
  expiresIn: string;
  nextPath: string;
  setOTPData: (email: string, expiresIn: string, nextPath?: string) => void;
  clearOTPData: () => void;
}
```

Update set/clear:

```ts
setOTPData: (email, expiresIn, nextPath = "") => {
  set({ email, expiresIn, nextPath });
},
clearOTPData: () => {
  set({ email: "", expiresIn: "", nextPath: "" });
},
```

- [ ] **Step 5: Refactor login page into tabs**

In `dashboard/src/app/login/page.tsx`, change `ViewMode` to include register:

```ts
type ViewMode = "login" | "register" | "forgot-request" | "forgot-reset";
```

Read search params:

```ts
import { useSearchParams } from "next/navigation";
const searchParams = useSearchParams();
const nextPath = searchParams.get("next") || "";
```

Initialize view mode from `?tab=register`.

Add register state:

```ts
const [registerData, setRegisterData] = useState({
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  honeypot: "",
  formStartedAt: Date.now(),
});
```

Add register mutation:

```ts
const registerMutation = useMutation({
  mutationFn: authService.registerCalonJamaah,
  onSuccess: (data) => {
    setOTPData(registerData.email, data.data.expiresIn, nextPath);
    toast({
      title: "Registrasi Berhasil",
      description: "Kode OTP sudah dikirim ke email Anda.",
    });
    router.push("/verify-otp");
  },
  onError: (error: any) => {
    const msg = error?.response?.data?.message || "Registrasi gagal";
    setErrors({ general: msg });
    toast({ variant: "destructive", title: "Registrasi Gagal", description: msg });
  },
});
```

Register submit payload must include honeypot and submit timing:

```ts
registerMutation.mutate({
  ...registerData,
  sourceType: "GENERAL",
  sourceSlug: null,
});
```

- [ ] **Step 6: Update OTP redirect**

In `dashboard/src/app/verify-otp/page.tsx`, add `CALON_JAMAAH` route and honor safe `nextPath`:

```ts
const roleRoutes: Record<string, string> = {
  ADMIN: "/admin",
  FINANCE: "/finance",
  STAFF: "/staff",
  AGEN: "/agen",
  JAMAAH: "/jamaah",
  CALON_JAMAAH: "/calon-jamaah",
};

const defaultRoute = roleRoutes[data.data.user.role] || "/login";
const safeNext =
  nextPath.startsWith("/calon-jamaah") && data.data.user.role === "CALON_JAMAAH"
    ? nextPath
    : "";
const targetRoute = safeNext || defaultRoute;
```

- [ ] **Step 7: Run dashboard checks**

```bash
cd dashboard
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add dashboard/src/lib/validateSession.ts dashboard/src/lib/routeAccess.ts dashboard/src/services/authService.ts dashboard/src/stores/otpStore.ts dashboard/src/app/login/page.tsx dashboard/src/app/verify-otp/page.tsx
git commit -m "feat: add calon jamaah register flow"
```

---

### Task 4: Add Calon Jamaah Backend APIs

**Files:**
- Create: `backend/src/controllers/prospectController.js`
- Create: `backend/src/routes/prospect.js`
- Modify: `backend/src/routes/api.js`
- Modify: `backend/src/validators/index.js`
- Test: `backend/src/tests/prospect-validation.test.js`

- [ ] **Step 1: Add validators**

Add:

```js
export const prospectSchemas = {
  interest: z.object({
    packageId: z.coerce.number().int().positive(),
    actionType: z.enum(["SAVED", "WHATSAPP_CONSULT", "CONVERT_REQUEST"]),
    sourcePath: z.string().max(500).optional().nullable(),
  }),
  followUp: z.object({
    status: z.enum(["BARU", "DIHUBUNGI", "TERTARIK", "BELUM_RESPON", "CONVERTED"]),
    note: z.string().max(2000).optional().nullable(),
  }),
  listQuery: paginationSchema.extend({
    status: z
      .enum(["BARU", "DIHUBUNGI", "TERTARIK", "BELUM_RESPON", "CONVERTED"])
      .optional(),
  }),
};
```

- [ ] **Step 2: Implement self-service endpoints**

Create `backend/src/controllers/prospectController.js` with exported functions:

```js
export const getMyProspectSummary = async (req, res, next) => {};
export const saveMyPackageInterest = async (req, res, next) => {};
export const getMyPackageInterests = async (req, res, next) => {};
export const convertMyProspectToJamaah = async (req, res, next) => {};
export const getProspects = async (req, res, next) => {};
export const getProspectDetail = async (req, res, next) => {};
export const addProspectFollowUp = async (req, res, next) => {};
export const adminConvertProspectToJamaah = async (req, res, next) => {};
```

Implementation requirements:

- `getMyProspectSummary` fetches current user prospect profile and recent interests.
- `saveMyPackageInterest` requires current user role `CALON_JAMAAH`, validates package exists and is published, then inserts interest.
- `convertMyProspectToJamaah` requires selected package, inserts `CONVERT_REQUEST`, updates role to `JAMAAH`, creates `jamaah_data`, updates prospect status `CONVERTED`.
- Conversion must first check if a `jamaah_data` record already exists for `userId`; if yes, return existing record and set role to `JAMAAH` if needed.
- Admin list/detail endpoints must join user, prospect, latest interests, and timeline.

- [ ] **Step 3: Add routes**

Create `backend/src/routes/prospect.js`:

```js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { validate, validateQuery, prospectSchemas } from "../validators/index.js";
import {
  addProspectFollowUp,
  adminConvertProspectToJamaah,
  convertMyProspectToJamaah,
  getMyPackageInterests,
  getMyProspectSummary,
  getProspectDetail,
  getProspects,
  saveMyPackageInterest,
} from "../controllers/prospectController.js";

const router = express.Router();

router.get("/me", authenticate, authorize(["CALON_JAMAAH"]), getMyProspectSummary);
router.get("/me/interests", authenticate, authorize(["CALON_JAMAAH"]), getMyPackageInterests);
router.post("/me/interests", authenticate, authorize(["CALON_JAMAAH"]), validate(prospectSchemas.interest), saveMyPackageInterest);
router.post("/me/convert", authenticate, authorize(["CALON_JAMAAH"]), validate(prospectSchemas.interest), convertMyProspectToJamaah);

router.get("/admin", authenticate, authorize(["ADMIN", "STAFF"]), validateQuery(prospectSchemas.listQuery), getProspects);
router.get("/admin/:id", authenticate, authorize(["ADMIN", "STAFF"]), getProspectDetail);
router.post("/admin/:id/follow-ups", authenticate, authorize(["ADMIN", "STAFF"]), validate(prospectSchemas.followUp), addProspectFollowUp);
router.post("/admin/:id/convert", authenticate, authorize(["ADMIN"]), validate(prospectSchemas.interest), adminConvertProspectToJamaah);

export default router;
```

Mount in `backend/src/routes/api.js`:

```js
import prospectRoutes from "./prospect.js";
router.use("/prospects", prospectRoutes);
```

- [ ] **Step 4: Add validation tests**

Create `backend/src/tests/prospect-validation.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { prospectSchemas } from "../validators/index.js";

test("prospect interest validates package id and action", () => {
  const parsed = prospectSchemas.interest.parse({
    packageId: "12",
    actionType: "SAVED",
    sourcePath: "/calon-jamaah/paket/example",
  });

  assert.equal(parsed.packageId, 12);
  assert.equal(parsed.actionType, "SAVED");
});

test("prospect follow up rejects invalid status", () => {
  assert.throws(() =>
    prospectSchemas.followUp.parse({
      status: "DONE",
      note: "called",
    }),
  );
});
```

- [ ] **Step 5: Run backend tests**

```bash
cd backend
npm test
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/prospectController.js backend/src/routes/prospect.js backend/src/routes/api.js backend/src/validators/index.js backend/src/tests/prospect-validation.test.js
git commit -m "feat: add calon jamaah prospect api"
```

---

### Task 5: Add Calon Jamaah Dashboard Pages

**Files:**
- Modify: `dashboard/src/app/(mobile)/layout.tsx`
- Create: `dashboard/src/app/(mobile)/calon-jamaah/page.tsx`
- Create: `dashboard/src/app/(mobile)/calon-jamaah/packages/page.tsx`
- Create: `dashboard/src/app/(mobile)/calon-jamaah/packages/[slug]/page.tsx`
- Create: `dashboard/src/app/(mobile)/calon-jamaah/interests/page.tsx`
- Create: `dashboard/src/app/(mobile)/calon-jamaah/consultation/page.tsx`
- Create: `dashboard/src/app/(mobile)/calon-jamaah/account/page.tsx`
- Create: `dashboard/src/services/prospectService.ts`

- [ ] **Step 1: Add service client**

Create `dashboard/src/services/prospectService.ts`:

```ts
import api from "@/lib/axios";

export const prospectService = {
  getSummary: async () => {
    const response = await api.get("/prospects/me");
    return response.data;
  },
  getInterests: async () => {
    const response = await api.get("/prospects/me/interests");
    return response.data;
  },
  saveInterest: async (packageId: number, actionType: "SAVED" | "WHATSAPP_CONSULT" | "CONVERT_REQUEST", sourcePath?: string) => {
    const response = await api.post("/prospects/me/interests", {
      packageId,
      actionType,
      sourcePath,
    });
    return response.data;
  },
  convert: async (packageId: number, sourcePath?: string) => {
    const response = await api.post("/prospects/me/convert", {
      packageId,
      actionType: "CONVERT_REQUEST",
      sourcePath,
    });
    return response.data;
  },
};
```

- [ ] **Step 2: Update mobile layout role support**

In `dashboard/src/app/(mobile)/layout.tsx`, add calon jamaah nav:

```ts
const desktopCalonJamaahNav = [
  { href: "/calon-jamaah", label: "Beranda", icon: LayoutDashboard },
  { href: "/calon-jamaah/packages", label: "Paket", icon: Package },
  { href: "/calon-jamaah/interests", label: "Diminati", icon: FileText },
  { href: "/calon-jamaah/consultation", label: "Konsultasi", icon: Users },
  { href: "/calon-jamaah/account", label: "Akun", icon: UserCircle },
];
```

Allow role:

```ts
if (!["AGEN", "JAMAAH", "CALON_JAMAAH"].includes(session.role)) {
  redirect(redirectPath ?? DEFAULT_ROUTES[session.role]);
}
```

Render nav title:

```tsx
{session.role === "AGEN" ? (
  <DesktopNav title="Area Agen" items={desktopAgenNav} />
) : session.role === "CALON_JAMAAH" ? (
  <DesktopNav title="Area Calon Jamaah" items={desktopCalonJamaahNav} />
) : (
  <DesktopNav title="Area Jamaah" items={desktopJamaahNav} />
)}
```

- [ ] **Step 3: Build pages**

Each page must:

- use responsive container classes matching existing mobile pages
- show loading state
- show empty state
- use package data from existing/public package services or new service wrappers
- provide bottom/mobile friendly CTA buttons

Minimum page content:

- `/calon-jamaah`: welcome, recent interests, CTA to packages
- `/calon-jamaah/packages`: package list
- `/calon-jamaah/packages/[slug]`: detail, save, consult, convert confirmation
- `/calon-jamaah/interests`: explicit interests only
- `/calon-jamaah/consultation`: WhatsApp CTA
- `/calon-jamaah/account`: current user basic profile

- [ ] **Step 4: Run dashboard checks**

```bash
cd dashboard
npm run lint
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/(mobile)/layout.tsx dashboard/src/app/(mobile)/calon-jamaah dashboard/src/services/prospectService.ts
git commit -m "feat: add calon jamaah dashboard"
```

---

### Task 6: Add Admin And Staff Prospect CRM

**Files:**
- Modify: `dashboard/src/lib/menu-config.ts`
- Create: `dashboard/src/app/(dashboard)/admin/prospects/page.tsx`
- Create: `dashboard/src/app/(dashboard)/admin/prospects/[id]/page.tsx`
- Create: `dashboard/src/app/(dashboard)/staff/prospects/page.tsx`
- Create: `dashboard/src/app/(dashboard)/staff/prospects/[id]/page.tsx`
- Modify: `dashboard/src/services/prospectService.ts`

- [ ] **Step 1: Add admin/staff menu items**

In `dashboard/src/lib/menu-config.ts`, add under `ADMIN` near `Kelola Jamaah`:

```ts
{
  label: "Calon Jamaah",
  href: "/admin/prospects",
  icon: UserCheck,
},
```

Add under `STAFF`:

```ts
{
  label: "Calon Jamaah",
  href: "/staff/prospects",
  icon: UserCheck,
},
```

- [ ] **Step 2: Extend service**

Add:

```ts
getAdminProspects: async (params?: { page?: number; search?: string; status?: string }) => {
  const response = await api.get("/prospects/admin", { params });
  return response.data;
},
getAdminProspectDetail: async (id: number | string) => {
  const response = await api.get(`/prospects/admin/${id}`);
  return response.data;
},
addFollowUp: async (id: number | string, data: { status: string; note?: string }) => {
  const response = await api.post(`/prospects/admin/${id}/follow-ups`, data);
  return response.data;
},
adminConvert: async (id: number | string, packageId: number) => {
  const response = await api.post(`/prospects/admin/${id}/convert`, {
    packageId,
    actionType: "CONVERT_REQUEST",
  });
  return response.data;
},
```

- [ ] **Step 3: Build list/detail pages**

Admin list:

- filters by status
- search by name/email/phone
- table/cards responsive
- WhatsApp direct link
- latest interested package
- status badge

Admin detail:

- profile
- interest list
- timeline notes
- follow-up form
- manual convert form visible to ADMIN only

Staff pages can re-export admin pages if permission checks and UI hide admin-only convert actions based on current role.

- [ ] **Step 4: Run dashboard checks**

```bash
cd dashboard
npm run lint
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/lib/menu-config.ts dashboard/src/app/(dashboard)/admin/prospects dashboard/src/app/(dashboard)/staff/prospects dashboard/src/services/prospectService.ts
git commit -m "feat: add calon jamaah crm dashboard"
```

---

### Task 7: Add Database-Backed Company Philosophy And Target Market

**Files:**
- Modify: `backend/src/db/schema.js`
- Create: `backend/drizzle/migrations/0013_company_profile_structured_content.sql`
- Modify: `backend/src/controllers/companyController.js`
- Modify: `backend/src/routes/public.js`
- Modify: `dashboard/src/app/(dashboard)/admin/settings/company/page.tsx`
- Modify: `frontend/src/lib/public-api.ts`

- [ ] **Step 1: Add DB fields**

In `companyProfile` schema add:

```js
philosophy: json("philosophy"),
targetMarket: json("target_market"),
```

Create migration:

```sql
ALTER TABLE `company_profile`
  ADD COLUMN `philosophy` json,
  ADD COLUMN `target_market` json;
```

Update journal.

- [ ] **Step 2: Add backend public response**

Ensure public company profile endpoint returns:

```js
{
  vision,
  mission,
  philosophy: Array.isArray(profile.philosophy) ? profile.philosophy : [],
  targetMarket: Array.isArray(profile.targetMarket) ? profile.targetMarket : [],
}
```

If no public endpoint exists, add `GET /api/public/company-profile`.

- [ ] **Step 3: Add dashboard repeater UI**

In company settings page, add two repeaters:

- Filosofi
- Target Market

Each item:

- title input
- description textarea
- add button
- remove button
- max 6 items

- [ ] **Step 4: Add frontend mapper**

In `frontend/src/lib/public-api.ts`, add `getPublicCompanyProfile()` that fetches `/public/company-profile` and returns normalized `vision`, `mission`, `philosophy`, `targetMarket`.

- [ ] **Step 5: Run checks**

```bash
cd backend
npm test
npm run check:migrations
cd ../dashboard
npm run lint
npm run build
cd ../frontend
npm run lint
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/schema.js backend/drizzle/migrations/0013_company_profile_structured_content.sql backend/drizzle/migrations/meta/_journal.json backend/src/controllers/companyController.js backend/src/routes/public.js dashboard/src/app/(dashboard)/admin/settings/company/page.tsx frontend/src/lib/public-api.ts
git commit -m "feat: add database backed brand content"
```

---

### Task 8: Add Public FAQ And Gallery Rendering To Landing

**Files:**
- Modify: `backend/src/routes/public.js`
- Modify: `backend/src/controllers/faqController.js`
- Modify: `backend/src/controllers/galleryController.js`
- Modify: `frontend/src/lib/public-api.ts`
- Modify: current landing page file after confirming active route path

- [ ] **Step 1: Add public endpoints**

Expose:

```js
router.get("/faqs", getPublicFaqs);
router.get("/gallery", getPublicGallery);
```

FAQ returns active ordered items only. Gallery returns active ordered images only.

- [ ] **Step 2: Add frontend API functions**

In `frontend/src/lib/public-api.ts`:

```ts
export const getPublicFaqs = cache(async () => {
  const payload = await fetchApi<{ faqs?: PublicFaq[] }>("/public/faqs");
  return Array.isArray(payload?.faqs) ? payload.faqs : [];
});

export const getPublicGallery = cache(async () => {
  const payload = await fetchApi<{ gallery?: PublicGalleryImage[] }>("/public/gallery");
  return Array.isArray(payload?.gallery) ? payload.gallery : [];
});
```

- [ ] **Step 3: Render sections**

In the active landing page:

- render FAQ accordion only when FAQ length > 0
- render masonry gallery only when gallery length > 0
- use lazy images
- mobile 1-2 columns
- desktop 3-4 columns

- [ ] **Step 4: Run checks**

```bash
cd backend
npm test
cd ../frontend
npm run lint
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/public.js backend/src/controllers/faqController.js backend/src/controllers/galleryController.js frontend/src/lib/public-api.ts
git add "frontend/src/app/(marketing)/page.tsx" "frontend/src/app/(marketing)/paket" frontend/src/components/marketing
git commit -m "feat: render public faq and gallery"
```

---

### Task 9: Update Landing CTAs And Incremental Redesign

**Files:**
- Modify: active landing page file
- Modify: package card/detail components or static landing renderer depending on active route state
- Modify: `frontend/src/lib/dashboard-url.ts` if needed

- [ ] **Step 1: Confirm active landing route**

Run:

```bash
cd frontend
npm run build
```

Inspect route table to identify whether `/`, `/landing`, and `/paket` are served by static `public/landing` HTML or the newer `(marketing)` route files. Apply changes only to the active route files.

- [ ] **Step 2: Update CTA URLs**

Package `Daftar Paket` CTA must link to dashboard auth with slug context:

```ts
const registerUrl = `${dashboardBaseUrl}/login?tab=register&next=${encodeURIComponent(`/calon-jamaah/packages/${pkg.slug}`)}`;
```

For already logged-in users with `CALON_JAMAAH`, link directly to:

```txt
https://dashboard.sahabatqolbu.com/calon-jamaah/packages/[slug]
```

- [ ] **Step 3: Redesign sections incrementally**

Preserve current navy/gold brand. Improve:

- hero copy hierarchy
- trust/legal section
- about section with vision/mission/philosophy
- target market section
- package CTA clarity
- mobile spacing

Do not replace the entire visual language in one pass.

- [ ] **Step 4: Verify responsive behavior**

Run local frontend and capture desktop/mobile screenshots with Playwright if available:

```bash
cd frontend
npm run dev
npx playwright screenshot http://localhost:3000 landing-desktop.png --viewport-size=1440,1200
npx playwright screenshot http://localhost:3000 landing-mobile.png --viewport-size=390,1200
```

- [ ] **Step 5: Run checks and commit**

```bash
cd frontend
npm run lint
npm run build
git add "frontend/src/app/(marketing)/page.tsx" "frontend/src/app/(marketing)/paket" frontend/src/components/marketing frontend/src/lib/dashboard-url.ts
git commit -m "feat: polish landing calon jamaah funnel"
```

---

### Task 10: Final Hardening And Production Verification

**Files:**
- Modify: `backend/src/middlewares/rateLimiter.js`
- Modify: auth-related backend/dashboard files as needed
- Modify: `docs/DEPLOYMENT_RUNBOOK.md`

- [ ] **Step 1: Harden auth limits**

Ensure these paths are rate limited:

- `/api/auth/login`
- `/api/auth/register/calon-jamaah`
- `/api/auth/request-otp`
- `/api/auth/forgot-password/request-otp`
- `/api/auth/forgot-password/reset`

Add OTP cooldown if not already enforced.

- [ ] **Step 2: Document optional CAPTCHA env defaults**

Backend env docs:

```env
TURNSTILE_ENABLED=false
TURNSTILE_SECRET_KEY=
```

Dashboard env docs:

```env
NEXT_PUBLIC_TURNSTILE_ENABLED=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

- [ ] **Step 3: Full verification**

Run:

```bash
cd backend
npm test
npm run check:migrations
npm run check:api-contract
cd ../dashboard
npm run lint
npm run build
cd ../frontend
npm run lint
npm run build
```

Manual staging checks:

- register as calon jamaah
- verify OTP
- land at `/calon-jamaah`
- save package interest
- admin sees lead and follow-up timeline
- calon jamaah converts with selected package
- user role becomes `JAMAAH`
- user lands at `/jamaah/onboarding`
- admin sees jamaah in existing verification flow
- landing FAQ/gallery render from database
- mobile dashboard is usable at 390px width

- [ ] **Step 4: Commit**

```bash
git add backend/src/middlewares/rateLimiter.js docs/DEPLOYMENT_RUNBOOK.md
git commit -m "chore: harden calon jamaah auth rollout"
```

---

## Deployment Notes

1. Deploy backend migration before enabling dashboard frontend that can create `CALON_JAMAAH`.
2. Confirm production MySQL accepts enum modification for `users.role`.
3. Set backend env for cookie/domain exactly as current production uses.
4. Deploy dashboard after backend register/prospect APIs are live.
5. Deploy frontend landing CTA changes after dashboard register tab is live.
6. Keep CAPTCHA disabled until Cloudflare Turnstile domain keys are available.

## Rollback Notes

- If dashboard register has issues, hide register tab and keep login active.
- If prospect conversion has issues, disable `Daftar Jadi Jamaah` CTA and keep consultation CTA.
- If landing content endpoints fail, hide FAQ/gallery/structured sections rather than showing dummy fallback.
- Do not remove `CALON_JAMAAH` enum from production without first migrating users out of that role.
