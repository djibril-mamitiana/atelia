/**
 * Status-history comments written by the system (checkout, webhooks, seed,
 * the admin "confirm transfer" shortcut) are stored as French text. Matching
 * them exactly lets the order timeline show them in the visitor's language;
 * anything typed by staff doesn't match and is shown untouched.
 */
export const SYSTEM_HISTORY_COMMENTS: Record<string, string> = {
  "Commande créée, en attente de paiement.": "historyCreatedPayment",
  "Commande créée, en attente de virement bancaire.": "historyCreatedTransfer",
  "Paiement confirmé.": "historyPaymentConfirmed",
  "Commande en cours de préparation.": "historyPreparing",
  "Colis remis au transporteur.": "historyShipped",
  "Colis en cours de livraison.": "historyOutForDelivery",
  "Colis livré.": "historyDelivered",
  "Paiement échoué ou expiré — commande annulée.": "historyPaymentFailed",
  "Commande remboursée.": "historyRefunded",
  "Virement bancaire reçu — commande confirmée.": "historyTransferReceived",
};
