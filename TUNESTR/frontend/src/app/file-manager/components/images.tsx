'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, Share2, Edit2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const imageList = [
  { id: 1, name: 'Image 1', src: '/placeholder.svg', favorite: false },
  { id: 2, name: 'Image 2', src: '/placeholder.svg', favorite: true },
  { id: 3, name: 'Image 3', src: '/placeholder.svg', favorite: false },
]

export function Images() {
  const [images, setImages] = useState(imageList)

  const toggleFavorite = (id: number) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, favorite: !img.favorite } : img
    ))
  }

  const renameImage = (id: number, newName: string) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, name: newName } : img
    ))
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <div key={image.id} className="border rounded-lg p-2">
          <Image src={image.src} alt={image.name} width={200} height={200} className="w-full h-40 object-cover mb-2" />
          <p className="font-semibold mb-2">{image.name}</p>
          <div className="flex justify-between">
            <Button variant="outline" size="icon" onClick={() => toggleFavorite(image.id)}>
              <Heart className={`h-4 w-4 ${image.favorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Image</DialogTitle>
                </DialogHeader>
                <Input 
                  defaultValue={image.name}
                  onChange={(e) => renameImage(image.id, e.target.value)}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

