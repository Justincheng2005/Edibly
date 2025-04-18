import React, { useState, useEffect } from "react";
import "./HomePage.css";
import DHallCard from "../components/DHallCard";
import { fetchAllDiningLocations } from "../api/diningAPI";
import Navbar from "../components/Navbar";
import MainHeader from "../components/MainHeader";

const DiningHalls = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // College background colors
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
      <MainHeader/>

      {/* Red Navbar */}
      <Navbar/>

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