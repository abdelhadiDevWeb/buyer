"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import Link from "next/link";
import { useMemo, useEffect, useState, useRef } from "react";
import { CategoryAPI } from "../../app/api/category";
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
  const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNTUlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ob3QgRm91bmQ8L3RleHQ+PC9zdmc+";

  // Helper function to get the correct image URL
  const getCategoryImageUrl = (category) => {
    console.log('🔍 Category Image Debug - Full Category Object:', category);
    console.log('🔧 Config Debug:', {
      appRoute: app.route,
      appBaseURL: app.baseURL,
      configType: typeof app
    });
    
    // Check all possible image properties in order of preference
    const possibleImageSources = [
      category.thumb?.url,
      category.thumb?.fullUrl,
      category.image,
      category.thumbnail,
      category.photo,
      category.picture,
      category.icon,
      category.logo
    ].filter(Boolean); // Remove null/undefined values
    
    console.log('🔍 Possible image sources found:', possibleImageSources);
    
    for (const imageUrl of possibleImageSources) {
      if (!imageUrl) continue;
      
      console.log('🔍 Processing image URL:', imageUrl);
      
      // Handle different URL formats
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        console.log('✅ Using full URL:', imageUrl);
        return imageUrl; // Already a full URL
      } 
      
      // Handle relative URLs - use the correct base URL construction
      let finalUrl;
      if (imageUrl.startsWith('/')) {
        // For URLs starting with /static/, use baseURL directly (don't add /static/ again)
        if (imageUrl.startsWith('/static/')) {
          finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
          console.log('🔍 URL starts with /static/, using baseURL + path (no double static):', finalUrl);
        } else {
          // For other URLs with leading slash, use baseURL + path
          finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
          console.log('🔍 URL with leading slash, using baseURL + path:', finalUrl);
        }
      } else {
        // For URLs without leading slash, use baseURL + path
        finalUrl = `${app.baseURL}${imageUrl}`;
        console.log('🔍 URL without leading slash, using baseURL + path:', finalUrl);
      }
      
      console.log('✅ Final constructed URL:', finalUrl);
      
      // Test if the URL is accessible
      testImageUrl(finalUrl).then(isAccessible => {
        if (isAccessible) {
          console.log('🎉 Image is accessible:', finalUrl);
        } else {
          console.log('❌ Image is NOT accessible:', finalUrl);
        }
      });
      
      return finalUrl;
    }
    
    console.log('⚠️ No image found in any property, using fallback');
    return PLACEHOLDER_IMAGE;
  };

  // Test image URL accessibility
  const testImageUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const isAccessible = response.ok;
      console.log(`🔍 Image URL test for ${url}:`, {
        status: response.status,
        ok: isAccessible,
        contentType: response.headers.get('content-type')
      });
      
      if (!isAccessible) {
        console.log(`❌ Image not accessible: ${url}`);
      }
      
      return isAccessible;
    } catch (error) {
      console.log(`❌ Image URL test failed for ${url}:`, error);
      return false;
    }
  };

  // Handle image load errors
  const handleImageError = (categoryId, category) => {
    console.log('❌ Image load error for category:', categoryId, category);
    
    // Test the URL that failed
    const failedUrl = getCategoryImageUrl(category);
    testImageUrl(failedUrl);
    
    // Try alternative URLs if the main one failed
    const alternativeUrls = generateAlternativeUrls(category);
    console.log('🔍 Trying alternative URLs:', alternativeUrls);
    
    // Test each alternative URL
    alternativeUrls.forEach(url => testImageUrl(url));
    
    setImageErrors(prev => ({
      ...prev,
      [categoryId]: true
    }));
  };

  // Generate alternative URLs for a category
  const generateAlternativeUrls = (category) => {
    const possibleImageSources = [
      category.thumb?.url,
      category.thumb?.fullUrl,
      category.image,
      category.thumbnail,
      category.photo,
      category.picture,
      category.icon,
      category.logo
    ].filter(Boolean);
    
    const alternativeUrls = [];
    
    possibleImageSources.forEach(imageUrl => {
      if (imageUrl && !imageUrl.startsWith('http')) {
        // Use the same logic as the main function
        if (imageUrl.startsWith('/')) {
          alternativeUrls.push(`${app.baseURL}${imageUrl.substring(1)}`);
        } else {
          alternativeUrls.push(`${app.baseURL}${imageUrl}`);
        }
        
        // Also try some alternative paths
        const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        alternativeUrls.push(`${app.baseURL}uploads/${cleanUrl}`);
        alternativeUrls.push(`${app.baseURL}images/${cleanUrl}`);
        alternativeUrls.push(`${app.baseURL}public/${cleanUrl}`);
        alternativeUrls.push(`${app.baseURL}assets/${cleanUrl}`);
      }
    });
    
    return [...new Set(alternativeUrls)]; // Remove duplicates
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
    // Debug config
    console.log('🔧 Config Debug:', {
      appRoute: app.route,
      appBaseURL: app.baseURL,
      configObject: app
    });
    
    // Test server connectivity and possible image paths
    const testServerPaths = async () => {
      const testPaths = [
        app.baseURL,
        `${app.baseURL}static/`,
        `${app.baseURL}uploads/`,
        `${app.baseURL}images/`,
        `${app.baseURL}public/`,
        `${app.baseURL}assets/`,
      ];
      
      console.log('🔍 Testing server paths:');
      for (const path of testPaths) {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          console.log(`✅ ${path} - Status: ${response.status}`);
        } catch (error) {
          console.log(`❌ ${path} - Error: ${error.message}`);
        }
      }
    };
    
    testServerPaths();
    
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching categories from API...');
        
        const response = await CategoryAPI.getCategoryTree();
        console.log('📡 API Response:', response);
        console.log('📡 API Response Structure:', {
          hasSuccess: 'success' in response,
          success: response?.success,
          hasData: 'data' in response,
          dataType: typeof response?.data,
          isArray: Array.isArray(response?.data),
          dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
          firstItem: Array.isArray(response?.data) && response.data.length > 0 ? response.data[0] : 'N/A'
        });
        
        // Handle different response structures
        let categoryDataResponse = null;
        
        // The API returns an array directly, not wrapped in success/data
        if (Array.isArray(response)) {
          categoryDataResponse = response;
          console.log('✅ Categories loaded from API (direct array):', categoryDataResponse.length);
        } else if (response?.success && Array.isArray(response.data)) {
          categoryDataResponse = response.data;
          console.log('✅ Categories loaded from API (wrapped):', categoryDataResponse.length);
        } else if (Array.isArray(response?.data)) {
          categoryDataResponse = response.data;
          console.log('✅ Categories loaded from API (nested):', categoryDataResponse.length);
        }
        
        if (categoryDataResponse && categoryDataResponse.length > 0) {
          console.log('🔍 First category structure:', categoryDataResponse[0]);
          console.log('🔍 First category thumb:', categoryDataResponse[0]?.thumb);
          console.log('🔍 First category image URL would be:', getCategoryImageUrl(categoryDataResponse[0]));
          
          // Debug all categories to see their image properties
          console.log('🔍 ALL CATEGORIES IMAGE DEBUG:');
          categoryDataResponse.forEach((category, index) => {
            console.log(`Category ${index + 1} (${category.name}):`, {
              thumb: category.thumb,
              image: category.image,
              thumbnail: category.thumbnail,
              photo: category.photo,
              picture: category.picture,
              icon: category.icon,
              logo: category.logo,
              allKeys: Object.keys(category)
            });
          });
          
          // Test the first few category image URLs
          const testPromises = categoryDataResponse.slice(0, 3).map(async (category, index) => {
            const url = getCategoryImageUrl(category);
            const isAccessible = await testImageUrl(url);
            console.log(`🔍 Category ${index + 1} (${category.name}) image accessibility:`, { url, isAccessible });
          });
          
          // Don't await - let it run in background
          Promise.all(testPromises).catch(console.error);
          
          setCategories(categoryDataResponse);
          setError(false);
          setErrorMessage('');
          console.log('✅ Categories set successfully');
        } else {
          throw new Error('No categories found in API response');
        }
        
      } catch (error) {
        console.error('❌ Error fetching categories from API:', error);
        console.log('🔄 No categories available from API');
        
        // Don't use static fallback data - show empty state instead
        setCategories([]);
        setError(true);
        setErrorMessage('No categories available at the moment');
      } finally {
        setLoading(false);
        console.log('🏁 Category loading completed');
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
                src={imageErrors[subcategory._id || subcategory.id] ? PLACEHOLDER_IMAGE : getCategoryImageUrl(subcategory)}
                alt={subcategory.name}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: level === 0 ? '10px' : '6px',
                  objectFit: 'cover',
                }}
                onError={() => handleImageError(subcategory._id || subcategory.id, subcategory)}
                onLoad={() => {
                  const imageUrl = getCategoryImageUrl(subcategory);
                  console.log('✅ ===== SUBCATEGORY IMAGE LOAD SUCCESS =====');
                  console.log('🎉 Successfully loaded:', imageUrl);
                  console.log('📋 Subcategory Info:', {
                    id: subcategory._id || subcategory.id,
                    name: subcategory.name
                  });
                  console.log('✅ ===== END SUBCATEGORY IMAGE LOAD SUCCESS =====');
                }}
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
    
    // Debug image error state
    console.log('🔍 Category render debug:', {
      id,
      name,
      hasImageError: imageErrors[id],
      imageErrorsState: imageErrors
    });

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
                  src={(() => {
                    const imageUrl = imageErrors[id] ? PLACEHOLDER_IMAGE : getCategoryImageUrl(category);
                    console.log(`🎯 Final image src for ${name}:`, imageUrl);
                    return imageUrl;
                  })()}
                  alt={name}
                  style={{
                    width: '90%',
                    height: '90%',
                    objectFit: 'cover',
                    borderRadius: '14px',
                    transition: 'all 0.4s ease',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  }}
                  onError={() => handleImageError(id, category)}
                  onLoad={() => {
                    const imageUrl = getCategoryImageUrl(category);
                    console.log('✅ ===== CATEGORY IMAGE LOAD SUCCESS =====');
                    console.log('🎉 Successfully loaded:', imageUrl);
                    console.log('📋 Category Info:', {
                      id: id,
                      name: name
                    });
                    console.log('✅ ===== END CATEGORY IMAGE LOAD SUCCESS =====');
                  }}
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
          📂 Aucune catégorie disponible
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          {errorMessage || 'Les catégories seront disponibles bientôt'}
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

      {/* Enhanced Responsive Categories Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 320px), 1fr))',
        gap: 'clamp(20px, 4vw, 32px)',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(16px, 3vw, 20px)',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        boxSizing: 'border-box',
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




