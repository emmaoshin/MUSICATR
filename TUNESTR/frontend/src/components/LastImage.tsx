import React from 'react';

interface LastImageProps {
  lastImage: string | null;
}

const LastImage: React.FC<LastImageProps> = ({ lastImage }) => {
  const getImageUrl = (dataUrl: string) => {
    const parts = dataUrl.split('###');
    return parts[0]; // Return just the data URL part
  };

  if (!lastImage) {
    return (
      <div className="border rounded p-4">
        <h2 className="text-xl mb-3">Last Selected Image</h2>
        <p className="text-gray-500">No image selected</p>
      </div>
    );
  }

  return (
    <div className="border rounded p-4">
      <h2 className="text-xl mb-3">Last Selected Image</h2>
      <div className="relative aspect-video">
        <img
          src={getImageUrl(lastImage)}
          alt="Selected image"
          className="w-full h-full object-contain"
          onError={(e) => {
            console.error('Error loading image:', lastImage.substring(0, 100) + '...');
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden text-gray-500 text-center p-4">
          Unable to load image
        </div>
      </div>
    </div>
  );
};

export default LastImage; 