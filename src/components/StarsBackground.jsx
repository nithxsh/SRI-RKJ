import React, { useState } from 'react';
import '../index.css';

const generateStars = () => {
  return Array.from({ length: 75 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `-${Math.random() * 20 + 10}%`,
    size: `${Math.random() * 3 + 1}px`,
    duration: `${8 + Math.random() * 15}s`,
    delay: `${Math.random() * 10}s`,
    opacity: Math.random() * 0.6 + 0.2
  }));
};

export default function StarsBackground() {
  const [stars] = useState(generateStars);

  return (
    <div className="stars-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="falling-star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDuration: star.duration,
            animationDelay: star.delay,
            opacity: star.opacity
          }}
        ></div>
      ))}
    </div>
  );
}
