'use client'

import EncryptionProvider from '@/components/EncryptionProvider'
import EncryptionBackupBanner from '@/components/EncryptionBackupBanner'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EncryptionProvider>
      {children}
      <EncryptionBackupBanner />
    </EncryptionProvider>
  )
}
