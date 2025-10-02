"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import SocketProvider from "@/contexts/socket";
import { useTranslation } from 'react-i18next';
import "./style.css";

export default function HowToBid() {
  const { t } = useTranslation();
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
      title: t('howToBid.steps.createAccount.title'),
      description: t('howToBid.steps.createAccount.description'),
      icon: "bi bi-person-plus",
      details: t('howToBid.steps.createAccount.details')
    },
    {
      id: 2,
      title: t('howToBid.steps.browseAuctions.title'),
      description: t('howToBid.steps.browseAuctions.description'),
      icon: "bi bi-search",
      details: t('howToBid.steps.browseAuctions.details')
    },
    {
      id: 3,
      title: t('howToBid.steps.understandDetails.title'),
      description: t('howToBid.steps.understandDetails.description'),
      icon: "bi bi-info-circle",
      details: t('howToBid.steps.understandDetails.details')
    },
    {
      id: 4,
      title: t('howToBid.steps.placeBid.title'),
      description: t('howToBid.steps.placeBid.description'),
      icon: "bi bi-cash-coin",
      details: t('howToBid.steps.placeBid.details')
    },
    {
      id: 5,
      title: t('howToBid.steps.monitorBids.title'),
      description: t('howToBid.steps.monitorBids.description'),
      icon: "bi bi-graph-up",
      details: t('howToBid.steps.monitorBids.details')
    },
    {
      id: 6,
      title: t('howToBid.steps.winComplete.title'),
      description: t('howToBid.steps.winComplete.description'),
      icon: "bi bi-trophy",
      details: t('howToBid.steps.winComplete.details')
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
                      <h1 className="hero-title">{t('howToBid.title')}</h1>
                      <p className="hero-description">
                        {t('howToBid.subtitle')}
                      </p>
                      <div className="hero-buttons">
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            const element = document.getElementById('steps-section');
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {t('howToBid.learnNow')} <i className="bi bi-arrow-right"></i>
                        </button>
                        <button className="btn btn-light ms-3">
                          {t('howToBid.viewLiveAuctions')} <i className="bi bi-box-arrow-right"></i>
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
                    <h2>{t('howToBid.masterTitle')} <span className="text-gradient">{t('howToBid.simpleSteps')}</span></h2>
                    <p>{t('howToBid.stepDescription')}</p>
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
                      <i className="bi bi-arrow-left"></i> {t('howToBid.previous')}
                    </button>
                    <button 
                      className="btn btn-primary"
                      disabled={activeStep === bidSteps.length}
                      onClick={() => setActiveStep(prev => Math.min(prev + 1, bidSteps.length))}
                    >
                      {t('howToBid.next')} <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </section>

              {/* Tips Section */}
              <section className="bid-tips-section">
                <div className="container">
                  <div className="section-title fade-in-section">
                    <h2>{t('howToBid.proTipsTitle')}</h2>
                    <p>{t('howToBid.proTipsSubtitle')}</p>
                  </div>

                  <div className="row fade-in-section">
                    <div className="col-md-4">
                      <div className="tip-card">
                        <div className="tip-icon">
                          <i className="bi bi-clock"></i>
                        </div>
                        <h3>{t('howToBid.strategicTimes')}</h3>
                        <p>{t('howToBid.strategicTimesDesc')}</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="tip-card">
                        <div className="tip-icon">
                          <i className="bi bi-graph-up-arrow"></i>
                        </div>
                        <h3>{t('howToBid.maxBids')}</h3>
                        <p>{t('howToBid.maxBidsDesc')}</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="tip-card">
                        <div className="tip-icon">
                          <i className="bi bi-clipboard-data"></i>
                        </div>
                        <h3>{t('howToBid.researchValue')}</h3>
                        <p>{t('howToBid.researchValueDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="bid-faq-section">
                <div className="container">
                  <div className="section-title fade-in-section">
                    <h2>{t('howToBid.faqTitle')}</h2>
                    <p>{t('howToBid.faqSubtitle')}</p>
                  </div>

                  <div className="row fade-in-section">
                    <div className="col-lg-6">
                      <div className="faq-item">
                        <h3>{t('howToBid.multipleWins')}</h3>
                        <p>{t('howToBid.multipleWinsDesc')}</p>
                      </div>
                      <div className="faq-item">
                        <h3>{t('howToBid.cancelBid')}</h3>
                        <p>{t('howToBid.cancelBidDesc')}</p>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="faq-item">
                        <h3>{t('howToBid.outbid')}</h3>
                        <p>{t('howToBid.outbidDesc')}</p>
                      </div>
                      <div className="faq-item">
                        <h3>{t('howToBid.paymentMethods')}</h3>
                        <p>{t('howToBid.paymentMethodsDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="bid-cta-section fade-in-section">
                <div className="container">
                  <div className="cta-container">
                    <h2>{t('howToBid.readyToStart')}</h2>
                    <p>{t('howToBid.readyToStartDesc')}</p>
                    <button className="btn btn-primary">
                      {t('howToBid.exploreLiveAuctions')} <i className="bi bi-arrow-right"></i>
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