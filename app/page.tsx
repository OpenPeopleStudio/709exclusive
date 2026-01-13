export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">709exclusive</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/products" className="text-gray-600 hover:text-gray-900">Products</a>
              <a href="/account" className="text-gray-600 hover:text-gray-900">Account</a>
              <a href="/cart" className="text-gray-600 hover:text-gray-900">Cart</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Welcome to 709exclusive
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Your trusted destination for premium products. Discover our curated collection of high-quality items.
          </p>
          <div className="mt-8">
            <a
              href="/products"
              className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Shop Now
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
