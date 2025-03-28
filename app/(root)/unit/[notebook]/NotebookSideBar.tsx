"use client"

import type React from "react"
import { useState } from "react"
import { Edit2, Trash2 } from "lucide-react"

interface Notebook {
  id: string
  name: string
  content: string
  lastModified: Date
}

interface SidebarProps {
  notebooks: Notebook[]
  currentNotebookId: string
  onSelectNotebook: (id: string) => void
  onRenameNotebook: (id: string, newName: string) => void
  onDeleteNotebook: (id: string) => void
}

export function Sidebar({
  notebooks,
  currentNotebookId,
  onSelectNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>("")

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const handleFinishRename = () => {
    if (editingId && editingName.trim()) {
      onRenameNotebook(editingId, editingName)
    }
    setEditingId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishRename()
    } else if (e.key === "Escape") {
      setEditingId(null)
    }
  }

  return (
    <div className="h-full bg-white border-r overflow-y-auto p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Your Notebooks</h2>
      <ul className="space-y-1">
        {notebooks.map((notebook) => (
          <li
            key={notebook.id}
            className={`rounded-lg ${
              notebook.id === currentNotebookId ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-between p-2">
              {editingId === notebook.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="flex-1 p-1 border rounded"
                />
              ) : (
                <button onClick={() => onSelectNotebook(notebook.id)} className="flex-1 text-left truncate py-1">
                  {notebook.name}
                </button>
              )}
              <div className="flex space-x-1">
                <button
                  onClick={() => handleStartRename(notebook.id, notebook.name)}
                  className="p-1 text-gray-500 hover:text-indigo-600 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteNotebook(notebook.id)}
                  className="p-1 text-gray-500 hover:text-red-600 rounded"
                  disabled={notebooks.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="px-2 pb-1 text-xs text-gray-500">{notebook.lastModified.toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

