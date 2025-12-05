import React from "react";
import { Outlet } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import api from "./api/axios";

function App() {
  const [backendData, setBackendData] = useState([{}]);

  useEffect(() => {

    const fetchData = async () => {
      const res =await api.get("/api");
      setBackendData(res.data);
      
    }
    fetchData();
    
  }, []);

  return (
    <main>
      <Outlet />
      <Outlet />
    </main>
  );
}

export default App;
