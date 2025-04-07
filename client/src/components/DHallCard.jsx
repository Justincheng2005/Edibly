import React from 'react';
import { Link } from 'react-router-dom';
import './DHallCard.css';
import defaultImage from '../images/hampshire.jpg';

const DHallCard = ({ diningHall }) => {
  const handleImageError = (e) => {
    e.target.src = defaultImage;
  };

  return (
    <div className="dhall-card-container">
      <Link
        to={`/dining/${diningHall.id}`}
        className="dhall-card"
        style={{ textDecoration: 'none' }}
      >
        <div className="dhall-image-wrapper">
          <img
            src={diningHall.image || defaultImage}
            alt={diningHall.name}
            className="dhall-image"
            onError={handleImageError}
          />
          <div className="image-overlay">
            <p>{diningHall.description || "Hours not available"}</p>
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