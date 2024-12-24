import React from 'react';
import { LastImageState } from '@/types';
import { X, Info } from 'lucide-react';

interface ChosenFileProps {
  lastImage: LastImageState | null;
  onClear: () => void;
}

const ChosenFile: React.FC<ChosenFileProps> = ({ lastImage, onClear }) => {
  const [showInfo, setShowInfo] = React.useState(false);

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

  const formatSize = (size: number | null) => {
    if (!size) return 'Unknown size';
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

  if (!lastImage?.path) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Chosen File</h2>
        <p className="text-muted-foreground">No file chosen</p>
      </div>
    );
  }

  const handleInfoClick = () => {
    setShowInfo(!showInfo);
  };

  const fileInfo = (
    <div className="space-y-1 p-3 bg-card rounded-md border">
      <p><strong>File Name:</strong> {lastImage.name || 'Unknown'}</p>
      <p><strong>Type:</strong> {lastImage.ext || 'Unknown'}</p>
      <p><strong>Size:</strong> {formatSize(lastImage.size)}</p>
      <p><strong>Last modified:</strong> {formatTimestamp(lastImage.timestamp)}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chosen File</h2>
        <button
          onClick={handleInfoClick}
          className="p-1.5 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          title={showInfo ? "Hide file info" : "Show file info"}
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      
      {showInfo && fileInfo}

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
            alt={`Preview of ${lastImage.name || 'chosen file'}`}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
        <div className="p-3 border-t space-y-1">
          <p className="font-medium truncate">
            {lastImage.name || 'Unknown file'}
          </p>
          <p className="text-sm text-muted-foreground">
            Last modified: {formatTimestamp(lastImage.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChosenFile; 