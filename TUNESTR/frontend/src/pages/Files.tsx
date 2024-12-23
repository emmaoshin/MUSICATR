import React, { useEffect, useState } from 'react';
import { FileInfo, LastImageState } from '@/types';
import SelectedItems from '@/components/SelectedItems';
import ChosenFile from '@/components/LastImage';
import { SelectFile, GetState, RemoveFile, ClearState, RenameFile, SetLastImage } from '../../wailsjs/go/main/App';

const Files: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [lastImage, setLastImage] = useState<LastImageState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      setLoading(true);
      const state = await GetState();
      if (state) {
        setSelectedFiles(state.selectedFiles || []);
        setLastImage(state.lastImage || null);
      }
    } catch (error) {
      console.error('Error loading state:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChosenFileName = (): string | undefined => {
    if (!lastImage?.path) return undefined;
    const imagePath = lastImage.path;
    
    // Find the file in selectedFiles that matches the chosen file
    const chosenFile = selectedFiles.find(file => {
      // Since lastImage.path is a data URL, we need to find the file that was used to create it
      // We can check if the data URL contains any part of the file path
      const pathParts = file.path.split(/[\\/]/); // Split on both forward and backward slashes
      return pathParts.some(part => 
        // Check if any part of the path matches
        part && part.length > 3 && imagePath.includes(part)
      );
    });
    
    return chosenFile?.name;
  };

  const handleFileSelect = async () => {
    try {
      const fileInfo = await SelectFile();
      if (fileInfo) {
        await loadState();
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleRemoveFile = async (path: string) => {
    try {
      await RemoveFile(path);
      await loadState();
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await ClearState();
      await loadState();
    } catch (error) {
      console.error('Error clearing state:', error);
    }
  };

  const handleSetLastImage = async (file: FileInfo) => {
    try {
      await SetLastImage(file.path);
      await loadState();
    } catch (error) {
      console.error('Error setting last image:', error);
    }
  };

  const handleClearLastImage = async () => {
    try {
      await SetLastImage("");
      await loadState();
    } catch (error) {
      console.error('Error clearing last image:', error);
    }
  };

  const handleRenameFile = async (path: string, newName: string) => {
    try {
      await RenameFile(path, newName);
      await loadState();
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Files</h1>
        <div className="space-x-4">
          <button
            onClick={handleFileSelect}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Select File
          </button>
          {selectedFiles.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <SelectedItems 
          files={selectedFiles} 
          onRemove={handleRemoveFile}
          onSetAsLastImage={handleSetLastImage}
          currentLastImagePath={lastImage?.path}
          onRename={handleRenameFile}
        />
        <ChosenFile 
          lastImage={lastImage} 
          onClear={handleClearLastImage}
          fileName={getChosenFileName()}
        />
      </div>
    </div>
  );
};

export default Files; 