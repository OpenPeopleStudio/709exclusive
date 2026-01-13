'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface VariantFormData {
  brand: string
  model: string
  size: string
  condition: string
  price: number
  stock: number
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Product form
  const [productName, setProductName] = useState('')
  const [productBrand, setProductBrand] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [isDrop, setIsDrop] = useState(false)
  const [dropStartsAt, setDropStartsAt] = useState('')
  const [dropEndsAt, setDropEndsAt] = useState('')

  // Variants
  const [variants, setVariants] = useState<VariantFormData[]>([
    { brand: '', model: '', size: '', condition: 'DS', price: 0, stock: 0 }
  ])

  const addVariant = () => {
    setVariants([...variants, { brand: '', model: '', size: '', condition: 'DS', price: 0, stock: 0 }])
  }

  const updateVariant = (index: number, field: keyof VariantFormData, value: string | number) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: {
            name: productName,
            brand: productBrand,
            category: productCategory,
            description: productDescription,
            isDrop,
            dropStartsAt,
            dropEndsAt
          },
          variants
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      router.push('/admin/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
        <p className="mt-2 text-gray-600">Add a new product with variants to your inventory.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand</label>
              <input
                type="text"
                required
                value={productBrand}
                onChange={(e) => setProductBrand(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Drop Settings */}
          <div className="mt-6">
            <div className="flex items-center">
              <input
                id="is-drop"
                type="checkbox"
                checked={isDrop}
                onChange={(e) => setIsDrop(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is-drop" className="ml-2 block text-sm text-gray-900">
                This is a drop product
              </label>
            </div>

            {isDrop && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Drop Starts At</label>
                  <input
                    type="datetime-local"
                    value={dropStartsAt}
                    onChange={(e) => setDropStartsAt(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Drop Ends At</label>
                  <input
                    type="datetime-local"
                    value={dropEndsAt}
                    onChange={(e) => setDropEndsAt(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
            <button
              type="button"
              onClick={addVariant}
              className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
            >
              Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium">Variant {index + 1}</h3>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Brand</label>
                    <input
                      type="text"
                      required
                      value={variant.brand}
                      onChange={(e) => updateVariant(index, 'brand', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <input
                      type="text"
                      required
                      value={variant.model}
                      onChange={(e) => updateVariant(index, 'model', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Size</label>
                    <input
                      type="text"
                      required
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Condition</label>
                    <select
                      value={variant.condition}
                      onChange={(e) => updateVariant(index, 'condition', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="DS">Deadstock (DS)</option>
                      <option value="VNDS">Very Near Deadstock (VNDS)</option>
                      <option value="USED">Used</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input
                      type="number"
                      required
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* SKU Preview */}
                {variant.brand && variant.model && variant.size && variant.condition && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Generated SKU:</div>
                    <div className="font-mono text-sm text-gray-900">
                      {variant.brand.toUpperCase()}-{variant.model.toUpperCase()}-{variant.size.toUpperCase()}-{variant.condition}-XXXX
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}