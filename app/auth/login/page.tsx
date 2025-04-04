"use client";
import { authClient } from "@/utils/auth-client";
import { redirect } from "next/navigation";
import React from "react";

const Login = () => {
  const signIn = async () =>
    await authClient.signIn.email(
      {
        email: "anais14@hotmail.com",
        password: "tasin123",
      },
      {
        onSuccess: () => {
          redirect("/");
        },
      }
    );

  return (
    <div>
      <button onClick={signIn}>Login</button>
    </div>
  );
};

export default Login;
