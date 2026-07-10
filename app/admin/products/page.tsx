'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  category: string
  ingredients: string[]
  available: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    category: 'Pastry',
    ingredients: '',
    available: true
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      ingredients: formData.ingredients.split(',').map((i) => i.trim()).filter(Boolean),
    }

    try {
      const res = editingProduct
        ? await fetch(`/api/products/${editingProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (!res.ok) throw new Error('Failed to save product')
      await loadProducts()
      setShowForm(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: 'Pastry',
        ingredients: '',
        available: true,
      })
    } catch (error) {
      console.error(error)
      alert('Could not save product')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      imageUrl: product.imageUrl || '',
      category: product.category,
      ingredients: product.ingredients.join(', '),
      available: product.available
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete product')
      await loadProducts()
    } catch (error) {
      console.error(error)
      alert('Could not delete product')
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900">Manage Products</h1>
          <button
            onClick={() => {
              setEditingProduct(null)
              setFormData({
                name: '',
                description: '',
                price: 0,
                imageUrl: '',
                category: 'Pastry',
                ingredients: '',
                available: true
              })
              setShowForm(true)
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Add New Product
          </button>
        </div>
        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Pastry">Pastry</option>
                    <option value="Drink">Drink</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma separated)</label>
                  <input
                    type="text"
                    name="ingredients"
                    value={formData.ingredients}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="available"
                    id="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="available" className="ml-2 text-sm font-medium text-gray-700">Available</label>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-2 border-amber-600 text-amber-700 hover:bg-amber-100 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        )}
        {loading ? (
          <div className="text-center py-12 text-amber-700">Loading products...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-md p-6">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <div className="text-sm text-amber-600 font-medium mb-1">{product.category}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2 text-sm">{product.description}</p>
              <div className="text-2xl font-bold text-amber-700 mb-4">${product.price.toFixed(2)}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </main>
    </div>
  )
}
