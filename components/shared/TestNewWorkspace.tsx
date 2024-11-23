"use client";
import React, { useState } from "react";

import { storage } from "@/app/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const [fileType, setFileType] = useState<"pdf" | "image" | null>(null);

  const [units, setUnits] = useState<Map<string, string>>(() => {
    return new Map(unitsProp.map((unit) => [unit.title, unit.id]));
  });

  // Supabase RPC Function for Unified Workflow
  const createUnitClusterResource = async (params: {
    unitTitle: string;
    clusterTitle: string;
    userId: string;
    fileData: any[];
  }) => {
    try {
      const { data, error } = await supabase.rpc(
        "create_unit_cluster_resource",
        {
          p_unit_title: params.unitTitle,
          p_cluster_title: params.clusterTitle,
          p_user_id: params.userId,
          p_file_data: params.fileData,
        }
      );

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Comprehensive creation error:", error);
      throw error;
    }
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

  const uploadFile = async (fileData: FileObject[]): Promise<any[]> => {
    const uploadPromises = fileData.map(async (file) => {
      try {
        const fileRef = ref(storage, `example_user/${fileType}s/${file.name}`);
        const fileBlob = await (await fetch(file.content)).blob();
        const uploadTask = uploadBytesResumable(fileRef, fileBlob);

        return new Promise<any>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`Upload is ${progress}% done`);
            },
            (error) => reject(error),
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                content: file.text,
                file_url: downloadURL,
              });
            }
          );
        });
      } catch (error) {
        console.error("File upload error", error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
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
    } catch (error) {
      console.error("Error reading files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Upload files to Firebase
      const uploadedFiles = await uploadFile(fileData);

      // Use Supabase RPC to handle unit, cluster, and resource creation
      const result = await createUnitClusterResource({
        unitTitle,
        clusterTitle,
        userId,
        fileData: uploadedFiles,
      });

      toast({
        title: "Success",
        description: "Files uploaded and processed successfully!",
      });

      // Reset form and close
      handleCancel();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload and process files.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    setFiles([]);
    setFileData([]);
    setUnitTitle("");
  };

  // Rest of the component remains the same...
  return (
    <div className="absolute w-fit max-h-40">
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
