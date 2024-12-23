import React, { useState } from 'react';
import { SelectFile, SelectDirectory, GetFileInfo } from '../../wailsjs/go/main/App';
import { FileInfo } from '../types';
import SelectedItems from '../components/SelectedItems';
import LastImage from '../components/LastImage';

const Files: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [lastImage, setLastImage] = useState<string | null>(null);

  const handleFileSelect = async () => {
    try {
      const dataUrl = await SelectFile();
      if (dataUrl) {
        const result = await GetFileInfo(dataUrl);
        const fileInfo: FileInfo = {
          name: result.name as string || 'Selected Image',
          path: result.path as string || dataUrl,
          ext: result.ext as string || '.jpg'
        };
        setSelectedFiles(prev => [...prev, fileInfo]);
        setLastImage(dataUrl);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleDirectorySelect = async () => {
    try {
      const dirPath = await SelectDirectory();
      if (dirPath) {
        const result = await GetFileInfo(dirPath);
        const dirInfo: FileInfo = {
          name: result.name as string,
          path: result.path as string,
          ext: result.ext as string
        };
        setSelectedFiles(prev => [...prev, dirInfo]);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">File Explorer</h1>

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={handleFileSelect}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Select File
        </button>
        <button
          onClick={handleDirectorySelect}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Select Folder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectedItems selectedFiles={selectedFiles} />
        <LastImage lastImage={lastImage} />
      </div>
    </div>
  );
};

export default Files; 