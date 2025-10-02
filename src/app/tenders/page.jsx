"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import SelectComponent from '@/components/common/SelectComponent'
import { useCountdownTimer } from '@/customHooks/useCountdownTimer'
import { TendersAPI } from '@/app/api/tenders'
import { CategoryAPI } from '@/app/api/category'
import { SubCategoryAPI } from '@/app/api/subcategory'
import app from '@/config'; // Import the app config
import { useTranslation } from 'react-i18next';
import Header from '@/components/header/Header';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Define BID_TYPE enum to match server definition
const BID_TYPE = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE'
};

// Default image constants
const DEFAULT_TENDER_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";
const DEFAULT_CATEGORY_IMAGE = "/assets/images/default-category.png";

// Timer interface
const calculateTimeRemaining = (endDate) => {
  const total = Date.parse(endDate) - Date.now();
  const hasEnded = total <= 0;

  if (hasEnded) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
      hasEnded: true
    };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days: days.toString().padStart(2, '0'),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    hasEnded: false
  };
};

// Custom hook to manage multiple countdown timers
const useTenderTimers = (tenders) => {
    const [timers, setTimers] = useState({});

    useEffect(() => {
        if (!tenders || tenders.length === 0) return;

        // Initialize timers for each tender
        const newTimers = {};
        tenders.forEach(tender => {
            if (tender._id) {
                newTimers[tender._id] = useCountdownTimer(tender.endingAt || "2024-10-23 12:00:00");
            }
        });

        setTimers(newTimers);
    }, [tenders]);

    return timers;
};

