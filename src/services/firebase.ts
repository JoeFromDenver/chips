import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
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

// Read build-time config from environment variables, fallback to public defaults
const envConfig: Partial<FirebaseConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCS2CnUi7faNrCtcvoIcPcaswL9bRRIZJo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "crunch-showdown.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "crunch-showdown",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "crunch-showdown.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "246942803723",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:246942803723:web:1147f8d8d2fdebf5e3a40e",
};

// Check if a full config is provided by environment variables
const isEnvConfigComplete = (config: Partial<FirebaseConfig>): config is FirebaseConfig => {
  return !!(config.apiKey && config.projectId && config.appId);
};

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

// Configuration source classification
export type FirebaseConfigSource = "Build-Time Secrets" | "Custom Local Storage" | "Build-Time Fallback Defaults";

export const getFirebaseConfigSource = (): FirebaseConfigSource => {
  const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (saved) return "Custom Local Storage";
  
  const hasEnvKeys = !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
  
  if (hasEnvKeys) {
    const isFallback = 
      import.meta.env.VITE_FIREBASE_API_KEY === "AIzaSyCS2CnUi7faNrCtcvoIcPcaswL9bRRIZJo" &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID === "crunch-showdown";
    return isFallback ? "Build-Time Fallback Defaults" : "Build-Time Secrets";
  }
  
  return "Build-Time Fallback Defaults";
};

// Helper for racing promises with a timeout
const withTimeout = <T>(promise: Promise<T>, ms: number, errMsg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errMsg)), ms)
    ),
  ]);
};

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

// Test connection to Firebase Firestore
export const testFirebaseConnection = async (
  config: FirebaseConfig
): Promise<{ success: boolean; error?: string }> => {
  const tempAppName = `connection-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  let tempApp: FirebaseApp | null = null;
  
  try {
    tempApp = initializeApp(config, tempAppName);
    const db = getFirestore(tempApp);
    const testDocRef = doc(db, "_connection_test_", "test");
    
    // Race getDoc against a 4-second timeout
    await withTimeout(
      getDoc(testDocRef),
      4000,
      "Timeout: Could not reach Cloud Firestore backend (4s)"
    );
    
    return { success: true };
  } catch (error: any) {
    // If it is a permission-denied error, the database credentials are valid and connection was established!
    const errorMsg = error?.message || String(error);
    const isPermissionDenied = error?.code === "permission-denied" || errorMsg.includes("PERMISSION_DENIED");
    
    if (isPermissionDenied) {
      if (errorMsg.includes("API has not been used") || errorMsg.includes("disabled")) {
        return {
          success: false,
          error: "Cloud Firestore API is disabled or not initialized in the Google Console for this project ID.",
        };
      }
      return { success: true };
    }
    
    return { success: false, error: errorMsg };
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
    await withTimeout(
      setDoc(userVoteRef, {
        votes,
        updatedAt: serverTimestamp(),
        username: username.trim(),
      }),
      5000,
      "Timeout: Could not save votes to Firestore (5s)"
    );
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
    const snap = await withTimeout(
      getDoc(userVoteRef),
      5000,
      "Timeout: Could not fetch user votes from Firestore (5s)"
    );
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
  onUpdate: (votes: AggregatedVotes, totalUsers: number) => void,
  onError?: (error: any) => void
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
    if (onError) onError(error);
  });
};
