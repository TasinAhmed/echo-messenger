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
import { MouseEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { IoClose } from "react-icons/io5";

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
  const [search, setSearch] = useState("");
  const [cleanSearch, setCleanSearch] = useState("");
  const [results, setResults] = useState<CustomConvoType[]>([]);
  const fetchUserConversations = async (): Promise<CustomConvoType[]> => {
    const response = await http({ path: "/conversations", method: "GET" });

    return await response?.json();
  };
  const { socket } = useSocketStore((state) => state);

  const [convoMap, setConvoMap] = useState<Map<string, CustomConvoType>>(
    new Map()
  );
  const [convoValues, setConvoValues] = useState<CustomConvoType[]>([]);

  const convoMapRef = useRef(convoMap);

  const escapeRegExp = (string: string) => {
    return string.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  };

  useEffect(() => {
    setCleanSearch(escapeRegExp(search));
  }, [search]);

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
    setSearch("");
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

    setConvoMap(new Map(data?.map((convo) => [convo.id, convo])));
  }, [data]);

  useEffect(() => {
    setConvoValues([...convoMap.values()]);
  }, [convoMap]);

  useEffect(() => {
    if (!cleanSearch) {
      setResults([]);
      return;
    }

    const regex = new RegExp(cleanSearch, "i");

    const convoArray = Array.from(convoMap.values());
    setResults(
      convoArray.filter(
        (convo) =>
          regex.test(convo.name) ||
          convo.members.some((user) => regex.test(user.user.name))
      )
    );
  }, [cleanSearch, convoMap]);

  return { convoValues, cleanSearch, setSearch, results, search };
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
          {!lastMsg && "New Conversation"}
          {lastMsg &&
            `${lastMsgSender}: ${
              lastMsg.message
                ? lastMsg.message
                : lastMsg.file?.type.startsWith("image")
                ? "Sent a photo."
                : "Sent a video."
            }`}
        </div>
      </div>
    </div>
  );
};

const SearchItem = ({
  data,
  onClick,
}: {
  data: CustomConvoType;
  onClick: MouseEventHandler<HTMLDivElement>;
}) => {
  const { setSelectedConvo } = useMainStore((state) => state);

  return (
    <div
      onClick={(e) => {
        onClick(e);
        setSelectedConvo(data);
      }}
      className={clsx(
        "rounded-2xl p-4 cursor-pointer grid grid-cols-[auto_1fr] min-w-0 gap-x-4"
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
        </div>
        <div className="whitespace-nowrap overflow-hidden overflow-ellipsis text-gray-400 text-sm">
          {data.members.map((m) => m.user.name).join(", ")}
        </div>
      </div>
    </div>
  );
};

const Conversations = () => {
  const { convoValues, cleanSearch, setSearch, results, search } =
    useConversations();

  return (
    <div className="bg-background p-8 w-115 grid grid-rows-[auto_1fr] rounded-2xl overflow-hidden">
      <div className="bg-secondary h-14 rounded-2xl mb-4 flex items-center px-4 gap-x-3">
        <CiSearch size={24} />
        <div className="relative grow">
          <input
            className="outline-0 w-full"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {cleanSearch && (
            <div
              onClick={() => setSearch("")}
              className="cursor-pointer w-5 aspect-square bg-background rounded-full flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2"
            >
              <IoClose fill="gray" />
            </div>
          )}
        </div>
      </div>
      <div className="h-full max-h-full overflow-y-auto relative overflow-x-hidden">
        {cleanSearch && results.length === 0 && (
          <div className="text-center">No results</div>
        )}
        <div className="grid content-start gap-y-2 absolute h-full w-full left-0 top-0 min-h-0 min-w-0">
          {!cleanSearch &&
            convoValues.map((convo) => (
              <ConversationItem key={convo.id} data={convo} />
            ))}
          {cleanSearch &&
            results.map((convo) => (
              <SearchItem
                onClick={() => setSearch("")}
                key={convo.id}
                data={convo}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Conversations;
