import React from 'react';
import { Link } from 'react-router-dom';
import './DHallCard.css'; 

const DHallCard = ({ diningHall }) => {
    
  return (
    <div className="dhall-card-container">
      <Link 
        to={`/dining/${diningHall.id}`} 
        className="dhall-card"
        style={{ textDecoration: 'none' }}
      >
        <div className="dhall-image-wrapper">
          <img 
            src={diningHall.image} 
            alt={diningHall.name} 
            className="dhall-image"
          />
          <div className="image-overlay">
            <p>{diningHall.description || "More info coming soon!"}</p>
          </div>
        </div>
        <div className="dhall-name">
          {diningHall.name}
        </div>
      </Link>
    </div>
  );
};

export default DHallCard;