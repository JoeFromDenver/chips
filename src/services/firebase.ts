import { initializeApp, getApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  Firestore,
  serverTimestamp,
} from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// LocalStorage key for saving custom configs at runtime
const CONFIG_STORAGE_KEY = "crunch_showdown_firebase_config";

// Read build-time config from environment variables
const envConfig: Partial<FirebaseConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if a full config is provided by environment variables
const isEnvConfigComplete = (config: Partial<FirebaseConfig>): config is FirebaseConfig => {
  return !!(config.apiKey && config.projectId && config.appId);
};

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

// Retrieve configuration: either environment variables or localStorage
export const getActiveFirebaseConfig = (): FirebaseConfig | null => {
  if (isEnvConfigComplete(envConfig)) {
    return envConfig;
  }
  
  const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (isEnvConfigComplete(parsed)) {
        return parsed;
      }
    } catch {
      // Clear invalid config
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    }
  }
  return null;
};

// Try to initialize Firebase
export const initializeFirebase = (customConfig?: FirebaseConfig): Firestore | null => {
  const config = customConfig || getActiveFirebaseConfig();
  
  if (!config) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    
    firestoreDb = getFirestore(firebaseApp);
    
    // Save to localStorage if it's a custom config passed in
    if (customConfig) {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(customConfig));
    }
    
    return firestoreDb;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return null;
  }
};

// Clear saved config and reset
export const clearFirebaseConfig = () => {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  firebaseApp = null;
  firestoreDb = null;
};

export const getDb = (): Firestore | null => {
  if (!firestoreDb) {
    initializeFirebase();
  }
  return firestoreDb;
};

// Check configuration status
export const isFirebaseConfigured = (): boolean => {
  return getActiveFirebaseConfig() !== null;
};

export interface VoteData {
  [chipId: string]: {
    best: number;
    spicy: number;
    weird: number;
    leastBest: number;
  };
}

// Save user votes
export const saveVotesToFirestore = async (
  partyCode: string,
  username: string,
  votes: VoteData
): Promise<boolean> => {
  const db = getDb();
  if (!db) {
    // If not configured, save locally
    return false;
  }

  const cleanParty = partyCode.trim().toUpperCase();
  const cleanUser = username.trim().toLowerCase();

  try {
    const userVoteRef = doc(db, "parties", cleanParty, "userVotes", cleanUser);
    await setDoc(userVoteRef, {
      votes,
      updatedAt: serverTimestamp(),
      username: username.trim(),
    });
    return true;
  } catch (error) {
    console.error("Error saving votes to Firestore:", error);
    return false;
  }
};

// Fetch user votes (e.g. upon logging back in)
export const fetchUserVotesFromFirestore = async (
  partyCode: string,
  username: string
): Promise<VoteData | null> => {
  const db = getDb();
  if (!db) return null;

  const cleanParty = partyCode.trim().toUpperCase();
  const cleanUser = username.trim().toLowerCase();

  try {
    const userVoteRef = doc(db, "parties", cleanParty, "userVotes", cleanUser);
    const snap = await getDoc(userVoteRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.votes as VoteData;
    }
  } catch (error) {
    console.error("Error fetching user votes:", error);
  }
  return null;
};

export interface AggregatedVotes {
  [chipId: string]: {
    best: number;
    spicy: number;
    weird: number;
    leastBest: number;
  };
}

// Subscribe to real-time updates for a party
export const subscribeToPartyVotes = (
  partyCode: string,
  onUpdate: (votes: AggregatedVotes, totalUsers: number) => void
) => {
  const db = getDb();
  if (!db) {
    return () => {};
  }

  const cleanParty = partyCode.trim().toUpperCase();
  const userVotesCol = collection(db, "parties", cleanParty, "userVotes");

  return onSnapshot(userVotesCol, (snapshot) => {
    const totals: AggregatedVotes = {};
    let userCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.votes) {
        userCount++;
        const userVotes = data.votes as VoteData;
        
        Object.keys(userVotes).forEach((chipId) => {
          if (!totals[chipId]) {
            totals[chipId] = { best: 0, spicy: 0, weird: 0, leastBest: 0 };
          }
          const chipVotes = userVotes[chipId];
          totals[chipId].best += chipVotes.best || 0;
          totals[chipId].spicy += chipVotes.spicy || 0;
          totals[chipId].weird += chipVotes.weird || 0;
          totals[chipId].leastBest += chipVotes.leastBest || 0;
        });
      }
    });

    onUpdate(totals, userCount);
  }, (error) => {
    console.error("Error in onSnapshot for party votes:", error);
  });
};
