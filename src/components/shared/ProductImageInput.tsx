import { ImageIcon, Link2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { productService } from '@/services/product.service'
import { cn } from '@/lib/utils'

type ImageMode = 'upload' | 'url'

export interface ProductImageInputProps {
  value?: string
  onChange: (url: string) => void
  error?: string
}

export function ProductImageInput({ value = '', onChange, error }: ProductImageInputProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImageMode>('upload')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'error' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image must be 2 MB or smaller', variant: 'error' })
      return
    }

    setIsUploading(true)
    try {
      const { data } = await productService.uploadImage(file)
      onChange(data.data.image_url)
      toast({ title: 'Image uploaded', variant: 'success' })
    } catch {
      toast({ title: 'Failed to upload image', variant: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-700">Product Image</label>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              mode === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setMode('upload')}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              mode === 'url' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setMode('url')}
          >
            <Link2 className="h-3.5 w-3.5" />
            Image URL
          </button>
        </div>
      </div>

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img src={value} alt="Product preview" className="mx-auto max-h-48 w-full object-contain" />
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-gray-500 shadow-sm transition-colors hover:bg-white hover:text-gray-700"
            onClick={() => onChange('')}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-400">
          <div className="flex flex-col items-center gap-1 text-sm">
            <ImageIcon className="h-8 w-8" />
            <span>No image selected</span>
          </div>
        </div>
      )}

      {mode === 'upload' ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {value ? 'Replace image' : 'Choose image'}
          </Button>
          <p className="text-xs text-gray-500">JPEG, PNG, WebP, or GIF · max 2 MB</p>
        </div>
      ) : (
        <Input
          placeholder="https://example.com/product.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )}

      {mode === 'upload' && error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  )
}
