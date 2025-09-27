"use client";
import React from 'react';

const WowTestComponent = () => {
  return (
    <div className="wow-test-container" style={{ padding: '20px', minHeight: '100vh' }}>
      <h1 className="wow fadeIn" data-wow-delay="0.2s">
        WOW.js Test Component
      </h1>
      
      <div className="wow fadeInUp" data-wow-delay="0.4s" style={{ margin: '20px 0' }}>
        <p>This text should animate when scrolling into view.</p>
      </div>
      
      <div className="wow fadeInLeft" data-wow-delay="0.6s" style={{ margin: '20px 0' }}>
        <p>This text should slide in from the left.</p>
      </div>
      
      <div className="wow fadeInRight" data-wow-delay="0.8s" style={{ margin: '20px 0' }}>
        <p>This text should slide in from the right.</p>
      </div>
      
      <div className="wow bounceIn" data-wow-delay="1s" style={{ margin: '20px 0' }}>
        <p>This text should bounce in.</p>
      </div>
      
      <div className="wow zoomIn" data-wow-delay="1.2s" style={{ margin: '20px 0' }}>
        <p>This text should zoom in.</p>
      </div>
      
      <div style={{ height: '200px', background: '#f0f0f0', margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Scroll down to see animations</span>
      </div>
      
      <div className="wow slideInUp" data-wow-delay="0.3s" style={{ margin: '20px 0' }}>
        <p>Another animated element that slides up.</p>
      </div>
      
      <div className="wow flipInX" data-wow-delay="0.5s" style={{ margin: '20px 0' }}>
        <p>This text should flip in horizontally.</p>
      </div>
      
      <div className="wow flipInY" data-wow-delay="0.7s" style={{ margin: '20px 0' }}>
        <p>This text should flip in vertically.</p>
      </div>
      
      <div className="wow lightSpeedIn" data-wow-delay="0.9s" style={{ margin: '20px 0' }}>
        <p>This text should have a light speed effect.</p>
      </div>
    </div>
  );
};

export default WowTestComponent;
