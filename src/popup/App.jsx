import React, { useEffect, useState } from "react";
import { getFromStorage } from "../utils/storage.js";

export default function App() {
  const [blockedSites, setBlockedSites] = useState([]);
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    async function fetchData() {
      const sites = (await getFromStorage("blockedSites")) || [];
      const av = (await getFromStorage("avatar")) || "falcon";
      setBlockedSites(sites);
      setAvatar(av);
    }
    fetchData();
  }, []);

  return (
    <div style={{ padding: 16, textAlign: "center", width: 300 }}>
      <h1>🦅 FocusFalcon</h1>
      <p>Blocked Sites:</p>
      <ul>
        {blockedSites.map((site) => (
          <li key={site}>{site}</li>
        ))}
      </ul>
      <p>Avatar: {avatar}</p>
    </div>
  );
}
