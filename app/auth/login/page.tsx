"use client";
import { authClient } from "@/utils/auth-client";
import { redirect } from "next/navigation";
import React, { useState } from "react";

const Login = () => {
  const [formData, setFormData] = useState<{ email: string; password: string }>(
    {
      email: "",
      password: "",
    }
  );

  const signIn = async () =>
    await authClient.signIn.email(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: () => {
          redirect("/");
        },
      }
    );

  return (
    <div>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <button onClick={signIn}>Login</button>
    </div>
  );
};

export default Login;
