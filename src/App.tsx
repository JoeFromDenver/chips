import { useState, useEffect } from "react";
import { PasswordGate } from "./components/PasswordGate";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { VotingScreen } from "./components/VotingScreen";
import { HostLeaderboard } from "./components/HostLeaderboard";
import { initializeFirebase } from "./services/firebase";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);

  // Initialize Firebase Firestore on app start if keys exist
  useEffect(() => {
    initializeFirebase();
  }, []);

  // 1. Session check on mount
  useEffect(() => {
    const savedPwd = localStorage.getItem("crunch_showdown_auth_pwd");
    const savedUser = localStorage.getItem("crunch_showdown_auth_username");
    
    if (savedPwd === "syrup" && savedUser) {
      setUsername(savedUser);
      setIsAuthenticated(true);
    }

    // Parse URL room parameters
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get("room");
    if (urlRoom) {
      setRoomCode(urlRoom.toUpperCase());
    }
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("crunch_showdown_auth_pwd");
    localStorage.removeItem("crunch_showdown_auth_username");
    setUsername("");
    setIsAuthenticated(false);
    setRoomCode("");
    // Clear URL parameters
    window.history.pushState({}, document.title, window.location.pathname);
  };

  const handleAuthenticated = (user: string) => {
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleJoinRoom = (code: string, host: boolean) => {
    setRoomCode(code);
    setIsHost(host);
    
    // Update URL to include the room query (for easy sharing)
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleLeaveRoom = () => {
    setRoomCode("");
    setIsHost(false);
    // Clear room URL query
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  // Views Router
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={handleAuthenticated} />;
  }

  if (roomCode) {
    if (isHost) {
      return <HostLeaderboard partyCode={roomCode} onLeave={handleLeaveRoom} />;
    } else {
      return <VotingScreen username={username} partyCode={roomCode} onLeave={handleLeaveRoom} />;
    }
  }

  return (
    <WelcomeScreen
      username={username}
      onJoinRoom={handleJoinRoom}
      onLogout={handleLogout}
    />
  );
}

export default App;
