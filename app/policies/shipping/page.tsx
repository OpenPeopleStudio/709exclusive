'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <nav className="mb-8">
            <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              ← Back
            </Link>
          </nav>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Shipping Information</h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">📍 We Ship From</h2>
              <p className="text-[var(--text-secondary)]">
                All orders ship from <span className="font-medium text-[var(--text-primary)]">St. John&apos;s, Newfoundland, Canada</span>. 
                We&apos;re located on the easternmost edge of North America, which means slightly longer delivery 
                times to western Canada and the US, but we&apos;ve partnered with fast carriers to minimize wait times.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">🇨🇦 Canada Shipping</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)]">
                      <th className="text-left py-3 text-[var(--text-muted)]">Method</th>
                      <th className="text-left py-3 text-[var(--text-muted)]">Delivery Time</th>
                      <th className="text-left py-3 text-[var(--text-muted)]">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    <tr>
                      <td className="py-3 text-[var(--text-primary)]">Standard (Canada Post)</td>
                      <td className="py-3 text-[var(--text-secondary)]">5-7 business days</td>
                      <td className="py-3 text-[var(--text-primary)]">$15 / FREE over $250</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[var(--text-primary)]">Express (Canada Post)</td>
                      <td className="py-3 text-[var(--text-secondary)]">2-3 business days</td>
                      <td className="py-3 text-[var(--text-primary)]">$25</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[var(--text-primary)]">Priority (Purolator)</td>
                      <td className="py-3 text-[var(--text-secondary)]">1-2 business days</td>
                      <td className="py-3 text-[var(--text-primary)]">$35</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                * Delivery times are estimates from date of shipment, not order date.
              </p>
            </section>

            <section className="p-6 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">🚗 Local Delivery</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Live in the St. John&apos;s area (postal codes starting with A1A-A1N)? 
                We offer local delivery!
              </p>
              <ul className="text-[var(--text-secondary)] space-y-2">
                <li>• <span className="font-medium text-[var(--success)]">FREE</span> on orders over $150</li>
                <li>• $10 flat rate under $150</li>
                <li>• Same-day delivery available (order by 2:00 PM NST)</li>
                <li>• Evening delivery windows available</li>
                <li>• &quot;Leave at door&quot; option available</li>
              </ul>
            </section>

            <section className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">📍 Local Pickup</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Want to save on shipping? Pick up your order locally for <span className="font-medium text-[var(--success)]">FREE</span>!
              </p>
              <ul className="text-[var(--text-secondary)] space-y-2">
                <li>• Select &quot;Local Pickup&quot; at checkout</li>
                <li>• We&apos;ll email you when your order is ready (usually within 24 hours)</li>
                <li>• Pickup location shared in confirmation email</li>
                <li>• Bring ID matching order name</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">🇺🇸 United States Shipping</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)]">
                      <th className="text-left py-3 text-[var(--text-muted)]">Method</th>
                      <th className="text-left py-3 text-[var(--text-muted)]">Delivery Time</th>
                      <th className="text-left py-3 text-[var(--text-muted)]">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    <tr>
                      <td className="py-3 text-[var(--text-primary)]">Standard (USPS)</td>
                      <td className="py-3 text-[var(--text-secondary)]">7-10 business days</td>
                      <td className="py-3 text-[var(--text-primary)]">$25 USD</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[var(--text-primary)]">Express (UPS)</td>
                      <td className="py-3 text-[var(--text-secondary)]">3-5 business days</td>
                      <td className="py-3 text-[var(--text-primary)]">$45 USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg">
                <p className="text-sm text-[var(--warning)] font-medium mb-2">⚠️ Important: Import Duties & Taxes</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  US customers may be responsible for import duties and taxes upon delivery. 
                  These fees are determined by US Customs and are not included in our shipping costs. 
                  For orders over $800 USD, additional paperwork may be required.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">💰 Canadian Taxes</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                All Canadian orders include applicable taxes calculated at checkout based on your province:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)]">
                      <th className="text-left py-3 text-[var(--text-muted)]">Province</th>
                      <th className="text-left py-3 text-[var(--text-muted)]">Tax Type</th>
                      <th className="text-left py-3 text-[var(--text-muted)]">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    <tr>
                      <td className="py-2 text-[var(--text-primary)]">NL, NB, NS, PE</td>
                      <td className="py-2 text-[var(--text-secondary)]">HST</td>
                      <td className="py-2 text-[var(--text-primary)]">15%</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[var(--text-primary)]">ON</td>
                      <td className="py-2 text-[var(--text-secondary)]">HST</td>
                      <td className="py-2 text-[var(--text-primary)]">13%</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[var(--text-primary)]">BC</td>
                      <td className="py-2 text-[var(--text-secondary)]">GST + PST</td>
                      <td className="py-2 text-[var(--text-primary)]">12%</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[var(--text-primary)]">AB, NT, NU, YT</td>
                      <td className="py-2 text-[var(--text-secondary)]">GST</td>
                      <td className="py-2 text-[var(--text-primary)]">5%</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[var(--text-primary)]">SK, MB</td>
                      <td className="py-2 text-[var(--text-secondary)]">GST + PST</td>
                      <td className="py-2 text-[var(--text-primary)]">11%</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[var(--text-primary)]">QC</td>
                      <td className="py-2 text-[var(--text-secondary)]">GST + QST</td>
                      <td className="py-2 text-[var(--text-primary)]">14.975%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">💵 Currency</h2>
              <p className="text-[var(--text-secondary)]">
                All prices on our site are in <span className="font-medium text-[var(--text-primary)]">Canadian Dollars (CAD)</span>. 
                Your card will be charged in CAD. If paying with a US card or other currency, your bank 
                will convert at their current exchange rate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">📦 Packaging</h2>
              <ul className="text-[var(--text-secondary)] space-y-2">
                <li>• All shoes ship in their original box (when available)</li>
                <li>• Original box placed in protective shipping box</li>
                <li>• Signature may be required for high-value orders</li>
                <li>• Insurance included on all shipments</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">📧 Tracking</h2>
              <p className="text-[var(--text-secondary)]">
                You&apos;ll receive tracking information via email as soon as your order ships. 
                You can also view tracking status in your account under &quot;Order History&quot;.
              </p>
            </section>

            <section className="p-6 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Questions?</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Have questions about shipping? We&apos;re here to help.
              </p>
              <a href="mailto:support@709exclusive.shop" className="btn-primary inline-block">
                Contact Us
              </a>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
