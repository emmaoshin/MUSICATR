'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, Share2 } from 'lucide-react'
import { Button } from "@/components/ui/button"

const favoritesList = [
  { id: 2, name: 'Image 2', src: '/placeholder.svg' },
]

export function Favorites() {
  const [favorites, setFavorites] = useState(favoritesList)

  const removeFromFavorites = (id: number) => {
    setFavorites(favorites.filter(img => img.id !== id))
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {favorites.map((image) => (
        <div key={image.id} className="border rounded-lg p-2">
          <Image src={image.src} alt={image.name} width={200} height={200} className="w-full h-40 object-cover mb-2" />
          <p className="font-semibold mb-2">{image.name}</p>
          <div className="flex justify-between">
            <Button variant="outline" size="icon" onClick={() => removeFromFavorites(image.id)}>
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

