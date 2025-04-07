import { CustomConvoUser } from "@/app/api/conversations/route";
import { message } from "@/db/schemas";
import { useMainStore } from "@/hooks/useMainStore";
import { authClient } from "@/utils/auth-client";
import { http } from "@/utils/http";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import dayjs from "dayjs";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { IoIosMore } from "react-icons/io";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useSocketStore } from "@/hooks/useSocketStore";

type Message = InferSelectModel<typeof message>;

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isSameOrAfter);

const formatTimestamp = (timestamp: Date) => {
  const date = dayjs(timestamp);

  if (date.isToday()) {
    return date.format("h:mm A"); // Example: 3:45 PM
  }
  if (date.isYesterday()) {
    return `Yesterday at ${date.format("h:mm A")}`; // Example: Yesterday at 3:45 PM
  }
  if (date.isSameOrAfter(dayjs().subtract(7, "days"), "day")) {
    return `${date.format("dddd")} at ${date.format("h:mm A")}`; // Example: Monday at 3:45 PM
  }
  if (date.isSameOrAfter(dayjs().startOf("year"))) {
    return date.format("MMM D [at] h:mm A"); // Example: Jan 5 at 3:45 PM
  }
  return date.format("MMM D, YYYY [at] h:mm A"); // Example: Jan 5, 2023, at 3:45 PM
};

function formatDate(date: string | Date): string {
  const d = dayjs(date);
  const now = dayjs();

  if (now.diff(d, "minute") < 1) {
    return "Just now";
  }

  if (now.diff(d, "hour") < 1) {
    return d.fromNow();
  }

  if (d.isToday()) {
    return `Today at ${d.format("h:mm A")}`;
  }

  if (d.isYesterday()) {
    return `Yesterday at ${d.format("h:mm A")}`;
  }

  if (now.diff(d, "day") < 7) {
    return `${d.format("dddd")} at ${d.format("h:mm A")}`;
  }

  if (now.year() === d.year()) {
    return d.format("MMM D [at] h:mm A");
  }

  return d.format("MMM D, YYYY [at] h:mm A");
}

