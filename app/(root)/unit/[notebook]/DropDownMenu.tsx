"use client";

import React, { useState, useEffect } from "react";

import { supabase } from "@/lib/supabase";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type Cluster = {
  id: string;
  title: string;
};

export default function ClusterMenu({
  unitId,
  selectedCluster,
  setSelectedCluster,
}: {
  unitId: string;
  selectedCluster: string | null;
  setSelectedCluster: (clusterId: string) => void;
}) {
  const getClusterDetail = async (): Promise<Cluster | null> => {
    try {
      const { data: Cluster, error: clusterError } = await supabase
        .from("clusters")
        .select("id, title")
        .eq("unit_id", unitId)
        .single();

      if (clusterError) {
        console.error("Error fetching cluster:", clusterError);
        return null;
      }

      return Cluster;
    } catch (error) {
      console.error("Error fetching cluster:", error);
      return null;
    }
  };

  const [clusterData, setClusterData] = useState<Cluster | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getClusterDetail();
      console.log(data);
      setClusterData(data);
    };

    fetchData().catch((error) =>
      console.error("Error fetching cluster:", error)
    );
  }, [unitId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ChevronDown size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Clusters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedCluster ?? undefined}
          onValueChange={setSelectedCluster}
        >
          {clusterData && (
            <DropdownMenuRadioItem value={clusterData.id}>
              {clusterData.title}
            </DropdownMenuRadioItem>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
