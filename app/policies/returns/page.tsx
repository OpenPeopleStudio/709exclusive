'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function ReturnsPolicy() {
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

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Returns & Exchanges Policy</h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Our Commitment</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                At 709 Exclusive, we want you to be completely satisfied with your purchase. We stand behind the 
                condition and authenticity of every item we sell. If something isn&apos;t right, we&apos;ll make it right.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Return Eligibility</h2>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg mb-4">
                <h3 className="font-medium text-[var(--text-primary)] mb-2">✓ We Accept Returns When:</h3>
                <ul className="text-[var(--text-secondary)] space-y-2">
                  <li>• Item condition doesn&apos;t match the listing description</li>
                  <li>• Item has undisclosed defects</li>
                  <li>• Wrong item or size was shipped</li>
                  <li>• Item is determined to be inauthentic (never happens, but we guarantee it)</li>
                </ul>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <h3 className="font-medium text-[var(--text-primary)] mb-2">✗ Returns Not Accepted:</h3>
                <ul className="text-[var(--text-secondary)] space-y-2">
                  <li>• Change of mind or fit preference</li>
                  <li>• Items worn, washed, or damaged after delivery</li>
                  <li>• Items without original tags (for DS/VNDS items)</li>
                  <li>• Returns requested after 7 days</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Return Process</h2>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold">1</span>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">Contact Us</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Email support@709exclusive.shop within 7 days of delivery with your order number and reason for return.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold">2</span>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">Get Approval</h3>
                    <p className="text-sm text-[var(--text-secondary)]">We&apos;ll review your request and provide a return label if approved. Response within 24 hours.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold">3</span>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">Ship It Back</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Pack the item securely in original packaging. Use the provided return label.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold">4</span>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">Refund Issued</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Once received and inspected, refund processed within 2-3 business days.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Exchanges</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Need a different size? We&apos;ll do our best to accommodate exchanges if we have the size in stock. 
                Contact us and we&apos;ll check availability. Exchange shipping is on us for condition-related issues.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Refunds</h2>
              <ul className="text-[var(--text-secondary)] space-y-2">
                <li>• Refunds are issued to the original payment method</li>
                <li>• Original shipping costs are non-refundable unless the issue was our fault</li>
                <li>• Crypto payments refunded at the CAD equivalent at time of refund</li>
                <li>• Processing time: 2-3 business days after item is received</li>
              </ul>
            </section>

            <section className="p-6 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Questions?</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                We&apos;re here to help. Reach out anytime.
              </p>
              <a href="mailto:support@709exclusive.shop" className="btn-primary inline-block">
                Contact Support
              </a>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
