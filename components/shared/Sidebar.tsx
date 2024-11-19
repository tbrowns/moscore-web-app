"use client";
import React, { Fragment, useEffect, useState } from "react";
import Link from "next/link";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { navLinks } from "@/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Sidebar = ({
  setIsLoading,
}: {
  setIsLoading: (isLoading: boolean) => void;
}) => {
  const navItems = navLinks();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("sidebarExpanded");
      if (saved === null) {
        return true;
      }
      return JSON.parse(saved);
    }
    return true; // default state if window is not defined
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "sidebarExpanded",
        JSON.stringify(isSidebarExpanded)
      );
    }
  }, [isSidebarExpanded]);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="pr-4">
      <div
        className={cn(
          isSidebarExpanded ? "w-[200px]" : "w-[68px]",
          "border-r transition-all duration-300 ease-in-out transform hidden sm:flex h-full"
        )}
      >
        <aside className="flex h-full flex-col w-full break-words px-4 overflow-x-hidden columns-1">
          {/* Top */}
          <div className="mt-4 relative pb-2">
            <div className="flex flex-col space-y-1">
              {navItems.map((item, idx) => {
                if (item.position === "top") {
                  return (
                    <Fragment key={idx}>
                      <div className="space-y-1">
                        <SideNavItem
                          label={item.label}
                          icon={item.icon}
                          path={item.route}
                          active={item.active}
                          isSidebarExpanded={isSidebarExpanded}
                          setIsLoading={setIsLoading}
                        />
                      </div>
                    </Fragment>
                  );
                }
              })}
            </div>
          </div>
          {/* Bottom */}
          <div className="sticky bottom-0 mt-auto whitespace-nowrap mb-4 transition duration-200 block"></div>
        </aside>
        <div className="mt-[calc(calc(90vh)-40px)] relative">
          <button
            type="button"
            className="absolute bottom-32 right-[-12px] flex h-6 w-6 items-center justify-center border rounded-full bg-secondary shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out"
            onClick={toggleSidebar}
          >
            {isSidebarExpanded ? (
              <ChevronLeft size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

export const SideNavItem: React.FC<{
  label: string;
  icon: any;
  path: string;
  active: boolean;
  isSidebarExpanded: boolean;
  setIsLoading: (isLoading: boolean) => void;
}> = ({ label, icon, path, active, isSidebarExpanded, setIsLoading }) => {
  return (
    <>
      {isSidebarExpanded ? (
        <Link
          href={path}
          onClick={() => setIsLoading(true)}
          className={`h-full relative flex items-center whitespace-nowrap rounded-md ${
            active
              ? "font-base text-sm bg-secondary shadow-sm text-secondary-foreground"
              : "hover:bg-accent hover:text-accent-foreground "
          }`}
        >
          <div className="relative font-base text-sm py-1.5 px-2 flex flex-row items-center space-x-2 rounded-md duration-100">
            {icon}
            <span>{label}</span>
          </div>
        </Link>
      ) : (
        <TooltipProvider delayDuration={70}>
          <Tooltip>
            <TooltipTrigger>
              <Link
                href={path}
                className={`h-full relative flex items-center whitespace-nowrap rounded-md ${
                  active
                    ? "font-base text-sm  text-neutral-700 dark:bg-neutral-800 dark:text-white"
                    : "hover:bg-accent hover:text-neutral-700 text-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                }`}
              >
                <div className="relative font-base text-sm p-2 flex flex-row items-center space-x-2 rounded-md duration-100">
                  {icon}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="px-3 py-1.5 text-xs"
              sideOffset={10}
            >
              <span>{label}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
};
