"use client";

import React, { useState, useEffect } from 'react';
import { CategoryAPI } from '../../api/category';
import { AuctionsAPI } from '../../api/auctions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import categoryData from '../../../data/category.json';
import app from '../../../config';

// Define Category type
interface Category {
  _id?: string;
  id?: number;
  name: string;
  type?: string;
  description?: string;
  item?: string;
  itemCount?: number;
  image?: string;
  thumb?: {
    _id: string;
    url: string;
    filename: string;
  } | null;
  attributes?: string[];
  car_type?: string;
  children?: string[];
  parent?: string | null;
  level?: number;
  path?: string[];
  fullPath?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define Auction type
interface Auction {
  _id: string;
  title: string;
  description?: string;
  currentPrice?: number;
  startingPrice?: number;
  endingAt?: string;
  thumbs?: Array<{ url: string }>;
  owner?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: { url: string };
  };
  productCategory?: {
    _id: string;
    name: string;
  };
}

export default function CategoryPage() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [auctionsLoading, setAuctionsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'auctions'>('categories');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const DEFAULT_CATEGORY_IMAGE = "/assets/images/logo-white.png";
  const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";

  // Get category from URL parameters
  useEffect(() => {
    const categoryId = searchParams.get('category');
    const categoryName = searchParams.get('name');
    
    if (categoryId) {
      setSelectedCategory(categoryId);
      setSelectedCategoryName(decodeURIComponent(categoryName || ''));
      setViewMode('auctions');
    }
  }, [searchParams]);

  // Helper function to get all subcategory IDs recursively
  const getAllSubcategoryIds = (category: Category): string[] => {
    const categoryId = category._id || category.id?.toString() || '';
    let subcategoryIds = [categoryId];
    
    if (category.children && category.children.length > 0) {
      // Since children is now string[], we just add them directly
      subcategoryIds = [...subcategoryIds, ...category.children];
    }
    
    return subcategoryIds;
  };

  // Helper function to find category by ID in the tree
  const findCategoryById = (categories: Category[], targetId: string): Category | null => {
    for (const category of categories) {
      const categoryId = category._id || category.id?.toString() || '';
      if (categoryId === targetId) {
        return category;
      }
      
      // Since children is now string[], we can't recursively search through them
      // This function will only find direct matches in the provided categories array
    }
    return null;
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await CategoryAPI.getCategoryTree();
        
        // Handle different response structures
        let categoryData = null;
        let isSuccess = false;
        
        if (response) {
          if (response.success && Array.isArray(response.data)) {
            categoryData = response.data;
            isSuccess = true;
          } else if (Array.isArray(response)) {
            categoryData = response;
            isSuccess = true;
          } else if (response.data && Array.isArray(response.data)) {
            categoryData = response.data;
            isSuccess = true;
          }
        }
        
        if (isSuccess && categoryData && categoryData.length > 0) {
          setCategories(categoryData);
          setError(false);
        } else {
          throw new Error('Invalid response structure');
        }
        
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch auctions when a category is selected - UPDATED to include subcategories
  useEffect(() => {
    const fetchAuctions = async () => {
      if (!selectedCategory) {
        setAuctions([]);
        setFilteredAuctions([]);
        return;
      }

      try {
        setAuctionsLoading(true);
        const response = await AuctionsAPI.getAuctions();
        
        if (response && Array.isArray(response)) {
          // Find the selected category in the tree
          const selectedCategoryObj = findCategoryById(categories, selectedCategory);
          
          if (selectedCategoryObj) {
            // Get all subcategory IDs (including the parent category itself)
            const allCategoryIds = getAllSubcategoryIds(selectedCategoryObj);
            
            console.log('Selected category:', selectedCategory);
            console.log('All category IDs to filter by:', allCategoryIds);
            
            // Filter auctions by selected category and all its subcategories
            const categoryAuctions = response.filter(auction => {
              if (auction.productCategory && auction.productCategory._id) {
                return allCategoryIds.includes(auction.productCategory._id);
              }
              return false;
            });
            
            console.log('Filtered auctions:', categoryAuctions.length);
            setAuctions(categoryAuctions);
            setFilteredAuctions(categoryAuctions);
          } else {
            // Fallback to original behavior if category not found in tree
            const categoryAuctions = response.filter(auction => 
              auction.productCategory && auction.productCategory._id === selectedCategory
            );
            setAuctions(categoryAuctions);
            setFilteredAuctions(categoryAuctions);
          }
        } else {
          setAuctions([]);
          setFilteredAuctions([]);
        }
      } catch (error) {
        console.error("Error fetching auctions:", error);
        setAuctions([]);
        setFilteredAuctions([]);
      } finally {
        setAuctionsLoading(false);
      }
    };

    // Only fetch auctions if categories are loaded
    if (categories.length > 0 && selectedCategory) {
      fetchAuctions();
    }
  }, [selectedCategory, categories]);

  // Helper functions
  const hasChildren = (category: Category) => {
    return category.children && category.children.length > 0;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const selectCategory = (category: Category) => {
    const categoryId = category._id || category.id?.toString() || '';
    setSelectedCategory(categoryId);
    setSelectedCategoryName(category.name);
    setViewMode('auctions');
  };

  const goBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSelectedCategoryName('');
    setAuctions([]);
    setFilteredAuctions([]);
  };

  // Filter categories based on search term and active filter
  const filteredCategories = categories.filter((category: Category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeFilter === 'all') return matchesSearch;
    // Add more filters as needed based on your category properties
    return matchesSearch;
  });

  // Filter auctions based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAuctions(auctions);
    } else {
      const filtered = auctions.filter(auction =>
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (auction.description && auction.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredAuctions(filtered);
    }
  }, [auctions, searchTerm]);

  // Render hierarchical category tree
  const renderCategoryHierarchy = (categories: Category[], level = 0): JSX.Element[] => {
    return categories.map((category) => {
      const categoryId = category._id || category.id?.toString() || '';
      const hasSubcategories = hasChildren(category);
      const isExpanded = expandedCategories[categoryId];
      const isHovered = hoveredCategory === categoryId;

      return (
        <div key={categoryId} style={{ marginBottom: '8px' }}>
          {/* Category Item */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              marginLeft: `${level * 24}px`,
              background: level === 0 
                ? 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' 
                : 'rgba(255, 255, 255, 0.8)',
              borderRadius: '16px',
              border: level === 0 ? '2px solid #e2e8f0' : '1px solid #f1f5f9',
              transition: 'all 0.3s ease',
              cursor: hasSubcategories ? 'pointer' : 'default',
              position: 'relative',
              boxShadow: isHovered 
                ? '0 8px 25px rgba(99, 102, 241, 0.15)' 
                : '0 2px 8px rgba(0, 0, 0, 0.05)',
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            }}
            onMouseEnter={() => setHoveredCategory(categoryId)}
            onMouseLeave={() => setHoveredCategory(null)}
            onClick={() => {
              // Only handle expansion for categories with subcategories
              if (hasSubcategories) {
                toggleCategory(categoryId);
              }
              // For leaf categories, user should click name/image for navigation
            }}
          >
            {/* Level Indicator */}
            {level > 0 && (
              <div style={{
                position: 'absolute',
                left: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '1px',
                background: '#cbd5e1',
              }} />
            )}
            
            {/* Expand/Collapse Icon */}
            {hasSubcategories && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                  background: isExpanded ? '#0063b1' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                transition: 'all 0.3s ease',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}>
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill={isExpanded ? 'white' : '#64748b'}
                >
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </div>
            )}

            {/* Category Image - Clickable for filter selection */}
            <img
              src={category.thumb ? `${app.imageBaseURL}${category.thumb.url}` : DEFAULT_CATEGORY_IMAGE}
              alt={category.name}
              style={{
                width: level === 0 ? '48px' : '40px',
                height: level === 0 ? '48px' : '40px',
                borderRadius: '12px',
                objectFit: 'cover',
                marginRight: '16px',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              crossOrigin="use-credentials"
              onClick={(e) => {
                e.stopPropagation();
                selectCategory(category);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            />

            {/* Category Info */}
            <div style={{ flex: 1 }}>
              <h4 
                style={{
                  fontSize: level === 0 ? '18px' : '16px',
                  fontWeight: level === 0 ? '700' : '600',
                  color: '#1e293b',
                  margin: '0 0 4px 0',
                  lineHeight: '1.3',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  display: 'inline-block',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectCategory(category);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 99, 177, 0.1), rgba(0, 163, 224, 0.1))';
                  e.currentTarget.style.color = '#0063b1';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#1e293b';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {category.name}
              </h4>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
              }}>
                {hasSubcategories 
                  ? `${category.children!.length} subcategories • Click row to expand` 
                  : 'Click to view auctions'
                }
              </p>
            </div>

            {/* Subcategory Count Badge */}
            {hasSubcategories && (
              <span style={{
                background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 12px',
                borderRadius: '12px',
                marginLeft: '12px',
              }}>
                {category.children!.length}
              </span>
            )}

            {/* Action Arrow */}
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="#94a3b8"
              style={{ marginLeft: '12px' }}
            >
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>

          {/* Recursive Subcategories */}
          {hasSubcategories && isExpanded && (
            <div style={{
              marginTop: '8px',
              paddingLeft: '16px',
              borderLeft: level < 2 ? '2px solid #f1f5f9' : 'none',
              marginLeft: `${level * 24 + 16}px`,
            }}>
              {/* Since children is now string[], we can't render them recursively */}
              {/* This would need to be implemented differently if subcategories are needed */}
            </div>
          )}
        </div>
      );
    });
  };

  // Render auction card
  const renderAuctionCard = (auction: Auction) => {
    return (
      <div
        key={auction._id}
        style={{
          background: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
        }}
        onClick={() => window.location.href = `/auction-details/${auction._id}`}
      >
        {/* Auction Image */}
        <div style={{
          height: '200px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <img
            src={auction.thumbs && auction.thumbs.length > 0 
              ? `${app.imageBaseURL}${auction.thumbs[0].url}` 
              : DEFAULT_AUCTION_IMAGE}
            alt={auction.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            crossOrigin="use-credentials"
          />
          
          {/* Live Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#fff',
              animation: 'pulse 2s ease-in-out infinite',
            }}></div>
            Live
          </div>

          {/* Category Badge - NEW */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}>
            {auction.productCategory?.name}
          </div>
        </div>

        {/* Auction Content */}
        <div style={{ padding: '20px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px',
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {auction.title}
          </h3>

          {/* Price */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #e2e8f0',
          }}>
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              margin: '0 0 4px 0',
              fontWeight: '500',
            }}>
              Current Bid
            </p>
            <p style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
              background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} DA
            </p>
          </div>

          {/* Owner Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <img
                src={auction.owner?.avatar?.url 
                  ? `${app.imageBaseURL}${auction.owner.avatar.url}` 
                  : '/assets/images/avatar.jpg'}
                alt="Owner"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                crossOrigin="use-credentials"
              />
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
                fontWeight: '500',
              }}>
                {auction.owner?.firstName && auction.owner?.lastName
                  ? `${auction.owner.firstName} ${auction.owner.lastName}`
                  : auction.owner?.name || 'Anonymous'}
              </p>
            </div>
          </div>

          {/* Bid Button */}
          <button
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #00a3e0, #0063b1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
Place Bid
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
        padding: '80px 0', 
        minHeight: '100vh',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
          {/* Page Header */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.2',
            }}>
              {viewMode === 'categories' 
                ? 'Browse Categories' 
                : `${selectedCategoryName} Auctions`
              }
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto 40px auto',
              lineHeight: '1.6',
            }}>
              {viewMode === 'categories' 
                ? 'Explore our diverse categories to find exactly what you\'re looking for'
                : `Discover amazing auctions in ${selectedCategoryName}`
              }
            </p>
            
            {/* Back Button for Auction View */}
            {viewMode === 'auctions' && (
              <button
                onClick={goBackToCategories}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                   color: '#0063b1',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginBottom: '30px',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0063b1';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.color = '#0063b1';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
Back to Categories
              </button>
            )}
            
            {/* Search Bar */}
            <div style={{ 
              maxWidth: '600px',
              margin: '0 auto',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '8px',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder={viewMode === 'categories' 
                    ? 'Search categories...' 
                    : 'Search auctions...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 20px',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    background: 'transparent',
                  }}
                />
                <svg 
                  style={{ 
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#0063b1',
                    pointerEvents: 'none'
                  }}
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Results Summary for Auction View */}
            {viewMode === 'auctions' && !auctionsLoading && (
              <div style={{
                marginTop: '20px',
                padding: '12px 20px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                maxWidth: '400px',
                margin: '20px auto 0 auto',
              }}>
                <p style={{
                  fontSize: '14px',
                   color: '#0063b1',
                  margin: 0,
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  Found {filteredAuctions.length} auctions in {selectedCategoryName}
                </p>
              </div>
            )}
          </div>
          
          {/* Loading State */}
          {(loading || auctionsLoading) ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div 
                style={{
                  display: 'inline-block',
                  width: '50px',
                  height: '50px',
                  border: '3px solid rgba(99, 102, 241, 0.2)',
                    borderTop: '3px solid #0063b1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '20px'
                }}
              ></div>
                <p style={{ fontSize: '16px', fontWeight: '500', color: '#0063b1' }}>
                {loading ? 'Loading categories...' : 'Loading auctions...'}
              </p>
            </div>
          ) : (
            <>
              {/* Categories View */}
              {viewMode === 'categories' && (
                <div>
                  {filteredCategories.length > 0 ? (
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                      {renderCategoryHierarchy(filteredCategories)}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '60px 40px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '20px',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      maxWidth: '600px',
                      margin: '0 auto'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>📂</div>
                      <h3 style={{ marginBottom: '15px', color: '#0063b1', fontSize: '24px', fontWeight: '700' }}>
No categories found
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '16px' }}>
Try adjusting your search terms or filters
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Auctions View */}
              {viewMode === 'auctions' && (
                <div>
                  {filteredAuctions.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '24px',
                      maxWidth: '1400px',
                      margin: '0 auto',
                    }}>
                      {filteredAuctions.map(auction => renderAuctionCard(auction))}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '60px 40px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '20px',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      maxWidth: '600px',
                      margin: '0 auto'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>🏷️</div>
                      <h3 style={{ marginBottom: '15px', color: '#0063b1', fontSize: '24px', fontWeight: '700' }}>
No auctions found
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '16px' }}>
No active auctions in this category at the moment
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '30px',
                  fontSize: '15px',
                  color: '#ef4444',
                  textAlign: 'center',
                  maxWidth: '600px',
                  margin: '30px auto 0 auto'
                }}>
                  Unable to load categories. Please try again later.
                </div>
              )}
            </>
          )}
          
          {/* Back to Home Button */}
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <Link href="/">
              <button style={{
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                   color: '#0063b1',
                background: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                textDecoration: 'none',
              }}
              onMouseOver={(e) => {
                    e.currentTarget.style.background = '#0063b1';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.color = '#0063b1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Home
              </button>
            </Link>
          </div>
        </div>
        
        {/* Global Styles */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
  );
}