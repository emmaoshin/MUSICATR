import React from 'react';
import { LastImageState } from '@/types';

interface LastImageProps {
  lastImage: LastImageState | null;
}

const LastImage: React.FC<LastImageProps> = ({ lastImage }) => {
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
        <h2 className="text-lg font-semibold">Last Image</h2>
        <p className="text-muted-foreground">No image selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Last Image</h2>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="relative aspect-video">
          <img
            src={lastImage.path}
            alt="Last selected image"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
        <div className="p-3 border-t">
          <p className="text-sm text-muted-foreground">
            Selected: {formatTimestamp(lastImage.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LastImage; 