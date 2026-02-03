import { z } from "zod";

// =====================================================
// IMPORT EXCEL VALIDATION
// =====================================================
export const importExcelSchema = z.object({
  body: z.object({
    overwrite: z.boolean().optional().default(false),
  }),
});
