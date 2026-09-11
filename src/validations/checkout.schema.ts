import { z } from "zod";
import { addressSchema } from "@/validations/auth.schema";

export const checkoutContactSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export const checkoutAddressStepSchema = z.object({
  shippingAddressId: z.string().min(1, "Choisissez une adresse de livraison").optional(),
  billingAddressId: z.string().min(1).optional(),
  useSameForBilling: z.boolean().default(true),
  newAddress: addressSchema.optional(),
});

export const checkoutShippingMethodSchema = z.object({
  method: z.enum(["STANDARD", "EXPRESS", "PICKUP"]),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, "Code requis").max(40),
});
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, "Adresse de livraison requise"),
  billingAddressId: z.string().min(1, "Adresse de facturation requise"),
  shippingMethod: z.enum(["STANDARD", "EXPRESS", "PICKUP"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  customerNote: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
