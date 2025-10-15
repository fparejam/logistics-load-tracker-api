import { useState, useMemo } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import {
  usePasswordValidation,
  usePasswordMatch,
  useEmailValidation,
} from "@/hooks/use-password-validation";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormState {
  data: FormData;
  isLoading: boolean;
  isSignUp: boolean;
  passwordTouched: boolean;
  emailTouched: boolean;
}

export function useLoginForm() {
  const { signIn } = useAuthActions();

  const [state, setState] = useState<FormState>({
    data: { name: "", email: "", password: "", confirmPassword: "" },
    isLoading: false,
    isSignUp: false,
    passwordTouched: false,
    emailTouched: false,
  });

  const passwordValidation = usePasswordValidation(state.data.password);
  const passwordsMatch = usePasswordMatch(
    state.data.password,
    state.data.confirmPassword,
  );
  const emailValidation = useEmailValidation(state.data.email);

  const isFormValid = useMemo(() => {
    const { name, email, password } = state.data;

    if (state.isSignUp) {
      return (
        passwordValidation.isValid &&
        passwordsMatch &&
        emailValidation.isValid &&
        name.trim() &&
        email.trim()
      );
    }

    return emailValidation.isValid && password;
  }, [
    state.data,
    state.isSignUp,
    passwordValidation.isValid,
    passwordsMatch,
    emailValidation.isValid,
  ]);

  const updateField = (field: keyof FormData, value: string) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }));
  };

  const toggleMode = () => {
    setState((prev) => ({
      ...prev,
      isSignUp: !prev.isSignUp,
      passwordTouched: false,
      emailTouched: false,
      data: { ...prev.data, password: "", confirmPassword: "" },
    }));
  };

  const setPasswordTouched = () => {
    setState((prev) => ({ ...prev, passwordTouched: true }));
  };

  const setEmailTouched = () => {
    setState((prev) => ({ ...prev, emailTouched: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      if (!emailValidation.isValid) {
        toast.error("Please enter a valid email address");
      } else if (state.isSignUp && !passwordValidation.isValid) {
        toast.error("Please ensure your password meets all requirements");
      } else if (state.isSignUp && !passwordsMatch) {
        toast.error("Passwords do not match");
      }
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const formData = new FormData();
      formData.append("email", state.data.email);
      formData.append("password", state.data.password);

      if (state.isSignUp) {
        formData.append("name", state.data.name);
        formData.append("flow", "signUp");
      } else {
        formData.append("flow", "signIn");
      }

      await signIn("password", formData);
    } catch (error) {
      if (state.isSignUp) {
        console.log("error", error);
        toast.error("Failed to create account. Email may already be in use.");
      } else {
        toast.error("Invalid email or password");
      }
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return {
    ...state,
    passwordValidation,
    passwordsMatch,
    emailValidation,
    isFormValid,
    updateField,
    toggleMode,
    setPasswordTouched,
    setEmailTouched,
    handleSubmit,
  };
}
