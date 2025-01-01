import Link from 'next/link'
import { Folder } from 'lucide-react'

const folderList = [
  { id: 1, name: 'Memes' },
  { id: 2, name: 'Private' },
  { id: 3, name: 'Public' },
  { id: 4, name: 'Duplicates' },
]

export function Folders() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {folderList.map((folder) => (
        <Link 
          key={folder.id} 
          href={`/folder/${folder.id}`}
          className="p-4 border rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
        >
          <Folder className="h-6 w-6" />
          <span>{folder.name}</span>
        </Link>
      ))}
    </div>
  )
}

