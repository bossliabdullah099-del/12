import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { ImageJob, ChatConversation } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific custom database ID and experimentalForceLongPolling to prevent WebChannel 10s timeouts in iframe environments
const databaseId = (firebaseConfigJson as any).firestoreDatabaseId || '(default)';

export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      databaseId
    );
  } catch (e) {
    // If already initialized with different options, return existing instance
    return getFirestore(app, databaseId);
  }
})();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  // If the client is operating in offline mode or network timed out, handle gracefully
  if (
    errMessage.includes('offline') ||
    errMessage.includes('Could not reach Cloud Firestore backend') ||
    errMessage.includes('timed out')
  ) {
    console.warn(`[Firestore Offline Mode] Operation ${operationType} on ${path}: operating offline.`);
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Notice: ', JSON.stringify(errInfo));
}

/**
 * Executes a promise with an automatic timeout to prevent 10s hangs when offline
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 4000, fallbackValue: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallbackValue);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (error) {
    clearTimeout(timer);
    return fallbackValue;
  }
}

// Connection health test helper with short timeout
export async function testFirestoreConnection(timeoutMs: number = 3000): Promise<boolean> {
  try {
    const checkPromise = getDoc(doc(db, 'test', 'connection'));
    const success = await withTimeout(
      checkPromise.then(() => true).catch(() => true), // Document missing still means network connection reached
      timeoutMs,
      false
    );
    return success;
  } catch (error: any) {
    return false;
  }
}

/**
 * Recursively removes all undefined values from an object or array.
 * Firestore strictly rejects documents containing undefined fields.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

/**
 * Save an AI-generated image to Firestore database
 */
export async function saveImageToFirestore(image: ImageJob, userId?: string): Promise<boolean> {
  try {
    const imageDocRef = doc(db, 'images', image.id);
    const payload = sanitizeForFirestore({
      id: image.id,
      userId: userId || 'anonymous',
      prompt: image.prompt || '',
      revisedPrompt: image.revisedPrompt || '',
      imageUrl: image.imageUrl,
      style: image.style || 'Realistic',
      aspectRatio: image.aspectRatio || '1:1',
      dimensions: image.dimensions || { width: 1024, height: 1024 },
      seed: image.seed || Math.floor(Math.random() * 9000000),
      modelUsed: image.modelUsed || 'Boss AI Neural Engine',
      createdAt: image.createdAt ? new Date(image.createdAt).toISOString() : new Date().toISOString(),
      timestamp: Date.now(),
    });

    const writePromise = setDoc(imageDocRef, payload, { merge: true }).then(() => true);
    return await withTimeout(writePromise, 4000, true);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `images/${image.id}`);
    return false;
  }
}

/**
 * Fetch image gallery from Firestore with timeout fallback
 */
export async function fetchImagesFromFirestore(userId?: string): Promise<ImageJob[]> {
  try {
    const imagesRef = collection(db, 'images');
    let q;
    if (userId && userId !== 'anonymous') {
      q = query(imagesRef, where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(50));
    } else {
      q = query(imagesRef, orderBy('timestamp', 'desc'), limit(50));
    }

    const fetchPromise = getDocs(q).then((snapshot) => {
      const images: ImageJob[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        images.push({
          id: (data.id as string) || docSnap.id,
          prompt: (data.prompt as string) || '',
          revisedPrompt: (data.revisedPrompt as string) || undefined,
          imageUrl: (data.imageUrl as string) || '',
          style: data.style,
          aspectRatio: data.aspectRatio,
          dimensions: data.dimensions,
          seed: data.seed,
          modelUsed: data.modelUsed,
          createdAt: data.timestamp || (data.createdAt ? new Date(data.createdAt).getTime() : Date.now()),
        });
      });
      return images;
    });

    return await withTimeout(fetchPromise, 4000, []);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'images');
    return [];
  }
}

/**
 * Delete an image from Firestore
 */
export async function deleteImageFromFirestore(imageId: string): Promise<boolean> {
  try {
    const deletePromise = deleteDoc(doc(db, 'images', imageId)).then(() => true);
    return await withTimeout(deletePromise, 4000, true);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `images/${imageId}`);
    return false;
  }
}

/**
 * Save / update user in Firestore
 */
export async function syncUserWithFirestore(user: {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  plan?: string;
}): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', user.id);
    const payload = sanitizeForFirestore({
      id: user.id,
      email: user.email,
      displayName: user.displayName || 'Creator',
      photoURL: user.photoURL || '',
      role: user.role || 'user',
      plan: user.plan || 'Pro',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    const syncPromise = setDoc(userRef, payload, { merge: true }).then(() => true);
    return await withTimeout(syncPromise, 4000, true);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    return false;
  }
}

