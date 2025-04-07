import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import DHallCard from "../components/DHallCard";
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