import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import { CategoryAPI } from '../../app/api/category.ts';

const Footer = () => {
  const { t } = useTranslation();
  const [dynamicCategories, setDynamicCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await CategoryAPI.getCategories();
        
        // The API returns an object with a 'data' property containing the array
        if (response && response.data && Array.isArray(response.data)) {
          setDynamicCategories(response.data);
        } else if (Array.isArray(response)) {
          // Fallback: if the response is directly an array
          setDynamicCategories(response);
        } else {
          console.error("API response format is unexpected:", response);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);
  
  // Navigation items from header
  const navItems = [
    { name: t('footer.navItems.home'), path: "/" },
    { name: t('footer.navItems.auctions'), path: "/auction-sidebar" },
    { name: t('footer.navItems.category'), path: "/category" },
    { name: t('footer.navItems.howToBid'), path: "/how-to-bid" },
    { name: t('footer.navItems.members'), path: "/users" },
  ];

  // Quick links
  const quickLinks = [
    { title: t('footer.quickLinks.howToBid'), link: '/how-to-bid' },
    { title: t('footer.quickLinks.howToSell'), link: '/how-to-sell' },
    { title: t('footer.quickLinks.about'), link: '/about' },
    { title: t('footer.quickLinks.faq'), link: '/faq' },
    { title: t('footer.quickLinks.contact'), link: '/contact' },
  ];

  // Legal links
  const legalLinks = [
    { title: t('footer.legal.assistance'), link: '/support-center' },
    { title: t('footer.legal.terms'), link: '/terms-condition' },
    { title: t('footer.legal.privacy'), link: '/privacy-policy' },
  ];

  // Social media links
  const socialLinks = [
    { icon: 'bi-linkedin', url: 'https://www.linkedin.com/', name: 'LinkedIn' },
    { icon: 'bi-facebook', url: 'https://www.facebook.com/', name: 'Facebook' },
    { icon: 'bi-twitter-x', url: 'https://twitter.com/', name: 'Twitter' },
    { icon: 'bi-instagram', url: 'https://www.instagram.com/', name: 'Instagram' },
  ];

  return (
    <>
      <style jsx>{`
        .footer-main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
        }
        
        .footer-logo-section {
          grid-column: span 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
        }
        
        @media (max-width: 1024px) {
          .footer-main-grid {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          .footer-logo-section {
            grid-column: span 2;
          }
        }
        
        @media (max-width: 768px) {
          .footer-main-grid {
            grid-template-columns: 1fr;
            gap: 30px;
            padding: 0 16px;
          }
          .footer-logo-section {
            grid-column: span 1;
            align-items: center;
            text-align: center;
          }
          .footer-logo-section > div {
            align-self: center !important;
          }
          .footer-logo-section img {
            height: 60px !important;
            width: 140px !important;
          }
          .footer-logo-section p {
            max-width: 100% !important;
            text-align: center;
          }
        }
        
        @media (max-width: 375px) {
          .footer-main-grid {
            gap: 24px;
            padding: 0 12px;
          }
          .footer-logo-section img {
            height: 50px !important;
            width: 120px !important;
          }
        }
      `}</style>
      <footer style={{
        background: 'white',
        paddingTop: '60px',
        borderTop: '1px solid #eaeaea',
      }}>
      {/* Main Footer Section */}
      <div className="main-footer container" style={{ 
        paddingTop: '0',
        paddingBottom: '40px',
        borderBottom: '1px solid #eaeaea',
      }}>
        <div className="footer-main-grid">
          {/* Logo and Description - Larger Section */}
          <div className="footer-logo-section" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            paddingTop: '0',
            marginTop: '0'
          }}>
            <Link href="/" style={{ 
              display: 'inline-block',
              marginBottom: '25px',
              transition: 'transform 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <img 
                src="/assets/img/logo.png" 
                alt="Mazad.Click Logo" 
                style={{ 
                  height: '80px', 
                  width: '190px',
                  display: 'block',
                  objectFit: 'contain',
                  objectPosition: 'center center',
                  filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.1))',
                  transition: 'filter 0.3s ease'
                }} 
                onMouseOver={(e) => {
                  e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.filter = 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.1))';
                }}
              />
            </Link>
            <p style={{ 
              color: '#666', 
              fontSize: '16px', 
              lineHeight: '1.6',
              marginBottom: '25px',
              maxWidth: '400px'
            }}>
              {t('footer.description')}
            </p>
            {/* Social Media Icons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {socialLinks.map((social, index) => (
                <a 
                  key={index} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '18px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#0063b1';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.3)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#f0f0f0';
                    e.currentTarget.style.color = '#666';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  title={social.name}
                >
                  <i className={`bi ${social.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--text-primary, #333)',
              marginBottom: '20px',
              position: 'relative'
            }}>
              {t('footer.navigation')}
              <span style={{
                position: 'absolute',
                bottom: '-8px',
                left: '0',
                width: '30px',
                height: '3px',
                background: 'var(--primary-color, #0063b1)',
                borderRadius: '2px'
              }}></span>
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {navItems.map((item, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <Link href={item.path} style={{
                    color: 'var(--text-secondary, #666)',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = 'var(--primary-color, #0063b1)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = 'var(--text-secondary, #666)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--primary-color, #0063b1)',
                      opacity: 0
                    }}></span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--text-primary, #333)',
              marginBottom: '20px',
              position: 'relative'
            }}>
              {t('footer.quickLinksTitle', 'Quick Links')}
              <span style={{
                position: 'absolute',
                bottom: '-8px',
                left: '0',
                width: '30px',
                height: '3px',
                background: 'var(--primary-color, #0063b1)',
                borderRadius: '2px'
              }}></span>
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {quickLinks.map((item, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <Link href={item.link} style={{
                    color: 'var(--text-secondary, #666)',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = 'var(--primary-color, #0063b1)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = 'var(--text-secondary, #666)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--primary-color, #0063b1)',
                      opacity: 0
                    }}></span>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories Column */}
          <div>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--text-primary, #333)',
              marginBottom: '20px',
              position: 'relative'
            }}>
              {t('footer.categoriesTitle')}
              <span style={{
                position: 'absolute',
                bottom: '-8px',
                left: '0',
                width: '30px',
                height: '3px',
                background: 'var(--primary-color, #0063b1)',
                borderRadius: '2px'
              }}></span>
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {dynamicCategories.slice(0, 6).map((category, index) => (
                <li key={category._id || index} style={{ marginBottom: '12px' }}>
                  <Link href={`/auction-sidebar?category=${category._id}`} style={{
                    color: 'var(--text-secondary, #666)',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = 'var(--primary-color, #0063b1)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = 'var(--text-secondary, #666)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--primary-color, #0063b1)',
                      opacity: 0
                    }}></span>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="copyright-section container" style={{ 
        padding: '20px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary, #666)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          ©2024 <Link href="/" style={{ 
            color: 'var(--primary-color, #0063b1)', 
            textDecoration: 'none',
            fontWeight: '600'
          }}>MazadClick</Link>
          <span style={{ color: 'var(--text-muted, #999)' }}>• {t('footer.copyright')}</span>
          <span style={{ color: 'var(--text-muted, #999)' }}>• {t('footer.createdBy')}</span>
          <Link href="https://noteasy-dz.com/" target="_blank" style={{ 
            color: 'var(--primary-color, #0063b1)', 
            textDecoration: 'none',
            fontWeight: '600'
          }}>NotEasy</Link>
        </div>
        <div>
          <ul style={{ 
            display: 'flex', 
            gap: '20px', 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            flexWrap: 'wrap'
          }}>
            {legalLinks.map((item, index) => (
              <li key={index}>
                <Link href={item.link} style={{ 
                  color: 'var(--text-secondary, #666)', 
                  textDecoration: 'none', 
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = 'var(--primary-color, #0063b1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = 'var(--text-secondary, #666)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </footer>
    </>
  )
}

export default Footer