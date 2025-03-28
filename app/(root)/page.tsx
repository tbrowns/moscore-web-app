"use server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import WorkspacePage from "@/components/shared/WorkspacePage";

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .upsert({
      id: user.id,
      name: user.username,
      email: user.emailAddresses[0].emailAddress,
    })
    .select();

  const { data: units, error: unitError } = await supabase
    .from("units")
    .select("id, title")
    .eq("user_id", user.id);

  const date = new Date();
  const hour = date.getHours();
  const baseGreeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greeting = `${baseGreeting}, ${user.username}!`;

  return (
    <div className="relative px-4 py-2 flex flex-col items-center justify-between">
      <h1 className="m-2 text-4xl mt-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-500 to-slate-900">
        {greeting}
      </h1>
      <WorkspacePage userId={user.id} initialUnits={units || []} />
    </div>
  );
}
