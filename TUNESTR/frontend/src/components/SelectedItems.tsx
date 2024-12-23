import React, { useEffect, useState } from 'react';
import { FileInfo } from '@/types';

interface SelectedItemsProps {
  files: FileInfo[];
  onRemove: (path: string) => void;
}

const SelectedItems: React.FC<SelectedItemsProps> = ({ files, onRemove }) => {
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
              className="flex items-center justify-between p-3 bg-card rounded-lg border"
            >
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Last modified: {new Date(file.modTime).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => onRemove(file.path)}
                className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                title="Remove file"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SelectedItems; 