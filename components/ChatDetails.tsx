import { useMainStore } from "@/hooks/useMainStore";
import clsx from "clsx";
import { useMemo } from "react";
import { Avatar, AvatarImage } from "./ui/avatar";

const ChatDetails = () => {
  const openDetails = useMainStore((state) => state.openDetails);
  const selectedConvo = useMainStore((state) => state.selectedConvo);

  const users = useMemo(
    () => new Map(selectedConvo?.members.map((m) => [m.memberId, m.user])),
    [selectedConvo]
  );

  return (
    <div
      className={clsx(
        "relative transition-[width] ease-in-out",
        openDetails ? "w-80" : "w-0"
      )}
    >
      <div className="p-8 absolute w-80 h-full left-0 top-0 box-border">
        <div className="text-xl mb-6">Members</div>
        <div className="grid gap-y-4">
          {[...users.values()].map((u) => (
            <div key={u.id} className="flex items-center gap-x-2">
              <Avatar>
                <AvatarImage src={u.image} />
              </Avatar>
              <div>{u.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatDetails;
