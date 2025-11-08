import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

function App() {
  const [backendData, setBackendData] = useState([{}]);

  useEffect(() => {
    fetch("/api")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) return response.json();
        throw new Error("Expected JSON response from /api");
      })
      .then((data) => {
        setBackendData(data);
      })
      .catch((err) => console.warn("Failed to fetch /api:", err));
  }, []);

  return (
    <main>
      <Outlet />
    </main>
  );
}

export default App;
