export const VALID_TRANSACTION_STATUS_TRANSITIONS = {
  PENDING: ["PARTIAL", "PAID", "CANCELLED"],
  PARTIAL: ["PAID", "CANCELLED"],
  PAID: ["VERIFIED", "CANCELLED", "REFUNDED"],
  VERIFIED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const REASON_REQUIRED_STATUSES = new Set(["CANCELLED", "REFUNDED"]);

export const isTransactionTransitionAllowed = (fromStatus, toStatus) => {
  const allowed = VALID_TRANSACTION_STATUS_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};

export const isReasonRequiredForStatus = (status) =>
  REASON_REQUIRED_STATUSES.has(status);
