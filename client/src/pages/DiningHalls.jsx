import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import DHallCard from "../components/DHallCard";
<<<<<<< HEAD
// import hampshireImg from "../images/hampshire.jpg";
// import berkshireImg from "../images/berkshire.jpg";
// import valentineImg from "../images/valentine.jpg";
// import supabase from './db/supabaseClient.js';
//import { createClient } from '@supabase/supabase-js'



const DiningHalls = () => {
  // const halls = [
  //   { id: 1, name: 'Hampshire', image: hampshireImg, college: 'UMass Amherst' },
  //   { id: 2, name: 'Berkshire', image: berkshireImg, college: 'UMass Amherst' },
  //   { id: 3, name: 'Valentine', image: valentineImg, college: 'Amherst College' }
  //   //this is fake data, replace with info from database, maybe add image linking information or something here.
    
  // ]
  const [halls, setHalls] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  
  React.useEffect(()=>{
    fetch('dining_halls')
    .then(res => res.json())
    .then(data => {
      setHalls(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
}, []);

//Need to add this for the onEvent info to show and call the function
// <DHallCard 
//   diningHall={d} 
//   onClick={() => getDiningHallInfo(d.id)} 
// />

// <DHallCard 
//   diningHall={d} 
//   onClick={() => getDiningHallInfo(d.id)} 
// />

//For later implementation by single dining info, potentially
// const getDiningHallInfo = (id) => {
//   fetch('dining_halls')
//     .then(res => res.json())
//     .then(data => {
//       if (error) throw error;
//       return data;
//     })
//     .catch(err => {
//       console.error("Error fetching hall:", err);
//       return null;
//     });
//   };

  
   //SCALABLE    ADD LATER MAYBE, then change server/routes/diningRoutes.js
  // const diningHallPage = () => {
  //   const{hallName} =  /*Link!! */;
  //   const [hallData, setHallData] = useState(null);
  
  //   useEffect(() => {
  //     const fetchData = async () => {
  //       const response = await fetch(`/api/dining-halls/${hallName}`);
  //       const data = await response.json();
  //       setHallData(data);
  //     };
  //     fetchData();
  //   }, [hallName]);

  //  // Render your hall data here
  // };
  
=======
import { fetchAllDiningLocations } from "../api/diningAPI";

const DiningHalls = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // College background colors
>>>>>>> c0460f6b82d8b77b3737d1e94e287f78b23af0ca
  const bgColors = {
    "Umass": '#971B2F',
    "Amherst College": '#470a77',
    "Hampshire College": '#faca39',
    "Smith College": '#203F69',
    "Holyoke College": '#83C2EC'
  };

  useEffect(() => {
    const loadDiningHalls = async () => {
      try {
        setLoading(true);
        const data = await fetchAllDiningLocations();
        // Map data to our component structure
        const hallsWithImages = data.map(hall => ({
          id: hall.id,
          name: hall.name,
          college: hall.school,
          description: `Hours: ${hall.hours}`,
          image: hall.image_filename
        }));
        setHalls(hallsWithImages);
        setError(null);
      } catch (err) {
        setError("Failed to load dining halls. Please try again later.");
        console.error("Error loading dining halls:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDiningHalls();
  }, []);

  // Get unique colleges from the halls data
  const colleges = halls.length > 0
    ? [...new Set(halls.map(hall => hall.college))]
    : Object.keys(bgColors);

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
        {loading ? (
          <p>Loading dining halls...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          colleges.map((college) => {
            const collegeHalls = halls.filter(h => h.college === college);
            if (collegeHalls.length === 0) return null;

            return (
              <div
                key={college}
                style={{
                  backgroundColor: bgColors[college] || '#777',
                  padding: "20px",
                  marginBottom: "10px",
                  borderRadius: "12px",
                }}
              >
                <h2 style={{ color: "white" }}>{college.toUpperCase()}</h2>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  {collegeHalls.map((hall) => (
                    <DHallCard key={hall.id} diningHall={hall} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DiningHalls;