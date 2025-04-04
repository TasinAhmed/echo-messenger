import { useBearStore } from "@/hooks/useBearStore";
import clsx from "clsx";

const ChatDetails = () => {
  const openDetails = useBearStore((state) => state.openDetails);

  return (
    <div className={clsx("p-8", openDetails ? "block" : "hidden")}>
      <div className="w-80 text-xl">Chat Details</div>
    </div>
  );
};

export default ChatDetails;
