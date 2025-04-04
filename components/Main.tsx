import clsx from "clsx";
import Chat from "./Chat";
import Conversations from "./Conversations";
import { useBearStore } from "@/hooks/useBearStore";

const Main = () => {
  const openDetails = useBearStore((state) => state.openDetails);

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
      <Chat />
    </div>
  );
};

export default Main;
