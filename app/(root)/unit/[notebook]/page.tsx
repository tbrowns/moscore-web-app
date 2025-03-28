"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Book, Plus, Save } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "./NotebookSideBar";

import { ChatSideBar } from "@/components/shared/ChatSideBar";

interface Notebook {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
}

export default function NotebookApp() {
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
        content:
          "<p>Welcome to your Notebook! Start writing your thoughts here...</p>",
        lastModified: new Date(),
      },
    ];
  });

  const [currentNotebookId, setCurrentNotebookId] = useState<string>(
    notebooks[0].id
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const currentNotebook =
    notebooks.find((n) => n.id === currentNotebookId) || notebooks[0];

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: currentNotebook.content,
    onUpdate: ({ editor }) => {
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
    },
  });

  // Save notebooks to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`notebooks-${page}`, JSON.stringify(notebooks));
  }, [notebooks, page]);

  // Update editor content when switching notebooks
  useEffect(() => {
    if (editor && currentNotebook) {
      editor.commands.setContent(currentNotebook.content);
    }
  }, [currentNotebookId, editor, currentNotebook]);

  const handleAddNotebook = () => {
    const newNotebook: Notebook = {
      id: `notebook-${Date.now()}`,
      name: `New Notebook ${notebooks.length + 1}`,
      content: "<p></p>",
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

    try {
      const { error } = await supabase.from("notebooks").upsert({
        id: currentNotebookId,
        name: currentNotebook.name,
        content: currentNotebook.content,
        unit_id: params.notebook,
        last_modified: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving notebook:", error);
        return;
      }

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-500 ease-in-out";
      notification.textContent = `✓ Saved at ${saveTime}`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.transform = "translateY(100%)";
        setTimeout(() => document.body.removeChild(notification), 500);
      }, 2000);
    } catch (error) {
      console.error("Error saving notebook:", error);
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
            <div className="h-full overflow-y-auto p-4">
              <EditorContent
                editor={editor}
                className="min-h-screen w-full max-w-screen-lg mx-auto bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
