'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface ModelImage {
  id: string
  url: string
  source: string
  is_primary: boolean
  position: number
  created_at: string
}

interface GoogleImageResult {
  imageUrl: string
  thumbnail: string
  width: number
  height: number
  sourcePage: string
}

export default function ModelImagesPage() {
  const params = useParams()
  const router = useRouter()
  const modelId = params.id as string

  const [model, setModel] = useState<{ id: string; brand: string; model: string } | null>(null)
  const [images, setImages] = useState<ModelImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoogleImport, setShowGoogleImport] = useState(false)
  const [googleImages, setGoogleImages] = useState<GoogleImageResult[]>([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [modelId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}`)
      if (response.ok) {
        const data = await response.json()
        setModel(data.model)
        setImages(data.images || [])
      } else if (response.status === 404) {
        router.push('/admin/models')
        return
      } else {
        console.error('Failed to fetch model data')
      }
    } catch (error) {
      console.error('Error fetching model data:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchGoogleImages = async () => {
    if (!model) return

    setSearching(true)
    try {
      const response = await fetch('/api/admin/models/google-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: model.brand,
          model: model.model
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGoogleImages(data.images || [])
        setShowGoogleImport(true)
      } else {
        alert('Failed to search Google images')
      }
    } catch (error) {
      console.error('Google search error:', error)
      alert('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const importSelectedImages = async () => {
    if (selectedImages.size === 0) return

    setImporting(true)
    try {
      const response = await fetch('/api/admin/models/import-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          images: Array.from(selectedImages)
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Imported ${data.imported} of ${data.total} images`)
        setShowGoogleImport(false)
        setSelectedImages(new Set())
        await fetchData() // Refresh images
      } else {
        alert('Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Import failed')
    } finally {
      setImporting(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm('Delete this image?')) return

    try {
      const response = await fetch(`/api/admin/models/${modelId}/images?imageId=${imageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
      } else {
        alert('Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed')
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Model Images</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!model) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Model Images</h1>
        <p className="text-red-600">Model not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Images</h1>
          <p className="text-gray-600 mt-1">
            {model.brand} {model.model}
          </p>
        </div>
        <div className="space-x-4">
          <button
            onClick={searchGoogleImages}
            disabled={searching}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Import from Google'}
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-400"
          >
            Back
          </button>
        </div>
      </div>

      {/* Existing Images */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Images ({images.length})
          </h2>
        </div>
        {images.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No images yet. Import from Google or upload manually.
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt={`${model.brand} ${model.model}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                      {image.is_primary && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                          Primary
                        </span>
                      )}
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {image.source} • {new Date(image.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Google Import Modal */}
      {showGoogleImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Import from Google - {model.brand} {model.model}
              </h2>
              <button
                onClick={() => setShowGoogleImport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {googleImages.length === 0 ? (
                <p className="text-gray-500">No images found. Try different search terms.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {googleImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.thumbnail}
                        alt={`Search result ${index + 1}`}
                        className={`w-full h-32 object-cover rounded-lg cursor-pointer border-2 ${
                          selectedImages.has(image.imageUrl)
                            ? 'border-blue-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          const newSelected = new Set(selectedImages)
                          if (newSelected.has(image.imageUrl)) {
                            newSelected.delete(image.imageUrl)
                          } else {
                            newSelected.add(image.imageUrl)
                          }
                          setSelectedImages(newSelected)
                        }}
                      />
                      {selectedImages.has(image.imageUrl) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        {image.width}×{image.height}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedImages.size} images selected
              </div>
              <div className="space-x-4">
                <button
                  onClick={() => setShowGoogleImport(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={importSelectedImages}
                  disabled={selectedImages.size === 0 || importing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : `Import ${selectedImages.size} Images`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}