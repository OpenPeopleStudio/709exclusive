'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function AuthenticityPolicy() {
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

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Authenticity Guarantee</h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="p-6 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
              <h2 className="text-xl font-semibold text-[var(--success)] mb-2 flex items-center gap-2">
                ✓ 100% Authentic Guarantee
              </h2>
              <p className="text-[var(--text-secondary)]">
                Every single item sold on 709 Exclusive is guaranteed to be 100% authentic. 
                If an item is ever determined to be inauthentic, we will provide a full refund 
                plus pay for return shipping. No questions asked.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Our Verification Process</h2>
              <div className="grid gap-4">
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">🔍 Multi-Point Inspection</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Every item undergoes a detailed inspection checking materials, stitching, labels, 
                    sizing tags, box labels, and other brand-specific authentication markers.
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">📸 Detailed Photography</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    We photograph all authentication points including tags, insoles, box labels, 
                    and any areas of wear. You see exactly what you&apos;re getting.
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">👀 Expert Review</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Our team has handled thousands of pairs. We know the subtle differences between 
                    authentic and replica products across all major brands.
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">📝 Source Verification</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    We only source from trusted suppliers with established track records. 
                    Every consignment is vetted before acceptance.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">What We Check</h2>
              <div className="grid grid-cols-2 gap-4">
                <ul className="text-[var(--text-secondary)] space-y-2">
                  <li>✓ Material quality & feel</li>
                  <li>✓ Stitching patterns & quality</li>
                  <li>✓ Size tag formatting</li>
                  <li>✓ UPC/SKU codes</li>
                  <li>✓ Box label accuracy</li>
                </ul>
                <ul className="text-[var(--text-secondary)] space-y-2">
                  <li>✓ Insole printing</li>
                  <li>✓ Tongue tag details</li>
                  <li>✓ Color accuracy</li>
                  <li>✓ Shape and proportions</li>
                  <li>✓ Glue quality</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Brands We Authenticate</h2>
              <div className="flex flex-wrap gap-2">
                {['Nike', 'Jordan', 'Adidas', 'Yeezy', 'New Balance', 'Asics', 'Converse', 'Vans', 'Reebok', 'Puma'].map(brand => (
                  <span key={brand} className="px-3 py-1 bg-[var(--bg-tertiary)] rounded-full text-sm text-[var(--text-secondary)]">
                    {brand}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">If You Have Concerns</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                While we stand behind every item we sell, we understand you may want peace of mind. 
                If you ever have concerns about an item&apos;s authenticity after purchase:
              </p>
              <ol className="text-[var(--text-secondary)] space-y-2">
                <li>1. Contact us within 7 days of delivery</li>
                <li>2. Share your specific concerns and any photos</li>
                <li>3. We&apos;ll review and respond within 24 hours</li>
                <li>4. If needed, we&apos;ll arrange third-party authentication at our expense</li>
              </ol>
            </section>

            <section className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Our Promise</h2>
              <blockquote className="text-lg text-[var(--text-secondary)] italic border-l-4 border-[var(--accent)] pl-4">
                &ldquo;We built 709 Exclusive on trust. Selling fakes would destroy everything we&apos;ve worked for. 
                We&apos;d rather turn away a sale than risk our reputation. Period.&rdquo;
              </blockquote>
              <p className="text-sm text-[var(--text-muted)] mt-4">— The 709 Exclusive Team</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Certificate of Authenticity</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Every order includes a certificate of authenticity card with:
              </p>
              <ul className="text-[var(--text-secondary)] space-y-1 mt-2">
                <li>• Unique verification code</li>
                <li>• Item details and inspection date</li>
                <li>• Inspector initials</li>
                <li>• QR code linking to item photos</li>
              </ul>
            </section>

            <section className="p-6 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Questions?</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Have questions about our authentication process? We&apos;re happy to explain in detail.
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
