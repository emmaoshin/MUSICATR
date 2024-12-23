import React, { useEffect, useState } from 'react';
import { FileInfo, LastImageState } from '@/types';
import SelectedItems from '@/components/SelectedItems';
import LastImage from '@/components/LastImage';
import { SelectFile, GetState, RemoveFile, ClearState } from '../../wailsjs/go/main/App';

const Files: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [lastImage, setLastImage] = useState<LastImageState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load state from backend on component mount
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

  const handleFileSelect = async () => {
    try {
      const fileInfo = await SelectFile();
      if (fileInfo) {
        // State is automatically updated in the backend
        // Just reload the state
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
        <SelectedItems files={selectedFiles} onRemove={handleRemoveFile} />
        <LastImage lastImage={lastImage} />
      </div>
    </div>
  );
};

export default Files; 