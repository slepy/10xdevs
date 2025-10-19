import { z } from "zod";

/**
 * Schema walidacji dla logowania
 */
export const loginSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
  password: z.string().min(1, "Hasło jest wymagane").min(8, "Hasło musi mieć minimum 8 znaków"),
});

/**
 * Schema walidacji dla rejestracji
 */
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "Imię jest wymagane")
      .min(2, "Imię musi mieć minimum 2 znaki")
      .max(50, "Imię może mieć maksymalnie 50 znaków")
      .refine((val) => /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż\s]+$/.test(val), "Imię może zawierać tylko litery"),
    lastName: z
      .string()
      .trim()
      .min(1, "Nazwisko jest wymagane")
      .min(2, "Nazwisko musi mieć minimum 2 znaki")
      .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
      .refine((val) => /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż\s]+$/.test(val), "Nazwisko może zawierać tylko litery"),
    email: z
      .string()
      .trim()
      .min(1, "E-mail jest wymagany")
      .email("Nieprawidłowy format e-mail")
      .max(100, "E-mail może mieć maksymalnie 100 znaków"),
    password: z
      .string()
      .min(1, "Hasło jest wymagane")
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .max(128, "Hasło może mieć maksymalnie 128 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Hasło musi zawierać co najmniej jeden znak specjalny"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema walidacji dla aktualizacji profilu użytkownika
 */
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "Imię musi mieć minimum 2 znaki")
    .max(50, "Imię może mieć maksymalnie 50 znaków")
    .regex(/^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż\s]+$/, "Imię może zawierać tylko litery")
    .optional(),
  lastName: z
    .string()
    .min(2, "Nazwisko musi mieć minimum 2 znaki")
    .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
    .regex(/^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż\s]+$/, "Nazwisko może zawierać tylko litery")
    .optional(),
});

/**
 * Typy inferred z schematów walidacji
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
