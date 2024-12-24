import { useEffect, useState } from 'react';
import { SelectFile, GetState, SetLastImage, RemoveFile, RenameFile } from '../../wailsjs/go/main/App';
import { LastImageState } from '@/types';
import ChosenFile from '@/components/LastImage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Edit2, Plus, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ImageFile {
  path: string;
  name: string;
  ext: string;
  size: number;
  modTime: string;
  favorite?: boolean;
}

export default function Files() {
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([]);
  const [lastImage, setLastImage] = useState<LastImageState | null>(null);
  const [favorites, setFavorites] = useState<ImageFile[]>([]);
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<ImageFile | null>(null);
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const state = await GetState();
      setSelectedFiles(state.selectedFiles || []);
      setLastImage(state.lastImage || null);
      const favSet = new Set(state.selectedFiles?.filter(f => f.favorite).map(f => f.path));
      setLocalFavorites(favSet);
      setFavorites(state.selectedFiles?.filter(file => file.favorite) || []);
    } catch (error) {
      console.error('Error loading state:', error);
    }
  };

  const handleFileSelect = async () => {
    try {
      const file = await SelectFile();
      if (file) {
        await loadState();
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleSetLastImage = async (path: string) => {
    try {
      await SetLastImage(path);
      const state = await GetState();
      if (state.lastImage) {
        setLastImage(state.lastImage);
      }
    } catch (error) {
      console.error('Error setting last image:', error);
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

  const handleClearLastImage = async () => {
    try {
      await SetLastImage('');
      await loadState();
    } catch (error) {
      console.error('Error clearing last image:', error);
    }
  };

  const toggleFavorite = (file: ImageFile) => {
    setLocalFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(file.path)) {
        newFavorites.delete(file.path);
      } else {
        newFavorites.add(file.path);
      }
      return newFavorites;
    });
  };

  const handleRename = async () => {
    try {
      if (!editingFile) return;

      await RenameFile(editingFile.path, newFileName);
      
      // If this was the last image, refresh it
      if (lastImage && lastImage.name === editingFile.name) {
        await SetLastImage(''); // Clear it first
        const state = await GetState();
        // Find the renamed file and set it as last image
        const renamedFile = state.selectedFiles.find(f => f.name === newFileName);
        if (renamedFile) {
          await SetLastImage(renamedFile.path);
        }
      }
      
      await loadState(); // Reload all state
      setIsRenameOpen(false);
      setEditingFile(null);
      setNewFileName('');
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };

  const openRenameDialog = (file: ImageFile) => {
    setEditingFile(file);
    setNewFileName(file.name);
    setIsRenameOpen(true);
  };

  const closeRenameDialog = () => {
    setIsRenameOpen(false);
    setEditingFile(null);
    setNewFileName('');
  };

  const ImageCard = ({ file, showRename = true }: { file: ImageFile, showRename?: boolean }) => (
    <div key={file.path} className="border rounded-lg p-2">
      <img
        src={file.path}
        alt={file.name}
        className="w-full h-40 object-cover mb-2 cursor-pointer"
        onClick={() => handleSetLastImage(file.path)}
      />
      <p className="font-semibold mb-2">{file.name}</p>
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => toggleFavorite(file)}
          className={localFavorites.has(file.path) ? 'text-red-500 hover:text-red-600' : ''}
        >
          <Heart className={`h-4 w-4 ${localFavorites.has(file.path) ? 'fill-red-500' : ''}`} />
        </Button>
        {showRename && (
          <>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => openRenameDialog(file)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Dialog open={isRenameOpen && editingFile?.path === file.path} onOpenChange={closeRenameDialog}>
              <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Rename Image</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2">
                  <Input 
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleRename();
                      }
                    }}
                    autoFocus
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleRename}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Image Manager</h1>
        <Button onClick={handleFileSelect}>
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>

      <ChosenFile lastImage={lastImage} onClear={handleClearLastImage} />

      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.map((file) => (
              <ImageCard key={file.path} file={file} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.filter(file => localFavorites.has(file.path)).map((file) => (
              <ImageCard key={file.path} file={file} showRename={false} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {['Memes', 'Private', 'Public', 'Duplicates'].map((folder) => (
              <div
                key={folder}
                className="p-4 border rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span>{folder}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 