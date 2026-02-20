import {
  isReasonRequiredForStatus,
  isTransactionTransitionAllowed,
} from "./transactionState.js";

export const validateTransactionStatusChange = ({
  currentStatus,
  nextStatus,
  remarks,
}) => {
  if (!currentStatus || !nextStatus) {
    return {
      ok: false,
      code: "INVALID_STATUS",
      message: "Status transaksi tidak valid",
    };
  }

  if (currentStatus === nextStatus) {
    return {
      ok: true,
      unchanged: true,
      normalizedRemarks:
        typeof remarks === "string" ? remarks.trim() : undefined,
    };
  }

  if (!isTransactionTransitionAllowed(currentStatus, nextStatus)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `Perubahan status dari ${currentStatus} ke ${nextStatus} tidak diizinkan`,
    };
  }

  const normalizedRemarks =
    typeof remarks === "string" ? remarks.trim() : undefined;

  if (isReasonRequiredForStatus(nextStatus) && !normalizedRemarks) {
    return {
      ok: false,
      code: "REASON_REQUIRED",
      message: `Alasan wajib diisi untuk status ${nextStatus}`,
    };
  }

  return {
    ok: true,
    unchanged: false,
    normalizedRemarks,
  };
};
