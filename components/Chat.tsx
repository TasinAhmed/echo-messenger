import { CustomConvoUser } from "@/app/api/conversations/route";
import { file, message } from "@/db/schemas";
import { useMainStore } from "@/hooks/useMainStore";
import { authClient } from "@/utils/auth-client";
import { http } from "@/utils/http";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import dayjs from "dayjs";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BsLayoutSidebarInsetReverse, BsSend } from "react-icons/bs";
import { IoIosMore } from "react-icons/io";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useSocketStore } from "@/hooks/useSocketStore";
import { GrAttachment } from "react-icons/gr";
import Dialog from "./Dialog";
import { supabase } from "@/utils/supabase";
import { supabaseImageLoader } from "@/utils/supabaseImageLoader";
import ReactPlayer from "react-player/lazy";
import { FaPlay } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

type Message = Omit<InferSelectModel<typeof message>, "attachment"> & {
  file?: InferSelectModel<typeof file>;
};
export type FileInfo = {
  name: string;
  type: string;
  size: number;
};
export type CustomFileType = {
  file?: FileInfo | null;
};

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
  const [file, setFile] = useState<File | null>(null);
  const { socket } = useSocketStore((state) => state);
  const fileRef = useRef(file);

  const uploadFile = async (data: Message) => {
    if (!fileRef.current) return;

    const { error } = await supabase.storage
      .from("echo")
      .upload(`${data.id}/${fileRef.current.name}`, fileRef.current);
    if (error) return;
    setFile(null);
  };

  useEffect(() => {
    fileRef.current = file;
  }, [file]);

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
        ...(fileRef.current && {
          file: {
            name: fileRef.current.name,
            size: fileRef.current.size,
            type: fileRef.current.type,
          },
        }),
      }),
    onSuccess: async (data) => {
      await uploadFile(data);
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
  const { data, refetch, isFetching } = useQuery({
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

  return {
    msgMap,
    messages,
    input,
    setInput,
    messageMutation,
    users,
    file,
    setFile,
    isFetching,
    selectedConvo,
  };
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
          {data.file && (
            <div className="my-4">
              {data.file.type.startsWith("image") && (
                <Image
                  src={
                    supabase.storage
                      .from("echo")
                      .getPublicUrl(`/${data.id}/${data.file.name}`).data
                      .publicUrl
                  }
                  loader={supabaseImageLoader}
                  alt="Message image"
                  width={350}
                  height={350}
                  className="rounded-md"
                />
              )}
              {data.file.type.startsWith("video") && (
                <div className="w-[350px] overflow-hidden rounded-md">
                  <ReactPlayer
                    url={
                      supabase.storage
                        .from("echo")
                        .getPublicUrl(`/${data.id}/${data.file.name}`).data
                        .publicUrl
                    }
                    width="100%"
                    height="100%"
                    controls
                    className="rounded-md  h-auto aspect-video"
                  />
                </div>
              )}
            </div>
          )}
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
  data: InferInsertModel<typeof message> & CustomFileType
): Promise<Message> => {
  console.log(data, "send data");
  const response = await http({
    path: `/messages/${data.conversationId}`,
    method: "POST",
    body: data,
  });

  return await response?.json();
};

const Chat = () => {
  const allowedTypes = ["video/mp4", "image/jpeg", "image/png"];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [invalidType, setInvalidType] = useState(false);
  const [maxSize, setMaxSize] = useState(false);
  const fileRef = useRef<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const {
    messageMutation,
    messages,
    input,
    setInput,
    users,
    file,
    setFile,
    isFetching,
    selectedConvo,
  } = useMessages();

  useEffect(() => {
    fileRef.current = file;
    if (file) setFileUrl(URL.createObjectURL(file));
  }, [file]);

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

  useEffect(() => {
    setFile(null);
    setInput("");
  }, [selectedConvo, setFile, setInput]);

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

  const onSubmit = () => {
    if ((!input && !file) || isFetching) return;

    if (messageMutation.isPending) return;

    messageMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    if (!allowedTypes.includes(selected.type)) {
      setInvalidType(true);
      return;
    }

    if (selected.size > 10485760) {
      setMaxSize(true);
      return;
    }

    setFile(selected);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-8 grid grid-rows-[auto_1fr_auto] gap-y-4 h-screen max-h-screen">
      <Dialog
        open={invalidType}
        onClose={() => {
          setInvalidType(false);
        }}
        title="Invalid File Type"
        description="The file you selected is not supported. Please upload a JPEG,
          PNG, or MP4"
      />
      <Dialog
        open={maxSize}
        onClose={() => {
          setMaxSize(false);
        }}
        title="File is too big!"
        description="The file you selected exceeds the size limit of 10MB."
      />
      <Header />
      {isFetching ? (
        <div className="flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
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
      )}

      <div className="bg-secondary p-6 rounded-2xl grid gap-y-6">
        {file && (
          <div className="h-[150px] relative flex">
            <div className="h-full w-auto relative">
              <div
                className="w-8 rounded-full aspect-square bg-primary absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
                onClick={() => setFile(null)}
              >
                <IoClose />
              </div>
              <div className="rounded-xl overflow-hidden h-full w-auto">
                {file.type.startsWith("image") ? (
                  <Image
                    src={fileUrl}
                    alt="Uploaded file"
                    height={0}
                    width={0}
                    className="h-full w-auto rounded-xl"
                  />
                ) : (
                  <>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[50px] aspect-square rounded-full bg-black">
                      <FaPlay size={20} fill="white" />
                    </div>
                    <ReactPlayer url={fileUrl} width="auto" height="100%" />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-x-4 items-center">
          <GrAttachment
            size={22}
            className="cursor-pointer"
            onClick={triggerFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            className="w-full outline-0"
            placeholder="Write a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSubmit();
              }
            }}
          />
          <BsSend size={22} className="cursor-pointer" onClick={onSubmit} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
