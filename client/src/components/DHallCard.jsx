import React from 'react';
import { Link } from 'react-router-dom';
import './DHallCard.css';
import defaultImage from '../images/hampshire.jpg';
// Import all the images we'll need
import hampshireImg from '../images/hampshire.jpg';
import berkshireImg from '../images/berkshire.jpg';
import valentineImg from '../images/valentine.jpg';

const DHallCard = ({ diningHall }) => {
  // Map of available images
  const localImages = {
    'hampshire.jpg': hampshireImg,
    'berkshire.jpg': berkshireImg,
    'valentine.jpg': valentineImg,
    // Add other images as needed
  };

  // Determine image source based on database value
  const getImageSrc = () => {
    if (!diningHall.image) return defaultImage;

    // Check if the image is a full URL
    if (diningHall.image.startsWith('http')) {
      return diningHall.image;
    }

    // Check if we have the image in our local map
    if (localImages[diningHall.image]) {
      return localImages[diningHall.image];
    }

    // Fallback to default
    return defaultImage;
  };

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
            src={getImageSrc()}
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