const useMessages = () => {
  const [msgMap, setMsgMap] = useState<Map<string, Message>>(new Map());
  const [input, setInput] = useState("");
  const { data: session } = authClient.useSession();
  const { selectedConvo } = useMainStore((state) => state);
  const { socket } = useSocketStore((state) => state);

  const users = useMemo(
    () => new Map(selectedConvo?.members.map((m) => [m.memberId, m.user])),
    [selectedConvo]
  );

  const selectedConvoRef = useRef(selectedConvo);

  const usersRef = useRef(users);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    selectedConvoRef.current = selectedConvo;
  }, [selectedConvo]);

  useEffect(() => {
    const onMessage = (data: Message) => {
      if (selectedConvoRef.current?.id === data.conversationId) {
        setMsgMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.id, data);
          return newMap;
        });
      }
    };

    socket?.on("message", onMessage);

    return () => {
      socket?.off("message", onMessage);
    };
  }, [socket]);

  const messageMutation = useMutation({
    mutationFn: () =>
      sendMessage({
        conversationId: selectedConvoRef.current?.id as string,
        message: input,
        senderId: session?.user.id as string,
      }),
    onSuccess: (data) => {
      setInput("");
      setMsgMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.id, data);
        return newMap;
      });
      socket?.emit("message", {
        message: data,
        userIds: [...usersRef.current.keys()],
      });
    },
  });
  const { data, refetch } = useQuery({
    queryKey: ["messages"],
    queryFn: () => fetchMessages(selectedConvoRef.current?.id as string),
    enabled: false,
  });

  useEffect(() => {
    if (!data) return;

    setMsgMap(new Map(data.map((msg) => [msg.id, msg])));
  }, [data]);

  useEffect(() => {
    if (!selectedConvo) return;

    setMsgMap(new Map());
    refetch();
  }, [selectedConvo, refetch]);

  const messages = useMemo(() => {
    return [...msgMap.values()];
  }, [msgMap]);

  return { msgMap, messages, input, setInput, messageMutation, users };
};

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
  const { openDetails, toggleOpenDetails, selectedConvo } = useMainStore(
    (state) => state
  );

  return (
    <div className="py-4 flex justify-between items-center">
      <div>
        <div className="text-2xl font-bold">{selectedConvo?.name}</div>
        <div>{selectedConvo?.members.length} members</div>
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

const Message = ({
  data,
  user,
  isNew,
  showTime,
}: {
  data: Message;
  user: CustomConvoUser;
  isNew: boolean;
  showTime: boolean;
}) => {
  const [formattedTime, setFormattedTime] = useState(() =>
    formatDate(data.createdAt)
  );

  useEffect(() => {
    const update = () => setFormattedTime(formatDate(data.createdAt));

    update(); // immediate call

    // How much time until next minute from updatedAt
    const msSinceUpdate = dayjs().diff(dayjs(data.createdAt));
    const msUntilNextMinute = 60 * 1000 - (msSinceUpdate % (60 * 1000));

    const timeout = setTimeout(() => {
      update();
      const interval = setInterval(update, 60 * 1000);

      // Clean up interval later
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(timeout);
  }, [data.createdAt]);

  return (
    <div className={clsx(isNew ? "mt-8" : "mt-1")}>
      {showTime && (
        <div className="text-xs text-gray-500 text-center mb-8">
          {formatTimestamp(data.createdAt)}
        </div>
      )}
      <div className="grid grid-cols-[auto_1fr] gap-x-4">
        <div className="relative w-14">
          {isNew && (
            <div className=" absolute top-0 left-0 overflow-hidden">
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
                className="rounded-xl"
              />
            </div>
          )}
        </div>
        <div>
          {isNew && (
            <div className="flex gap-x-2 items-center">
              <div className="mb-1 font-bold text-gray-300">{user.name}</div>
              <div className="text-xs text-gray-500">{formattedTime}</div>
            </div>
          )}
          <div className="text-gray-400">{data.message}</div>
        </div>
      </div>
    </div>
  );
};

const fetchMessages = async (convoId: string): Promise<Message[]> => {
  const response = await http({ path: `/messages/${convoId}`, method: "GET" });

  return await response?.json();
};

const sendMessage = async (
  data: InferInsertModel<typeof message>
): Promise<Message> => {
  const response = await http({
    path: `/messages/${data.conversationId}`,
    method: "POST",
    body: data,
  });

  return await response?.json();
};

const Chat = () => {
  const { messageMutation, messages, input, setInput, users } = useMessages();

  const isNewMsg = (index: number) => {
    return (
      index === 0 ||
      Math.abs(
        dayjs(messages[index]?.createdAt).diff(
          messages[index - 1]?.createdAt,
          "minute"
        )
      ) >= 5 ||
      messages[index]?.senderId !== messages[index - 1]?.senderId
    );
  };

  const showTime = (index: number) => {
    return (
      index === 0 ||
      Math.abs(
        dayjs(messages[index]?.createdAt).diff(
          messages[index - 1]?.createdAt,
          "minute"
        )
      ) >= 5
    );
  };

  return (
    <div className="p-8 grid grid-rows-[auto_1fr_auto] gap-y-4 h-screen max-h-screen">
      <Header />
      <div className="flex flex-col-reverse overflow-y-auto">
        <div className="grid pb-4">
          {messages?.map((data, index) => {
            const user = users.get(data.senderId);

            return (
              user && (
                <Message
                  key={index}
                  data={data}
                  user={user}
                  isNew={isNewMsg(index)}
                  showTime={showTime(index)}
                />
              )
            );
          })}
        </div>
      </div>
      <div className="bg-secondary py-6 px-8 rounded-2xl">
        <input
          className="w-full outline-0"
          placeholder="Write a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (!input) return;

            if (e.key === "Enter" && !messageMutation.isPending) {
              messageMutation.mutate();
            }
          }}
        />
      </div>
    </div>
  );
};

export default Chat;
