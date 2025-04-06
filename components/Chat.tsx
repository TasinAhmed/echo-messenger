import { CustomConvoUser } from "@/app/api/conversations/route";
import { message } from "@/db/schemas";
import { useBearStore } from "@/hooks/useBearStore";
import { authClient } from "@/utils/auth-client";
import { http } from "@/utils/http";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import dayjs from "dayjs";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { IoIosMore } from "react-icons/io";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

type Message = InferSelectModel<typeof message>;

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

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
  const { selectedConvo } = useBearStore((state) => state);
  const users = new Map(
    selectedConvo?.members.map((m) => [m.memberId, m.user])
  );
  const messageMutation = useMutation({
    mutationFn: () =>
      sendMessage({
        conversationId: selectedConvo?.id as string,
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
    },
  });
  const { data, refetch } = useQuery({
    queryKey: ["messages"],
    queryFn: () => fetchMessages(selectedConvo?.id as string),
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

const Message = ({
  data,
  user,
  isNew,
}: {
  data: Message;
  user: CustomConvoUser;
  isNew: boolean;
}) => {
  const [formattedTime, setFormattedTime] = useState(() =>
    formatDate(data.createdAt)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setFormattedTime(formatDate(data.createdAt));
    }, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, [data.createdAt]);

  return (
    <div
      className={clsx(
        "grid grid-cols-[auto_1fr] gap-x-4",
        isNew ? "mt-8" : "mt-1"
      )}
    >
      <div className="relative w-14">
        {isNew && (
          <div className=" absolute top-0 left-0 overflow-hidden">
            <Image
              src={user?.image}
              alt="Conversation image"
              objectFit="cover"
              width={56}
              height={56}
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

            if (e.key === "Enter") {
              messageMutation.mutate();
            }
          }}
        />
      </div>
    </div>
  );
};

export default Chat;
