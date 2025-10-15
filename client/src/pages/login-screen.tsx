import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidationMessage } from "@/components/validation-message";
import { useLoginForm } from "@/hooks/use-loign-form";
import type {
  EmailValidation,
  PasswordValidation,
} from "@/hooks/use-password-validation";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

function SignUpFields({
  data,
  isLoading,
  updateField,
}: {
  data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  isLoading: boolean;
  updateField: (field: keyof typeof data, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        type="text"
        placeholder="Enter your name"
        value={data.name}
        onChange={(e) => updateField("name", e.target.value)}
        required
        disabled={isLoading}
      />
    </div>
  );
}

function PasswordField({
  data,
  isLoading,
  isSignUp,
  passwordTouched,
  passwordValidation,
  updateField,
  setPasswordTouched,
}: {
  data: { password: string };
  isLoading: boolean;
  isSignUp: boolean;
  passwordTouched: boolean;
  passwordValidation: PasswordValidation;
  updateField: (field: keyof typeof data, value: string) => void;
  setPasswordTouched: () => void;
}) {
  const getValidationState = () => {
    if (!isSignUp || !passwordTouched || !data.password) return "neutral";
    return passwordValidation.isValid ? "valid" : "invalid";
  };

  const showError =
    isSignUp && passwordTouched && !passwordValidation.isValid && data.password;

  return (
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <PasswordInput
        id="password"
        placeholder="Enter your password"
        value={data.password}
        onChange={(e) => updateField("password", e.target.value)}
        onBlur={setPasswordTouched}
        validationState={getValidationState()}
        required
        disabled={isLoading}
      />
      {showError && (
        <p className="text-xs text-red-500 font-medium">
          Password must be at least 6 characters with a letter and number
        </p>
      )}
    </div>
  );
}

function ConfirmPasswordField({
  data,
  isLoading,
  passwordsMatch,
  updateField,
}: {
  data: { password: string; confirmPassword: string };
  isLoading: boolean;
  passwordsMatch: boolean;
  updateField: (field: keyof typeof data, value: string) => void;
}) {
  const getValidationState = () => {
    if (!data.confirmPassword) return "neutral";
    return passwordsMatch && data.password ? "valid" : "invalid";
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="confirmPassword">Confirm Password</Label>
      <PasswordInput
        id="confirmPassword"
        placeholder="Confirm your password"
        value={data.confirmPassword}
        onChange={(e) => updateField("confirmPassword", e.target.value)}
        validationState={getValidationState()}
        required
        disabled={isLoading}
      />
      <ValidationMessage
        type="error"
        show={!!data.confirmPassword && !passwordsMatch}
      >
        Passwords do not match
      </ValidationMessage>
      <ValidationMessage
        type="success"
        show={!!data.confirmPassword && passwordsMatch && !!data.password}
      >
        Passwords match
      </ValidationMessage>
    </div>
  );
}

function EmailField({
  data,
  isLoading,
  emailTouched,
  emailValidation,
  updateField,
  setEmailTouched,
}: {
  data: { email: string };
  isLoading: boolean;
  emailTouched: boolean;
  emailValidation: EmailValidation;
  updateField: (field: keyof typeof data, value: string) => void;
  setEmailTouched: () => void;
}) {
  const getValidationState = () => {
    if (!data.email) return "neutral";
    if (!emailTouched) return "neutral";
    return emailValidation.isValid ? "valid" : "invalid";
  };

  const validationState = getValidationState();
  const showError = emailTouched && !emailValidation.isValid && data.email;

  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={data.email}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={setEmailTouched}
          className={cn(
            "pr-9 transition-all duration-200",
            validationState === "valid" &&
              "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/20",
            validationState === "invalid" &&
              "border-red-300 focus:border-red-400 focus:ring-red-400/20",
          )}
          required
          disabled={isLoading}
        />
        {validationState === "valid" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
        )}
        {validationState === "invalid" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
        )}
      </div>
      {showError && (
        <p className="text-xs text-red-500 font-medium">
          Please enter a valid email address
        </p>
      )}
    </div>
  );
}

export function LoginPage() {
  const {
    data,
    isLoading,
    isSignUp,
    passwordTouched,
    emailTouched,
    passwordValidation,
    passwordsMatch,
    emailValidation,
    isFormValid,
    updateField,
    toggleMode,
    setPasswordTouched,
    setEmailTouched,
    handleSubmit,
  } = useLoginForm();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-0">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-medium">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Sign up to start using the chat application"
              : "Sign in to access the chat application"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <SignUpFields
                data={data}
                isLoading={isLoading}
                updateField={updateField}
              />
            )}

            <EmailField
              data={data}
              isLoading={isLoading}
              emailTouched={emailTouched}
              emailValidation={emailValidation}
              updateField={updateField}
              setEmailTouched={setEmailTouched}
            />

            <PasswordField
              data={data}
              isLoading={isLoading}
              isSignUp={isSignUp}
              passwordTouched={passwordTouched}
              passwordValidation={passwordValidation}
              updateField={updateField}
              setPasswordTouched={setPasswordTouched}
            />

            {isSignUp && (
              <ConfirmPasswordField
                data={data}
                isLoading={isLoading}
                passwordsMatch={passwordsMatch}
                updateField={updateField}
              />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !isFormValid}
            >
              {isLoading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
