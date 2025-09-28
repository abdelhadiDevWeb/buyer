"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import SocketProvider from "@/contexts/socket";
import "./style.css";

export default function HowToBid() {
  const [activeStep, setActiveStep] = useState(1);

  // Animation control for elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".fade-in-section");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const bidSteps = [
    {
      id: 1,
      title: 'Create Your Account',
      description: 'Sign up for a free account to start bidding',
      icon: "bi bi-person-plus",
      details: 'Register with your email and create a secure account to access all auction features.'
    },
    {
      id: 2,
      title: 'Browse Live Auctions',
      description: 'Explore available auctions and find items you love',
      icon: "bi bi-search",
      details: 'Use our search and filter tools to discover auctions by category, price range, and location.'
    },
    {
      id: 3,
      title: 'Understand Item Details',
      description: 'Review comprehensive information about each item',
      icon: "bi bi-info-circle",
      details: 'Read descriptions, view photos, check condition reports, and understand terms before bidding.'
    },
    {
      id: 4,
      title: 'Place Your Bid',
      description: 'Enter your maximum bid amount strategically',
      icon: "bi bi-cash-coin",
      details: 'Set your maximum bid and let our system automatically bid for you up to that amount.'
    },
    {
      id: 5,
      title: 'Monitor Your Bids',
      description: 'Track auction progress and adjust your strategy',
      icon: "bi bi-graph-up",
      details: 'Watch live updates, receive notifications, and manage your active bids in real-time.'
    },
    {
      id: 6,
      title: 'Win & Complete Purchase',
      description: 'Secure your winning item and arrange collection',
      icon: "bi bi-trophy",
      details: 'If you win, complete payment and arrange pickup or delivery of your new item.'
    }
  ];

  return (
    <SocketProvider>
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <RequestProvider>
          <AxiosInterceptor>
            <Header />
            <main className="how-to-bid-page">
              {/* Hero Section */}
              <section className="bid-hero-section">
                <div className="container">
                  <div className="row align-items-center">
                    <div className="col-lg-6 fade-in-section">
                      <h1 className="hero-title">How to Bid Like a Pro</h1>
                      <p className="hero-description">
                        Master the art of online auction bidding with our comprehensive guide
                      </p>
                      <div className="hero-buttons">
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            const element = document.getElementById('steps-section');
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Learn Now <i className="bi bi-arrow-right"></i>
                        </button>
                        <button className="btn btn-light ms-3">
                          View Live Auctions <i className="bi bi-box-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                    <div className="col-lg-6 fade-in-section">
                      <div className="hero-image">
                        <div className="image-container">
                          <img 
                            src="/assets/img/logo.svg" 
                            alt="Bidding Illustration" 
                            className="img-fluid bid-illustration"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Steps Section */}
              <section id="steps-section" className="bid-steps-section">
                <div className="container">
                  <div className="section-title fade-in-section">
                    <h2>Master Bidding in <span className="text-gradient">6 Simple Steps</span></h2>
                    <p>Follow our proven process to become a confident and successful bidder</p>
                  </div>

                  <div className="steps-navigation fade-in-section">
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${(activeStep / bidSteps.length) * 100}%` }}
                      ></div>
                    </div>
                    <div className="steps-indicators">
                      {bidSteps.map((step) => (
                        <div 
                          key={step.id}
                          className={`step-indicator ${activeStep >= step.id ? 'active' : ''}`}
                          onClick={() => setActiveStep(step.id)}
                        >
                          <div className="step-number">{step.id}</div>
                          <div className="step-title">{step.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="steps-content fade-in-section">
                    {bidSteps.map((step) => (
                      <div 
                        key={step.id} 
                        className={`step-card ${activeStep === step.id ? 'active' : ''}`}
                      >
                        <div className="step-card-inner">
                          <div className="row align-items-center">
                            <div className="col-md-4">
                              <div className="step-icon">
                                <i className={step.icon}></i>
                              </div>
                            </div>
                            <div className="col-md-8">
                              <h3 className="step-title">
                                <span className="step-number">{step.id}.</span> {step.title}
                              </h3>
                              <p className="step-description">{step.description}</p>
                              <div className="step-details">
                                {step.details}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="step-navigation-buttons fade-in-section">
                    <button 
                      className="btn btn-light"
                      disabled={activeStep === 1}
                      onClick={() => setActiveStep(prev => Math.max(prev - 1, 1))}
                    >
                      <i className="bi bi-arrow-left"></i> Previous
                    </button>
                    <button 
                      className="btn btn-primary"
                      disabled={activeStep === bidSteps.length}
                      onClick={() => setActiveStep(prev => Math.min(prev + 1, bidSteps.length))}
                    >
                      Next <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </section>

              {/* Tips Section */}
              <section className="bid-tips-section">
                <div className="container">
                  <div className="section-title fade-in-section">
                    <h2>Pro Tips for Success</h2>
                    <p>Expert strategies to maximize your bidding potential</p>
                  </div>

                  <div className="row fade-in-section">
                    <div className="col-md-4">
                      <div className="tip-card">
                        <div className="tip-icon">
                          <i className="bi bi-clock"></i>
                        </div>
                        <h3>Strategic Timing</h3>
                        <p>Bid during less competitive hours to increase your chances of winning at better prices.</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="tip-card">
                        <div className="tip-icon">
                          <i className="bi bi-graph-up-arrow"></i>
                        </div>
                        <h3>Set Maximum Bids</h3>
                        <p>Use proxy bidding to automatically bid up to your maximum amount without constant monitoring.</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="tip-card">
                        <div className="tip-icon">
                          <i className="bi bi-clipboard-data"></i>
                        </div>
                        <h3>Research Item Value</h3>
                        <p>Research similar items and market values to set realistic maximum bids and avoid overpaying.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="bid-faq-section">
                <div className="container">
                  <div className="section-title fade-in-section">
                    <h2>Frequently Asked Questions</h2>
                    <p>Everything you need to know about bidding on our platform</p>
                  </div>

                  <div className="row fade-in-section">
                    <div className="col-lg-6">
                      <div className="faq-item">
                        <h3>Can I win multiple auctions?</h3>
                        <p>Yes! You can bid on and win multiple auctions simultaneously. Just ensure you have sufficient funds for all potential wins.</p>
                      </div>
                      <div className="faq-item">
                        <h3>Can I cancel my bid?</h3>
                        <p>Bids can be cancelled before the auction ends, but not after. Always bid responsibly and within your budget.</p>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="faq-item">
                        <h3>What happens if I'm outbid?</h3>
                        <p>You'll receive notifications when you're outbid. You can increase your maximum bid anytime before the auction ends.</p>
                      </div>
                      <div className="faq-item">
                        <h3>What payment methods are accepted?</h3>
                        <p>We accept credit cards, debit cards, and bank transfers. Payment is required within 24 hours of winning an auction.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="bid-cta-section fade-in-section">
                <div className="container">
                  <div className="cta-container">
                    <h2>Ready to Start Bidding?</h2>
                    <p>Join thousands of successful bidders and discover amazing deals today</p>
                    <button className="btn btn-primary">
                      Explore Live Auctions <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </section>
            </main>
            <Footer />
          </AxiosInterceptor>
        </RequestProvider>
      </SnackbarProvider>
    </SocketProvider>
  );
} 