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

// Public Zero-Config Sync Mode using ntfy.sh
let usePublicSync = false;

export const checkShouldUsePublicSync = (): boolean => {
  if (localStorage.getItem(CONFIG_STORAGE_KEY)) {
    return false;
  }
  const hasEnvKeys = !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
  if (hasEnvKeys) {
    const isFallback = 
      import.meta.env.VITE_FIREBASE_API_KEY === "AIzaSyCS2CnUi7faNrCtcvoIcPcaswL9bRRIZJo" &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID === "crunch-showdown";
    return isFallback;
  }
  return true;
};

// Initialize the state
usePublicSync = checkShouldUsePublicSync();

// Configuration source classification
export type FirebaseConfigSource = 
  | "Build-Time Secrets" 
  | "Custom Local Storage" 
  | "Build-Time Fallback Defaults" 
  | "ntfy.sh Public Sync (Zero Config)";

export const getFirebaseConfigSource = (): FirebaseConfigSource => {
  if (usePublicSync) return "ntfy.sh Public Sync (Zero Config)";
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
  if (usePublicSync) {
    return null;
  }
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
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    }
  }
  return null;
};

// Try to initialize Firebase
export const initializeFirebase = (customConfig?: FirebaseConfig): Firestore | null => {
  if (customConfig) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(customConfig));
    usePublicSync = false;
  } else {
    usePublicSync = checkShouldUsePublicSync();
  }

  if (usePublicSync) {
    return null;
  }

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
    return firestoreDb;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return null;
  }
};

// Connection diagnostic tool
export const testFirebaseConnection = async (customConfig?: FirebaseConfig): Promise<{ success: boolean; error?: string }> => {
  if (usePublicSync && !customConfig) {
    try {
      const response = await fetch("https://ntfy.sh/");
      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: "Public sync server (ntfy.sh) returned an error status." };
    } catch (e: any) {
      return { success: false, error: "Network error connecting to ntfy.sh: " + (e?.message || String(e)) };
    }
  }

  let db: Firestore | null = null;
  let tempApp: any = null;

  if (customConfig) {
    try {
      const tempAppName = `connection-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      tempApp = initializeApp(customConfig, tempAppName);
      db = getFirestore(tempApp);
    } catch (err: any) {
      return { success: false, error: "Failed to initialize test Firebase app: " + (err.message || String(err)) };
    }
  } else {
    db = getDb();
  }

  if (!db) {
    return { success: false, error: "Firebase credentials/config are completely missing." };
  }

  try {
    const testDocRef = doc(db, "parties", "CONNECTION_TEST_ROOM_XYZ", "userVotes", "testUser");
    await withTimeout(
      getDoc(testDocRef),
      4000,
      "Timeout: Could not reach Cloud Firestore backend (4s)"
    );
    
    return { success: true };
  } catch (error: any) {
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
  usePublicSync = checkShouldUsePublicSync();
};

export const getDb = (): Firestore | null => {
  if (usePublicSync) return null;
  if (!firestoreDb) {
    initializeFirebase();
  }
  return firestoreDb;
};

// Check configuration status
export const isFirebaseConfigured = (): boolean => {
  return usePublicSync || getActiveFirebaseConfig() !== null;
};

export interface VoteData {
  [chipId: string]: {
    best: number;
    spicy: number;
    weird: number;
    leastBest: number;
  };
}

// -------------------------------------------------------------
// ntfy.sh client helper functions
// -------------------------------------------------------------
const saveVotesToNtfy = async (partyCode: string, username: string, votes: VoteData): Promise<boolean> => {
  const cleanParty = partyCode.trim().toUpperCase();
  const cleanUser = username.trim().toLowerCase();
  const topic = `crunch_showdown_party_${cleanParty.toLowerCase()}`;

  try {
    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      body: JSON.stringify({
        room: cleanParty,
        user: cleanUser,
        votes: votes,
        timestamp: Date.now()
      })
    });
    return response.ok;
  } catch (error) {
    console.error("Error saving votes to ntfy:", error);
    return false;
  }
};

const fetchUserVotesFromNtfy = async (partyCode: string, username: string): Promise<VoteData | null> => {
  const cleanParty = partyCode.trim().toUpperCase();
  const cleanUser = username.trim().toLowerCase();
  const topic = `crunch_showdown_party_${cleanParty.toLowerCase()}`;

  try {
    const response = await fetch(`https://ntfy.sh/${topic}/json?poll=1`);
    if (!response.ok) return null;
    const text = await response.text();
    const lines = text.split("\n").filter(Boolean);
    let latestVotes: VoteData | null = null;
    let latestTime = 0;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.event === "message" && entry.message) {
          const payload = JSON.parse(entry.message);
          if (payload.user === cleanUser && payload.timestamp > latestTime) {
            latestVotes = payload.votes;
            latestTime = payload.timestamp;
          }
        }
      } catch (e) {
        // Skip invalid rows
      }
    }
    return latestVotes;
  } catch (error) {
    console.error("Error fetching votes from ntfy:", error);
    return null;
  }
};

