import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily-initialised Stripe server client — avoids throwing at import time
 *  in environments (e.g. build, or before .env is configured) that never
 *  actually call it. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set — add it to .env (see .env.example).");
  }
  _stripe = new Stripe(key, {
    apiVersion: "2026-08-26.dahlia",
  });
  return _stripe;
}
