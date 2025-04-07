import clsx from "clsx";
import Chat from "./Chat";
import Conversations from "./Conversations";
import { useMainStore } from "@/hooks/useMainStore";
import Image from "next/image";

const Main = () => {
  const { openDetails, selectedConvo } = useMainStore((state) => state);

  return (
    <div
      className={clsx(
        "bg-background grid grid-cols-[auto_1fr] overflow-hidden",
        openDetails
          ? "rounded-l-4xl rounded-r-4xl"
          : "rounded-l-4xl rounded-r-none"
      )}
    >
      <Conversations />
      {selectedConvo ? (
        <Chat />
      ) : (
        <div className="flex justify-center items-center">
          <div className="flex flex-col items-center gap-y-8">
            <Image
              src="/select-conversation.svg"
              alt="Select conversation image"
              width={300}
              height={200}
              className="opacity-30"
            />
            <div className="text-gray-500 font-bold">
              To begin, create or select conversation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
