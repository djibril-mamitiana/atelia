import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
  lastName: z.string().trim().min(1, "Le nom est requis").max(80),
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export const addressSchema = z.object({
  label: z.string().trim().max(60).optional().or(z.literal("")),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  line1: z.string().trim().min(1, "Adresse requise").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Ville requise").max(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4,10}$/, "Code postal invalide"),
  country: z.string().trim().min(2).max(2).default("FR"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;
