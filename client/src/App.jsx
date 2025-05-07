import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DiningHalls from './pages/DiningHalls'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage';
import PreferencesPage from './pages/PreferencesPage';
import AllergiesPage from './pages/AllergiesPage';
import MealSearchPage from './pages/MealSearchPage';
import MenuPage from './pages/MenuPage';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dining-halls" element={<DiningHalls />} />
        <Route path="/dining/:id" element={<MenuPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:usrid/preferences" element={<PreferencesPage />} />
        <Route path="/profile/:usrid/allergies" element={<AllergiesPage />} />
        <Route path="/meals-search/:mealQuery?" element={<MealSearchPage />} />
        { }
      </Routes>
    </Router>
  )
}

export default App
