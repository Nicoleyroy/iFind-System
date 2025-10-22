import React, {useEffect, useState} from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/login'
import LostItemManagement from './components/user/Lost-Item-Management'
import Register from './components/register'

function App() {

  const [backendData, setBackendData] = useState([{}])

  useEffect(() => {

    fetch("/api").then(
      response => response.json() 
    ).then(
      data => {
        setBackendData(data)
      }
    )

  })


  return (
      <Router>

      <Routes>

          <Route path="/" element={<Login />} />
          <Route path="/Lost-Items" element={<LostItemManagement />} />
          <Route path="/register" element={<Register />} />


      </Routes>
    </Router>
  )
}


export default App

