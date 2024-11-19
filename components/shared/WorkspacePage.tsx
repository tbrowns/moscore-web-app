// WorkspacePage.tsx
"use client";
import { useState, useEffect } from "react";
import { Plus, Workflow } from "lucide-react";
import { NewWorkspace } from "@/components/shared/NewWorkspace";
import { revalidateWorkspace } from "@/lib/actions/revalidatePath";
import { supabase } from "@/lib/supabase";

import { UnitBar } from "./UnitBar";
export default function WorkspacePage({
  userId,
  initialUnits,
}: {
  userId: string;
  initialUnits: Array<{ id: string; title: string }>;
}) {
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [units, setUnits] = useState(initialUnits);

  useEffect(() => {
    // Set up real-time subscription
    const channel = supabase
      .channel("custom-filter-channel")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "units",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("Change received!", payload);

          // Fetch the latest units data
          const { data: updatedUnits } = await supabase
            .from("units")
            .select("id, title")
            .eq("user_id", userId);

          if (updatedUnits) {
            setUnits(updatedUnits);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleNewWorkspaceClick = () => {
    setIsCreatingWorkspace(true);
  };

  const handleWorkspaceCreationClose = async () => {
    setIsCreatingWorkspace(false);
    // Revalidate the page after workspace creation
    await revalidateWorkspace();
  };

  return (
    <>
      {isCreatingWorkspace && (
        <NewWorkspace
          userId={userId}
          unitNameProp=""
          unitsProp={units}
          clusterName=""
          onClose={handleWorkspaceCreationClose}
        />
      )}

      <div className="w-3/4 my-10 flex items-end justify-between">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Workflow size={16} />
          <span>Workspaces</span>
        </div>
        <button
          onClick={handleNewWorkspaceClick}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-md p-2 hover:bg-primary/80"
        >
          <Plus size={20} />
          <span className="text-sm">New Workspace</span>
        </button>
      </div>

      <div className="w-full flex items-center justify-center">
        <div className="w-3/4 flex flex-col gap-2">
          {units.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No units available.
            </p>
          ) : (
            units.map((unit) => (
              <UnitBar key={unit.id} unitName={unit.title} unitId={unit.id} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
