import React from "react";

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

const Subscription = () => {
  const plans = [
    {
      title: "Basic",
      price: "Ksh.200",
      features: [
        "Access to limited resources",
        "Community Support",
        "Basic project feedback",
      ],
    },
    {
      title: "Pro",
      price: "Ksh.200",
      features: [
        "Design resources library",
        "Monthly masterclass",
        "Project feedback",
        "Networking opportunities",
        "Access to community",
      ],
    },
    {
      title: "Premium",
      price: "Ksh.500",
      features: [
        "All Pro features",
        "1-on-1 mentorship",
        "Exclusive content",
        "Priority project review",
      ],
    },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
        {plans.map((plan, index) => (
          <div key={index} className="shadow-md rounded-lg p-6 text-center">
            <h2 className="text-lg font-bold">{plan.title}</h2>
            <p className="text-4xl font-bold  my-4">
              {plan.price} <span className="text-sm">/mo</span>
            </p>
            <p className="text-sm 0 mb-4">14-day free trial</p>
            <DetailedPlan />
            <ul className="mt-6 text-sm flex flex-col items-start ">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="mb-2">
                  ✔ {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;

export function DetailedPlan() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-full">Select Plan</Button>
      </SheetTrigger>
      <SheetContent>
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
