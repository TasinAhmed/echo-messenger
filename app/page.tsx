"use client";
import ChatDetails from "@/components/ChatDetails";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import React from "react";

const Home = () => {
  return (
    <div className="bg-primary">
      <Navbar />
      <Main />
      <ChatDetails />
    </div>
  );
};

export default Home;
