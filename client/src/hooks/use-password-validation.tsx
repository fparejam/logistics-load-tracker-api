import { useMemo } from "react";

export interface PasswordValidation {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

export interface EmailValidation {
  isValid: boolean;
  hasAtSymbol: boolean;
  hasDomain: boolean;
  isProperFormat: boolean;
}

export function usePasswordValidation(password: string): PasswordValidation {
  return useMemo(() => {
    const minLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isValid = minLength && hasLetter && hasNumber;

    return { minLength, hasLetter, hasNumber, isValid };
  }, [password]);
}

export function usePasswordMatch(
  password: string,
  confirmPassword: string,
): boolean {
  return useMemo(
    () => password === confirmPassword,
    [password, confirmPassword],
  );
}

export function useEmailValidation(email: string): EmailValidation {
  return useMemo(() => {
    const trimmedEmail = email.trim();
    const hasAtSymbol = trimmedEmail.includes("@");
    const parts = trimmedEmail.split("@");
    const hasDomain = parts.length === 2 && parts[1].includes(".");

    // More comprehensive email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isProperFormat = emailRegex.test(trimmedEmail);

    const isValid =
      hasAtSymbol && hasDomain && isProperFormat && trimmedEmail.length > 0;

    return { isValid, hasAtSymbol, hasDomain, isProperFormat };
  }, [email]);
}
