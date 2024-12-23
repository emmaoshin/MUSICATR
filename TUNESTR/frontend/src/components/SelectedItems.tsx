import React from 'react';
import { FileInfo } from '../types';

interface SelectedItemsProps {
  selectedFiles: FileInfo[];
}

const SelectedItems: React.FC<SelectedItemsProps> = ({ selectedFiles }) => {
  const formatPath = (path: string) => {
    if (path.startsWith('data:')) {
      return path.substring(0, 20) + '...'; // Show only first 20 chars of data URL
    }
    return path;
  };

  return (
    <div className="border rounded p-4">
      <h2 className="text-xl mb-3">Selected Items</h2>
      {selectedFiles.length === 0 ? (
        <p className="text-gray-500">No items selected</p>
      ) : (
        selectedFiles.map((file, index) => (
          <div key={index} className="p-2 mb-2 bg-gray-100 rounded">
            <p className="font-medium">{file.name || "can't get name" }</p>
            <p className="text-sm text-gray-600">{formatPath(file.path)}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default SelectedItems; 