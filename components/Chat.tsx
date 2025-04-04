import { useBearStore } from "@/hooks/useBearStore";
import { faker } from "@faker-js/faker";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { IoIosMore } from "react-icons/io";

const Button = ({
  children,
  onClick,
  selected,
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  selected?: boolean;
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "aspect-squar cursor-pointer p-3",
        selected && "bg-secondary rounded-xl"
      )}
    >
      {children}
    </div>
  );
};

const Header = () => {
  const BUTTON_SIZE = 20;
  const { openDetails, toggleOpenDetails } = useBearStore((state) => state);
  const convo = useBearStore((state) => state.selectedConvo);

  return (
    <div className="py-4 flex justify-between items-center">
      <div>
        <div className="text-2xl font-bold">{convo?.name}</div>
        <div>{convo?.members.length} members</div>
      </div>
      <div className="flex gap-x-2 items-center">
        <Button selected={openDetails} onClick={toggleOpenDetails}>
          <BsLayoutSidebarInsetReverse size={BUTTON_SIZE} />
        </Button>
        <Button>
          <IoIosMore size={BUTTON_SIZE} />
        </Button>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <div className="bg-secondary py-6 px-8 rounded-2xl">Write a message...</div>
  );
};

const Message = ({ name, message }: { name: string; message: string }) => {
  return (
    <div className="grid grid-cols-[auto_1fr]">
      <div className="w-20 flex items-start justify-start">
        <div className="bg-secondary w-15 aspect-square rounded-xl"></div>
      </div>
      <div>
        <div className="flex gap-x-2 items-center">
          <div className="mb-1 font-bold text-gray-300">{name}</div>
          <div className="text-xs text-gray-500">2025-03-29 9:36 PM</div>
        </div>
        <div className="text-gray-400">{message}</div>
      </div>
    </div>
  );
};

const MessagesArea = () => {
  const [data, setData] = useState<{ name: string; message: string }[]>([]);

  useEffect(() => {
    setData(
      [...Array(30).keys()].map(() => ({
        name: faker.person.fullName(),
        message: faker.lorem.sentences({ min: 1, max: 3 }),
      }))
    );
  }, []);

  return (
    <div className="relative mb-4">
      <div className="absolute max-h-full bottom-0 left-0 o overflow-auto w-full grid gap-y-6">
        {data.map(({ name, message }, index) => (
          <Message key={index} name={name} message={message} />
        ))}
      </div>
    </div>
  );
};

const Chat = () => {
  return (
    <div className="p-8 grid grid-rows-[auto_1fr_auto] gap-y-4">
      <Header />
      <MessagesArea />
      <Footer />
    </div>
  );
};

export default Chat;
