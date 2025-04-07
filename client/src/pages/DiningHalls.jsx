import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import DHallCard from "../components/DHallCard";
import hampshireImg from "../images/hampshire.jpg";
import berkshireImg from "../images/berkshire.jpg";
import valentineImg from "../images/valentine.jpg";

const DiningHalls = () => {
  const halls = [
    { id: 1, name: 'Hampshire', image: hampshireImg, college: 'UMass Amherst' },
    { id: 2, name: 'Berkshire', image: berkshireImg, college: 'UMass Amherst' },
    { id: 3, name: 'Valentine', image: valentineImg, college: 'Amherst College' }
    //this is fake data, replace with info from database, maybe add image linking information or something here.
  ]
  const bgColors = {
    "UMass Amherst": '#971B2F',
    "Amherst College": '#470a77',
    "Hampshire College": '#faca39',
    "Smith College": '#203F69',
    "Mt. Holyoke College": '#83C2EC'
  }

  return (
    <div>
      {/* UMass style header */}
      <header className="main-header">
        <div className="header-content">
          <h1 className="site-title">Edibly | Campus Dining</h1>
        </div>
      </header>

      {/* Red Navbar */}
      <div className="main-navbar">
        <Link to="/dining-halls" className="nav-button">
          Dining Halls
        </Link>
        <div className="nav-button search-button">
          Search Meal
        </div>
        <div className="nav-button">
          Profile
        </div>
      </div>

      <div className="dining-halls-container" style={{ padding: "20px" }}>
        {Object.keys(bgColors).map((college) => (
          <div
            key={college}
            style={{
              backgroundColor: bgColors[college],
              padding: "20px",
              marginBottom: "10px",
              borderRadius: "12px",
            }}
          >
            <h2 style={{ color: "white" }}>{college.toUpperCase()}</h2>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {halls
                .filter((d) => d.college === college)
                .map((d) => (
                  <DHallCard key={d.id} diningHall={d} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiningHalls;