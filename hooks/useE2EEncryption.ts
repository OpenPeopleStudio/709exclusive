'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  initializeIdentityKeys,
  encryptMessage,
  decryptMessage,
  generateFingerprint,
  generateShortFingerprint,
  generateVerificationData,
  exportKeysForBackup,
  importKeysFromBackup,
  type StoredKeyPair,
} from '@/lib/crypto/e2e'

interface EncryptedMessage {
  id: string
  content: string
  encrypted?: boolean
  iv?: string
  sender_public_key?: string
  message_index?: number
  sender_type: 'customer' | 'admin'
  customer_id: string
}

interface DecryptedMessage extends EncryptedMessage {
  decryptedContent?: string
  decryptionError?: string
}

export function useE2EEncryption(userId: string | null) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [keyPair, setKeyPair] = useState<StoredKeyPair | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [shortFingerprint, setShortFingerprint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize keys and sync public key to server
  useEffect(() => {
    if (!userId) return

    const init = async () => {
      try {
        const keys = await initializeIdentityKeys()
        setKeyPair(keys)
        
        // Generate fingerprints
        const fp = await generateFingerprint(keys.publicKey)
        const sfp = await generateShortFingerprint(keys.publicKey)
        setFingerprint(fp)
        setShortFingerprint(sfp)

        // Sync public key to server if changed
        const { data: profile } = await supabase
          .from('709_profiles')
          .select('public_key')
          .eq('id', userId)
          .single()

        if (profile?.public_key !== keys.publicKey) {
          await supabase
            .from('709_profiles')
            .update({ 
              public_key: keys.publicKey,
              public_key_updated_at: new Date().toISOString()
            })
            .eq('id', userId)
        }

        setIsInitialized(true)
      } catch (err) {
        console.error('E2E initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize encryption')
      }
    }

    init()
  }, [userId])

  // Get recipient's public key
  const getRecipientPublicKey = useCallback(async (
    recipientId: string
  ): Promise<string | null> => {
    const { data } = await supabase
      .from('709_profiles')
      .select('public_key')
      .eq('id', recipientId)
      .single()

    return data?.public_key || null
  }, [])

  // Encrypt a message for a recipient
  const encrypt = useCallback(async (
    plaintext: string,
    recipientId: string
  ): Promise<{
    content: string
    iv: string
    senderPublicKey: string
    messageIndex: number
  } | null> => {
    if (!keyPair) {
      setError('Encryption keys not initialized')
      return null
    }

    const recipientPublicKey = await getRecipientPublicKey(recipientId)
    if (!recipientPublicKey) {
      // Recipient doesn't have E2EE set up - return null to send unencrypted
      return null
    }

    const encrypted = await encryptMessage(
      plaintext,
      keyPair.privateKey,
      keyPair.publicKey,
      recipientPublicKey,
      recipientId
    )

    if (!encrypted) {
      return null
    }

    return {
      content: encrypted.ciphertext,
      iv: encrypted.iv,
      senderPublicKey: encrypted.senderPublicKey,
      messageIndex: encrypted.messageIndex,
    }
  }, [keyPair, getRecipientPublicKey])

  // Decrypt a single message
  const decrypt = useCallback(async (
    message: EncryptedMessage,
    senderId: string
  ): Promise<string> => {
    if (!message.encrypted || !message.iv || !message.sender_public_key) {
      return message.content // Not encrypted, return as-is
    }

    if (!keyPair) {
      throw new Error('Decryption keys not initialized')
    }

    return decryptMessage(
      message.content,
      message.iv,
      message.sender_public_key,
      message.message_index || 0,
      keyPair.privateKey,
      senderId
    )
  }, [keyPair])

  // Decrypt multiple messages
  const decryptMessages = useCallback(async (
    messages: EncryptedMessage[],
    getSenderId: (msg: EncryptedMessage) => string
  ): Promise<DecryptedMessage[]> => {
    return Promise.all(
      messages.map(async (msg) => {
        if (!msg.encrypted) {
          return { ...msg, decryptedContent: msg.content }
        }

        try {
          const senderId = getSenderId(msg)
          const decryptedContent = await decrypt(msg, senderId)
          return { ...msg, decryptedContent }
        } catch (err) {
          return { 
            ...msg, 
            decryptedContent: '[Unable to decrypt]',
            decryptionError: err instanceof Error ? err.message : 'Decryption failed'
          }
        }
      })
    )
  }, [decrypt])

  // Backup keys (encrypted with password)
  const backupKeys = useCallback(async (password: string): Promise<string> => {
    if (!keyPair) {
      throw new Error('No keys to backup')
    }
    return exportKeysForBackup(password)
  }, [keyPair])

  // Restore keys from backup
  const restoreKeys = useCallback(async (
    backupData: string,
    password: string
  ): Promise<void> => {
    const restored = await importKeysFromBackup(backupData, password)
    setKeyPair(restored)
    
    // Update fingerprints
    const fp = await generateFingerprint(restored.publicKey)
    const sfp = await generateShortFingerprint(restored.publicKey)
    setFingerprint(fp)
    setShortFingerprint(sfp)

    // Sync to server
    if (userId) {
      await supabase
        .from('709_profiles')
        .update({ 
          public_key: restored.publicKey,
          public_key_updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    }
  }, [userId])

  // Get verification data for QR code
  const getVerificationData = useCallback(async () => {
    if (!keyPair) {
      throw new Error('Keys not initialized')
    }
    return generateVerificationData(keyPair.publicKey)
  }, [keyPair])

  // Verify another user's key
  const verifyUserKey = useCallback(async (
    userId: string
  ): Promise<{ fingerprint: string; shortFingerprint: string } | null> => {
    const publicKey = await getRecipientPublicKey(userId)
    if (!publicKey) return null

    const fp = await generateFingerprint(publicKey)
    const sfp = await generateShortFingerprint(publicKey)
    return { fingerprint: fp, shortFingerprint: sfp }
  }, [getRecipientPublicKey])

  return {
    isInitialized,
    publicKey: keyPair?.publicKey || null,
    fingerprint,
    shortFingerprint,
    error,
    encrypt,
    decrypt,
    decryptMessages,
    getRecipientPublicKey,
    backupKeys,
    restoreKeys,
    getVerificationData,
    verifyUserKey,
  }
}
