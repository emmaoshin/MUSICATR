import React, { useState } from 'react';
import { FileInfo } from '@/types';
import { X, Plus, Edit2, Check, X as XIcon } from 'lucide-react';

interface SelectedItemsProps {
  files: FileInfo[];
  onRemove: (path: string) => void;
  onSetAsLastImage: (file: FileInfo) => void;
  currentLastImagePath?: string | null;
  onRename: (path: string, newName: string) => void;
}

const SelectedItems: React.FC<SelectedItemsProps> = ({ 
  files, 
  onRemove, 
  onSetAsLastImage,
  currentLastImagePath,
  onRename
}) => {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const isImageFile = (ext: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(e => ext.toLowerCase().endsWith(e));
  };

  const isCurrentImage = (filePath: string): boolean => {
    if (!currentLastImagePath) return false;
    const currentPath = currentLastImagePath;
    const pathParts = filePath.split(/[\\/]/);
    return pathParts.some(part => 
      part && part.length > 3 && currentPath.includes(part)
    );
  };

  const handleStartEdit = (file: FileInfo) => {
    setEditingFile(file.path);
    setEditName(file.name);
  };

  const handleSaveEdit = (path: string) => {
    if (editName.trim()) {
      onRename(path, editName);
    }
    setEditingFile(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditName("");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Selected Files</h2>
      {files.length === 0 ? (
        <p className="text-muted-foreground">No files selected</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li 
              key={file.path}
              className="flex items-center justify-between p-3 bg-card rounded-lg border relative group"
            >
              <div className="flex-1 min-w-0">
                {editingFile === file.path ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded bg-background"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(file.path)}
                      className="p-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                      title="Cancel"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Last modified: {new Date(file.modTime).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {!editingFile && (
                  <button
                    onClick={() => handleStartEdit(file)}
                    className="p-1.5 hover:bg-accent hover:text-accent-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit name"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
                {isImageFile(file.ext) && (
                  <button
                    onClick={() => onSetAsLastImage(file)}
                    className={`p-1.5 rounded-md transition-colors ${
                      isCurrentImage(file.path)
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                    disabled={isCurrentImage(file.path)}
                    title={isCurrentImage(file.path) ? "Current chosen file" : "Set as chosen file"}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onRemove(file.path)}
                  className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SelectedItems; 