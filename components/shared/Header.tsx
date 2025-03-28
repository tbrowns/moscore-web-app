import React from "react";
import Link from "next/link";
import Image from "next/image";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { AlignLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  return (
    <header className="flex-between h-16 w-full border-b-2 border-border backdrop-blur-sm bg-white/30 p-5">
      <div className="md:hidden">
        <MenuBar />
      </div>
      <Image
        src="/assets/images/logo-2.png"
        alt="logo"
        width={150}
        height={150}
      />

      <div className="gap-4 text-sm font-medium text-muted-foreground md:flex hidden">
        <Link href="/"> home</Link>
        <Link href="/chat"> chatbot</Link>
        <Link href="/credits"> purchases</Link>
      </div>

      <UserButton />
    </header>
  );
};

export default Header;

export function MenuBar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <AlignLeft />
      </SheetTrigger>
      <SheetContent side={"left"}>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4"></div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
