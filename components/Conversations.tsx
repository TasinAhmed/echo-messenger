import { CustomConvoType } from "@/app/api/conversations/route";
import { message } from "@/db/schemas";
import { useMainStore } from "@/hooks/useMainStore";
import { useSocketStore } from "@/hooks/useSocketStore";
import { http } from "@/utils/http";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import dayjs from "dayjs";
import { InferSelectModel } from "drizzle-orm";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { CiSearch } from "react-icons/ci";

function getRelativeTimeShort(date: Date) {
  const now = dayjs();
  const input = dayjs(date);

  const minutes = now.diff(input, "minute");
  const hours = now.diff(input, "hour");
  const days = now.diff(input, "day");
  const weeks = now.diff(input, "week");
  const months = now.diff(input, "month");
  const years = now.diff(input, "year");

  if (minutes < 1) return `1m`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (weeks < 4) return `${weeks}w`;
  if (months < 12) return `${months}mo`;
  return `${years}y`;
}

const useConversations = () => {
  const fetchUserConversations = async (): Promise<CustomConvoType[]> => {
    const response = await http({ path: "/conversations", method: "GET" });

    return await response?.json();
  };
  const { socket } = useSocketStore((state) => state);

  const [convoMap, setConvoMap] = useState<Map<string, CustomConvoType>>(
    new Map()
  );

  const convoMapRef = useRef(convoMap);

  const updateLatestMessage = (data: InferSelectModel<typeof message>) => {
    let newMap = new Map(convoMapRef.current);
    const convoData = convoMapRef.current.get(data.conversationId);

    if (!convoData) return;

    console.log(data.createdAt, "time");

    newMap.delete(data.conversationId);
    newMap = new Map([
      [
        data.conversationId,
        { ...convoData, updatedAt: data.createdAt, messages: [data] },
      ],
      ...Array.from(newMap.entries()),
    ]);
    setConvoMap(newMap);
  };

  useEffect(() => {
    convoMapRef.current = convoMap;
  }, [convoMap]);

  useEffect(() => {
    socket?.on("updateLatestMessage", updateLatestMessage);

    return () => {
      socket?.off("updateLatestMessage", updateLatestMessage);
    };
  }, [socket]);

  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchUserConversations,
  });

  useEffect(() => {
    if (!data) return;

    setConvoMap(new Map(data.map((convo) => [convo.id, convo])));
  }, [data]);

  const convoValues = useMemo(() => {
    return [...convoMap.values()];
  }, [convoMap]);

  return { convoValues };
};

const ConversationItem = ({ data }: { data: CustomConvoType }) => {
  const { selectedConvo, setSelectedConvo } = useMainStore((state) => state);
  const users = useMemo(() => {
    return new Map(data.members.map((m) => [m.memberId, m.user]));
  }, [data.members]);
  const lastMsg = data.messages[0];
  const lastMsgSender = users?.get(lastMsg?.senderId)?.name.split(" ")[0];
  const [formattedTime, setFormattedTime] = useState(() =>
    getRelativeTimeShort(data.updatedAt)
  );

  useEffect(() => {
    const update = () => setFormattedTime(getRelativeTimeShort(data.updatedAt));

    update(); // immediate call

    // How much time until next minute from updatedAt
    const msSinceUpdate = dayjs().diff(dayjs(data.updatedAt));
    const msUntilNextMinute = 60 * 1000 - (msSinceUpdate % (60 * 1000));

    const timeout = setTimeout(() => {
      update();
      const interval = setInterval(update, 60 * 1000);

      // Clean up interval later
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(timeout);
  }, [data.updatedAt]);

  return (
    <div
      onClick={() => {
        if (selectedConvo?.id !== data.id) {
          setSelectedConvo(data);
        }
      }}
      className={clsx(
        "rounded-2xl p-4 cursor-pointer grid grid-cols-[auto_1fr] min-w-0 gap-x-4",
        selectedConvo?.id === data.id && "bg-secondary"
      )}
    >
      <div className="w-15 h-15 relative rounded-xl overflow-hidden">
        <Image
          src="/profile.png"
          alt="Conversation image"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
          width={100}
          height={100}
        />
      </div>
      <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">
        <div className="flex items-center gap-x-4 justify-between">
          <div className="whitespace-nowrap overflow-hidden overflow-ellipsis font-bold">
            {data.name}
          </div>
          <div className="text-sm text-gray-500">{formattedTime}</div>
        </div>
        <div className="whitespace-nowrap overflow-hidden overflow-ellipsis text-gray-400 text-sm">
          {lastMsg ? `${lastMsgSender}: ${lastMsg.message}` : "NULL"}
        </div>
      </div>
    </div>
  );
};

const Conversations = () => {
  const { convoValues } = useConversations();

  return (
    <div className="p-8 w-115 grid grid-rows-[auto_1fr]">
      <div className="bg-secondary h-14 rounded-2xl mb-4 flex items-center px-4 gap-x-3">
        <CiSearch size={24} />
        <input className="outline-0 w-full" placeholder="Search" />
      </div>
      <div className="h-full max-h-full overflow-y-auto relative overflow-x-hidden">
        <div className="grid gap-y-2 absolute h-full w-full left-0 top-0 min-h-0 min-w-0">
          {convoValues.map((convo) => (
            <ConversationItem key={convo.id} data={convo} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Conversations;
