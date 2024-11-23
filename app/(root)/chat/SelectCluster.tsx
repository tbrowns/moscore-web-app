import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, ScrollText } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Unit {
  id: string;
  title: string;
}

interface Cluster {
  id: string;
  title: string;
  unit_id: string;
}

interface GroupedClusters {
  [key: string]: Cluster[];
}

export function SelectCluster() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [groupedClusters, setGroupedClusters] = useState<GroupedClusters>({});
  const [selectedClusterId, setSelectedClusterId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedClusterId") || "";
    }
    return "";
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select("id, title")
        .eq("user_id", user.id);

      if (unitsError) {
        console.error("Error fetching units:", unitsError);
        return;
      }

      setUnits(unitsData || []);

      // Fetch all clusters for these units
      const { data: clustersData, error: clustersError } = await supabase
        .from("clusters")
        .select("id, title, unit_id")
        .in("unit_id", unitsData?.map((unit) => unit.id) || []);

      if (clustersError) {
        console.error("Error fetching clusters:", clustersError);
        return;
      }

      // Group clusters by unit_id
      const grouped = (clustersData || []).reduce<GroupedClusters>(
        (acc, cluster) => {
          if (!acc[cluster.unit_id]) {
            acc[cluster.unit_id] = [];
          }
          acc[cluster.unit_id].push(cluster);
          return acc;
        },
        {}
      );

      setGroupedClusters(grouped);
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!selectedClusterId) return;

    document.cookie = `selectedClusterId=${selectedClusterId}`;

    localStorage.setItem("selectedClusterId", selectedClusterId);
  }, [selectedClusterId]);

  const handleClusterSelect = (clusterId: string) => {
    setSelectedClusterId(clusterId);
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className=" w-6">
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full bg-transparent"
        >
          {<ScrollText className=" w-full bg-transparent" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search units or clusters..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {units.map((unit) => (
              <CommandGroup key={unit.id} heading={unit.title}>
                {groupedClusters[unit.id]?.map((cluster) => (
                  <CommandItem
                    key={cluster.id}
                    value={`${unit.title} ${cluster.title}`}
                    onSelect={() => handleClusterSelect(cluster.id)}
                    className="ml-2"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-4 h-4 border rounded flex items-center justify-center">
                        {selectedClusterId === cluster.id && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span>{cluster.title}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SelectCluster;
