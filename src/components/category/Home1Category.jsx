"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import Link from "next/link";
import { useMemo, useEffect, useState, useRef } from "react";
import { CategoryAPI } from "../../app/api/category";
// Import static data as fallback
import categoryData from "../../data/category.json"
import app from '../../config'; // Import config to access route
import { useTranslation } from 'react-i18next';

const Home1Category = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const DEFAULT_CATEGORY_IMAGE = "/assets/images/logo-white.png";
  const FALLBACK_CATEGORY_IMAGE = "/assets/images/cat.avif";

  // Helper function to get the correct image URL
  const getCategoryImageUrl = (category) => {
    // If it's from API response (has thumb.url)
    if (category.thumb && category.thumb.url) {
      return `${app.route}${category.thumb.url}`;
    }
    // If it's from fallback data (has image property)
    if (category.image) {
      // Check if it's already a full URL or a relative path
      if (category.image.startsWith('http')) {
        return category.image;
      }
      // If it's a relative path, make it absolute
      return category.image.startsWith('/') ? category.image : `/${category.image}`;
    }
    return FALLBACK_CATEGORY_IMAGE;
  };

  // Handle image load errors
  const handleImageError = (categoryId) => {
    setImageErrors(prev => ({
      ...prev,
      [categoryId]: true
    }));
  };

  // Simplified Swiper settings for responsive carousel
  const settings = useMemo(
    () => ({
      modules: [Autoplay, Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 20 },
        1024: { slidesPerView: 4, spaceBetween: 20 },
        1280: { slidesPerView: 5, spaceBetween: 20 },
      },
    }),
    []
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await CategoryAPI.getCategoryTree();
        
        // Handle different response structures
        let categoryDataResponse = null;
        
        if (response?.success && Array.isArray(response.data)) {
          categoryDataResponse = response.data;
        } else if (Array.isArray(response)) {
          categoryDataResponse = response;
        } else if (response?.data && Array.isArray(response.data)) {
          categoryDataResponse = response.data;
        }
        
        if (categoryDataResponse && categoryDataResponse.length > 0) {
          setCategories(categoryDataResponse);
          setError(false);
          setErrorMessage('');
        } else {
          throw new Error('Invalid response structure');
        }
        
      } catch (error) {
        console.error('Error fetching categories:', error);
        
        // Try loading static fallback data
        if (categoryData && categoryData['auction-category'] && Array.isArray(categoryData['auction-category']) && categoryData['auction-category'].length > 0) {
          // Transform the fallback data to match expected structure
          const transformedCategories = categoryData['auction-category'].map(cat => ({
            _id: cat.id.toString(),
            id: cat.id,
            name: cat.name,
            thumb: {
              url: cat.image
            },
            children: []
          }));
          setCategories(transformedCategories);
          setError(false);
          setErrorMessage('');
        } else {
          setCategories([]);
          setError(true);
          setErrorMessage('Failed to load categories');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const hasChildren = (category) => {
    return category.children && category.children.length > 0;
  };

  const navigateToCategory = (category) => {
    const categoryId = category._id || category.id;
    const categoryName = category.name;
    window.location.href = `/category?category=${categoryId}&name=${encodeURIComponent(categoryName)}`;
  };

  // Recursive function to render subcategory tree
  const renderSubcategoryTree = (subcategories, level = 0) => {
    if (!subcategories || !Array.isArray(subcategories) || subcategories.length === 0) {
      return null;
    }

    return subcategories.map((subcategory) => {
      const hasGrandchildren = hasChildren(subcategory);
      
      return (
        <div key={subcategory._id || subcategory.id}>
          {/* Subcategory Item */}
          <div
            className="subcategory-tree-item"
            onClick={(e) => {
              e.stopPropagation();
              navigateToCategory(subcategory);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 20px',
              paddingLeft: `${20 + (level * 24)}px`, // Indent based on level
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderBottom: level === 0 ? '1px solid rgba(0, 99, 177, 0.12)' : '1px solid rgba(0, 99, 177, 0.06)',
              position: 'relative',
              backgroundColor: 'transparent',
              borderRadius: level === 0 ? '12px' : '8px',
              margin: level === 0 ? '0 8px' : '0 12px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = level === 0 
                ? 'rgba(0, 99, 177, 0.1)' 
                : 'rgba(0, 99, 177, 0.06)';
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Tree line indicator for nested items */}
            {level > 0 && (
              <>
                <div 
                  className="tree-line"
                  style={{
                    position: 'absolute',
                    left: `${8 + ((level - 1) * 20)}px`,
                    top: '0',
                    bottom: '0',
                    width: '1px',
                    background: 'rgba(0, 99, 177, 0.2)',
                  }} 
                />
                <div 
                  className="tree-line"
                  style={{
                    position: 'absolute',
                    left: `${8 + ((level - 1) * 20)}px`,
                    top: '50%',
                    width: '12px',
                    height: '1px',
                    background: 'rgba(0, 99, 177, 0.2)',
                  }} 
                />
              </>
            )}
            
            <div style={{
              width: level === 0 ? '40px' : '32px',
              height: level === 0 ? '40px' : '32px',
              borderRadius: level === 0 ? '12px' : '8px',
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '14px',
              flexShrink: 0,
              transition: 'all 0.3s ease',
            }}>
              <img
                src={imageErrors[subcategory._id || subcategory.id] ? FALLBACK_CATEGORY_IMAGE : getCategoryImageUrl(subcategory)}
                alt={subcategory.name}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: level === 0 ? '10px' : '6px',
                  objectFit: 'cover',
                }}
                onError={() => handleImageError(subcategory._id || subcategory.id)}
                loading="lazy"
              />
            </div>
            <span style={{
              fontSize: level === 0 ? '15px' : '14px',
              fontWeight: level === 0 ? '600' : '500',
              color: level === 0 ? '#1e293b' : '#475569',
              flex: 1,
              lineHeight: '1.4',
            }}>
              {subcategory.name}
            </span>
            
            {/* Indicator for categories with children */}
            {hasGrandchildren && (
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'rgba(0, 99, 177, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '8px',
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0063b1" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
            )}
            
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
          
          {/* Recursively render grandchildren */}
          {hasGrandchildren && renderSubcategoryTree(subcategory.children, level + 1)}
        </div>
      );
    });
  };

  const renderCategoryCard = (category, index = 0) => {
    const id = category._id || category.id;
    const name = category.name;
    const isHovered = hoveredCategory === id;
    const isExpanded = expandedCategories[id];
    const hasSubcategories = hasChildren(category);

    // Dynamic gradient based on category index
    const gradients = [
      'linear-gradient(135deg, #0063b1 0%, #00a3e0 100%)',
      'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
    ];
    const categoryGradient = gradients[index % gradients.length];

    return (
      <div 
        key={id}
        className="category-card-professional"
        style={{
          position: 'relative',
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isHovered 
            ? '0 20px 60px rgba(0, 99, 177, 0.25), 0 0 0 1px rgba(0, 99, 177, 0.1)' 
            : '0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.5)',
          transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
          overflow: isExpanded ? 'visible' : 'hidden',
          zIndex: isExpanded ? 20 : 1,
        }}
        onMouseEnter={() => setHoveredCategory(id)}
        onMouseLeave={() => setHoveredCategory(null)}
      >
        {/* Gradient Accent */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '4px',
          background: categoryGradient,
          borderRadius: '20px 20px 0 0',
        }} />

        {/* Floating Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '32px',
          height: '32px',
          background: `${categoryGradient}`,
          borderRadius: '50%',
          opacity: isHovered ? 0.8 : 0.3,
          transition: 'all 0.4s ease',
          transform: isHovered ? 'scale(1.2) rotate(45deg)' : 'scale(1) rotate(0deg)',
        }} />

        {/* Category Content */}
        <div 
          onClick={() => navigateToCategory(category)}
          style={{
            padding: '24px',
            cursor: 'pointer',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Category Image with Creative Frame */}
          <div style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: categoryGradient,
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.4s ease',
              transform: isHovered ? 'rotate(6deg) scale(1.1)' : 'rotate(0deg) scale(1)',
              boxShadow: isHovered 
                ? '0 12px 40px rgba(0, 99, 177, 0.3)' 
                : '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '17px',
                overflow: 'hidden',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img
                  src={imageErrors[id] ? FALLBACK_CATEGORY_IMAGE : getCategoryImageUrl(category)}
                  alt={name}
                  style={{
                    width: '90%',
                    height: '90%',
                    objectFit: 'cover',
                    borderRadius: '14px',
                    transition: 'all 0.4s ease',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  }}
                  onError={() => handleImageError(id)}
                  loading="lazy"
                />
              </div>
            </div>
            
            {/* Badge for subcategories */}
            {hasSubcategories && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                background: categoryGradient,
                borderRadius: '50%',
                border: '3px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                animation: isHovered ? 'pulse 2s infinite' : 'none',
              }}>
                {category.children.length}
              </div>
            )}
          </div>
          
          {/* Category Name with Modern Typography */}
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0',
            lineHeight: '1.3',
            transition: 'all 0.4s ease',
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          }}>
            {name}
          </h3>
          
          {/* Category Description */}
          {category.description && (
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              lineHeight: '1.5',
              margin: '0 0 12px 0',
              textAlign: 'center',
              maxHeight: isHovered ? '40px' : '32px',
              overflow: 'hidden',
              transition: 'all 0.4s ease',
              opacity: isHovered ? 1 : 0.8,
            }}>
              {category.description}
            </p>
          )}
          
          {/* Subcategory Info with Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#64748b',
            fontWeight: '500',
          }}>
            {hasSubcategories && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span>{category.children.length} categories</span>
              </>
            )}
          </div>

          {/* Animated Underline */}
          <div style={{
            width: isHovered ? '60px' : '30px',
            height: '3px',
            background: categoryGradient,
            borderRadius: '3px',
            margin: '12px auto 0',
            transition: 'all 0.4s ease',
            opacity: isHovered ? 1 : 0.6,
          }} />
        </div>
        
        {/* Modern Expand Button */}
        {hasSubcategories && (
          <div style={{
            borderTop: '1px solid rgba(0, 99, 177, 0.08)',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)',
            borderRadius: '0 0 20px 20px',
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(id);
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: isExpanded 
                  ? categoryGradient 
                  : 'transparent',
                border: isExpanded 
                  ? 'none' 
                  : '1px solid rgba(0, 99, 177, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: isExpanded ? 'white' : '#0063b1',
                transition: 'all 0.3s ease',
                boxShadow: isExpanded 
                  ? '0 4px 20px rgba(0, 99, 177, 0.3)' 
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.background = 'rgba(0, 99, 177, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
              <span>{isExpanded ? 'Hide' : 'Explore'} subcategories</span>
            </button>
          </div>
        )}
        
        {/* Enhanced Subcategories Dropdown */}
        {hasSubcategories && isExpanded && (
          <div 
            className="subcategory-dropdown-modern"
            style={{
              position: 'absolute',
              top: 'calc(100% - 1px)',
              left: '0',
              right: '0',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
              border: '1px solid rgba(0, 99, 177, 0.15)',
              borderTop: `3px solid`,
              borderImage: `${categoryGradient} 1`,
              borderRadius: '0 0 20px 20px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5)',
              zIndex: 100,
              maxHeight: '350px',
              overflowY: 'auto',
              animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 0',
            }}>
              {renderSubcategoryTree(category.children)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCategoryGrid = (categories) => {
    return categories.map((category, index) => renderCategoryCard(category, index));
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '300px',
        padding: '40px',
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid rgba(0, 99, 177, 0.2)', 
          borderTop: '3px solid #0063b1', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 99, 177, 0.1)',
        margin: '20px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>📂</div>
        <h3 style={{ color: '#0063b1', marginBottom: '10px', fontSize: '20px', fontWeight: '600' }}>
          No Categories Found
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          {errorMessage || 'Categories will be available soon'}
        </p>
      </div>
    );
  }

  return (
    <section className="container-responsive" style={{
      padding: 'clamp(40px, 8vw, 60px) 0',
    }}>
      {/* Enhanced Section Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '60px',
        position: 'relative',
      }}>
        
        <div style={{
          marginBottom: 'clamp(16px, 3vw, 20px)',
        }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #0063b1 0%, #00a3e0 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
          }}>
            Explore Categories
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: '500',
          }}>
            Discover amazing auctions across different categories and find exactly what you're looking for
          </p>
        </div>

      </div>

      {/* Professional Categories Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '32px',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
      }}>
        {renderCategoryGrid(categories)}
      </div>

      {/* Mobile Carousel */}
      <div style={{ 
        display: 'none',
        marginTop: '40px',
        '@media (max-width: 768px)': { display: 'block' }
      }}>
        <Swiper {...settings}>
          {categories.map((category, index) => (
            <SwiperSlide key={category._id || category.id}>
              {renderCategoryCard(category, index)}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Enhanced Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          0% { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(3deg);
          }
        }
        
        /* Professional card styling */
        .category-card-professional {
          min-height: 300px;
          position: relative;
        }
        
        .category-card-professional::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          border-radius: 20px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .category-card-professional:hover::before {
          opacity: 1;
        }
        
        /* Enhanced dropdown styling */
        .subcategory-dropdown-modern {
          transform-origin: top center;
        }
        
        .subcategory-dropdown-modern::-webkit-scrollbar {
          width: 8px;
        }
        
        .subcategory-dropdown-modern::-webkit-scrollbar-track {
          background: rgba(0, 99, 177, 0.05);
          border-radius: 8px;
        }
        
        .subcategory-dropdown-modern::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(0, 99, 177, 0.3), rgba(0, 163, 224, 0.3));
          border-radius: 8px;
        }
        
        .subcategory-dropdown-modern::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(0, 99, 177, 0.5), rgba(0, 163, 224, 0.5));
        }
        
        /* Tree structure enhancements */
        .subcategory-tree-item {
          position: relative;
        }
        
        .tree-line {
          transition: all 0.3s ease;
        }
        
        .subcategory-tree-item:hover .tree-line {
          opacity: 0.8;
          background: rgba(0, 99, 177, 0.3) !important;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .category-card-professional {
            min-height: 280px;
          }
          
          .category-card-professional .category-image {
            width: 70px !important;
            height: 70px !important;
          }
        }
        
        @media (max-width: 480px) {
          .category-card-professional {
            min-height: 260px;
          }
        }
        
        /* Performance optimizations */
        .category-card-professional {
          will-change: transform, box-shadow;
        }
        
        .subcategory-tree-item {
          will-change: transform, background-color;
        }
        
        /* Enhanced visual effects */
        .gradient-text {
          background-size: 200% auto;
          animation: gradientShift 3s ease-in-out infinite;
        }
        
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </section>
  );
};

export default Home1Category;