/**
 * Save / update a full Chat Conversation in Firestore partitioned by userEmail
 */
export async function saveConversationToFirestore(
  conversation: ChatConversation,
  userId?: string,
  userEmail?: string
): Promise<boolean> {
  try {
    const resolvedEmail = (userEmail || conversation.userEmail || '').trim().toLowerCase();
    // Guest mode has NO saved chat - never save guest conversations to Firestore
    if (
      !resolvedEmail ||
      resolvedEmail === 'guest@bossai.com' ||
      (userId && userId.startsWith('guest_')) ||
      (conversation.userId && conversation.userId.startsWith('guest_'))
    ) {
      return false;
    }

    const convRef = doc(db, 'conversations', conversation.id);

    // Explicitly clean messages and ensure no undefined values exist
    const rawMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const cleanMessages = rawMessages.map((msg) => {
      const entry: Record<string, any> = {
        id: msg.id || `msg_${Date.now()}`,
        role: msg.role || 'user',
        content: msg.content || '',
        timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : Date.now(),
      };
      if (msg.modelUsed) entry.modelUsed = msg.modelUsed;
      if (msg.mediaType) entry.mediaType = msg.mediaType;
      if (msg.mediaData) entry.mediaData = msg.mediaData;
      if (msg.attachedImage) entry.attachedImage = msg.attachedImage;
      return sanitizeForFirestore(entry);
    });

    const docPayload = sanitizeForFirestore({
      id: conversation.id,
      userId: userId || conversation.userId || 'anonymous',
      userEmail: resolvedEmail,
      title: conversation.title || 'New Chat',
      messages: cleanMessages,
      createdAt: typeof conversation.createdAt === 'number' ? conversation.createdAt : Date.now(),
      updatedAt: typeof conversation.updatedAt === 'number' ? conversation.updatedAt : Date.now(),
      modelUsed: conversation.modelUsed || 'Boss AI',
    });

    const savePromise = setDoc(convRef, docPayload, { merge: true }).then(() => true);
    return await withTimeout(savePromise, 4000, true);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `conversations/${conversation.id}`);
    return false;
  }
}

/**
 * Fetch all chat conversations from Firestore partitioned by user email
 */
export async function fetchConversationsFromFirestore(
  userId?: string,
  userEmail?: string
): Promise<ChatConversation[]> {
  try {
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    // Guest mode has NO saved chat - never return or query any cloud chats for guest
    if (!cleanEmail || cleanEmail === 'guest@bossai.com' || (userId && userId.startsWith('guest_'))) {
      return [];
    }

    const convRef = collection(db, 'conversations');
    let q;
    if (cleanEmail) {
      q = query(convRef, where('userEmail', '==', cleanEmail), limit(100));
    } else if (userId && userId !== 'anonymous') {
      q = query(convRef, where('userId', '==', userId), limit(100));
    } else {
      return [];
    }

    const fetchPromise = getDocs(q).then((snapshot) => {
      const conversations: ChatConversation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        conversations.push({
          id: (data.id as string) || docSnap.id,
          title: (data.title as string) || 'Untitled Chat',
          messages: Array.isArray(data.messages) ? data.messages : [],
          createdAt: Number(data.createdAt) || Date.now(),
          updatedAt: Number(data.updatedAt) || Date.now(),
          userId: data.userId || 'anonymous',
          userEmail: data.userEmail || cleanEmail || 'guest@bossai.com',
          modelUsed: data.modelUsed,
        });
      });
      return conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    });

    return await withTimeout(fetchPromise, 4000, []);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'conversations');
    return [];
  }
}

/**
 * Delete a conversation from Firestore
 */
export async function deleteConversationFromFirestore(conversationId: string): Promise<boolean> {
  try {
    const deletePromise = deleteDoc(doc(db, 'conversations', conversationId)).then(() => true);
    return await withTimeout(deletePromise, 4000, true);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `conversations/${conversationId}`);
    return false;
  }
}

/**
 * Rename a conversation in Firestore
 */
export async function renameConversationInFirestore(
  conversationId: string,
  newTitle: string
): Promise<boolean> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const renamePromise = setDoc(convRef, { title: newTitle, updatedAt: Date.now() }, { merge: true }).then(
      () => true
    );
    return await withTimeout(renamePromise, 4000, true);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `conversations/${conversationId}`);
    return false;
  }
}
