"use client";
import ChatDetails from "@/components/ChatDetails";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const queryClient = new QueryClient();

const Home = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen w-screen grid grid-cols-[1fr_auto] gap-x-4 text-white p-4">
        <Main />
        <ChatDetails />
      </div>
    </QueryClientProvider>
  );
};

export default Home;
