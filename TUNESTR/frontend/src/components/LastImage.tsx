import React from 'react';
import { LastImageState } from '@/types';
import { X } from 'lucide-react';

interface ChosenFileProps {
  lastImage: LastImageState | null;
  onClear: () => void;
  fileName?: string;
}

const ChosenFile: React.FC<ChosenFileProps> = ({ lastImage, onClear, fileName }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!lastImage?.path) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Chosen File</h2>
        <p className="text-muted-foreground">No file chosen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Chosen File</h2>
      <div className="overflow-hidden rounded-lg border bg-card relative group">
        <button
          onClick={onClear}
          className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background border rounded-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Clear chosen file"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative aspect-video">
          <img
            src={lastImage.path}
            alt="Chosen file preview"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
        <div className="p-3 border-t space-y-1">
          {fileName && (
            <p className="text-sm font-medium truncate">
              {fileName}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Selected: {formatTimestamp(lastImage.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChosenFile; 