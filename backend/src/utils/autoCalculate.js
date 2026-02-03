// =====================================================
// AUTO CALCULATE UTILITIES
// =====================================================

/**
 * Calculate age from birthDate
 */
export function calculateAge(birthDate) {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate harga final
 */
export function calculateHargaFinal(
  hargaPaket,
  potonganFeeAgen = 0,
  potonganPoinAgen = 0,
  potonganCashbackKK = 0
) {
  const paket = parseFloat(hargaPaket) || 0;
  const fee = parseFloat(potonganFeeAgen) || 0;
  const poin = parseFloat(potonganPoinAgen) || 0;
  const cashback = parseFloat(potonganCashbackKK) || 0;

  return paket - fee - poin - cashback;
}

/**
 * Calculate outstanding
 */
export function calculateOutstanding(hargaFinal, totalPayment = 0) {
  const final = parseFloat(hargaFinal) || 0;
  const paid = parseFloat(totalPayment) || 0;

  return final - paid;
}

/**
 * Determine status payment
 */
export function getStatusPayment(outstanding, totalPayment) {
  const out = parseFloat(outstanding) || 0;
  const paid = parseFloat(totalPayment) || 0;

  if (out <= 0) return "LUNAS";
  if (paid > 0) return "CICILAN";
  return "BELUM_BAYAR";
}

/**
 * Generate booking number: JMH-2025-001
 */
export function generateBookingNumber(year, sequence) {
  return `JMH-${year}-${String(sequence).padStart(3, "0")}`;
}

/**
 * Get next booking sequence for current year
 */
export async function getNextBookingSequence(db, jamaahData) {
  const currentYear = new Date().getFullYear();
  const prefix = `JMH-${currentYear}-`;

  const { sql } = await import("drizzle-orm");

  const result = await db
    .select({
      maxNumber: sql`MAX(CAST(SUBSTRING(booking_number, ${
        prefix.length + 1
      }) AS UNSIGNED))`,
    })
    .from(jamaahData)
    .where(sql`booking_number LIKE '${prefix}%'`);

  const lastSequence = result[0]?.maxNumber || 0;
  return lastSequence + 1;
}
