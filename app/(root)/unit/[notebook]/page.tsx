"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Book, Plus, Save } from "lucide-react";

import { Editor } from "novel";
import { Editor as TipTapEditor } from "@tiptap/core";
import { supabase } from "@/lib/supabase";

import { Sidebar } from "@/app/(root)/unit/[notebook]/NotebookSideBar";
import { ChatSideBar } from "@/app/(root)/unit/[notebook]/ChatSideBar";

interface Notebook {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
}

export default function App() {
  const params = useParams();

  const page = params.notebook as string;
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`notebooks-${page}`);
      if (saved) {
        return JSON.parse(saved).map((n: any) => ({
          ...n,
          lastModified: new Date(n.lastModified),
        }));
      }
    }
    return [
      {
        id: "default",
        name: "Welcome Note",
        content: "Welcome to your Notebook!Start writing your thoughts here...",
        lastModified: new Date(),
      },
    ];
  });

  const [currentNotebookId, setCurrentNotebookId] = useState<string>(
    notebooks[0].id
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editorKey, setEditorKey] = useState(0); // Add this to force editor remount

  const currentNotebook =
    notebooks.find((n) => n.id === currentNotebookId) || notebooks[0];

  useEffect(() => {
    localStorage.setItem(`notebooks-${page}`, JSON.stringify(notebooks));
  }, [notebooks]);

  // Force editor remount when notebook changes
  useEffect(() => {
    setEditorKey((prev) => prev + 1);
  }, [currentNotebookId]);

  const handleContentChange = (editor?: TipTapEditor) => {
    if (!editor) return;

    const newContent = editor.getHTML();

    // Only update if content has actually changed
    if (newContent !== currentNotebook.content) {
      setNotebooks((prev) =>
        prev.map((notebook) =>
          notebook.id === currentNotebookId
            ? { ...notebook, content: newContent, lastModified: new Date() }
            : notebook
        )
      );
    }
  };

  const handleAddNotebook = () => {
    const newNotebook: Notebook = {
      id: `notebook-${Date.now()}`,
      name: `New Notebook ${notebooks.length + 1}`,
      content: "",
      lastModified: new Date(),
    };
    setNotebooks([...notebooks, newNotebook]);
    setCurrentNotebookId(newNotebook.id);
  };

  const handleRenameNotebook = (id: string, newName: string) => {
    setNotebooks((prev) =>
      prev.map((notebook) =>
        notebook.id === id ? { ...notebook, name: newName } : notebook
      )
    );
  };

  const handleDeleteNotebook = (id: string) => {
    if (notebooks.length === 1) return;
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
    if (currentNotebookId === id) {
      setCurrentNotebookId(
        notebooks[0].id === id ? notebooks[1].id : notebooks[0].id
      );
    }
  };

  const handleSave = async () => {
    const saveTime = new Date().toLocaleTimeString();
    const { error } = await supabase.from("notebooks").insert({
      id: currentNotebookId,
      name: currentNotebook.name,
      content: currentNotebook.content,
      unit_id: params.notebook,
      lastModified: currentNotebook.lastModified,
    });

    if (error) {
      console.error(error);
      return;
    }
    const notification = document.createElement("div");
    notification.className =
      "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-500 ease-in-out";
    notification.textContent = `✓ Saved at ${saveTime}`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = "translateY(100%)";
      setTimeout(() => document.body.removeChild(notification), 500);
    }, 2000);
  };

  const getInitialContent = (content: string) => {
    if (!content) return undefined;

    try {
      // First try to parse it as JSON in case it's already in the correct format
      const parsed = JSON.parse(content);
      return parsed;
    } catch {
      // If it's plain text, convert it to the proper format
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: content }],
          },
        ],
      };
    }
  };

  return (
    <>
      <ChatSideBar />
      <div className="h-screen flex bg-gray-50">
        <div
          className={`${
            isSidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 ease-in-out`}
        >
          {isSidebarOpen && (
            <Sidebar
              notebooks={notebooks}
              currentNotebookId={currentNotebookId}
              onSelectNotebook={setCurrentNotebookId}
              onRenameNotebook={handleRenameNotebook}
              onDeleteNotebook={handleDeleteNotebook}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Book className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                {currentNotebook.name}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddNotebook}
                className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-white">
            <div className="h-full overflow-y-auto">
              <Editor
                key={editorKey}
                defaultValue={getInitialContent(currentNotebook.content)}
                onUpdate={(editor?: TipTapEditor) => {
                  if (editor) handleContentChange(editor);
                }}
                storageKey={currentNotebookId}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
