"use client";
import { authClient } from "@/utils/auth-client";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const NavbarItem = ({ className }: { className?: string }) => {
  const router = useRouter();
  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
        },
      },
    });
  };

  return (
    <div
      onClick={signOut}
      className={clsx(
        "w-15 aspect-square bg-background rounded-xl cursor-pointer",
        className
      )}
    ></div>
  );
};

const Navbar = () => {
  return (
    <div className="w-25 flex justify-center items-center">
      <div className="grid gap-y-4">
        <NavbarItem className="bg-secondary" />
        <NavbarItem />
        <NavbarItem />
        <NavbarItem />
        <NavbarItem />
      </div>
    </div>
  );
};

export default Navbar;
