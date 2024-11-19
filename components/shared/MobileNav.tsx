"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { SignedIn, UserButton } from "@clerk/nextjs";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navLinks } from "@/constants";

const MobileNav = () => {
  const pathname = usePathname();
  return (
    <header className="header">
      
    </header>
  );
};

export default MobileNav;
