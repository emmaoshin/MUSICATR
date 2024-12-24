import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Folders } from "./components/folders"
import { Images } from "./components/images"
import { Favorites } from "./components/favorites"

export default function FileManager() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="folders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="folders">
          <Folders />
        </TabsContent>
        <TabsContent value="images">
          <Images />
        </TabsContent>
        <TabsContent value="favorites">
          <Favorites />
        </TabsContent>
      </Tabs>
    </div>
  )
}

