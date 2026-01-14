'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  const [productName, setProductName] = useState('')
  const [productBrand, setProductBrand] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [isDrop, setIsDrop] = useState(false)
  const [dropStartsAt, setDropStartsAt] = useState('')
  const [dropEndsAt, setDropEndsAt] = useState('')

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
        headers: { 'Content-Type': 'application/json' },
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
        <Link href="/admin/products" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-4">Create Product</h1>
        <p className="text-[var(--text-secondary)] mt-1">Add a new product with variants</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Details */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Product Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>Product Name *</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Jordan 4 Retro"
              />
            </div>
            <div>
              <label>Brand</label>
              <input
                type="text"
                value={productBrand}
                onChange={(e) => setProductBrand(e.target.value)}
                placeholder="Nike"
              />
            </div>
            <div>
              <label>Category</label>
              <input
                type="text"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                placeholder="Sneakers"
              />
            </div>
            <div className="md:col-span-2">
              <label>Description</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={3}
                placeholder="Product description..."
              />
            </div>
          </div>

          {/* Drop Settings */}
          <div className="mt-6 pt-6 border-t border-[var(--border-primary)]">
            <label className="flex items-center gap-3 cursor-pointer mb-0">
              <input
                type="checkbox"
                checked={isDrop}
                onChange={(e) => setIsDrop(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--text-primary)] font-medium">This is a drop product</span>
            </label>

            {isDrop && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>Drop Starts</label>
                  <input
                    type="datetime-local"
                    value={dropStartsAt}
                    onChange={(e) => setDropStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label>Drop Ends</label>
                  <input
                    type="datetime-local"
                    value={dropEndsAt}
                    onChange={(e) => setDropEndsAt(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Variants</h2>
            <button type="button" onClick={addVariant} className="btn-secondary text-sm py-2 px-4">
              + Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {variants.map((variant, index) => (
              <div key={index} className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-[var(--text-primary)]">Variant {index + 1}</h3>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-sm text-[var(--error)] hover:text-[var(--error)]/80 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label>Brand *</label>
                    <input
                      type="text"
                      required
                      value={variant.brand}
                      onChange={(e) => updateVariant(index, 'brand', e.target.value)}
                      placeholder="Nike"
                    />
                  </div>
                  <div>
                    <label>Model *</label>
                    <input
                      type="text"
                      required
                      value={variant.model}
                      onChange={(e) => updateVariant(index, 'model', e.target.value)}
                      placeholder="Air Jordan 4"
                    />
                  </div>
                  <div>
                    <label>Size *</label>
                    <input
                      type="text"
                      required
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      placeholder="10.5"
                    />
                  </div>
                  <div>
                    <label>Condition</label>
                    <select
                      value={variant.condition}
                      onChange={(e) => updateVariant(index, 'condition', e.target.value)}
                    >
                      <option value="DS">Deadstock (DS)</option>
                      <option value="VNDS">Very Near Deadstock (VNDS)</option>
                      <option value="USED">Used</option>
                    </select>
                  </div>
                  <div>
                    <label>Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="250.00"
                    />
                  </div>
                  <div>
                    <label>Stock *</label>
                    <input
                      type="number"
                      required
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                      placeholder="1"
                    />
                  </div>
                </div>

                {variant.brand && variant.model && variant.size && variant.condition && (
                  <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded">
                    <p className="text-xs text-[var(--text-muted)]">Generated SKU</p>
                    <p className="font-mono text-sm text-[var(--text-primary)]">
                      {variant.brand.toUpperCase()}-{variant.model.toUpperCase().replace(/\s+/g, '')}-{variant.size}-{variant.condition}-XXXX
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <p className="text-[var(--error)]">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
