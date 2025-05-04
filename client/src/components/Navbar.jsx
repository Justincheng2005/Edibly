import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
    return (
        <div className="main-navbar">
            <Link to="/dining-halls" className="nav-button">
                Dining Halls
            </Link>
            <Link to="/meals-search" className="nav-button search-button">
                Search Meal
            </Link>
            <Link to="/profile" className="nav-button">
                Profile
            </Link>
        </div>
    )
}

export default Navbar