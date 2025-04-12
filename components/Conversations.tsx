import { CustomConvoType } from "@/app/api/conversations/route";
import { message } from "@/db/schemas";
import { useMainStore } from "@/hooks/useMainStore";
import { useSocketStore } from "@/hooks/useSocketStore";
import { http } from "@/utils/http";
import { useQuery } from "@tanstack/react-query";
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

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
          <AvatarImage src={data.image} />
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
          <AvatarImage src={data.image} />
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
  const { convoValues, cleanSearch, setSearch, results, search } =
    useConversations();
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [createConvo, setCreateConvo] = useState(false);

  return (
    <Card className="py-8 w-110 grid grid-rows-[auto_1fr] overflow-hidden">
      <Dialog open={createConvo} onOpenChange={setCreateConvo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Conversation</DialogTitle>
            <DialogDescription>
              Anyone who has this link will be able to view this.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                defaultValue="https://ui.shadcn.com/docs/installation"
                readOnly
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
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
                    <AvatarImage src={session.user.image!} />
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
      </CardContent>
    </Card>
  );
};

export default Conversations;
