import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { isAdmin } from '@/lib/roles'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">709exclusive Admin</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/admin/products" className="text-gray-600 hover:text-gray-900">Products</Link>
              <Link href="/admin/models" className="text-gray-600 hover:text-gray-900">Models</Link>
              <Link href="/admin/inventory" className="text-gray-600 hover:text-gray-900">Inventory</Link>
              <Link href="/admin/orders" className="text-gray-600 hover:text-gray-900">Orders</Link>
              <Link href="/admin/customers" className="text-gray-600 hover:text-gray-900">Customers</Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">← Back to Store</Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}