import { CustomConvoType } from "@/app/api/conversations/route";
import { useBearStore } from "@/hooks/useBearStore";
import { http } from "@/utils/http";
import { faker } from "@faker-js/faker";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Image from "next/image";

const ConversationItem = ({ data }: { data: CustomConvoType }) => {
  const { selectedConvo, setSelectedConvo } = useBearStore((state) => state);

  return (
    <div
      onClick={() => setSelectedConvo(data)}
      className={clsx(
        "rounded-2xl p-4 cursor-pointer grid grid-cols-[auto_1fr] min-w-0 gap-x-4",
        selectedConvo?.id === data.id && "bg-secondary"
      )}
    >
      <div className="w-15 h-15 relative rounded-xl overflow-hidden">
        <Image
          src={data.image}
          alt="Conversation image"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">
        <div className="flex items-center gap-x-4 justify-between">
          <div className="whitespace-nowrap overflow-hidden overflow-ellipsis font-bold">
            {data.name}
          </div>
          <div className="text-sm text-gray-500">4 m</div>
        </div>
        <div className="whitespace-nowrap overflow-hidden overflow-ellipsis text-gray-400 text-sm">
          {faker.lorem.sentence()}
        </div>
      </div>
    </div>
  );
};

const fetchUserConversations = async (): Promise<CustomConvoType[]> => {
  const response = await http({ path: "/conversations", method: "GET" });

  return await response?.json();
};

const Conversations = () => {
  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchUserConversations,
  });

  return (
    <div className="p-8 w-115 grid grid-rows-[auto_1fr]">
      <div className="bg-secondary h-15 rounded-2xl mb-4"></div>
      <div className="h-full max-h-full overflow-y-auto relative overflow-x-hidden">
        <div className="grid gap-y-2 absolute h-full w-full left-0 top-0 min-h-0 min-w-0">
          {data?.map((convo) => (
            <ConversationItem key={convo.id} data={convo} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Conversations;