export interface AggregatedVotes {
  [chipId: string]: {
    best: number;
    spicy: number;
    weird: number;
    leastBest: number;
  };
}

const subscribeToNtfyPartyVotes = (
  partyCode: string,
  onUpdate: (votes: AggregatedVotes, totalUsers: number) => void
) => {
  const cleanParty = partyCode.trim().toUpperCase();
  const topic = `crunch_showdown_party_${cleanParty.toLowerCase()}`;
  
  const userVotesMap: { [username: string]: VoteData } = {};

  const processPayload = (payload: any) => {
    if (payload.user && payload.votes) {
      userVotesMap[payload.user] = payload.votes;
      
      const totals: AggregatedVotes = {};
      let userCount = 0;
      
      Object.keys(userVotesMap).forEach((user) => {
        userCount++;
        const userVotes = userVotesMap[user];
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
      });
      
      onUpdate(totals, userCount);
    }
  };

  // Fetch cached votes first
  fetch(`https://ntfy.sh/${topic}/json?poll=1`)
    .then((r) => r.text())
    .then((text) => {
      const lines = text.split("\n").filter(Boolean);
      lines.forEach((line) => {
        try {
          const entry = JSON.parse(line);
          if (entry.event === "message" && entry.message) {
            const payload = JSON.parse(entry.message);
            processPayload(payload);
          }
        } catch (e) {
          // ignore
        }
      });
    })
    .catch((err) => console.error("Failed to fetch historical ntfy votes:", err));

  // Connect to SSE stream
  const eventSource = new EventSource(`https://ntfy.sh/${topic}/sse`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "message" && data.message) {
        const payload = JSON.parse(data.message);
        processPayload(payload);
      }
    } catch (err) {
      console.error("Error parsing real-time ntfy message:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.error("Ntfy SSE Connection error:", err);
  };

  return () => {
    eventSource.close();
  };
};

// -------------------------------------------------------------
// Public functions with ntfy.sh fallback checks
// -------------------------------------------------------------

// Save user votes
export const saveVotesToFirestore = async (
  partyCode: string,
  username: string,
  votes: VoteData
): Promise<boolean> => {
  if (usePublicSync) {
    return saveVotesToNtfy(partyCode, username, votes);
  }

  const db = getDb();
  if (!db) {
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
  if (usePublicSync) {
    return fetchUserVotesFromNtfy(partyCode, username);
  }

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

// Subscribe to real-time updates for a party
export const subscribeToPartyVotes = (
  partyCode: string,
  onUpdate: (votes: AggregatedVotes, totalUsers: number) => void,
  onError?: (error: any) => void
) => {
  if (usePublicSync) {
    return subscribeToNtfyPartyVotes(partyCode, onUpdate);
  }

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
