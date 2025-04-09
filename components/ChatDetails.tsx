import { useMainStore } from "@/hooks/useMainStore";
import clsx from "clsx";

const ChatDetails = () => {
  const openDetails = useMainStore((state) => state.openDetails);

  return (
    <div
      className={clsx(
        "relative transition-[width] ease-in-out",
        openDetails ? "w-80" : "w-0"
      )}
    >
      <div className="p-8 absolute w-full h-full left-0 top-0 text-xl box-border">
        Members
      </div>
    </div>
  );
};

export default ChatDetails;
