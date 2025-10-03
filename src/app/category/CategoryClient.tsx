"use client";

import React, { useState, useEffect } from 'react';
import { CategoryAPI } from '../api/category';
import { AuctionsAPI } from '../api/auctions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import app from '../../config';

interface Category {
  _id?: string;
  id?: number;
  name: string;
  item?: string;
  itemCount?: number;
  image?: string;
  thumb?: { url?: string } | null;
  car_type?: string;
  children?: Category[];
  parent?: string | null;
  level?: number;
}

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

export default function CategoryClient() {
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

  useEffect(() => {
    const categoryId = searchParams.get('category');
    const categoryName = searchParams.get('name');
    if (categoryId) {
      setSelectedCategory(categoryId);
      setSelectedCategoryName(decodeURIComponent(categoryName || ''));
      setViewMode('auctions');
    }
  }, [searchParams]);

  const getAllSubcategoryIds = (category: Category): string[] => {
    const categoryId = category._id || category.id?.toString() || '';
    let subcategoryIds = [categoryId];
    if (category.children && category.children.length > 0) {
      category.children.forEach(child => {
        subcategoryIds = [...subcategoryIds, ...getAllSubcategoryIds(child)];
      });
    }
    return subcategoryIds;
  };

  const findCategoryById = (categories: Category[], targetId: string): Category | null => {
    for (const category of categories) {
      const categoryId = category._id || category.id?.toString() || '';
      if (categoryId === targetId) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching categories from API...');
        const response = await CategoryAPI.getCategoryTree();
        console.log('📡 API Response:', response);
        
        let categoryData: Category[] | null = null;
        let isSuccess = false;
        
        if (response) {
          if ((response as any).success && Array.isArray((response as any).data)) {
            categoryData = (response as any).data;
            isSuccess = true;
            console.log('✅ Success: Found categories in response.data:', categoryData?.length || 0);
          } else if (Array.isArray(response as any)) {
            categoryData = response as any;
            isSuccess = true;
            console.log('✅ Success: Direct array response:', categoryData?.length || 0);
          } else if ((response as any).data && Array.isArray((response as any).data)) {
            categoryData = (response as any).data;
            isSuccess = true;
            console.log('✅ Success: Found categories in response.data (alternative):', categoryData?.length || 0);
          } else {
            console.log('❌ No valid category data found in response structure');
            console.log('Response structure:', {
              hasSuccess: 'success' in (response as any),
              hasData: 'data' in (response as any),
              isArray: Array.isArray(response),
              responseType: typeof response,
              responseKeys: response && typeof response === 'object' ? Object.keys(response) : []
            });
          }
        } else {
          console.log('❌ No response received from API');
        }
        
        if (isSuccess && categoryData && categoryData.length > 0) {
          console.log('🎉 Setting categories:', categoryData);
          setCategories(categoryData as Category[]);
          setError(false);
        } else {
          console.log('❌ No categories to display, throwing error');
          throw new Error('Invalid response structure or no categories found');
        }
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
        setCategories([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
          const selectedCategoryObj = findCategoryById(categories, selectedCategory);
          if (selectedCategoryObj) {
            const allCategoryIds = getAllSubcategoryIds(selectedCategoryObj);
            const categoryAuctions = response.filter(auction => {
              if (auction.productCategory && auction.productCategory._id) {
                return allCategoryIds.includes(auction.productCategory._id);
              }
              return false;
            });
            setAuctions(categoryAuctions);
            setFilteredAuctions(categoryAuctions);
          } else {
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
    if (categories.length > 0 && selectedCategory) {
      fetchAuctions();
    }
  }, [selectedCategory, categories]);

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

  const filteredCategories = categories.filter((category: Category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch;
  });

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

  const renderCategoryHierarchy = (categories: Category[], level = 0): JSX.Element[] => {
    return categories.map((category) => {
      const categoryId = category._id || category.id?.toString() || '';
      const hasSubcategories = hasChildren(category);
      const isExpanded = expandedCategories[categoryId];
      const isHovered = hoveredCategory === categoryId;

      return (
        <div key={categoryId} style={{ marginBottom: '8px' }}>
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
                ? '0 8px 25px rgba(59, 130, 246, 0.15)' 
                : '0 2px 8px rgba(0, 0, 0, 0.05)',
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            }}
            onMouseEnter={() => setHoveredCategory(categoryId)}
            onMouseLeave={() => setHoveredCategory(null)}
            onClick={() => {
              if (hasSubcategories) {
                toggleCategory(categoryId);
              }
            }}
          >
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
            {hasSubcategories && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isExpanded ? '#3b82f6' : '#f1f5f9',
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
            <img
              src={category.thumb ? `${app.route}${category.thumb.url}` : DEFAULT_CATEGORY_IMAGE}
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
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            />
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
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))';
                  e.currentTarget.style.color = '#3b82f6';
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
                  ? `${category.children!.length} subcategories • Click row to expand, name to browse all` 
                  : 'Click name or image to view auctions'
                }
              </p>
            </div>
          </div>
          {hasSubcategories && expandedCategories[categoryId] && (
            <div style={{
              marginTop: '8px',
              paddingLeft: '16px',
              borderLeft: level < 2 ? '2px solid #f1f5f9' : 'none',
              marginLeft: `${level * 24 + 16}px`,
            }}>
              {renderCategoryHierarchy(category.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderAuctionCard = (auction: Auction) => {
    return (
      <div
        key={auction._id}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        }}
        onClick={() => window.location.href = `/auction-details/${auction._id}`}
      >
        <div style={{
          height: '200px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <img
            src={auction.thumbs && auction.thumbs.length > 0 
              ? `${app.route}${auction.thumbs[0].url}` 
              : DEFAULT_AUCTION_IMAGE}
            alt={auction.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            crossOrigin="use-credentials"
          />
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
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
              background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} DA
            </p>
          </div>
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
                  ? `${app.route}${auction.owner.avatar.url}` 
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
          <button
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
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
              e.currentTarget.style.background = 'linear-gradient(90deg, #1d4ed8, #3b82f6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
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
          Categories will be available soon. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
        padding: '80px 0', 
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      }}>
      
      {/* Header Section */}
      <div className="container-responsive" style={{ marginBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #0063b1 0%, #00a3e0 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
            lineHeight: '1.2',
          }}>
            {viewMode === 'categories' ? 'Browse Categories' : selectedCategoryName}
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            {viewMode === 'categories' 
              ? 'Explore our wide range of auction categories and find exactly what you\'re looking for'
              : `Discover amazing auctions in the ${selectedCategoryName} category`
            }
          </p>
        </div>

        {/* Search Bar */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 40px',
          position: 'relative',
        }}>
          <input
            type="text"
            placeholder={viewMode === 'categories' ? 'Search categories...' : 'Search auctions...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px',
              paddingRight: '50px',
              fontSize: '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              background: 'white',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0063b1';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 99, 177, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
            }}
          />
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
        </div>

        {/* Back Button for Auctions View */}
        {viewMode === 'auctions' && (
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <button
              onClick={goBackToCategories}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                color: '#0063b1',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0, #cbd5e1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #e2e8f0)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Categories
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="container-responsive">
        {viewMode === 'categories' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}>
            {renderCategoryHierarchy(filteredCategories)}
          </div>
        ) : (
          <div>
            {auctionsLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '200px',
              }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  border: '3px solid rgba(0, 99, 177, 0.2)', 
                  borderTop: '3px solid #0063b1', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }} />
              </div>
            ) : filteredAuctions.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                maxWidth: '1400px',
                margin: '0 auto',
              }}>
                {filteredAuctions.map(renderAuctionCard)}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 99, 177, 0.1)',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>🔍</div>
                <h3 style={{ color: '#0063b1', marginBottom: '10px', fontSize: '20px', fontWeight: '600' }}>
                  No Auctions Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  {searchTerm ? 'No auctions match your search criteria.' : 'No auctions available in this category yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
      `}</style>
    </div>
  );
}


