'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageIcon, Video, MapPin, Table, AlertTriangle, Heart } from 'lucide-react'
import { Editor } from '@tiptap/core'

interface MediaToolsProps {
  editor: Editor | null
}

// EXIF scrubber - removes EXIF data from images
async function scrubExif(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          canvas.toBlob((blob) => {
            if (blob) {
              const scrubbedFile = new File([blob], file.name, { type: file.type })
              resolve(scrubbedFile)
            } else {
              resolve(file)
            }
          }, file.type)
        } else {
          resolve(file)
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function MediaTools({ editor }: MediaToolsProps) {
  const [images, setImages] = useState<string[]>([])
  const [beforeAfterImages, setBeforeAfterImages] = useState<{ before: string | null; after: string | null }>({
    before: null,
    after: null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (file: File) => {
    // Scrub EXIF data
    const scrubbedFile = await scrubExif(file)
    
    // Convert to data URL or upload to server
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImages([...images, dataUrl])
      
      // Insert into editor
      if (editor) {
        editor.chain().focus().setImage({ src: dataUrl }).run()
      }
    }
    reader.readAsDataURL(scrubbedFile)
  }

  const handleGalleryUpload = async (files: FileList) => {
    const uploadedImages: string[] = []
    for (const file of Array.from(files)) {
      const scrubbedFile = await scrubExif(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        uploadedImages.push(e.target?.result as string)
        if (uploadedImages.length === files.length) {
          setImages([...images, ...uploadedImages])
        }
      }
      reader.readAsDataURL(scrubbedFile)
    }
  }

  const insertBeforeAfter = () => {
    if (!beforeAfterImages.before || !beforeAfterImages.after) return
    
    if (editor) {
      const html = `
        <div class="before-after-container my-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="font-semibold mb-2">Before</h4>
              <img src="${beforeAfterImages.before}" alt="Before" class="w-full rounded" />
            </div>
            <div>
              <h4 class="font-semibold mb-2">After</h4>
              <img src="${beforeAfterImages.after}" alt="After" class="w-full rounded" />
            </div>
          </div>
        </div>
      `
      editor.chain().focus().insertContent(html).run()
    }
  }

  const insertVideo = () => {
    const url = window.prompt('Video URL (YouTube, Vimeo, etc.)')
    if (url && editor) {
      const html = `<div class="video-embed my-4"><iframe src="${url}" frameborder="0" allowfullscreen class="w-full aspect-video"></iframe></div>`
      editor.chain().focus().insertContent(html).run()
    }
  }

  const insertMap = () => {
    const address = window.prompt('Address or coordinates')
    if (address && editor) {
      // Generate embed URL (example for Google Maps)
      const embedUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(address)}`
      const html = `<div class="map-embed my-4"><iframe src="${embedUrl}" width="100%" height="450" frameborder="0" style="border:0" allowfullscreen></iframe></div>`
      editor.chain().focus().insertContent(html).run()
    }
  }

  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
  }

  const insertCallout = (type: 'vet-tip' | 'safety-warning') => {
    if (!editor) return
    
    const title = type === 'vet-tip' ? 'Vet Tip' : 'Safety Warning'
    const icon = type === 'vet-tip' ? '💡' : '⚠️'
    const bgColor = type === 'vet-tip' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
    
    const html = `
      <div class="callout ${bgColor} border-l-4 p-4 my-4 rounded">
        <div class="flex items-start gap-2">
          <span class="text-2xl">${icon}</span>
          <div class="flex-1">
            <h4 class="font-semibold mb-2">${title}</h4>
            <p>Add your tip or warning here...</p>
          </div>
        </div>
      </div>
    `
    editor.chain().focus().insertContent(html).run()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Tools</CardTitle>
        <CardDescription>Insert images, videos, maps, tables, and callouts</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="images">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="callouts">Callouts</TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-4">
            <div className="space-y-2">
              <Label>Single Image (EXIF scrubbed)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Image Gallery</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                  if (files) handleGalleryUpload(files)
                }}
              />
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Gallery ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 p-4 border border-gray-200 rounded-lg">
              <Label>Before/After Comparison</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Before</Label>
                  <Input
                    ref={beforeInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const scrubbed = await scrubExif(file)
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setBeforeAfterImages({ ...beforeAfterImages, before: ev.target?.result as string })
                        }
                        reader.readAsDataURL(scrubbed)
                      }
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">After</Label>
                  <Input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const scrubbed = await scrubExif(file)
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setBeforeAfterImages({ ...beforeAfterImages, after: ev.target?.result as string })
                        }
                        reader.readAsDataURL(scrubbed)
                      }
                    }}
                  />
                </div>
              </div>
              <Button
                onClick={insertBeforeAfter}
                disabled={!beforeAfterImages.before || !beforeAfterImages.after}
                className="w-full mt-2"
                type="button"
              >
                Insert Before/After
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="video">
            <Button onClick={insertVideo} className="w-full" type="button">
              <Video className="h-4 w-4 mr-2" />
              Insert Video Embed
            </Button>
          </TabsContent>

          <TabsContent value="map">
            <Button onClick={insertMap} className="w-full" type="button">
              <MapPin className="h-4 w-4 mr-2" />
              Insert Map
            </Button>
          </TabsContent>

          <TabsContent value="table">
            <Button onClick={insertTable} className="w-full" type="button">
              <Table className="h-4 w-4 mr-2" />
              Insert Table
            </Button>
          </TabsContent>

          <TabsContent value="callouts" className="space-y-2">
            <Button
              onClick={() => insertCallout('vet-tip')}
              variant="outline"
              className="w-full"
              type="button"
            >
              <Heart className="h-4 w-4 mr-2" />
              Insert Vet Tip
            </Button>
            <Button
              onClick={() => insertCallout('safety-warning')}
              variant="outline"
              className="w-full"
              type="button"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Insert Safety Warning
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

