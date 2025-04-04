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
      <div className="bg-primary h-screen w-screen grid grid-cols-[auto_1fr_auto] text-white">
        <Navbar />
        <Main />
        <ChatDetails />
      </div>
    </QueryClientProvider>
  );
};

export default Home;
