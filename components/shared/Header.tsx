import React from "react";
import Image from "next/image";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { AlignLeft } from "lucide-react";

import UserReportButton from "@/components/shared/UserReportButton";
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

import { ClerkProvider } from "@clerk/nextjs";

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
      <ClerkProvider dynamic>
        {" "}
        <UserReportButton />
      </ClerkProvider>

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
