"use client";
import React from "react";
import { authClient } from "@/utils/auth-client";
import { redirect } from "next/navigation";

const signUp = async () => {
  const {} = await authClient.signUp.email(
    {
      email: "atasin1998@gmail.com",
      password: "tasin123",
      name: "Tasin Ahmed",
    },
    {
      onSuccess: () => {
        redirect("/");
      },
    }
  );
};

const Register = () => {
  return (
    <div>
      <button onClick={signUp}>Register</button>
    </div>
  );
};

export default Register;
