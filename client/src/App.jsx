import { useState } from "react";
import LostItemManagement from "./components/user/Lost-Item-Management";
import { useEffect } from "react";

function App() {
  const [backendData, setBackendData] = useState([{}]);

  useEffect(() => {
    fetch("/api")
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data);
      });
  });

  return (
    <main>
      <LostItemManagement />
    </main>
  );
}

export default App;
