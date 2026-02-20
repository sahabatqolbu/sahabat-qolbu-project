const PAYMENT_PROOF_PREFIXES = [
  "/uploads/payments/",
  "/api/protected-uploads/payments/",
];

export const normalizeProofPath = (proofUrl) => {
  if (!proofUrl || typeof proofUrl !== "string") {
    return null;
  }

  const trimmed = proofUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).pathname;
  } catch {
    return trimmed;
  }
};

export const isPaymentProofPathValid = (proofUrl) => {
  const normalized = normalizeProofPath(proofUrl);
  if (!normalized) {
    return false;
  }

  if (normalized.includes("..")) {
    return false;
  }

  return PAYMENT_PROOF_PREFIXES.some(
    (prefix) => normalized.startsWith(prefix) && normalized.length > prefix.length,
  );
};
