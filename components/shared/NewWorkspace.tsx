"use client";
import React, { useState } from "react";

import { storage } from "@/app/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";

import { createResource } from "@/lib/actions/resources";

import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FileObject = {
  name: string;
  content: string;
  type: string;
  size: number;
  text?: string;
  downloadURL?: string;
  downloadProgress: number;
};

interface Unit {
  id: string;
  title: string;
}

export function NewWorkspace({
  userId,
  unitNameProp,
  unitsProp,
  clusterName,
  onClose,
}: {
  userId: string;
  unitNameProp: string;
  unitsProp: Unit[];
  clusterName: string;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const [unitTitle, setUnitTitle] = useState(unitNameProp || "");
  const [clusterTitle, setClusterTitle] = useState(
    clusterName || "Default Cluster"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [fileData, setFileData] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [fileType, setFileType] = useState<"pdf" | "image" | null>(null);

  const [units, setUnits] = useState<Map<string, string>>(() => {
    return new Map(unitsProp.map((unit) => [unit.title, unit.id]));
  });

  const createNewUnit = async () => {
    const { error } = await supabase
      .from("units")
      .insert([{ title: unitTitle, user_id: userId }]);
    if (error) {
      console.error("Error creating new unit:", error);
      return;
    }

    const { data: newUnitData, error: newUnitError } = await supabase
      .from("units")
      .select("id")
      .eq("title", unitTitle)
      .eq("user_id", userId);
    if (newUnitError) {
      console.error("Error fetching unit:", newUnitError);
      return;
    }

    const unitId = newUnitData?.[0]?.id;
    return unitId;
  };

  const createNewCluster = async (unitId: string) => {
    const { error } = await supabase
      .from("clusters")
      .insert([{ title: clusterTitle, unit_id: unitId }]);
    if (error) {
      console.error("Error creating new cluster:", error);
    }

    const clusterId = getClusterId(unitId);
    return clusterId;
  };

  const getClusterId = async (unitId: string) => {
    const { data: clusterData, error: clusterError } = await supabase
      .from("clusters")
      .select("id")
      .eq("title", clusterTitle)
      .eq("unit_id", unitId);
    if (clusterError) {
      console.error("Error fetching cluster:", clusterError);
    }
    const clusterId = clusterData?.[0]?.id;

    return clusterId;
  };

  const uploadFile = async (clusterId: string) => {
    if (!files || files.length === 0) return [];

    // Create a copy of fileData to modify
    const updatedFileData = [...fileData];

    for (const file of files) {
      try {
        const dataIndex = updatedFileData.findIndex(
          (f) => f.name === file.name
        );

        const fileRef = ref(storage, `example_user/${fileType}s/${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

              // Update the progress in the copied array
              if (dataIndex !== -1) {
                updatedFileData[dataIndex] = {
                  ...updatedFileData[dataIndex],
                  downloadProgress: Math.floor(progress),
                };

                // Update the state to trigger re-render
                setFileData(updatedFileData);
              }

              console.log(`Upload is ${progress}% done`);
            },
            (error) => {
              console.error("Upload failed", error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("File available at", downloadURL);

              const getText = await extractTextFromPDF(file);
              const { error } = await supabase.from("files").insert([
                {
                  cluster_id: clusterId,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  content: fileType === "pdf" ? getText : null,
                  file_url: downloadURL,
                },
              ]);
              if (error) {
                console.error("Error uploading file:", error);
              }

              toast({
                title: "Success.",
                description: `${file.name} uploaded successfully!`,
              });

              setUploadProgress(0);
              resolve(downloadURL);
            }
          );
        });
      } catch (error) {
        // ... error handling
      }
    }

    setFiles([]);
    setUnitTitle("");
    setFileType(null);

    return [];
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;

    const selectedFiles = Array.from(event.target.files);

    const types = new Set(selectedFiles.map((file) => file.type.split("/")[0]));

    if (types.size > 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Please upload only one type of file at a time (either PDFs or images).",
      });
      return;
    }

    const currentFileType = types.values().next().value;
    if (currentFileType !== "application" && currentFileType !== "image") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Only PDF and image files are allowed.",
      });
      return;
    }

    setFileType(currentFileType === "application" ? "pdf" : "image");
    setFiles(selectedFiles);

    const readFileContent = async (file: File): Promise<FileObject> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          let fileObject: FileObject = {
            name: file.name,
            content: reader.result as string,
            type: file.type,
            size: file.size,
            downloadProgress: 0,
          };

          if (file.type === "application/pdf") {
            try {
              const text = await extractTextFromPDF(file);
              fileObject.text = text;
            } catch (error) {
              console.error("Error extracting PDF text:", error);
              fileObject.text = "Error: Unable to extract text from this PDF.";
            }
          }

          resolve(fileObject);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    };

    setIsLoading(true);
    try {
      const fileDataPromises = selectedFiles.map((file) =>
        readFileContent(file)
      );
      const fileData = await Promise.all(fileDataPromises);
      setFileData(fileData);

      console.log("File data:", fileData);
    } catch (error) {
      console.error("Error reading files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Check if user has entered an already existing Unit
    const isUnitTitleExists = units.has(unitTitle);

    // If so get the unit Id, otherwise create new Unit
    const unitId = isUnitTitleExists
      ? units.get(unitTitle)
      : await createNewUnit();

    // Check if the current Unit has the selected cluster
    let clusterId = await getClusterId(unitId);

    // If not create a new cluster under for the unit
    if (!clusterId) {
      console.log("New Unit");
      clusterId = await createNewCluster(unitId);
    }

    // uplood file to firebase for storage
    await uploadFile(clusterId);
    console.log("Cluster ID:", clusterId);
    // Show success toast
    toast({
      title: "Success.",
      description: "Files uploaded successfully!",
      action: <ToastAction altText="Undo">Undo</ToastAction>,
    });

    // remove this component from the user's view
    handleCancel();

    // Create embeddings of the documents and store in supabase
    const res = await createResource(clusterId);
    console.log(res);
  };

  const handleCancel = () => {
    onClose();
    setFiles([]);
    setFileData([]);
    setUnitTitle("");
  };

  return (
    <div className="absolute  w-fit max-h-40">
      <div className="flex flex-col justify-center items-center gap-10 p-6 mt-10 w-full border rounded-md h-full bg-white">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">Unit Title</Label>
          <Input
            type="text"
            value={unitTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUnitTitle(e.target.value)
            }
            placeholder="Enter Unit Title"
            className="w-full"
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">Cluster Title</Label>
          <Input
            type="text"
            value={clusterTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setClusterTitle(e.target.value)
            }
            placeholder="Enter Cluster Title"
            className="w-full"
          />
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5 border p-2 rounded-md">
          <input
            type="file"
            multiple
            onInput={handleFileInputChange}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
              setFileData([]);
              setFiles([]);
            }}
            className="w-full"
            accept={
              fileType === "pdf"
                ? ".pdf"
                : fileType === "image"
                ? "image/*"
                : ".pdf,image/*"
            }
          />
        </div>

        {isLoading && (
          <div className="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        )}

        {fileData.length > 0 && (
          <div>
            <ul className="space-y-4">
              {fileData.map((file, index) => (
                <li key={index} className="border p-4 rounded">
                  <strong>{file.name}</strong>
                  <p>{file.type}</p>
                  <p>{file.downloadProgress}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !unitTitle}
            className="w-20"
          >
            Upload
          </Button>
          <Button onClick={handleCancel} className="w-20">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
