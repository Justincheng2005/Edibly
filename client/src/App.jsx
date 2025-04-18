import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DiningHalls from './pages/DiningHalls'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage';
function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dining-halls" element={<DiningHalls />} />
        <Route path="/profile" element={<ProfilePage />} />
        { }
      </Routes>
    </Router>
  )
}

export default App
