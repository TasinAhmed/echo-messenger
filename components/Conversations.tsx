import { CustomConvoType } from "@/app/api/conversations/route";
import { message, user } from "@/db/schemas";
import { useMainStore } from "@/hooks/useMainStore";
import { useSocketStore } from "@/hooks/useSocketStore";
import { http } from "@/utils/http";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import dayjs from "dayjs";
import { InferSelectModel } from "drizzle-orm";
import { MouseEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { IoClose, IoCreateOutline } from "react-icons/io5";
import { authClient } from "@/utils/auth-client";
import { z } from "zod";
import { FaAngleDown } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { FancyMultiSelect } from "./ui/fancy-multi-select";
import { getImage } from "@/utils/getImage";

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
  const { data: session } = authClient.useSession();
  const [search, setSearch] = useState("");
  const [cleanSearch, setCleanSearch] = useState("");
  const [results, setResults] = useState<CustomConvoType[]>([]);
  const [newConvoName, setNewConvoName] = useState("");
  const [selected, setSelected] = useState<InferSelectModel<typeof user>[]>([]);
  const fetchUserConversations = async (): Promise<CustomConvoType[]> => {
    const response = await http({ path: "/conversations", method: "GET" });

    return await response?.json();
  };
  const [createConvo, setCreateConvo] = useState(false);
  const { socket } = useSocketStore((state) => state);
  const [errors, setErrors] = useState<z.inferFlattenedErrors<
    typeof CreateConvoSchema
  > | null>(null);

  const [convoMap, setConvoMap] = useState<Map<string, CustomConvoType>>(
    new Map()
  );
  const [convoValues, setConvoValues] = useState<CustomConvoType[]>([]);

  const convoMapRef = useRef(convoMap);

  useEffect(() => {
    setErrors(null);
  }, [createConvo]);

  const CreateConvoSchema = z.object({
    name: z
      .string()
      .max(20, { message: "Conversation name cannot exceed 20 characters." })
      .nonempty({ message: "Name is required" }),
    members: z
      .array(z.any())
      .max(4, { message: "Maximum of 5 users allowed." })
      .min(1, { message: "Must select a user." }),
  });

  const escapeRegExp = (string: string) => {
    return string.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  };

  const createConversation = async ({
    name,
    userIds,
  }: {
    name: string;
    userIds: string[];
  }) => {
    console.log(name, userIds);
    const response = await http({
      path: "/conversations",
      method: "POST",
      body: { name, userIds },
    });

    return await response?.json();
  };

  const createConvoMutation = useMutation({
    mutationFn: () => {
      if (!session) {
        throw new Error("User ID is undefined");
      }
      return createConversation({
        name: newConvoName,
        userIds: [...selected.map((u) => u.id), session.user.id],
      });
    },
    onSuccess: (data) => {
      socket?.emit("createConversation", data);
      setNewConvoName("");
      setSelected([]);
      setCreateConvo(false);
    },
  });

  useEffect(() => {
    setCleanSearch(escapeRegExp(search));
  }, [search]);

  const updateLatestMessage = (data: InferSelectModel<typeof message>) => {
    let newMap = new Map(convoMapRef.current);
    const convoData = convoMapRef.current.get(data.conversationId);

    if (!convoData) return;

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
    socket?.on("addConversation", (data: CustomConvoType) => {
      setConvoMap((prev) => {
        const tempArr = Array.from(prev);
        const newMap = new Map([[data.id, data], ...tempArr]);
        return newMap;
      });
    });

    return () => {
      socket?.off("updateLatestMessage", updateLatestMessage);
    };
  }, [socket]);

  const { data, isSuccess: doneFetch } = useQuery({
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

  return {
    convoValues,
    cleanSearch,
    setSearch,
    results,
    search,
    createConvoMutation,
    selected,
    setSelected,
    setNewConvoName,
    newConvoName,
    session,
    createConvo,
    setCreateConvo,
    CreateConvoSchema,
    errors,
    setErrors,
    doneFetch,
  };
};

const ConversationItem = ({
  data,
  currUser,
}: {
  data: CustomConvoType;
  currUser: string | undefined;
}) => {
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
        "rounded-md p-4 cursor-pointer grid grid-cols-[auto_1fr] min-w-0 gap-x-4 hover:bg-secondary/80",
        selectedConvo?.id === data.id && "bg-muted"
      )}
    >
      <div className="w-15 h-15 relative overflow-hidden">
        <Avatar className="w-full h-full">
          <AvatarImage src={getImage(data.image)} />
        </Avatar>
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
            `${lastMsg.senderId === currUser ? "You" : lastMsgSender}: ${
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
        "rounded-2xl p-4 cursor-pointer grid grid-cols-[auto_1fr] min-w-0 gap-x-4 hover:bg-secondary/80"
      )}
    >
      <div className="w-15 h-15 relative rounded-xl overflow-hidden">
        <Avatar className="w-full h-full">
          <AvatarImage src={getImage(data.image)} />
        </Avatar>
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
  const {
    convoValues,
    cleanSearch,
    setSearch,
    results,
    search,
    selected,
    setSelected,
    newConvoName,
    setNewConvoName,
    session,
    createConvoMutation,
    createConvo,
    setCreateConvo,
    CreateConvoSchema,
    errors,
    setErrors,
    doneFetch,
  } = useConversations();
  const router = useRouter();
  const fetchUsers = async (): Promise<InferSelectModel<typeof user>[]> => {
    const response = await http({ path: "/users", method: "GET" });

    return await response?.json();
  };

  console.log(errors);

  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return (
    <Card className="py-8 md:w-80 lg:w-110 grid grid-rows-[auto_1fr] overflow-hidden">
      <Dialog open={createConvo} onOpenChange={setCreateConvo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Conversation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <div className="grid items-center mb-4">
              <Input
                id="name"
                placeholder="Conversation name"
                value={newConvoName}
                onChange={(e) => setNewConvoName(e.target.value)}
                className="mb-2"
              />
              {errors?.fieldErrors.name && (
                <div className="text-red-500 text-sm">
                  {errors.fieldErrors.name[0]}
                </div>
              )}
            </div>
            <div className="grid items-center">
              {data && session && (
                <FancyMultiSelect
                  data={data}
                  currUser={session.user.id}
                  selected={selected}
                  setSelected={setSelected}
                />
              )}
              {errors?.fieldErrors.members && (
                <div className="text-red-500 text-sm">
                  {errors.fieldErrors.members[0]}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              className="cursor-pointer"
              type="submit"
              onClick={() => {
                const result = CreateConvoSchema.safeParse({
                  name: newConvoName,
                  members: selected,
                });

                if (!result.success) {
                  const err = result.error.flatten();
                  setErrors(
                    err as z.inferFlattenedErrors<typeof CreateConvoSchema>
                  );
                  return;
                }

                createConvoMutation.mutate();
              }}
              loading={createConvoMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CardHeader className="px-8  w-full">
        <div className="flex justify-between items-center mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-0">
              {session && (
                <div className="flex items-center gap-x-3 cursor-pointer">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={getImage(session.user.image!)} />
                  </Avatar>
                  <div className="font-bold text-lg">
                    {session.user.name.split(" ")[0]}
                  </div>
                  <FaAngleDown />
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-4">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push("/auth/login");
                      },
                    },
                  })
                }
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <IoCreateOutline
            onClick={() => setCreateConvo(true)}
            size={30}
            className="cursor-pointer"
          />
        </div>
        <div className=" relative">
          <Input
            className="px-10 py-6"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CiSearch className="absolute left-0 top-1/2 -translate-y-1/2 ml-3 h-5 w-5 text-muted-foreground" />
          {cleanSearch && (
            <div
              onClick={() => setSearch("")}
              className="cursor-pointer w-5 aspect-square bg-background rounded-full flex items-center justify-center absolute right-0 mr-3 top-1/2 -translate-y-1/2"
            >
              <IoClose fill="gray" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="mx-8 h-full max-h-full overflow-y-auto relative overflow-x-hidden">
        {cleanSearch && results.length === 0 && (
          <div className="text-center">No results</div>
        )}
        {doneFetch && convoValues.length > 0 ? (
          <div className="grid content-start gap-y-2 absolute h-full w-full left-0 top-0 min-h-0 min-w-0">
            {!cleanSearch &&
              convoValues.map((convo) => (
                <ConversationItem
                  key={convo.id}
                  data={convo}
                  currUser={session?.user.id}
                />
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
        ) : (
          doneFetch &&
          convoValues.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="font-bold text-lg">No conversations</div>
                <div className="text-md text-gray-400">
                  New conversations will appear here.
                </div>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default Conversations;