const MultipurposeTenderSidebar = () => {
    const { t } = useTranslation();
    const router = useRouter();
    // Default countdown timer for the page (fallback)
    const defaultTimer = useCountdownTimer("2024-08-23 11:42:00");

    const [activeColumn, setActiveColumn] = useState(3);
    const [currentPage, setCurrentPage] = useState(1);
    const [tenders, setTenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedBidType, setSelectedBidType] = useState(""); // "" for all, "PRODUCT", or "SERVICE"
    const [tenderTimers, setTenderTimers] = useState({});
    const [filteredTenders, setFilteredTenders] = useState([]);
    const [sortOption, setSortOption] = useState(t('defaultSort'));
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [hoveredSubCategory, setHoveredSubCategory] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [timers, setTimers] = useState({});
    const [animatedCards, setAnimatedCards] = useState([]);

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

    // Helper function to check if a tender belongs to a category or its descendants
    const doesTenderBelongToCategory = (tender, selectedCategoryId, categoriesTree) => {
        if (!tender.category || !selectedCategoryId) return false;
        
        const tenderCategoryId = tender.category._id || tender.category;
        
        // Direct match
        if (tenderCategoryId === selectedCategoryId) return true;
        
        // Check if tender category is a descendant of selected category
        const allDescendants = getAllDescendantCategoryIds(selectedCategoryId, categoriesTree);
        return allDescendants.includes(tenderCategoryId);
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
                            borderWidth: level === 0 ? '2px' : '1px',
                            borderStyle: 'solid',
                            borderColor: level === 0 ? '#e2e8f0' : '#f1f5f9',
                            transition: 'all 0.3s ease',
                            cursor: hasSubcategories ? 'pointer' : 'default',
                            position: 'relative',
                            ...(isSelected && {
                                borderColor: '#0063b1',
                                background: 'rgba(0, 99, 177, 0.05)',
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
                            src={category.thumb ? `${app.route}/static${category.thumb.url}` : DEFAULT_CATEGORY_IMAGE}
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
                                    : 'Click name or image to filter tenders'
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

    // Update timers
    useEffect(() => {
        if (filteredTenders.length === 0) return;

        const updateTimers = () => {
            const newTimers = {};
            filteredTenders.forEach(tender => {
                if (tender._id && tender.endingAt) {
                    newTimers[tender._id] = calculateTimeRemaining(tender.endingAt);
                }
            });
            setTimers(newTimers);
        };

        // Initial update
        updateTimers();

        // Update every second
        const interval = setInterval(updateTimers, 1000);

        return () => clearInterval(interval);
    }, [filteredTenders]);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index') || '0');
                        setAnimatedCards(prev => [...prev, index]);
                    }
                });
            },
            { threshold: 0.3, rootMargin: '0px 0px -50px 0px' }
        );

        const tenderCards = document.querySelectorAll('.tender-card-animate');
        tenderCards.forEach((card, index) => {
            card.setAttribute('data-index', index.toString());
            observer.observe(card);
        });

        return () => observer.disconnect();
    }, [filteredTenders]);

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
        const fetchTenders = async () => {
            try {
                setLoading(true);
                // Fetch tenders with populated owner and avatar
                const response = await TendersAPI.getActiveTenders();
                
                console.log('Tenders API Response:', response);
                
                // Handle the API response structure
                let tendersData = [];
                if (response && response.success) {
                    // If response has data array
                    if (Array.isArray(response.data)) {
                        tendersData = response.data;
                    } else if (Array.isArray(response)) {
                        // If response is directly an array
                        tendersData = response;
                    }
                } else if (Array.isArray(response)) {
                    // If response is directly an array
                    tendersData = response;
                }
                
                console.log('Processed tenders data:', tendersData);
                
                setTenders(tendersData);
                // Initial filtering for display, the useEffect below will refine it
                setFilteredTenders(tendersData);

                // Initialize countdown timers for each tender
                const timers = {};
                tendersData.forEach(tender => {
                    if (tender._id) {
                        const endTime = tender.endingAt || "2024-10-23 12:00:00";
                        const currentTime = new Date();
                        const timeDifference = new Date(endTime) - currentTime;

                        if (timeDifference > 0) {
                            timers[tender._id] = calculateTimeRemaining(endTime);
                        } else {
                            timers[tender._id] = { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: true }; // Mark as ended
                        }
                    }
                });
                setTenderTimers(timers);

                // Update timers every second
                const interval = setInterval(() => {
                    const updatedTimers = {};
                    tendersData.forEach(tender => {
                        if (tender._id) {
                            const endTime = tender.endingAt || "2024-10-23 12:00:00";
                            updatedTimers[tender._id] = calculateTimeRemaining(endTime);
                        }
                    });
                    setTenderTimers(updatedTimers);
                }, 1000);

                setLoading(false);

                return () => clearInterval(interval);
            } catch (err) {
                console.error("Error fetching tenders:", err);
                setError("Failed to load tenders");
                setLoading(false);
            }
        };

        fetchTenders();
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
        console.log("Filtering useEffect triggered with:", {
            tendersLength: tenders?.length,
            selectedCategory,
            selectedSubCategory,
            selectedBidType,
            searchTerm,
            sortOption
        });
        
        if (!tenders || tenders.length === 0) return;

        let result = [...tenders];

        // Do NOT filter out tenders that have already ended.
        // Instead, their 'hasEnded' flag will be used for styling and click prevention.

        // 1. Apply bidType filter if selected
        if (selectedBidType) {
            result = result.filter(tender =>
                tender.tenderType && tender.tenderType === selectedBidType
            );
        }

        // 2. Apply category filter if selected (with hierarchical support)
        if (selectedCategory) {
            console.log("Applying category filter for:", selectedCategory);
            const beforeFilter = result.length;
            result = result.filter(tender =>
                doesTenderBelongToCategory(tender, selectedCategory, categories)
            );
            console.log(`Category filter: ${beforeFilter} -> ${result.length} tenders`);
        } else {
            console.log("No category filter applied (selectedCategory is empty)");
        }

        // 3. Apply subcategory filter if selected
        if (selectedSubCategory) {
            result = result.filter(tender =>
                tender.subCategory && tender.subCategory._id === selectedSubCategory
            );
        }

        // 4. Apply search term filter
        if (searchTerm.trim() !== "") {
            const searchLower = searchTerm.toLowerCase().trim();
            result = result.filter(tender =>
                (tender.title && tender.title.toLowerCase().includes(searchLower)) ||
                (tender.description && tender.description.toLowerCase().includes(searchLower))
            );
        }

        // 5. Apply sorting
        if (sortOption === t('priceAsc')) {
            result.sort((a, b) =>
                (a.maxBudget || 0) - (b.maxBudget || 0)
            );
        } else if (sortOption === t('priceDesc')) {
            result.sort((a, b) =>
                (b.maxBudget || 0) - (a.maxBudget || 0)
            );
        }

        console.log(`Final filtered result: ${result.length} tenders`);
        setFilteredTenders(result);
    }, [tenders, selectedCategory, selectedSubCategory, selectedBidType, searchTerm, sortOption]); // Removed tenderTimers from dependency array as it's not filtering, only styling

    // Debug useEffect to monitor selectedCategory changes
    useEffect(() => {
        console.log("selectedCategory changed to:", selectedCategory);
        console.log("selectedSubCategory changed to:", selectedSubCategory);
    }, [selectedCategory, selectedSubCategory]);

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
        console.log("Clearing category filter...");
        console.log("Before clear - selectedCategory:", selectedCategory);
        console.log("Before clear - selectedSubCategory:", selectedSubCategory);
        
        // Clear URL parameters first
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.delete('category');
            url.searchParams.delete('subcategory');
            window.history.replaceState({}, '', url);
        }
        
        // Clear states using functional updates to ensure they're applied
        setSelectedCategory("");
        setSelectedSubCategory("");
        setExpandedCategories({});
        
        // Force immediate filtering update by directly updating filteredTenders
        if (tenders && tenders.length > 0) {
            let result = [...tenders];
            
            // Apply only non-category filters
            if (selectedBidType) {
                result = result.filter(tender =>
                    tender.tenderType && tender.tenderType === selectedBidType
                );
            }
            
            if (searchTerm.trim() !== "") {
                const searchLower = searchTerm.toLowerCase().trim();
                result = result.filter(tender =>
                    (tender.title && tender.title.toLowerCase().includes(searchLower)) ||
                    (tender.description && tender.description.toLowerCase().includes(searchLower))
                );
            }
            
            // Apply sorting
            if (sortOption) {
                result.sort((a, b) => {
                    switch (sortOption) {
                        case 'newest':
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        case 'oldest':
                            return new Date(a.createdAt) - new Date(b.createdAt);
                        case 'ending_soon':
                            return new Date(a.endingAt) - new Date(b.endingAt);
                        case 'ending_later':
                            return new Date(b.endingAt) - new Date(a.endingAt);
                        default:
                            return 0;
                    }
                });
            }
            
            console.log(`Direct filtering result: ${result.length} tenders`);
            setFilteredTenders(result);
        }
        
        console.log("Clear function completed");
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
        t('defaultSort'),
        t('priceAsc'),
        t('priceDesc'),
    ];

    const handleColumnClick = (columnNumber) => {
        setActiveColumn(columnNumber);
    };

    // Handle tender card click
    const handleTenderCardClick = (tenderId) => {
        router.push(`/tender-details/${tenderId}`);
    };

    // Swiper settings
    const swiperSettings = useMemo(() => ({
        slidesPerView: "auto",
        speed: 1200,
        spaceBetween: 25,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
        },
        navigation: {
            nextEl: ".tender-slider-next",
            prevEl: ".tender-slider-prev",
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            280: {
                slidesPerView: 1,
                spaceBetween: 15,
            },
            576: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            992: {
                slidesPerView: 3,
                spaceBetween: 25,
            },
            1200: {
                slidesPerView: 4,
                spaceBetween: 25,
            },
            1400: {
                slidesPerView: 4,
                spaceBetween: 30,
            },
        },
    }), []);

    return (
        <>
            <Header />
            <div className="tender-grid-section pt-10 mb-110">
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
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .hero-section {
                    animation: slideIn 0.8s ease-out;
                }
                .filter-card {
                    animation: slideIn 0.8s ease-out 0.2s both;
                }
                .tender-card {
                    animation: slideIn 0.8s ease-out 0.4s both;
                }
                .tender-card-animate {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                    transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .tender-card-animate.animated {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                .tender-card-hover {
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .tender-card-hover:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(40, 167, 69, 0.15);
                }
                .timer-digit {
                    animation: pulse 1s infinite;
                }
                .timer-digit.urgent {
                    animation: pulse 0.5s infinite;
                    color: #ff4444;
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
                                {t('discoverTenders')}
                            </h1>
                            <p style={{
                                fontSize: '20px',
                                color: '#666',
                                marginBottom: '60px',
                                fontWeight: '400',
                                maxWidth: '600px',
                                margin: '0 auto 60px auto'
                            }}>
                                {t('chooseDescription')}
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
                                                Découvrez une large gamme de produits en appel d'offres
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
                                                Accédez à des services professionnels en appel d'offres
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
                                                    placeholder={t('searchTenderPlaceholder')}
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
                                                {t('categories', 'Categories')}
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
                                                    {t('loadingCategories')}
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
                                                    {selectedBidType ? t('noCategoryAvailable') : t('noCategoryAvailable')}
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
                                                {t('display')}
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

                {/* Tender Cards Section */}
                <div className="row">
                    <div className="col-12">
                                {loading ? (
                            <div className="text-center py-5">
                                        <div className="spinner" style={{
                                            width: '40px',
                                            height: '40px',
                                            margin: '0 auto',
                                            border: '4px solid rgba(0, 99, 177, 0.1)',
                                            borderRadius: '50%',
                                            borderTop: '4px solid #0063b1',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        <p style={{ marginTop: '15px', color: '#666' }}>{t('loadingTenders')}</p>
                                    </div>
                                ) : error ? (
                            <div className="text-center py-5">
                                        <p style={{ color: '#ff5555' }}>{error}</p>
                                    </div>
                                ) : filteredTenders && filteredTenders.length > 0 ? (
                            <div className="tender-carousel-container" style={{ position: 'relative' }}>
                                <Swiper
                                    {...swiperSettings}
                                    className="swiper tender-slider"
                                    style={{
                                        padding: '20px 0 50px',
                                        overflow: 'visible',
                                    }}
                                >
                                    {filteredTenders.map((tender, idx) => {
                                        const timer = timers[tender._id] || { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false };
                                        const isAnimated = animatedCards.includes(idx);
                                        const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30;

                                        // Determine the display name for the tender owner
                                        const ownerName = tender.owner?.firstName && tender.owner?.lastName
                                            ? `${tender.owner.firstName} ${tender.owner.lastName}`.trim()
                                            : tender.owner?.name;
                                        const displayName = ownerName || 'Acheteur';

                                        return (
                                            <SwiperSlide key={tender._id} style={{ height: 'auto', display: 'flex', justifyContent: 'center' }}>
                                        <div
                                                    className={`tender-card-animate tender-card-hover ${isAnimated ? 'animated' : ''}`}
                                                    style={{
                                                        background: 'white',
                                                        borderRadius: 'clamp(16px, 3vw, 20px)',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                                                        border: '1px solid rgba(0, 0, 0, 0.05)',
                                                        width: '100%',
                                                        maxWidth: '320px',
                                                        position: 'relative',
                                                        minHeight: '380px',
                                                opacity: timer.hasEnded ? 0.6 : 1,
                                                filter: timer.hasEnded ? 'grayscale(60%)' : 'none',
                                                cursor: timer.hasEnded ? 'not-allowed' : 'default'
                                                    }}
                                                >
                                                    {/* Tender Image */}
                                                    <div style={{
                                                            position: 'relative',
                                                        height: 'clamp(160px, 25vw, 200px)',
                                                            overflow: 'hidden',
                                                        background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                            <img
                                                                src={
                                                                    tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url
                                                                    ? `${app.route}${tender.attachments[0].url}`
                                                                        : tender.attachments && tender.attachments.length > 0 && tender.attachments[0].path
                                                                    ? `${app.route}${tender.attachments[0].path}`
                                                                        : tender.thumbs && tender.thumbs.length > 0
                                                                    ? `${app.route}${tender.thumbs[0].url}`
                                                                        : tender.images && tender.images.length > 0
                                                                    ? `${app.route}${tender.images[0].url}`
                                                                        : tender.image
                                                                    ? `${app.route}${tender.image}`
                                                                        : DEFAULT_TENDER_IMAGE
                                                                }
                                                                alt={tender.title || "Tender Item"}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                transition: 'transform 0.4s ease',
                                                                }}
                                                                onError={(e) => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = DEFAULT_TENDER_IMAGE;
                                                                }}
                                                                crossOrigin="use-credentials"
                                                            />

                                                        {/* Timer Overlay */}
                                                        <div style={{
                                                                    position: 'absolute',
                                                            top: '10px',
                                                            right: '10px',
                                                            background: timer.hasEnded
                                                                ? 'rgba(0,0,0,0.55)'
                                                                : (isUrgent ? 'linear-gradient(45deg, #ff4444, #ff6666)' : 'linear-gradient(45deg, #8b5cf6, #a855f7)'),
                                                                    color: 'white',
                                                            padding: '8px 12px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                                        }}>
                                                            {timer.hasEnded ? (
                                                                <span style={{ fontWeight: 800 }}>Terminé</span>
                                                            ) : (
                                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                                    <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.hours}</span>
                                                                    <span>:</span>
                                                                    <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.minutes}</span>
                                                                    <span>:</span>
                                                                    <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.seconds}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Type Badge */}
                                                            <div style={{
                                                            position: 'absolute',
                                                            top: '10px',
                                                            left: '10px',
                                                            background: 'rgba(255, 255, 255, 0.9)',
                                                            color: '#333',
                                                            padding: '6px 12px',
                                                            borderRadius: '15px',
                                                            fontSize: '12px',
                                                                fontWeight: '600',
                                                            }}>
                                                            {tender.tenderType === 'PRODUCT' ? 'Produit' : 'Service'}
                                                        </div>
                                                    </div>

                                                    {/* Tender Details */}
                                                    <div style={{ padding: 'clamp(16px, 3vw, 20px)' }}>
                                                        <h3 style={{
                                                            fontSize: '18px',
                                                            fontWeight: '600',
                                                            color: '#222',
                                                            marginBottom: '12px',
                                                            lineHeight: '1.3',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                        }}>
                                                            {tender.title || 'Tender Title'}
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
                                                                    color: '#666',
                                                                    margin: '0 0 4px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    Quantité
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '14px',
                                                                    color: '#333',
                                                                    margin: 0,
                                                                    fontWeight: '500',
                                                                }}>
                                                                    {tender.quantity || 'Non spécifiée'}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p style={{
                                                                    fontSize: '12px',
                                                                    color: '#666',
                                                                    margin: '0 0 4px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    Localisation
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '14px',
                                                                    color: '#333',
                                                                    margin: 0,
                                                                    fontWeight: '500',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}>
                                                                    {tender.location || tender.wilaya || 'Non spécifiée'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Separator Line */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '1px',
                                                            background: 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                            margin: '0 0 16px 0',
                                                        }}></div>

                                                        {/* Description */}
                                                        {tender.description && (
                                                            <div style={{
                                                                marginBottom: '16px',
                                                            }}>
                                                                <p style={{
                                                                    fontSize: '12px',
                                                                    color: '#666',
                                                                    margin: '0 0 4px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    Description
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '13px',
                                                                    color: '#555',
                                                                    margin: 0,
                                                                    lineHeight: '1.4',
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}>
                                                                    {tender.description}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Separator Line after Description */}
                                                        {tender.description && (
                                                            <div style={{
                                                                width: '100%',
                                                                height: '1px',
                                                                background: 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                                margin: '0 0 16px 0',
                                                            }}></div>
                                                        )}

                                                        {/* Participants Count */}
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
                                                                    background: '#8b5cf6',
                                                                    animation: 'pulse 2s infinite',
                                                                }}></div>
                                                                <span style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: '600',
                                                                    color: '#8b5cf6',
                                                                }}>
                                                                    {tender.participantsCount || 0} participant{(tender.participantsCount || 0) !== 1 ? 's' : ''}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '12px',
                                                                    color: '#666',
                                                                }}>
                                                                    ont soumis des offres
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Separator Line after Participants Count */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '1px',
                                                            background: 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
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
                                                                src={tender.owner?.photoURL || DEFAULT_PROFILE_IMAGE}
                                                                alt={displayName}
                                                                        style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                            objectFit: 'cover',
                                                                        }}
                                                                        onError={(e) => {
                                                                    const target = e.target;
                                                                    target.src = DEFAULT_PROFILE_IMAGE;
                                                                }}
                                                            />
                                                            <span style={{
                                                                fontSize: '14px',
                                                                color: '#666',
                                                                        fontWeight: '500',
                                                                    }}>
                                                                {displayName}
                                                            </span>
                                                        </div>

                                                        {/* View Tender Button */}
                                                        <Link
                                                            href={`/tender-details/${tender._id}`}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                width: '100%',
                                                                padding: '12px 20px',
                                                                background: timer.hasEnded ? '#c7c7c7' : 'linear-gradient(90deg, #8b5cf6, #a855f7)',
                                                                color: 'white',
                                                                textDecoration: 'none',
                                                                borderRadius: '25px',
                                                                fontWeight: '600',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: timer.hasEnded ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
                                                                pointerEvents: timer.hasEnded ? 'none' : 'auto'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!timer.hasEnded) {
                                                                    e.currentTarget.style.background = 'linear-gradient(90deg, #a855f7, #8b5cf6)';
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!timer.hasEnded) {
                                                                    e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6, #a855f7)';
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                                                                }
                                                            }}
                                                        >
                                                            {timer.hasEnded ? 'Terminé' : 'Voir les détails'}
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </SwiperSlide>
                                        );
                                    })}
                                </Swiper>

                                {/* Navigation Buttons */}
                                <div className="slider-navigation" style={{
                                    position: 'absolute',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    pointerEvents: 'none',
                                    zIndex: 10,
                                }}>
                                    <button
                                        className="tender-slider-prev"
                                        style={{
                                            background: 'white',
                                            border: 'none',
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            pointerEvents: 'auto',
                                            marginLeft: '-25px',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6, #a855f7)';
                                            e.currentTarget.style.color = 'white';
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'white';
                                            e.currentTarget.style.color = '#333';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12Z"/>
                                        </svg>
                                    </button>

                                    <button
                                        className="tender-slider-next"
                                        style={{
                                            background: 'white',
                                            border: 'none',
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            pointerEvents: 'auto',
                                            marginRight: '-25px',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6, #a855f7)';
                                            e.currentTarget.style.color = 'white';
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'white';
                                            e.currentTarget.style.color = '#333';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                                        </svg>
                                    </button>
                                </div>

                                {/* Pagination */}
                                <div className="swiper-pagination" style={{
                                    position: 'relative',
                                    marginTop: '30px',
                                }}></div>
                            </div>
                        ) : (
                            <div className="text-center py-5">
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
                                                {t('noTendersFound')}
                                            </h3>
                                            <p style={{
                                                fontSize: '16px',
                                                color: '#999',
                                                margin: 0,
                                            }}>
                                                {t('modifyFiltersOrSearch')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                    </div>
                </div>

                {/* Pagination */}
                {filteredTenders && filteredTenders.length > 0 && Math.ceil(filteredTenders.length / 9) > 1 && (
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
                                    <li className="page-item active" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <a href="#" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                                            color: 'white',
                                            fontWeight: '700',
                                            textDecoration: 'none',
                                            boxShadow: '0 4px 15px rgba(0, 99, 177, 0.3)',
                                            transition: 'all 0.3s ease',
                                        }}>{t('page01')}</a>
                                    </li>
                                    <li className="page-item" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <a href="#" style={{
                                            display: 'flex',
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
                                        }}>{t('page02')}</a>
                                    </li>
                                    <li className="page-item" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <a href="#" style={{
                                            display: 'flex',
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
                                        }}>{t('page03')}</a>
                                    </li>
                                    <li className="page-item paginations-button" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <a href="#" style={{
                                            display: 'flex',
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
                                            <svg width={16} height={13} viewBox="0 0 16 13" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M15.557 10.1026L1.34284 1.89603M15.557 10.1026C12.9386 8.59083 10.8853 3.68154 12.7282 0.489511M15.557 10.1026C12.9386 8.59083 7.66029 9.2674 5.81744 12.4593" strokeWidth="0.96" strokeLinecap="round" />
                                            </svg>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    )
}

export default MultipurposeTenderSidebar;