"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";
import { InferSelectModel } from "drizzle-orm";
import { user } from "@/db/schemas";
import { Avatar } from "./avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { getImage } from "@/utils/getImage";

// type Framework = Record<"value" | "label", string>;

// const FRAMEWORKS = [
//   {
//     value: "next.js",
//     label: "Next.js",
//   },
//   {
//     value: "sveltekit",
//     label: "SvelteKit",
//   },
//   {
//     value: "nuxt.js",
//     label: "Nuxt.js",
//   },
//   {
//     value: "remix",
//     label: "Remix",
//   },
//   {
//     value: "astro",
//     label: "Astro",
//   },
//   {
//     value: "wordpress",
//     label: "WordPress",
//   },
//   {
//     value: "express.js",
//     label: "Express.js",
//   },
//   {
//     value: "nest.js",
//     label: "Nest.js",
//   },
// ] satisfies Framework[];

type User = InferSelectModel<typeof user>;

export function FancyMultiSelect({
  data,
  className,
  currUser,
  selected,
  setSelected,
}: {
  className?: string;
  data: User[];
  currUser: string;
  selected: User[];
  setSelected: React.Dispatch<React.SetStateAction<User[]>>;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback(
    (user: User) => {
      setSelected((prev) => prev.filter((s) => s.id !== user.id));
    },
    [setSelected]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            setSelected((prev) => {
              const newSelected = [...prev];
              newSelected.pop();
              return newSelected;
            });
          }
        }
        // This is not a default behaviour of the <input /> field
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    [setSelected]
  );

  const selectables = data.filter(
    (user) => !selected.includes(user) && user.id !== currUser
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn("overflow-visible bg-transparent", className)}
    >
      <div className="group rounded-md dark:bg-input/30 border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selected.map((user) => {
            return (
              <Badge key={user.id} variant="secondary">
                {user.name}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(user);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(user)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          {/* Avoid having the "Search" Icon */}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder="Add users..."
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="max-h-[200px] overflow-auto">
                {selectables.map((user) => {
                  return (
                    <CommandItem
                      key={user.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        setInputValue("");
                        setSelected((prev) => [...prev, user]);
                      }}
                      className={"cursor-pointer flex gap-x-4 items-center"}
                    >
                      <Avatar>
                        <AvatarImage
                          className="w-10 h-10"
                          src={getImage(user.image!)}
                        />
                      </Avatar>
                      <div>
                        <div>{user.name}</div>
                        <div className="text-gray-500 text-xs">
                          {user.email}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </div>
    </Command>
  );
}
