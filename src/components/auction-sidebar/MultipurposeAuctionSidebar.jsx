"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import SelectComponent from '../common/SelectComponent'
import { AuctionsAPI } from '@/app/api/auctions'
import { CategoryAPI } from '@/app/api/category'
import { SubCategoryAPI } from '@/app/api/subcategory'
import app from '@/config'; // Import the app config
import { useTranslation } from 'react-i18next';

// Define BID_TYPE enum to match server definition
const BID_TYPE = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE'
};

// Default image constants
const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";
const DEFAULT_CATEGORY_IMAGE = "/assets/images/default-category.png";

const MultipurposeAuctionSidebar = () => {
    const { t } = useTranslation();
    const router = useRouter();

    const [activeColumn, setActiveColumn] = useState(3);
    const [currentPage, setCurrentPage] = useState(1);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedBidType, setSelectedBidType] = useState(""); // "" for all, "PRODUCT", or "SERVICE"
    const [auctionTimers, setAuctionTimers] = useState({});
    const [filteredAuctions, setFilteredAuctions] = useState([]);
    const [sortOption, setSortOption] = useState(t('auctionSidebar.defaultSort'));
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [hoveredSubCategory, setHoveredSubCategory] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    
    // Pagination constants
    const ITEMS_PER_PAGE = 9;
    const totalPages = Math.ceil(filteredAuctions.length / ITEMS_PER_PAGE);
    const paginatedAuctions = filteredAuctions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Helper function to find all descendant category IDs
    const getAllDescendantCategoryIds = (categoryId, categoriesTree) => {
        const descendants = [];
        
        const findDescendants = (categories) => {
            categories.forEach(category => {
                if (category._id === categoryId || category.id === categoryId) {
                    // Found the target category, collect all its descendants
                    const collectAllChildren = (cat) => {
                        if (cat.children && cat.children.length > 0) {
                            cat.children.forEach(child => {
                                descendants.push(child._id || child.id);
                                collectAllChildren(child);
                            });
                        }
                    };
                    collectAllChildren(category);
                } else if (category.children && category.children.length > 0) {
                    // Continue searching in children
                    findDescendants(category.children);
                }
            });
        };
        
        findDescendants(categoriesTree);
        return descendants;
    };

    // Helper function to check if an auction belongs to a category or its descendants
    const doesAuctionBelongToCategory = (auction, selectedCategoryId, categoriesTree) => {
        if (!auction.productCategory || !selectedCategoryId) return false;
        
        const auctionCategoryId = auction.productCategory._id || auction.productCategory;
        
        // Direct match
        if (auctionCategoryId === selectedCategoryId) return true;
        
        // Check if auction category is a descendant of selected category
        const allDescendants = getAllDescendantCategoryIds(selectedCategoryId, categoriesTree);
        return allDescendants.includes(auctionCategoryId);
    };

    // Helper function to check if category has children
    const hasChildren = (category) => {
        return category.children && category.children.length > 0;
    };

    // Toggle category expansion
    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    // Render hierarchical category tree
    const renderCategoryHierarchy = (categories, level = 0) => {
        return categories.map((category) => {
            const categoryId = category._id || category.id;
            const hasSubcategories = hasChildren(category);
            const isExpanded = expandedCategories[categoryId];
            const isSelected = selectedCategory === categoryId;

            return (
                <div key={categoryId} style={{ marginBottom: '8px' }}>
                    {/* Category Item */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            marginLeft: `${level * 20}px`,
                            background: level === 0 
                                ? 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' 
                                : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '12px',
                            border: level === 0 ? '2px solid #e2e8f0' : '1px solid #f1f5f9',
                            transition: 'all 0.3s ease',
                            cursor: hasSubcategories ? 'pointer' : 'default',
                            position: 'relative',
                            ...(isSelected && {
                                borderColor: '#0063b1',
                                backgroundColor: 'rgba(0, 99, 177, 0.05)',
                                boxShadow: '0 4px 12px rgba(0, 99, 177, 0.15)',
                            }),
                        }}
                        onClick={() => {
                            // Row click only handles expansion for categories with subcategories
                            if (hasSubcategories) {
                                toggleCategory(categoryId);
                            }
                            // For leaf categories, user should click name/image for selection
                        }}
                        onMouseEnter={() => setHoveredCategory(categoryId)}
                        onMouseLeave={() => setHoveredCategory(null)}
                    >
                        {/* Level Indicator */}
                        {level > 0 && (
                            <div style={{
                                position: 'absolute',
                                left: '-10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '20px',
                                height: '1px',
                                background: '#cbd5e1',
                            }} />
                        )}
                        
                        {/* Expand/Collapse Icon */}
                        {hasSubcategories && (
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: isExpanded ? '#0063b1' : '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                transition: 'all 0.3s ease',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}>
                                <svg 
                                    width="12" 
                                    height="12" 
                                    viewBox="0 0 24 24" 
                                    fill={isExpanded ? 'white' : '#64748b'}
                                >
                                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                                </svg>
                            </div>
                        )}

                        {/* Category Image - Clickable for filter selection */}
                        <img
                            src={category.thumb ? `${app.route}${category.thumb.url}` : DEFAULT_CATEGORY_IMAGE}
                            alt={category.name}
                            style={{
                                width: level === 0 ? '40px' : '32px',
                                height: level === 0 ? '40px' : '32px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                marginRight: '12px',
                                border: '2px solid white',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/assets/images/logo-white.png";
                            }}
                            crossOrigin="use-credentials"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryChange(categoryId);
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.3)';
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
                                    fontSize: level === 0 ? '16px' : '14px',
                                    fontWeight: level === 0 ? '700' : '600',
                                    color: isSelected ? '#0063b1' : '#1e293b',
                                    margin: '0 0 2px 0',
                                    lineHeight: '1.3',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    transition: 'all 0.3s ease',
                                    display: 'inline-block',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCategoryChange(categoryId);
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 99, 177, 0.1), rgba(0, 163, 224, 0.1))';
                                    e.currentTarget.style.color = '#0063b1';
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = isSelected ? '#0063b1' : '#1e293b';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                            >
                                {category.name}
                            </h4>
                            <p style={{
                                fontSize: '12px',
                                color: '#64748b',
                                margin: 0,
                            }}>
                                {hasSubcategories 
                                    ? `${category.children.length} subcategories • Click row to expand, name to filter` 
                                    : 'Click name or image to filter auctions'
                                }
                            </p>
                        </div>

                        {/* Subcategory Count Badge */}
                        {hasSubcategories && (
                            <span style={{
                                background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: '600',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                marginLeft: '8px',
                            }}>
                                {category.children.length}
                            </span>
                        )}

                        {/* Selection Indicator */}
                        {isSelected && (
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#0063b1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: '8px',
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Recursive Subcategories */}
                    {hasSubcategories && isExpanded && (
                        <div style={{
                            marginTop: '8px',
                            paddingLeft: '16px',
                            borderLeft: level < 2 ? '2px solid #f1f5f9' : 'none',
                            marginLeft: `${level * 20 + 8}px`,
                        }}>
                            {renderCategoryHierarchy(category.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    // Parse URL parameters on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const categoryParam = urlParams.get('category');
            const subCategoryParam = urlParams.get('subcategory');
            const bidTypeParam = urlParams.get('bidType');
            const searchParam = urlParams.get('search');

            if (categoryParam) setSelectedCategory(categoryParam);
            if (subCategoryParam) setSelectedSubCategory(subCategoryParam);
            if (bidTypeParam) setSelectedBidType(bidTypeParam);
            if (searchParam) setSearchTerm(searchParam);
        }
    }, []);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                setLoading(true);
                // Ensure this API call fetches bids/auctions with populated owner and avatar
                // This call should hit your backend endpoint that uses the updated bid.service.ts
                const data = await AuctionsAPI.getAuctions();
                setAuctions(data);
                // Initial filtering for display, the useEffect below will refine it
                setFilteredAuctions(data);

                // Initialize countdown timers for each auction
                const timers = {};
                data.forEach(auction => {
                    if (auction._id) {
                        const endTime = auction.endingAt || "2024-10-23 12:00:00";
                        const currentTime = new Date();
                        const timeDifference = new Date(endTime) - currentTime;

                        if (timeDifference > 0) {
                            timers[auction._id] = calculateTimeRemaining(endTime);
                        } else {
                            timers[auction._id] = { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: true }; // Mark as ended
                        }
                    }
                });
                setAuctionTimers(timers);

                // Update timers every second
                const interval = setInterval(() => {
                    const updatedTimers = {};
                    data.forEach(auction => {
                        if (auction._id) {
                            const endTime = auction.endingAt || "2024-10-23 12:00:00";
                            updatedTimers[auction._id] = calculateTimeRemaining(endTime);
                        }
                    });
                    setAuctionTimers(updatedTimers);
                }, 1000);

                setLoading(false);

                return () => clearInterval(interval);
            } catch (err) {
                console.error("Error fetching auctions:", err);
                setError("Failed to load auctions");
                setLoading(false);
            }
        };

        fetchAuctions();
    }, []);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
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
                    // Filter categories by selected bid type
                    if (selectedBidType) {
                        const filtered = categoryData.filter(category => category.type === selectedBidType);
                        setFilteredCategories(filtered);
                    } else {
                        setFilteredCategories(categoryData);
                    }
                }
                setCategoriesLoading(false);
            } catch (err) {
                console.error("Error fetching categories:", err);
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, [selectedBidType]);

    // Fetch subcategories when a category is selected
    useEffect(() => {
        const fetchSubCategories = async () => {
            if (!selectedCategory) {
                setSubCategories([]);
                return;
            }

            try {
                setSubCategoriesLoading(true);
                const data = await SubCategoryAPI.getSubCategories(selectedCategory);
                if (data && Array.isArray(data)) {
                    setSubCategories(data);
                }
                setSubCategoriesLoading(false);
            } catch (err) {
                console.error("Error fetching subcategories:", err);
                setSubCategoriesLoading(false);
            }
        };

        fetchSubCategories();
    }, [selectedCategory]);

    // useEffect to handle filtering and sorting
    useEffect(() => {
        if (auctions.length === 0) return;

        let result = [...auctions];

        // Do NOT filter out auctions that have already ended.
        // Instead, their 'hasEnded' flag will be used for styling and click prevention.

        // 1. Apply bidType filter if selected
        if (selectedBidType) {
            result = result.filter(auction =>
                auction.bidType && auction.bidType === selectedBidType
            );
        }

        // 2. Apply category filter if selected (with hierarchical support)
        if (selectedCategory) {
            result = result.filter(auction =>
                doesAuctionBelongToCategory(auction, selectedCategory, categories)
            );
        }

        // 3. Apply subcategory filter if selected
        if (selectedSubCategory) {
            result = result.filter(auction =>
                auction.productSubCategory && auction.productSubCategory._id === selectedSubCategory
            );
        }

        // 4. Apply search term filter
        if (searchTerm.trim() !== "") {
            const searchLower = searchTerm.toLowerCase().trim();
            result = result.filter(auction =>
                (auction.title && auction.title.toLowerCase().includes(searchLower)) ||
                (auction.description && auction.description.toLowerCase().includes(searchLower))
            );
        }

        // 5. Apply sorting
        if (sortOption === t('auctionSidebar.priceAsc')) {
            result.sort((a, b) =>
                (a.currentPrice || a.startingPrice || 0) - (b.currentPrice || b.startingPrice || 0)
            );
        } else if (sortOption === t('auctionSidebar.priceDesc')) {
            result.sort((a, b) =>
                (b.currentPrice || b.startingPrice || 0) - (a.currentPrice || a.startingPrice || 0)
            );
        }
        
        setCurrentPage(1); // Reset to first page on any filter change
        setFilteredAuctions(result);
    }, [auctions, selectedCategory, selectedSubCategory, selectedBidType, searchTerm, sortOption, categories]);

    // Function to calculate time remaining
    function calculateTimeRemaining(endTime) {
        const currentTime = new Date();
        const timeDifference = new Date(endTime) - currentTime;

        if (timeDifference <= 0) {
            return {
                days: "00",
                hours: "00",
                minutes: "00",
                seconds: "00",
                hasEnded: true, // Add a flag to indicate if the auction has ended
            };
        }

        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        return {
            days: days.toString().padStart(2, "0"),
            hours: hours.toString().padStart(2, "0"),
            minutes: minutes.toString().padStart(2, "0"),
            seconds: seconds.toString().padStart(2, "0"),
            hasEnded: false,
        };
    }

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle category selection
    const handleCategoryChange = (categoryId) => {
        const newCategoryId = categoryId === selectedCategory ? "" : categoryId;
        setSelectedCategory(newCategoryId);
        // Clear subcategory when category changes
        setSelectedSubCategory("");
    };

    // Handle clear category filter
    const handleClearCategoryFilter = () => {
        // Clear URL parameters first
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.delete('category');
            url.searchParams.delete('subcategory');
            window.history.replaceState({}, '', url);
        }
        
        // Clear states
        setSelectedCategory("");
        setSelectedSubCategory("");
        setExpandedCategories({});
    };

    // Handle subcategory selection
    const handleSubCategoryChange = (subCategoryId) => {
        setSelectedSubCategory(subCategoryId === selectedSubCategory ? "" : subCategoryId);
    };

    // Handle bidType selection
    const handleBidTypeChange = (bidType) => {
        const newBidType = bidType === selectedBidType ? "" : bidType;
        setSelectedBidType(newBidType);
        // Clear category and subcategory when bid type changes
        setSelectedCategory("");
        setSelectedSubCategory("");
    };

    const handleSortChange = (option) => {
        setSortOption(option);
    };

    const sortOptions = [
        t('auctionSidebar.defaultSort'),
        t('auctionSidebar.priceAsc'),
        t('auctionSidebar.priceDesc'),
    ];

    const handleColumnClick = (columnNumber) => {
        setActiveColumn(columnNumber);
    };

    // Handle auction card click
    const handleAuctionCardClick = (auctionId) => {
        router.push(`/auction-details/${auctionId}`);
    };

    return (
        <div className="auction-grid-section pt-10 mb-110">
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hero-section {
                    animation: slideIn 0.8s ease-out;
                }
                .filter-card {
                    animation: slideIn 0.8s ease-out 0.2s both;
                }
                .auction-card {
                    animation: slideIn 0.8s ease-out 0.4s both;
                }
            `}</style>
            <div className="container">
                {/* Hero Bid Type Selection */}
                <div className="hero-section" style={{
                    background: 'white',
                    borderRadius: '30px',
                    padding: '80px 40px',
                    marginBottom: '50px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)',
                    border: '2px solid rgba(0, 99, 177, 0.1)',
                }}>
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        opacity: 0.3,
                    }}></div>
                    
                    <div className="row">
                        <div className="col-12 text-center">
                            <h1 style={{
                                fontSize: '48px',
                                fontWeight: '800',
                                color: '#0063b1',
                                marginBottom: '20px',
                                textShadow: 'none',
                                lineHeight: '1.2'
                            }}>
                                {t('auctionSidebar.discoverAuctions')}
                            </h1>
                            <p style={{
                                fontSize: '20px',
                                color: '#666',
                                marginBottom: '60px',
                                fontWeight: '400',
                                maxWidth: '600px',
                                margin: '0 auto 60px auto'
                            }}>
                                {t('auctionSidebar.chooseDescription')}
                            </p>
                            
                            {/* Large Bid Type Cards */}
                            <div className="row justify-content-center">
                                <div className="col-lg-10">
                                    <div style={{
                                        display: 'flex',
                                        gap: '40px',
                                        justifyContent: 'center',
                                        flexWrap: 'wrap'
                                    }}>
                                        {/* Products Card */}
                                        <div
                                            onClick={() => handleBidTypeChange(BID_TYPE.PRODUCT)}
                                            style={{
                                                background: selectedBidType === BID_TYPE.PRODUCT 
                                                    ? 'linear-gradient(135deg, #0063b1, #00a3e0)' 
                                                    : 'rgba(248, 249, 250, 0.9)',
                                                backdropFilter: 'blur(20px)',
                                                borderRadius: '25px',
                                                padding: '50px 40px',
                                                cursor: 'pointer',
                                                transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                border: selectedBidType === BID_TYPE.PRODUCT 
                                                    ? '3px solid rgba(0, 99, 177, 0.3)' 
                                                    : '2px solid rgba(0, 99, 177, 0.1)',
                                                minWidth: '280px',
                                                maxWidth: '320px',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                boxShadow: selectedBidType === BID_TYPE.PRODUCT 
                                                    ? '0 30px 60px rgba(0, 99, 177, 0.3)' 
                                                    : '0 15px 35px rgba(0, 0, 0, 0.1)',
                                                transform: selectedBidType === BID_TYPE.PRODUCT ? 'scale(1.05)' : 'scale(1)',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedBidType !== BID_TYPE.PRODUCT) {
                                                    e.currentTarget.style.transform = 'scale(1.02) translateY(-10px)';
                                                    e.currentTarget.style.background = 'rgba(0, 99, 177, 0.1)';
                                                    e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 99, 177, 0.2)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedBidType !== BID_TYPE.PRODUCT) {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                                    e.currentTarget.style.background = 'rgba(248, 249, 250, 0.9)';
                                                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            {/* Glow effect for selected */}
                                            {selectedBidType === BID_TYPE.PRODUCT && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-50%',
                                                    left: '-50%',
                                                    width: '200%',
                                                    height: '200%',
                                                    background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                                                    animation: 'pulse 2s ease-in-out infinite',
                                                    pointerEvents: 'none'
                                                }} />
                                            )}
                                            
                                            <div style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '50%',
                                                background: selectedBidType === BID_TYPE.PRODUCT 
                                                    ? 'linear-gradient(135deg, #0063b1, #00a3e0)' 
                                                    : 'rgba(255, 255, 255, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 30px auto',
                                                boxShadow: selectedBidType === BID_TYPE.PRODUCT 
                                                    ? '0 15px 30px rgba(0, 99, 177, 0.4)' 
                                                    : '0 10px 20px rgba(255, 255, 255, 0.2)',
                                                transition: 'all 0.4s ease',
                                            }}>
                                                <i className="bx bx-package" style={{ 
                                                    fontSize: '50px',
                                                    color: selectedBidType === BID_TYPE.PRODUCT ? 'white' : '#0063b1'
                                                }}></i>
                                            </div>
                                            
                                            <h3 style={{
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                color: selectedBidType === BID_TYPE.PRODUCT ? 'white' : '#0063b1',
                                                marginBottom: '15px',
                                                transition: 'color 0.3s ease'
                                            }}>
                                                Produits
                                            </h3>
                                            
                                            <p style={{
                                                fontSize: '16px',
                                                color: selectedBidType === BID_TYPE.PRODUCT ? 'rgba(255, 255, 255, 0.9)' : '#666',
                                                lineHeight: '1.5',
                                                margin: 0,
                                                transition: 'color 0.3s ease'
                                            }}>
                                                Découvrez une large gamme de produits uniques aux enchères
                                            </p>
                                            
                                            {selectedBidType === BID_TYPE.PRODUCT && (
                                                <div style={{
                                                    width: '60px',
                                                    height: '4px',
                                                    background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
                                                    borderRadius: '2px',
                                                    margin: '20px auto 0 auto',
                                                    transition: 'all 0.3s ease',
                                                }} />
                                            )}
                                        </div>

                                        {/* Services Card */}
                                        <div
                                            onClick={() => handleBidTypeChange(BID_TYPE.SERVICE)}
                                            style={{
                                                background: selectedBidType === BID_TYPE.SERVICE 
                                                    ? 'linear-gradient(135deg, #0063b1, #00a3e0)' 
                                                    : 'rgba(248, 249, 250, 0.9)',
                                                backdropFilter: 'blur(20px)',
                                                borderRadius: '25px',
                                                padding: '50px 40px',
                                                cursor: 'pointer',
                                                transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                border: selectedBidType === BID_TYPE.SERVICE 
                                                    ? '3px solid rgba(0, 99, 177, 0.3)' 
                                                    : '2px solid rgba(0, 99, 177, 0.1)',
                                                minWidth: '280px',
                                                maxWidth: '320px',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                boxShadow: selectedBidType === BID_TYPE.SERVICE 
                                                    ? '0 30px 60px rgba(0, 99, 177, 0.3)' 
                                                    : '0 15px 35px rgba(0, 0, 0, 0.1)',
                                                transform: selectedBidType === BID_TYPE.SERVICE ? 'scale(1.05)' : 'scale(1)',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedBidType !== BID_TYPE.SERVICE) {
                                                    e.currentTarget.style.transform = 'scale(1.02) translateY(-10px)';
                                                    e.currentTarget.style.background = 'rgba(0, 99, 177, 0.1)';
                                                    e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 99, 177, 0.2)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedBidType !== BID_TYPE.SERVICE) {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                                    e.currentTarget.style.background = 'rgba(248, 249, 250, 0.9)';
                                                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            {/* Glow effect for selected */}
                                            {selectedBidType === BID_TYPE.SERVICE && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-50%',
                                                    left: '-50%',
                                                    width: '200%',
                                                    height: '200%',
                                                    background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                                                    animation: 'pulse 2s ease-in-out infinite',
                                                    pointerEvents: 'none'
                                                }} />
                                            )}
                                            
                                            <div style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '50%',
                                                background: selectedBidType === BID_TYPE.SERVICE 
                                                    ? 'linear-gradient(135deg, #0063b1, #00a3e0)' 
                                                    : 'rgba(255, 255, 255, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 30px auto',
                                                boxShadow: selectedBidType === BID_TYPE.SERVICE 
                                                    ? '0 15px 30px rgba(0, 99, 177, 0.4)' 
                                                    : '0 10px 20px rgba(255, 255, 255, 0.2)',
                                                transition: 'all 0.4s ease',
                                            }}>
                                                <i className="bx bx-cog" style={{ 
                                                    fontSize: '50px',
                                                    color: selectedBidType === BID_TYPE.SERVICE ? 'white' : '#0063b1'
                                                }}></i>
                                            </div>
                                            
                                            <h3 style={{
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                color: selectedBidType === BID_TYPE.SERVICE ? 'white' : '#0063b1',
                                                marginBottom: '15px',
                                                transition: 'color 0.3s ease'
                                            }}>
                                                Services
                                            </h3>
                                            
                                            <p style={{
                                                fontSize: '16px',
                                                color: selectedBidType === BID_TYPE.SERVICE ? 'rgba(255, 255, 255, 0.9)' : '#666',
                                                lineHeight: '1.5',
                                                margin: 0,
                                                transition: 'color 0.3s ease'
                                            }}>
                                                Accédez à des services professionnels de qualité
                                            </p>
                                            
                                            {selectedBidType === BID_TYPE.SERVICE && (
                                                <div style={{
                                                    width: '60px',
                                                    height: '4px',
                                                    background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
                                                    borderRadius: '2px',
                                                    margin: '20px auto 0 auto',
                                                    transition: 'all 0.3s ease',
                                                }} />
                                            )}
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Filter Section */}
                <div className="filter-card">
                    <div className="row mb-40">
                        <div className="col-12">
                            <div className="enhanced-filter-wrapper" style={{
                                borderRadius: '25px',
                                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.08)',
                                padding: '40px',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                marginBottom: '40px',
                                border: '1px solid rgba(0, 99, 177, 0.08)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Subtle background pattern */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230063b1' fill-opacity='0.02'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
                                    opacity: 0.5,
                                }}></div>

                                {/* Search Bar */}
                                <div className="row mb-4">
                                    <div className="col-md-8 col-lg-6 mx-auto">
                                        <div className="enhanced-search-box" style={{
                                            position: 'relative',
                                            marginBottom: '30px'
                                        }}>
                                            <div style={{
                                                position: 'relative',
                                                background: 'white',
                                                borderRadius: '60px',
                                                padding: '5px',
                                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                                                border: '2px solid rgba(0, 99, 177, 0.1)',
                                            }}>
                                                <input
                                                    type="text"
                                                    placeholder={t('auctionSidebar.searchAuctionPlaceholder')}
                                                    value={searchTerm}
                                                    onChange={handleSearchChange}
                                                    style={{
                                                        width: '100%',
                                                        padding: '20px 30px',
                                                        paddingRight: '70px',
                                                        borderRadius: '60px',
                                                        border: 'none',
                                                        outline: 'none',
                                                        fontSize: '18px',
                                                        background: 'transparent',
                                                        color: '#333',
                                                        fontWeight: '500'
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'white',
                                                        fontSize: '22px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 6px 20px rgba(0, 99, 177, 0.3)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 99, 177, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 99, 177, 0.3)';
                                                    }}
                                                >
                                                    <i className="bx bx-search" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Categories Filter - Hierarchical */}
                                <div className="row mb-4">
                                    <div className="col-12">
                                        <div className="hierarchical-categories-filter" style={{
                                            background: 'rgba(248, 249, 250, 0.8)',
                                            borderRadius: '15px',
                                            padding: '25px',
                                            border: '1px solid rgba(0, 99, 177, 0.1)',
                                        }}>
                                            <h4 style={{
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                color: '#333',
                                                marginBottom: '20px',
                                                textAlign: 'center'
                                            }}>
                                                {t('auctionSidebar.categories', 'Categories')}
                                            </h4>
                                            
                                            {categoriesLoading ? (
                                                <div style={{
                                                    padding: '20px',
                                                    fontSize: '16px',
                                                    color: '#666',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px'
                                                }}>
                                                    <div className="spinner" style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        border: '2px solid rgba(0, 99, 177, 0.1)',
                                                        borderRadius: '50%',
                                                        borderTop: '2px solid #0063b1',
                                                        animation: 'spin 1s linear infinite'
                                                    }}></div>
                                                    {t('auctionSidebar.loadingCategories')}
                                                </div>
                                            ) : filteredCategories && filteredCategories.length > 0 ? (
                                                renderCategoryHierarchy(filteredCategories)
                                            ) : (
                                                <div style={{
                                                    padding: '20px',
                                                    fontSize: '16px',
                                                    color: '#666',
                                                    textAlign: 'center'
                                                }}>
                                                    {selectedBidType ? t('auctionSidebar.noCategoryAvailable') : t('auctionSidebar.noCategoryAvailable')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Clear Category Filter Button */}
                                {selectedCategory && (
                                    <div className="row mb-4">
                                        <div className="col-12 d-flex justify-content-center">
                                            <button
                                                type="button"
                                                disabled={false}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleClearCategoryFilter();
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '12px 24px',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid #ef4444',
                                                    borderRadius: '12px',
                                                    color: '#ef4444',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    fontSize: '14px',
                                                    position: 'relative',
                                                    zIndex: 10,
                                                    pointerEvents: 'auto',
                                                    userSelect: 'none',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#ef4444';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                    e.currentTarget.style.color = '#ef4444';
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                                </svg>
                                                Clear Category Filter
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Grid View Controls */}
                                <div className="row">
                                    <div className="col-12 d-flex justify-content-center">
                                        <div className="grid-controls" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px',
                                            padding: '15px 25px',
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            borderRadius: '50px',
                                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                                            backdropFilter: 'blur(10px)'
                                        }}>
                                            <span style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#666',
                                                marginRight: '10px'
                                            }}>
                                                {t('auctionSidebar.display')}
                                            </span>
                                            <ul className="grid-view" style={{
                                                display: 'flex',
                                                gap: '8px',
                                                margin: 0,
                                                padding: 0,
                                                listStyle: 'none'
                                            }}>
                                                <li
                                                    className={`column-2 ${activeColumn === 2 ? "active" : ""}`}
                                                    onClick={() => handleColumnClick(2)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        padding: '8px',
                                                        background: activeColumn === 2 ? 'linear-gradient(135deg, #0063b1, #00a3e0)' : 'rgba(245, 245, 245, 0.8)',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '35px',
                                                        height: '35px',
                                                        transition: 'all 0.3s ease',
                                                        boxShadow: activeColumn === 2 ? '0 4px 12px rgba(0, 99, 177, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width={14}
                                                        height={22}
                                                        viewBox="0 0 12 20"
                                                        fill={activeColumn === 2 ? "white" : "#666"}
                                                    >
                                                        <g>
                                                            <rect width="4.88136" height="5.10638" rx="2.44068" />
                                                            <rect y="7.44678" width="4.88136" height="5.10638" rx="2.44068" />
                                                            <rect y="14.8937" width="4.88136" height="5.10638" rx="2.44068" />
                                                            <rect x="7.11865" width="4.88136" height="5.10638" rx="2.44068" />
                                                            <rect x="7.11865" y="7.44678" width="4.88136" height="5.10638" rx="2.44068" />
                                                            <rect x="7.11865" y="14.8937" width="4.88136" height="5.10638" rx="2.44068" />
                                                        </g>
                                                    </svg>
                                                </li>
                                                <li
                                                    className={`column-3 ${activeColumn === 3 ? "active" : ""}`}
                                                    onClick={() => handleColumnClick(3)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        padding: '8px',
                                                        background: activeColumn === 3 ? 'linear-gradient(135deg, #0063b1, #00a3e0)' : 'rgba(245, 245, 245, 0.8)',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '35px',
                                                        height: '35px',
                                                        transition: 'all 0.3s ease',
                                                        boxShadow: activeColumn === 3 ? '0 4px 12px rgba(0, 99, 177, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width={22}
                                                        height={22}
                                                        viewBox="0 0 20 20"
                                                        fill={activeColumn === 3 ? "white" : "#666"}
                                                    >
                                                        <g clipPath="url(#clip0_1610_1442)">
                                                            <rect width="5.10638" height="5.10638" rx="2.55319" />
                                                            <rect y="7.44678" width="5.10638" height="5.10638" rx="2.55319" />
                                                            <rect y="14.8937" width="5.10638" height="5.10638" rx="2.55319" />
                                                            <rect x="7.44678" width="5.10638" height="5.10638" rx="2.55319" />
                                                            <rect x="7.44678" y="7.44678" width="5.10638" height="5.10638" rx="2.55319" />
                                                            <rect x="7.44678" y="14.8937" width="5.10638" height="5.10638" rx="2.55319" />
                                                            <rect x="14.8936" width="5.10638" height="5.10638" rx="2.55319" />
                                                            <rect x="14.8936" y="7.44678" width="5.10638" height="5.10638" rx="2.55319" />
                                                            <rect x="14.8936" y="14.8937" width="5.10638" height="5.10638" rx="2.55319" />
                                                        </g>
                                                    </svg>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Auction Items Grid */}
                <div className="row">
                    <div className="col-12">
                        <div
                            className={`list-grid-product-wrap column-${activeColumn === 2 ? "2" : activeColumn === 3 ? "3" : "3"}-wrapper`}
                        >
                            <div className="row g-4 mb-60">
                                {loading ? (
                                    <div className="col-12 text-center py-5">
                                        <div className="spinner" style={{
                                            width: '40px',
                                            height: '40px',
                                            margin: '0 auto',
                                            border: '4px solid rgba(0, 99, 177, 0.1)',
                                            borderRadius: '50%',
                                            borderTop: '4px solid #0063b1',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        <p style={{ marginTop: '15px', color: '#666' }}>{t('auctionSidebar.loadingAuctions')}</p>
                                    </div>
                                ) : error ? (
                                    <div className="col-12 text-center py-5">
                                        <p style={{ color: '#ff5555' }}>{error}</p>
                                    </div>
                                ) : paginatedAuctions && paginatedAuctions.length > 0 ? (
                                    paginatedAuctions.map((auction, index) => {
                                        const thumbObj = auction.thumbs && auction.thumbs.length > 0 ? auction.thumbs[0] : null;
                                        const hasAuctionEnded = auctionTimers[auction._id]?.hasEnded || false; // Check if the auction has ended
                                        return (
                                            <div
                                                key={auction._id}
                                                className={`col-lg-${activeColumn === 2 ? '6' : '4'} col-md-6 item`}
                                            >
                                                <div
                                                    className="modern-auction-card auction-card"
                                                    style={{
                                                        background: hasAuctionEnded ? '#f0f0f0' : 'white', // Grey background when ended
                                                        borderRadius: '20px',
                                                        overflow: 'hidden',
                                                        boxShadow: hasAuctionEnded ? 'none' : '0 8px 25px rgba(0, 0, 0, 0.08)', // No shadow when ended
                                                        height: '100%',
                                                        maxWidth: '350px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        position: 'relative',
                                                        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                        border: hasAuctionEnded ? '1px solid #d0d0d0' : '1px solid rgba(0, 0, 0, 0.05)', // Grey border when ended
                                                        cursor: hasAuctionEnded ? 'not-allowed' : 'pointer', // Change cursor
                                                        opacity: hasAuctionEnded ? 0.6 : 1, // Grey out the card
                                                        pointerEvents: hasAuctionEnded ? 'none' : 'auto', // Disable clicks
                                                        margin: '0 auto',
                                                    }}
                                                    onClick={() => !hasAuctionEnded && handleAuctionCardClick(auction._id)}
                                                    onMouseEnter={(e) => {
                                                        if (!hasAuctionEnded) { // Only apply hover effects if not ended
                                                            e.currentTarget.style.transform = 'translateY(-10px)';
                                                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 99, 177, 0.15)';
                                                            e.currentTarget.style.borderColor = 'rgba(0, 99, 177, 0.2)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!hasAuctionEnded) { // Only apply hover effects if not ended
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                                                            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                                                        }
                                                    }}
                                                >
                                                    {/* Auction Image */}
                                                    <div
                                                        className="auction-image"
                                                        style={{
                                                            height: '240px',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <Link href={hasAuctionEnded ? "#" : `/auction-details/${auction._id}`} style={{ display: 'block', height: '100%', cursor: hasAuctionEnded ? 'not-allowed' : 'pointer' }} onClick={(e) => e.stopPropagation()}>
                                                            <img
                                                                src={
                                                                    auction.thumbs && auction.thumbs.length > 0
                                                                        ? `${app.route}${auction.thumbs[0].url}`
                                                                        : DEFAULT_AUCTION_IMAGE
                                                                }
                                                                alt={auction.title || "Auction Item"}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    transition: 'transform 0.5s ease',
                                                                    filter: hasAuctionEnded ? 'grayscale(100%)' : 'none', // Grey out image
                                                                }}
                                                                onError={(e) => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
                                                                }}
                                                                crossOrigin="use-credentials"
                                                            />
                                                        </Link>

                                                        {/* Auction Type Badge */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '15px',
                                                                    left: '15px',
                                                                background: 'rgba(255, 255, 255, 0.95)',
                                                                backdropFilter: 'blur(10px)',
                                                                color: '#333',
                                                                padding: '8px 12px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                                    zIndex: 2,
                                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                            }}
                                                        >
                                                            {auction.bidType === 'PRODUCT' ? 'Produit' : 'Service'}
                                                            </div>

                                                        {/* Countdown Timer */}
                                                        <div
                                                            className="countdown-overlay"
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '0',
                                                                left: '0',
                                                                right: '0',
                                                                background: hasAuctionEnded ? 'rgba(0, 0, 0, 0.6)' : 'linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), transparent)', // Darker grey background when ended
                                                                padding: '20px 15px 15px',
                                                                color: 'white',
                                                            }}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                            }}>
                                                                <div style={{
                                                                    background: hasAuctionEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)', // Grey timer background
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {auctionTimers[auction._id]?.days || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{t('auctionSidebar.daysAbbr')}</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasAuctionEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)', // Grey timer background
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {auctionTimers[auction._id]?.hours || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{t('auctionSidebar.hoursAbbr')}</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasAuctionEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)', // Grey timer background
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {auctionTimers[auction._id]?.minutes || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{t('auctionSidebar.minutesAbbr')}</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasAuctionEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)', // Grey timer background
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {auctionTimers[auction._id]?.seconds || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{t('auctionSidebar.secondsAbbr')}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Auction Content */}
                                                    <div style={{
                                                        padding: '25px',
                                                        flexGrow: 1,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                    }}>
                                                        {/* Title */}
                                                        <h3 style={{
                                                            fontSize: '18px',
                                                            fontWeight: '600',
                                                            color: hasAuctionEnded ? '#666' : '#333', // Grey text for title
                                                            marginBottom: '12px',
                                                            lineHeight: '1.3',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            <Link
                                                                href={hasAuctionEnded ? "#" : `/auction-details/${auction._id}`} // Prevent navigation if ended
                                                                style={{ color: 'inherit', textDecoration: 'none', cursor: hasAuctionEnded ? 'not-allowed' : 'pointer' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {auction.title || t('auctionSidebar.noTitle')}
                                                            </Link>
                                                        </h3>

                                                        {/* Quantity and Location Info */}
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '12px',
                                                            marginBottom: '16px',
                                                        }}>
                                                            <div>
                                                                <p style={{
                                                                    fontSize: '12px',
                                                                    color: hasAuctionEnded ? '#888' : '#666',
                                                                    margin: '0 0 4px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    Quantité
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '14px',
                                                                    color: hasAuctionEnded ? '#888' : '#333',
                                                                    margin: 0,
                                                                    fontWeight: '500',
                                                                }}>
                                                                    {auction.quantity || 'Non spécifiée'}
                                                                </p>
                                                            </div>

                                                                <div>
                                                                    <p style={{
                                                                        fontSize: '12px',
                                                                    color: hasAuctionEnded ? '#888' : '#666',
                                                                        margin: '0 0 4px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    Localisation
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '14px',
                                                                    color: hasAuctionEnded ? '#888' : '#333',
                                                                    margin: 0,
                                                                        fontWeight: '500',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}>
                                                                    {auction.location || auction.wilaya || 'Non spécifiée'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Separator Line */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '1px',
                                                            background: hasAuctionEnded ? '#e0e0e0' : 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                            margin: '0 0 16px 0',
                                                        }}></div>

                                                        {/* Description */}
                                                        {auction.description && (
                                                            <div style={{
                                                                marginBottom: '16px',
                                                            }}>
                                                                <p style={{
                                                                    fontSize: '12px',
                                                                    color: hasAuctionEnded ? '#888' : '#666',
                                                                    margin: '0 0 4px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    Description
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '13px',
                                                                    color: hasAuctionEnded ? '#888' : '#555',
                                                                    margin: 0,
                                                                    lineHeight: '1.4',
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}>
                                                                    {auction.description}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Separator Line after Description */}
                                                        {auction.description && (
                                                            <div style={{
                                                                width: '100%',
                                                                height: '1px',
                                                                background: hasAuctionEnded ? '#e0e0e0' : 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                                margin: '0 0 16px 0',
                                                            }}></div>
                                                        )}

                                                        {/* Price Info */}
                                                        <div style={{
                                                            background: hasAuctionEnded ? '#f0f0f0' : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            marginBottom: '16px',
                                                            border: hasAuctionEnded ? '1px solid #e0e0e0' : '1px solid #e9ecef',
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                            }}>
                                                                <div style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    background: hasAuctionEnded ? '#ccc' : '#28a745',
                                                                    animation: hasAuctionEnded ? 'none' : 'pulse 2s infinite',
                                                                }}></div>
                                                                <span style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: '600',
                                                                    color: hasAuctionEnded ? '#888' : '#28a745',
                                                                }}>
                                                                    {hasAuctionEnded ? 'Enchère terminée' : 'Prix actuel'}
                                                                </span>
                                                            </div>
                                                            <div style={{
                                                                textAlign: 'center',
                                                                marginTop: '8px',
                                                            }}>
                                                                    <p style={{
                                                                        fontSize: '22px',
                                                                        fontWeight: '800',
                                                                        margin: 0,
                                                                    color: hasAuctionEnded ? '#888' : '#0063b1',
                                                                        background: hasAuctionEnded ? 'none' : 'linear-gradient(90deg, #0063b1, #00a3e0)',
                                                                        WebkitBackgroundClip: hasAuctionEnded ? undefined : 'text',
                                                                        backgroundClip: hasAuctionEnded ? undefined : 'text',
                                                                        WebkitTextFillColor: hasAuctionEnded ? '#888' : 'transparent',
                                                                    }}>
                                                                        {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} DA
                                                                    </p>
                                                            </div>
                                                        </div>

                                                        {/* Separator Line after Price */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '1px',
                                                            background: hasAuctionEnded ? '#e0e0e0' : 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                            margin: '0 0 16px 0',
                                                        }}></div>

                                                        {/* Bidders Count */}
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            marginBottom: '16px',
                                                            border: '1px solid #e9ecef',
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                            }}>
                                                                <div style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    background: hasAuctionEnded ? '#ccc' : '#0063b1',
                                                                    animation: hasAuctionEnded ? 'none' : 'pulse 2s infinite',
                                                                }}></div>
                                                                <span style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: '600',
                                                                    color: hasAuctionEnded ? '#888' : '#0063b1',
                                                                }}>
                                                                    {auction.biddersCount || 0} participant{(auction.biddersCount || 0) !== 1 ? 's' : ''}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '12px',
                                                                    color: hasAuctionEnded ? '#888' : '#666',
                                                                }}>
                                                                    ont enchéri
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Separator Line after Bidders Count */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '1px',
                                                            background: hasAuctionEnded ? '#e0e0e0' : 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                            margin: '0 0 16px 0',
                                                        }}></div>

                                                        {/* Owner Info */}
                                                        <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                            gap: '10px',
                                                            marginBottom: '16px',
                                                                }}>
                                                                    <img
                                                                src={auction.owner?.avatar?.url ? `${app.route}${auction.owner.avatar.url}` : DEFAULT_PROFILE_IMAGE}
                                                                        alt="Owner"
                                                                        style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                            objectFit: 'cover',
                                                                    filter: hasAuctionEnded ? 'grayscale(100%)' : 'none',
                                                                        }}
                                                                        onError={(e) => {
                                                                    const target = e.target;
                                                                    target.src = DEFAULT_PROFILE_IMAGE;
                                                                }}
                                                            />
                                                            <span style={{
                                                                fontSize: '14px',
                                                                color: hasAuctionEnded ? '#888' : '#666',
                                                                        fontWeight: '500',
                                                                    }}>
                                                                        {(() => {
                                                                            // Check if seller is hidden (anonymous)
                                                                            if (auction.hidden === true) {
                                                                        return 'Anonyme';
                                                                            }
                                                                            
                                                                            // Try owner firstName + lastName first
                                                                            if (auction.owner?.firstName && auction.owner?.lastName) {
                                                                                return `${auction.owner.firstName} ${auction.owner.lastName}`;
                                                                            }
                                                                            // Try owner name field
                                                                            if (auction.owner?.name) {
                                                                                return auction.owner.name;
                                                                            }
                                                                            // Try seller name
                                                                            if (auction.seller?.name) {
                                                                                return auction.seller.name;
                                                                            }
                                                                            // Try just firstName
                                                                            if (auction.owner?.firstName) {
                                                                                return auction.owner.firstName;
                                                                            }
                                                                            // Default fallback
                                                                    return 'Vendeur';
                                                                        })()}
                                                            </span>
                                                            </div>

                                                        {/* View Auction Button */}
                                                        <Link
                                                            href={hasAuctionEnded ? "#" : `/auction-details/${auction._id}`}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                width: '100%',
                                                                padding: '12px 20px',
                                                                background: hasAuctionEnded ? '#cccccc' : 'linear-gradient(90deg, #0063b1, #00a3e0)',
                                                                color: hasAuctionEnded ? '#888' : 'white',
                                                                textDecoration: 'none',
                                                                borderRadius: '25px',
                                                                fontWeight: '600',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: hasAuctionEnded ? 'none' : '0 4px 12px rgba(0, 99, 177, 0.3)',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!hasAuctionEnded) {
                                                                    e.currentTarget.style.background = 'linear-gradient(90deg, #00a3e0, #0063b1)';
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 99, 177, 0.4)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!hasAuctionEnded) {
                                                                    e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.3)';
                                                                }
                                                            }}
                                                        >
                                                            Voir les détails
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-12 text-center py-5">
                                        <div style={{
                                            padding: '60px 20px',
                                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                            borderRadius: '20px',
                                            border: '2px dashed rgba(0, 99, 177, 0.2)',
                                        }}>
                                            <div style={{
                                                fontSize: '48px',
                                                marginBottom: '20px',
                                                opacity: 0.5,
                                            }}>
                                                🔍
                                            </div>
                                            <h3 style={{
                                                fontSize: '24px',
                                                fontWeight: '600',
                                                color: '#666',
                                                marginBottom: '10px',
                                            }}>
                                                {t('auctionSidebar.noAuctionsFound')}
                                            </h3>
                                            <p style={{
                                                fontSize: '16px',
                                                color: '#999',
                                                margin: 0,
                                            }}>
                                                {t('auctionSidebar.modifyFiltersOrSearch')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="row">
                        <div className="col-lg-12 d-flex justify-content-center">
                            <div className="inner-pagination-area" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                                <ul className="paginations" style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: 0,
                                    margin: 0,
                                    listStyle: 'none'
                                }}>
                                    {/* Previous Button */}
                                    <li className="page-item paginations-button">
                                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} style={{
                                            display: currentPage === 1 ? 'none' : 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '50%',
                                            background: '#f5f5f5',
                                            color: '#333',
                                            fontWeight: '600',
                                            textDecoration: 'none',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        }}>
                                            <svg width={16} height={13} viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
                                        </a>
                                    </li>
                                    
                                    {/* Page Numbers */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '45px',
                                                height: '45px',
                                                borderRadius: '50%',
                                                background: currentPage === page ? 'linear-gradient(135deg, #0063b1, #00a3e0)' : '#f5f5f5',
                                                color: currentPage === page ? 'white' : '#333',
                                                fontWeight: currentPage === page ? '700' : '600',
                                                textDecoration: 'none',
                                                boxShadow: currentPage === page ? '0 4px 15px rgba(0, 99, 177, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                transition: 'all 0.3s ease',
                                            }}>{page.toString().padStart(2, '0')}</a>
                                        </li>
                                    ))}

                                    {/* Next Button */}
                                    <li className="page-item paginations-button">
                                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} style={{
                                            display: currentPage === totalPages ? 'none' : 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '50%',
                                            background: '#f5f5f5',
                                            color: '#333',
                                            fontWeight: '600',
                                            textDecoration: 'none',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        }}>
                                            <svg width={16} height={13} viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"></path></svg>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MultipurposeAuctionSidebar;