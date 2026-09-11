import "server-only";

/** Bank details shown to customers for manual transfer payments. */
export function getBankTransferDetails() {
  return {
    holder: process.env.BANK_TRANSFER_HOLDER || "À renseigner",
    iban: process.env.BANK_TRANSFER_IBAN || "À renseigner",
    bic: process.env.BANK_TRANSFER_BIC || "À renseigner",
    bankName: process.env.BANK_TRANSFER_BANK_NAME || "À renseigner",
  };
}

export function isBankTransferConfigured(): boolean {
  return Boolean(
    process.env.BANK_TRANSFER_IBAN &&
      process.env.BANK_TRANSFER_IBAN !== "À renseigner" &&
      process.env.BANK_TRANSFER_BIC &&
      process.env.BANK_TRANSFER_BIC !== "À renseigner"
  );
}
