"use client";

import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";

// Separate component for parts that use useSearchParams
const NavigationEvents = ({
  setIsLoading,
}: {
  setIsLoading: (loading: boolean) => void;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams, setIsLoading]);

  return null;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main>
      {isLoading && <LoadingBar />}
      <Header />
      <div className="flex">
        {/* Set loading to true when the users clicks on a new page */}
        {/* <Sidebar setIsLoading={setIsLoading} /> */}
        <div className="w-full overflow-x-auto">
          <div className="sm:h-[calc(99vh-60px)] overflow-auto">
            <div className="w-full flex justify-center mx-auto overflow-auto h-[calc(100vh-120px)]">
              <div className="w-full md:max-w-6xl">
                <Suspense fallback={null}>
                  <NavigationEvents setIsLoading={setIsLoading} />
                </Suspense>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const LoadingBar: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-accent z-50">
      <div className="h-full w-1/3 bg-primary animate-loading-bar rounded-full"></div>
    </div>
  );
};

export default Layout;
