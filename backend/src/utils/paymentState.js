export const deriveJamaahPaymentState = ({
  hargaFinal,
  totalPayment,
}) => {
  const totalPrice = Number.parseFloat(hargaFinal || "0") || 0;
  const paid = Number.parseFloat(totalPayment || "0") || 0;
  const outstanding = Math.max(totalPrice - paid, 0);

  let statusPayment = "BELUM_BAYAR";
  if (paid > 0 && outstanding > 0) {
    statusPayment = "CICILAN";
  } else if (totalPrice > 0 && outstanding <= 0) {
    statusPayment = "LUNAS";
  }

  return {
    hargaFinal: totalPrice,
    totalPayment: paid,
    outstanding,
    statusPayment,
  };
};
