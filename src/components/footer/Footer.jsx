import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { CategoryAPI } from '../../app/api/category';

const Footer = () => {
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
    { name: 'Accueil', path: "/" },
    { name: 'Enchères', path: "/auction-sidebar" },
    { name: 'Catégories', path: "/category" },
    { name: "Comment Enchérir", path: "/how-to-bid" },
    { name: 'Membres', path: "/users" },
  ];

  // Quick links
  const quickLinks = [
    { title: 'Comment Enchérir', link: '/how-to-bid' },
    { title: 'Comment Vendre', link: '/how-to-sell' },
    { title: 'À Propos', link: '/about' },
    { title: 'FAQ', link: '/faq' },
    { title: 'Contact', link: '/contact' },
  ];

  // Legal links
  const legalLinks = [
    { title: 'Support', link: '/support-center' },
    { title: "Conditions d'utilisation", link: '/terms-condition' },
    { title: 'Politique de Confidentialité', link: '/privacy-policy' },
  ];

  // Social media links
  const socialLinks = [
    { icon: 'bi-linkedin', url: 'https://www.linkedin.com/', name: 'LinkedIn' },
    { icon: 'bi-facebook', url: 'https://www.facebook.com/', name: 'Facebook' },
    { icon: 'bi-twitter-x', url: 'https://twitter.com/', name: 'Twitter' },
    { icon: 'bi-instagram', url: 'https://www.instagram.com/', name: 'Instagram' },
  ];

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      paddingTop: '60px',
      borderTop: '1px solid #eaeaea',
    }}>
      {/* Main Footer Section */}
      <div className="main-footer container" style={{ 
        paddingBottom: '40px',
        borderBottom: '1px solid #eaeaea',
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '40px'
        }}>
          {/* Logo and Description - Larger Section */}
          <div style={{ gridColumn: 'span 2' }}>
            <img 
              src="/assets/images/logo-dark.png" 
              alt="MazadClick Logo" 
              style={{ 
                height: '120px', 
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
              }} 
            />
            <p style={{ 
              color: '#666', 
              fontSize: '16px', 
              lineHeight: '1.6',
              marginBottom: '25px',
              maxWidth: '400px'
            }}>
              Plateforme d'enchères moderne pour professionnels et particuliers.
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
              Navigation
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
              Liens rapides
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
              Catégories
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
              margin: 0,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              {dynamicCategories.slice(0, 8).map((category, index) => (
                <li key={category._id || index}>
                  <Link href={`/auction-sidebar?category=${category._id}`} style={{
                    color: 'var(--text-secondary, #666)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = 'var(--primary-color, #0063b1)';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = 'var(--text-secondary, #666)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <span style={{
                      width: '3px',
                      height: '3px',
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
          <span style={{ color: 'var(--text-muted, #999)' }}>• Tous droits réservés</span>
          <span style={{ color: 'var(--text-muted, #999)' }}>• Créé par</span>
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
  )
}

export default Footer