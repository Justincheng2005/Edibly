import React from 'react';
import { Link } from 'react-router-dom';
import './DHallCard.css';
import defaultImage from '../images/hampshire.jpg';
// Import all the images we'll need
import hampshireImg from '../images/hampshire.jpg';
import berkshireImg from '../images/berkshire.jpg';
import wooImg from '../images/worcester.jpg';
import franklinImg from '../images/franklin.jpg';
import valentineImg from '../images/valentine.jpg';
import holyokeCommonsImg from '../images/holyoke.jpg'; // Dining Commons (Holyoke College)
import hampshireCommonsImg from '../images/hampshire_college.jpg'; // Dining Commons (Hampshire College)
import chapinImg from '../images/smith_chapin.jpg';
import chaseDuckettImg from '../images/smith_chase_duckett.jpg';
import comstockWilderImg from '../images/smith_comstock_wilder.jpg';
import gillettImg from '../images/smith_gilett.jpg';
import northrupImg from '../images/smith_northrup.jpg';
import kingScalesImg from '../images/smith_king_scales.jpg';
import lamontImg from '../images/smith_lamont.jpg';
import tylerImg from '../images/smith_tyler.jpg';
import ziskindCutterImg from '../images/smith_ziskind_cutter.jpg';

const DHallCard = ({ diningHall }) => {
  // Map of available images
  const localImages = {
    'hampshire.jpg': hampshireImg,
    'berkshire.jpg': berkshireImg,
    'worcester.jpg': wooImg,
    'franklin.jpg': franklinImg,
    'valentine.jpg': valentineImg,
    'holyoke.jpg': holyokeCommonsImg, // Dining Commons (Holyoke College)
    'hampshire_college.jpg': hampshireCommonsImg, // Dining Commons (Hampshire College)
    'smith_chapin.jpg': chapinImg,
    'smith_chase_duckett.jpg': chaseDuckettImg,
    'smith_comstock_wilder.jpg': comstockWilderImg,
    'smith_gillett.jpg': gillettImg,
    'smith_northrup.jpg': northrupImg,
    'smith_king_scales.jpg': kingScalesImg,
    'smith_lamont.jpg': lamontImg,
    'smith_tyler.jpg': tylerImg,
    'smith_ziskind_cutter.jpg': ziskindCutterImg,
    'smith_ziskind_kosher.jpg': ziskindCutterImg
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