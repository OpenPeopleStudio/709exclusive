/**
 * IndexedDB-based secure key storage
 * More secure than localStorage - data is sandboxed per origin
 */

const DB_NAME = '709exclusive_e2e'
const DB_VERSION = 1
const KEYS_STORE = 'keys'
const SESSIONS_STORE = 'sessions'

export interface StoredKeyPair {
  id: string
  publicKey: string
  privateKey: string
  createdAt: number
  isActive: boolean
}

interface SessionKey {
  id: string
  recipientId: string
  sharedSecret: string // Derived key for this session
  messageIndex: number // For forward secrecy - increments per message
  createdAt: number
  expiresAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Keys store - for long-term identity keys
      if (!db.objectStoreNames.contains(KEYS_STORE)) {
        const keysStore = db.createObjectStore(KEYS_STORE, { keyPath: 'id' })
        keysStore.createIndex('isActive', 'isActive', { unique: false })
      }

      // Sessions store - for ephemeral session keys (forward secrecy)
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' })
        sessionsStore.createIndex('recipientId', 'recipientId', { unique: false })
        sessionsStore.createIndex('expiresAt', 'expiresAt', { unique: false })
      }
    }
  })
}

// Key Pair Operations
export async function storeKeyPair(keyPair: StoredKeyPair): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEYS_STORE], 'readwrite')
    const store = transaction.objectStore(KEYS_STORE)
    const request = store.put(keyPair)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getActiveKeyPair(): Promise<StoredKeyPair | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEYS_STORE], 'readonly')
    const store = transaction.objectStore(KEYS_STORE)
    const index = store.index('isActive')
    const request = index.get(IDBKeyRange.only(true))
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function getAllKeyPairs(): Promise<StoredKeyPair[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEYS_STORE], 'readonly')
    const store = transaction.objectStore(KEYS_STORE)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deactivateAllKeys(): Promise<void> {
  const db = await openDB()
  const keys = await getAllKeyPairs()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEYS_STORE], 'readwrite')
    const store = transaction.objectStore(KEYS_STORE)
    
    let completed = 0
    for (const key of keys) {
      const request = store.put({ ...key, isActive: false })
      request.onsuccess = () => {
        completed++
        if (completed === keys.length) resolve()
      }
      request.onerror = () => reject(request.error)
    }
    
    if (keys.length === 0) resolve()
  })
}

// Session Operations (for forward secrecy)
export async function storeSession(session: SessionKey): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE)
    const request = store.put(session)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getSession(recipientId: string): Promise<SessionKey | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readonly')
    const store = transaction.objectStore(SESSIONS_STORE)
    const index = store.index('recipientId')
    const request = index.get(IDBKeyRange.only(recipientId))
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const session = request.result
      // Check if expired
      if (session && session.expiresAt < Date.now()) {
        resolve(null)
      } else {
        resolve(session || null)
      }
    }
  })
}

export async function updateSessionIndex(sessionId: string, newIndex: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE)
    const getRequest = store.get(sessionId)
    
    getRequest.onsuccess = () => {
      const session = getRequest.result
      if (session) {
        session.messageIndex = newIndex
        const putRequest = store.put(session)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

export async function deleteExpiredSessions(): Promise<void> {
  const db = await openDB()
  const now = Date.now()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE)
    const index = store.index('expiresAt')
    const range = IDBKeyRange.upperBound(now)
    const request = index.openCursor(range)
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// Clear all data (for logout/reset)
export async function clearAllData(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEYS_STORE, SESSIONS_STORE], 'readwrite')
    
    const keysStore = transaction.objectStore(KEYS_STORE)
    const sessionsStore = transaction.objectStore(SESSIONS_STORE)
    
    keysStore.clear()
    sessionsStore.clear()
    
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
