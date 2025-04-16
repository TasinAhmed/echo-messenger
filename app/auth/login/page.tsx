"use client";
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
import { cn } from "@/lib/utils";
import { authClient } from "@/utils/auth-client";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { z } from "zod";

const ErrorMsg = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("text-xs text-red-400", className)}>{children}</div>
  );
};

const initialLoginData = {
  email: "",
  password: "",
};
const initialRegisterData = {
  email: "",
  password: "",
  name: "",
  confirmPassword: "",
};

function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const registerSchema = z
    .object({
      name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(100, { message: "Name must be less than 100 characters." }),
      email: z.string().email({ message: "Invalid email address." }),
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/[a-z]/, {
          message: "Password must include at least one lowercase letter.",
        })
        .regex(/[A-Z]/, {
          message: "Password must include at least one uppercase letter.",
        })
        .regex(/[0-9]/, {
          message: "Password must include at least one number.",
        })
        .regex(/[^a-zA-Z0-9]/, {
          message: "Password must include at least one special character.",
        }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
  const [reqError, setReqError] = useState<string | undefined>();

  const loginSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(1, { message: "Password is required." }),
  });

  const [loginErrors, setLoginErrors] = useState<z.inferFlattenedErrors<
    typeof loginSchema
  > | null>();

  const [registerErrors, setRegisterErrors] = useState<z.inferFlattenedErrors<
    typeof registerSchema
  > | null>();

  type LoginType = z.infer<typeof loginSchema>;

  type RegisterType = z.infer<typeof registerSchema>;

  const [loginData, setLoginData] = useState<LoginType>(initialLoginData);
  const [registerData, setRegisterData] =
    useState<RegisterType>(initialRegisterData);
  const [view, setView] = useState<"login" | "register">("login");

  const toggleView = () => {
    if (view === "register") {
      setView("login");
    } else {
      setView("register");
    }
  };

  const resetData = useCallback(() => {
    setLoginData(initialLoginData);
    setRegisterData(initialRegisterData);
    setLoginErrors(null);
    setRegisterErrors(null);
    setReqError(undefined);
  }, []);

  useEffect(() => {
    resetData();
  }, [view, resetData]);

  useEffect(() => {
    setLoginErrors(null);
    setRegisterErrors(null);
    setReqError(undefined);
  }, [loginData, registerData]);

  const Login = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const res = loginSchema.safeParse(loginData);
    console.log("login", res, loginData);

    if (!res.success) {
      setLoginErrors(res.error.flatten());
      return;
    }

    await authClient.signIn.email(loginData, {
      onSuccess: () => {
        router.push("/");
      },
      onError: (e) => {
        setReqError(e.error.message);
      },
    });
  };

  const Register = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const res = registerSchema.safeParse(registerData);

    if (!res.success) {
      setRegisterErrors(res.error.flatten());
      return;
    }

    await authClient.signUp.email(registerData, {
      onSuccess: () => {
        router.push("/");
      },
      onError: (e) => {
        setReqError(e.error.message);
      },
    });
  };

  useEffect(() => {
    console.log(loginErrors, registerErrors);
  }, [loginErrors, registerErrors]);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          {view === "login" ? (
            <CardTitle className="text-xl">Welcome back</CardTitle>
          ) : (
            <CardTitle className="text-xl">Create an account</CardTitle>
          )}
          <CardDescription>
            {view === "login" ? "Login" : "Sign up"} with your Github or Google
            account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 cursor-pointer"
                  onClick={async () => {
                    await authClient.signIn.social({
                      provider: "github",
                    });
                  }}
                >
                  <FaGithub size={16} />
                  {view === "login" ? "Login" : "Sign up"} with Github
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 cursor-pointer"
                  onClick={async () => {
                    await authClient.signIn.social({
                      provider: "google",
                    });
                  }}
                >
                  <FaGoogle size={16} />
                  {view === "login" ? "Login" : "Sign up"} with Google
                </Button>
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-4">
                {view === "login" ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                      />
                      {loginErrors?.fieldErrors.email && (
                        <ErrorMsg>{loginErrors.fieldErrors.email}</ErrorMsg>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
                      />
                      {loginErrors?.fieldErrors.password && (
                        <ErrorMsg>{loginErrors.fieldErrors.password}</ErrorMsg>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      onClick={Login}
                    >
                      Login
                    </Button>
                    <ErrorMsg className="text-center">{reqError}</ErrorMsg>
                  </>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            name: e.target.value,
                          })
                        }
                      />
                      {registerErrors?.fieldErrors.name && (
                        <ErrorMsg>{registerErrors.fieldErrors.name}</ErrorMsg>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email-r"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                      />
                      {registerErrors?.fieldErrors.email && (
                        <ErrorMsg>{registerErrors.fieldErrors.email}</ErrorMsg>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                      </div>
                      <Input
                        id="password-r"
                        type="password"
                        required
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                      />
                      {registerErrors?.fieldErrors.password && (
                        <ErrorMsg>
                          {registerErrors.fieldErrors.password[0]}
                        </ErrorMsg>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Confirm password</Label>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                      {registerErrors?.fieldErrors.confirmPassword && (
                        <ErrorMsg>
                          {registerErrors.fieldErrors.confirmPassword}
                        </ErrorMsg>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      onClick={Register}
                    >
                      Register
                    </Button>
                    <ErrorMsg className="text-center">{reqError}</ErrorMsg>
                  </>
                )}
              </div>
              <div className="text-center text-sm">
                {view === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <a
                      href="#"
                      className="underline underline-offset-4"
                      onClick={toggleView}
                    >
                      Sign up
                    </a>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <a
                      href="#"
                      className="underline underline-offset-4"
                      onClick={toggleView}
                    >
                      Sign in
                    </a>
                  </>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const Login = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Logo" width={100} height={100} />
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
