import { usePathname } from "next/navigation";

import { Home, Search, Bot, User, FilePlus, Coins } from "lucide-react";

export const navLinks = () => {
  const pathname = usePathname();

  return [
    {
      label: "Home",
      route: "/",
      icon: <Home size={20} />,
      active: pathname === "/",
      position: "top",
    },
    // {
    //   label: "Search",
    //   route: "/search",
    //   icon: <Search size={20} />,
    //   active: pathname.includes("/search"),
    //   position: "top",
    // },
    {
      label: "AI assistant",
      route: "/chat",
      icon: <Bot size={20} />,
      active: pathname.includes("/chat"),
      position: "top",
    },

    // {
    //   label: "Profile",
    //   route: "/profile",
    //   icon: <User size={20} />,
    //   active: pathname.includes("/profile"),
    //   position: "top",
    // },
    // {
    //   label: "Subscription",
    //   route: "/subscriptions",
    //   icon: <Coins size={20} />,
    //   active: pathname.includes("/credits"),
    //   position: "top",
    // },
  ];
};

export const plans = [
  {
    _id: 1,
    name: "Free",
    icon: "/assets/icons/free-plan.svg",
    price: 0,
    credits: 20,
    inclusions: [
      {
        label: "20 Free Credits",
        isIncluded: true,
      },
      {
        label: "Basic Access to Services",
        isIncluded: true,
      },
      {
        label: "Priority Customer Support",
        isIncluded: false,
      },
      {
        label: "Priority Updates",
        isIncluded: false,
      },
    ],
  },
  {
    _id: 2,
    name: "Pro Package",
    icon: "/assets/icons/free-plan.svg",
    price: 40,
    credits: 120,
    inclusions: [
      {
        label: "120 Credits",
        isIncluded: true,
      },
      {
        label: "Full Access to Services",
        isIncluded: true,
      },
      {
        label: "Priority Customer Support",
        isIncluded: true,
      },
      {
        label: "Priority Updates",
        isIncluded: false,
      },
    ],
  },
  {
    _id: 3,
    name: "Premium Package",
    icon: "/assets/icons/free-plan.svg",
    price: 199,
    credits: 2000,
    inclusions: [
      {
        label: "2000 Credits",
        isIncluded: true,
      },
      {
        label: "Full Access to Services",
        isIncluded: true,
      },
      {
        label: "Priority Customer Support",
        isIncluded: true,
      },
      {
        label: "Priority Updates",
        isIncluded: true,
      },
    ],
  },
];

export const creditFee = -1;
