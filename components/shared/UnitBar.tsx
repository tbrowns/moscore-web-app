"use client";

import React, { useState } from "react";
import { HiDotsHorizontal } from "react-icons/hi";
import { BookOpenText } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface Cluster {
  id: string;
  title: string;
}

export function UnitBar({
  unitName,
  unitId,
}: {
  unitName: string;
  unitId: string;
}) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Cluster[]>([]);

  const getClusters = async () => {
    try {
      const { data, error } = await supabase
        .from("clusters")
        .select("id, title")
        .eq("unit_id", unitId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching clusters:", error);
    }
  };

  getClusters().then((data) => {
    if (data) setLabels(data);
  });

  return (
    <div className="flex w-full flex-col items-start justify-between rounded-md border px-4 py-3 sm:flex-row sm:items-center">
      <p className="text-sm font-medium leading-none flex items-center justify-between">
        <span className="">
          <BookOpenText className="w-5 h-5 mr-2" />
        </span>
        <Link href={`/unit/${unitId}`} className="text-ellipsis text-base">
          {unitName}
        </Link>
      </p>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <HiDotsHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <RenameUnitDialog unitId={unitId} currentName={unitName} />
            </DropdownMenuItem>
            <DropdownMenuItem>Add file</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Clusters</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-0">
                <Command>
                  <CommandInput
                    placeholder="Filter label..."
                    autoFocus={true}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No label found.</CommandEmpty>
                    <CommandGroup>
                      {labels.map((label) => (
                        <CommandItem
                          key={label.id}
                          value={label.title}
                          onSelect={(value) => {
                            setOpen(false);
                          }}
                        >
                          {label.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <ConfirmDeleteUnitDialog unitId={unitId} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RenameUnitDialog({
  unitId,
  currentName,
}: {
  unitId: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);

  const handleRename = async (e: any) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("units")
        .update({ title: newName })
        .eq("id", unitId)
        .select();

      setOpen(false);
    } catch (error) {
      console.error("Error renaming unit:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <p className="w-full text-left">Rename</p>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
          <DialogDescription>Rename your unit.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRename}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                New name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteUnitDialog({ unitId }: { unitId: string }) {
  const [open, setOpen] = React.useState(false);

  const deleteUnitFunction = async () => {
    try {
      // Perform a single transaction to ensure data integrity
      const { error } = await supabase.rpc("delete_unit_cascade", {
        p_unit_id: unitId,
      });

      if (error) {
        console.error("Error deleting unit and related data:", error.message);
        throw error;
      }

      console.log("Unit and all related data successfully deleted.");
      setOpen(false);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className="w-full text-left text-red-600">Delete</button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this unit
            and remove all its data and files.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteUnitFunction}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { RenameUnitDialog, ConfirmDeleteUnitDialog };
