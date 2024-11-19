import React, { useState } from "react";
import { Pencil, Trash2, MoreVertical } from "lucide-react";

interface Notebook {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
}

interface SidebarProps {
  notebooks: Notebook[];
  currentNotebookId: string;
  onSelectNotebook: (id: string) => void;
  onRenameNotebook: (id: string, newName: string) => void;
  onDeleteNotebook: (id: string) => void;
}

export function Sidebar({
  notebooks,
  currentNotebookId,
  onSelectNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleRenameClick = (id: string) => {
    setEditingId(id);
    setMenuOpenId(null);
  };

  const handleRenameSubmit = (id: string, newName: string) => {
    onRenameNotebook(id, newName);
    setEditingId(null);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Are you sure you want to delete this notebook?")) {
      onDeleteNotebook(id);
    }
    setMenuOpenId(null);
  };

  return (
    <div className="h-full bg-gray-900 text-gray-300 p-4">
      <h2 className="text-lg font-semibold mb-4 text-white">Notebooks</h2>
      <div className="space-y-1">
        {notebooks.map((notebook) => (
          <div
            key={notebook.id}
            className={`relative group rounded-lg ${
              currentNotebookId === notebook.id
                ? "bg-gray-700 text-white"
                : "hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center p-2">
              {editingId === notebook.id ? (
                <input
                  type="text"
                  defaultValue={notebook.name}
                  className="flex-1 bg-gray-800 text-white px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onBlur={(e) =>
                    handleRenameSubmit(notebook.id, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameSubmit(notebook.id, e.currentTarget.value);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <>
                  <button
                    className="flex-1 text-left truncate"
                    onClick={() => onSelectNotebook(notebook.id)}
                  >
                    {notebook.name}
                  </button>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setMenuOpenId(notebook.id)}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Dropdown Menu */}
            {menuOpenId === notebook.id && (
              <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleRenameClick(notebook.id)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteClick(notebook.id)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-xs text-gray-500">
          Last modified: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
