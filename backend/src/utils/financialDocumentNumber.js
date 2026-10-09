export const financialNumberPrefix = (type, date) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta",
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${type === "INVOICE" ? "INV" : "KWT"}/SQ/${parts.year}/${parts.day}${parts.month}`;
};

export const nextFinancialNumber = (prefix, existingNumbers) => {
  const sequence = Math.max(0, ...existingNumbers.map((number) => Number(number.slice(prefix.length))).filter(Number.isInteger)) + 1;
  return `${prefix}${String(sequence).padStart(2, "0")}`;
};
