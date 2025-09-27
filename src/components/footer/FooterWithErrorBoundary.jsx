"use client";
import React from 'react';
import Footer from './Footer';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Footer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <footer style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          paddingTop: '60px',
          borderTop: '1px solid #eaeaea',
        }}>
          <div className="container" style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <p>©2024 MazadClick - All rights reserved</p>
            </div>
          </div>
        </footer>
      );
    }

    return this.props.children;
  }
}

const FooterWithErrorBoundary = () => {
  return (
    <ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
};

export default FooterWithErrorBoundary; 