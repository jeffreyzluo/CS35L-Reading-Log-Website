import React from 'react';
import './HeroImage.css';

function HeroImage({ children }) {
  const bgUrl = `url(${process.env.PUBLIC_URL || ''}/library.jpg)`;

  return (
    <section className="hero-image" style={{ ['--hero-bg']: bgUrl }}>
      <div className="hero-content">
        <div className="container">
          {children}
        </div>
      </div>
    </section>
  );
}

export default HeroImage;
