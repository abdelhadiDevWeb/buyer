"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import "./st.css";
import "./modern-details.css";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useCountdownTimer } from "@/customHooks/useCountdownTimer";
import HandleQuantity from "../common/HandleQuantity";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authStore } from "@/contexts/authStore";
import { TendersAPI } from "@/app/api/tenders";
import { OfferAPI } from "@/app/api/offer";
import { AutoBidAPI } from "@/app/api/auto-bid";
import useAuth from "@/hooks/useAuth";
import app from "@/config"; // Import the app config
import { calculateTimeRemaining } from "../live-auction/Home1LiveAuction";
import { ReviewAPI } from "@/app/api/review"; // Import Review API
import { CommentAPI } from "@/app/api/comment";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";

// Helper function to calculate time remaining and format with leading zeros
function getTimeRemaining(endDate) {
  if (!endDate) {
    return {
      total: 0,
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }
  
  const total = Date.parse(endDate) - Date.now();
  const seconds = Math.max(Math.floor((total / 1000) % 60), 0);
  const minutes = Math.max(Math.floor((total / 1000 / 60) % 60), 0);
  const hours = Math.max(Math.floor((total / (1000 * 60 * 60)) % 24), 0);
  const days = Math.max(Math.floor(total / (1000 * 60 * 60 * 24)), 0);

  const formatNumber = (num) => String(num).padStart(2, "0");

  return {
    total,
    days: formatNumber(days),
    hours: formatNumber(hours),
    minutes: formatNumber(minutes),
    seconds: formatNumber(seconds),
  };
}

const MultipurposeDetails2 = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [tenderData, setTenderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null); // For debugging
  const { isLogged, auth } = useAuth();
  const [time, setTime] = useState({
    day: "00",
    hour: "00",
    mun: "00",
    sec: "00",
  });
  const [allTenders, setAllTenders] = useState([]);
  const [similarTenderTimers, setSimilarTenderTimers] = useState([]);
  const [activeTab, setActiveTab] = useState("description"); // State for active tab
  const [reviewText, setReviewText] = useState(""); // State for review text
  const [reviewRating, setReviewRating] = useState(0); // State for review rating
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // State for selected image index
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0); // State for selected video index
  const [showVideo, setShowVideo] = useState(false); // State for showing video instead of image
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false); // State for showing all comments
  const [offers, setOffers] = useState([]); // State for offers
  const [myOffers, setMyOffers] = useState([]); // State for user's offers
  const [loadingOffers, setLoadingOffers] = useState(false); // State for loading offers
  const [professionalAmount, setProfessionalAmount] = useState(""); // State for professional amount
  const [savingAutoBid, setSavingAutoBid] = useState(false); // State for saving auto bid
  const [loadingAutoBid, setLoadingAutoBid] = useState(false); // State for loading auto bid
  const [hasExistingAutoBid, setHasExistingAutoBid] = useState(false); // State to track if user has existing auto-bid
  const [deletingAutoBid, setDeletingAutoBid] = useState(false); // State for deleting auto bid
  const [showCongrats, setShowCongrats] = useState(false); // Winner banner visibility
  const [showAcceptedModal, setShowAcceptedModal] = useState(false); // Owner accepted offer modal

  // Get tender ID from URL params or search params
  const routeId = params?.id;
  const queryId = searchParams.get("id");
  const tenderId = routeId || queryId;
  const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-dark.png";
  const DEFAULT_USER_AVATAR = "/assets/images/avatar.jpg";
  const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

  // Add error boundary with better error information
  if (error && !loading) {
    return (
      <div className="auction-details-section mb-110" style={{ marginTop: 0, paddingTop: 0 }}>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 text-center">
              <div className="alert alert-danger">
                <h3>Une erreur s'est produite</h3>
                <p>{error}</p>
                {errorDetails && (
                  <details style={{ marginTop: '10px', textAlign: 'left' }}>
                    <summary style={{ cursor: 'pointer', color: '#721c24' }}>
                      Détails techniques (pour le débogage)
                    </summary>
                    <pre style={{ 
                      background: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '5px', 
                      fontSize: '12px',
                      marginTop: '10px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {JSON.stringify(errorDetails, null, 2)}
                    </pre>
                  </details>
                )}
                <div style={{ marginTop: '20px' }}>
                  <button 
                    className="btn btn-primary me-2"
                    onClick={() => window.location.reload()}
                  >
                    Réessayer
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => router.push('/tenders')}
                  >
                    Retour aux appels d'offres
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!tenderData) return;
    let inter = setInterval(() => {
      try {
        // Use the local getTimeRemaining for consistent formatting
        const dataTimer = getTimeRemaining(safeEndingAt);
        setTime({
          day: dataTimer.days,
          hour: dataTimer.hours,
          mun: dataTimer.minutes,
          sec: dataTimer.seconds,
        });
      } catch (err) {
        console.error("Error updating timer:", err);
        // Set default values if timer fails
        setTime({
          day: "00",
          hour: "00",
          mun: "00",
          sec: "00",
        });
      }
    }, 1000);
    return () => clearInterval(inter);
  }, [tenderData]);

  useEffect(() => {
    const fetchTenderDetails = async () => {
      try {
        if (!tenderId) {
          console.error("No tender ID found in URL parameters");
          setError("ID d'appel d'offres introuvable. Veuillez vérifier l'URL.");
          setErrorDetails({
            type: "MISSING_TENDER_ID",
            routeId,
            queryId,
            params: params,
            searchParams: searchParams ? Object.fromEntries(searchParams.entries()) : null
          });
          setLoading(false);
          return;
        }

        console.log("Fetching tender details for ID:", tenderId);
        console.log("API Base URL:", app.baseURL);
        setLoading(true);
        
        // Test server connectivity first
        try {
          const testResponse = await fetch(`${app.baseURL}health`, { 
            method: 'GET',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log("Server health check response:", testResponse.status);
        } catch (healthError) {
          console.warn("Server health check failed:", healthError);
        }

        const response = await TendersAPI.getTenderById(tenderId);
        console.log("Tender API response:", response);
        console.log("Response type:", typeof response);
        console.log("Response keys:", response ? Object.keys(response) : 'No response');
        
        // Handle different response structures
        let data = null;
        if (response) {
          if (response.data) {
            data = response.data;
            console.log("Using response.data:", data);
          } else if (response.success && response.data) {
            data = response.data;
            console.log("Using response.data from success object:", data);
          } else if (typeof response === 'object' && !response.success) {
            data = response;
            console.log("Using response directly:", data);
          }
        }
        
        console.log("Final extracted tender data:", data);
        console.log("Data type:", typeof data);
        console.log("Data keys:", data ? Object.keys(data) : 'No data');
        
        if (!data) {
          // For development, provide test data if no data is received
          if (process.env.NODE_ENV === 'development') {
            console.warn("No data received, using test data for development");
            const testData = {
              _id: tenderId,
              title: "Appel d'offres de test",
              description: "Ceci est un appel d'offres de test pour le développement",
              maxBudget: 100000,
              tenderType: "SERVICE",
              status: "OPEN",
              category: { name: "Services informatiques" },
              location: "Alger",
              wilaya: "Alger",
              endingAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              startingAt: new Date().toISOString(),
              attachments: [],
              videos: [],
              offers: [],
              requirements: ["Expérience minimum 2 ans", "Certification requise"],
              quantity: "1",
              minimumPrice: 50000
            };
            setTenderData(testData);
            setLoading(false);
            return;
          }
          throw new Error("Aucune donnée reçue du serveur");
        }
        
        setTenderData(data);
        // Assuming offers are populated within tenderData
        if (data?.offers) {
          setOffers(data.offers);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tender details:", err);
        
        // Enhanced error handling
        let errorMessage = "Impossible de charger les détails de l'appel d'offres. Veuillez réessayer plus tard.";
        let errorType = "UNKNOWN_ERROR";
        
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
          errorType = "NETWORK_ERROR";
        } else if (err.response) {
          // Server responded with error status
          const status = err.response.status;
          if (status === 404) {
            errorMessage = "Appel d'offres introuvable. Il a peut-être été supprimé.";
            errorType = "NOT_FOUND";
          } else if (status === 401) {
            errorMessage = "Accès non autorisé. Veuillez vous reconnecter.";
            errorType = "UNAUTHORIZED";
          } else if (status >= 500) {
            errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
            errorType = "SERVER_ERROR";
          }
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
          errorMessage = "Serveur inaccessible. Vérifiez que le serveur est en cours d'exécution.";
          errorType = "SERVER_UNREACHABLE";
        }
        
        setError(errorMessage);
        setErrorDetails({
          type: errorType,
          message: err.message,
          stack: err.stack,
          tenderId,
          apiUrl: `${app.baseURL}bid/${tenderId}`,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
        });
        setLoading(false);
      }
    };

    fetchTenderDetails();
  }, [tenderId, params, searchParams]);

  // Extract fetchAutoBidData as a reusable function
  const fetchAutoBidData = async () => {
    if (!isLogged || !auth.tokens || !tenderId || !tenderData) {
      return;
    }

    // Only fetch for PROFESSIONAL users
    if (auth.user?.type !== 'PROFESSIONAL') {
      return;
    }

    // Compute max budget to avoid dependency issues
    const maxBudget = tenderData?.maxBudget || 0;

    try {
      setLoadingAutoBid(true);
      console.log("Fetching auto-bid data for tender:", tenderId);
      
      const autoBidResponse = await AutoBidAPI.getAutoBidByAuctionAndUser(tenderId);
      console.log("Auto-bid response:", autoBidResponse);

      if (autoBidResponse.success && autoBidResponse.data) {
        // User has an auto-bid for this auction, use that price
        console.log("Found existing auto-bid:", autoBidResponse.data);
        setProfessionalAmount(autoBidResponse.data.price.toString());
        setHasExistingAutoBid(true);
      } else {
        // No auto-bid found, use max budget
        console.log("No auto-bid found, using max budget");
        setProfessionalAmount(maxBudget.toString());
        setHasExistingAutoBid(false);
      }
    } catch (err) {
      console.error("Error fetching auto-bid data:", err);
      // If error, use max budget as fallback and assume no existing auto-bid
      setProfessionalAmount(maxBudget.toString());
      setHasExistingAutoBid(false);
    } finally {
      setLoadingAutoBid(false);
    }
  };

  // Fetch auto-bid data for professional users on component mount and data changes
  useEffect(() => {
    fetchAutoBidData();
  }, [isLogged, auth.tokens, tenderId, tenderData, auth.user?.type]);

  // Fetch offers using OfferAPI
  const fetchOffers = async () => {
    if (!isLogged || !auth.tokens || !tenderId) {
      return;
    }

    try {
      setLoadingOffers(true);
      console.log("Fetching offers for tender:", tenderId);
      
      // Fetch all offers for this tender
      const offersResponse = await OfferAPI.getOffersByTenderId(tenderId);
      console.log("Offers response:", offersResponse);
      
      if (offersResponse.success && offersResponse.data) {
        // Filter offers for this specific tender
        const tenderOffers = offersResponse.data.filter(offer => 
          offer.auctionId === tenderId || offer.tenderId === tenderId
        );
        setOffers(tenderOffers);
      }
      
      // Fetch user's offers
      if (auth.user?._id) {
        const myOffersResponse = await OfferAPI.getOffersByUserId(auth.user._id);
        console.log("My offers response:", myOffersResponse);
        
        if (myOffersResponse.success && myOffersResponse.data) {
          // Filter user's offers for this specific tender
          const myTenderOffers = myOffersResponse.data.filter(offer => 
            offer.auctionId === tenderId || offer.tenderId === tenderId
          );
          setMyOffers(myTenderOffers);
        }
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
      // Don't show error to user as this is background data
    } finally {
      setLoadingOffers(false);
    }
  };

  // Fetch offers when component mounts and user logs in
  useEffect(() => {
    fetchOffers();
  }, [isLogged, auth.tokens, tenderId, auth.user?._id]);

  // Fetch tender bids using TendersAPI
  const fetchTenderBids = async () => {
    if (!tenderId) return;

    try {
      console.log("Fetching tender bids for tender:", tenderId);
      const bidsResponse = await TendersAPI.getTenderBids(tenderId);
      console.log("Tender bids response:", bidsResponse);
      
      if (bidsResponse.success && bidsResponse.data) {
        setOffers(bidsResponse.data);
      }
    } catch (err) {
      console.error("Error fetching tender bids:", err);
    }
  };

  // Fetch tender bids when component mounts
  useEffect(() => {
    fetchTenderBids();
  }, [tenderId]);

  // Fetch user's tender bids using TendersAPI
  const fetchMyTenderBids = async () => {
    if (!isLogged || !auth.tokens || !auth.user?._id) return;

    try {
      console.log("Fetching user's tender bids for user:", auth.user._id);
      const myBidsResponse = await TendersAPI.getMyTenderBids(auth.user._id);
      console.log("User's tender bids response:", myBidsResponse);
      
      if (myBidsResponse.success && myBidsResponse.data) {
        // Filter bids for this specific tender
        const myTenderBids = myBidsResponse.data.filter(bid => 
          bid.tenderId === tenderId || bid.tender === tenderId
        );
        setMyOffers(myTenderBids);
      }
    } catch (err) {
      console.error("Error fetching user's tender bids:", err);
    }
  };

  // Fetch user's tender bids when user logs in
  useEffect(() => {
    fetchMyTenderBids();
  }, [isLogged, auth.tokens, tenderId, auth.user?._id]);

  // When owner accepts participant's offer → show congratulation modal and open chat
  useEffect(() => {
    try {
      if (!isLogged || !auth?.user?._id || !Array.isArray(myOffers)) return;
      const hasAccepted = myOffers.some(bid => (bid.status === 'accepted' || bid.status === 'ACCEPTED'));
      if (hasAccepted && !showAcceptedModal) {
        setShowAcceptedModal(true);
        toast.success("🎉 Votre offre a été acceptée ! Un chat avec l'acheteur va s'ouvrir.");
        // Auto open chat after short delay
        setTimeout(() => router.push('/messages'), 1500);
      }
    } catch (_) {}
  }, [isLogged, auth?.user?._id, myOffers, showAcceptedModal]);

  useEffect(() => {
    // Fetch all tenders for 'Appels d'Offres Similaires'
    const fetchAllTenders = async () => {
      try {
        const response = await TendersAPI.getActiveTenders();
        // Handle different response structures
        const tendersData = response?.data || response || [];
        // Ensure we always set an array
        setAllTenders(Array.isArray(tendersData) ? tendersData : []);
      } catch (err) {
        console.error("Error fetching similar tenders:", err);
        setAllTenders([]);
      }
    };
    fetchAllTenders();
  }, []);

  // Update timers for similar tenders
  useEffect(() => {
    if (!Array.isArray(allTenders) || allTenders.length === 0) return;
    const filtered = allTenders
      .filter((tender) => tender._id !== tenderId)
      .slice(0, 4);
    function updateTimers() {
      setSimilarTenderTimers(
        filtered.map((tender) => {
          const endDate =
            tender.endDate || tender.endingAt || "2024-09-23 11:42:00";
          return getTimeRemaining(endDate); // getTimeRemaining now formats with leading zeros
        })
      );
    }
    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [allTenders, tenderId]);

  // Add null checks for critical data with better debugging
  const safeTenderData = tenderData || {};
  
  // Debug logging
  console.log("Raw tenderData:", tenderData);
  console.log("Safe tenderData:", safeTenderData);
  
  const safeAttachments = safeTenderData.attachments || safeTenderData.images || [];
  const safeVideos = safeTenderData.videos || [];
  const safeTitle = safeTenderData.title || safeTenderData.name || "Appel d'offres";
  const safeMaxBudget = safeTenderData.maxBudget || safeTenderData.budget || safeTenderData.maximumBudget || 0;
  const safeOwner = safeTenderData.owner || safeTenderData.seller || null;
  const safeEndingAt = safeTenderData.endingAt || safeTenderData.endDate || safeTenderData.endTime;
  const safeStartingAt = safeTenderData.startingAt || safeTenderData.startDate || safeTenderData.startTime;
  const safeDescription = safeTenderData.description || safeTenderData.details || "Aucune description disponible.";
  const safeCategory = safeTenderData.category || null;
  const safeSubCategory = safeTenderData.subCategory || safeTenderData.subcategory || null;
  const safeTenderType = safeTenderData.tenderType || safeTenderData.type || "SERVICE";
  const safeStatus = safeTenderData.status || safeTenderData.state || "OPEN";
  const safeAwardedTo = safeTenderData.awardedTo || safeTenderData.awardedUser || null;
  const safeLocation = safeTenderData.location || safeTenderData.address || "";
  const safeWilaya = safeTenderData.wilaya || safeTenderData.region || "";
  const safeQuantity = safeTenderData.quantity || safeTenderData.amount || "";
  const safeRequirements = safeTenderData.requirements || safeTenderData.specifications || [];
  const safeMinimumPrice = safeTenderData.minimumPrice || safeTenderData.minPrice || 0;

  // Using the real end date if available, otherwise fallback to static date
  const endDate = safeEndingAt || "2024-09-23 11:42:00";
  const { days, hours, minutes, seconds } = useCountdownTimer(endDate);

  // Detect winner (current user is awarded) and show congratulatory banner once
  useEffect(() => {
    try {
      if (!isLogged || !auth?.user?._id || !safeAwardedTo) return;
      const awardedId = typeof safeAwardedTo === 'string' ? safeAwardedTo : safeAwardedTo?._id;
      const isWinner = awardedId && awardedId === auth.user._id;
      if (isWinner && safeStatus === 'AWARDED' && !showCongrats) {
        setShowCongrats(true);
        toast.success("🎉 Félicitations ! Vous avez remporté cet appel d'offres. Un chat avec l'acheteur est disponible.");
      }
    } catch (_) {}
  }, [isLogged, auth?.user?._id, safeAwardedTo, safeStatus, showCongrats]);

  // Rest of the component remains the same
  const settings = useMemo(() => {
    return {
      slidesPerView: "auto",
      speed: 1500,
      spaceBetween: 15,
      grabCursor: true,
      autoplay: {
        delay: 2500, // Autoplay duration in milliseconds
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".category-slider-next",
        prevEl: ".category-slider-prev",
      },

      breakpoints: {
        280: {
          slidesPerView: 2,
        },
        350: {
          slidesPerView: 3,
          spaceBetween: 10,
        },
        576: {
          slidesPerView: 3,
          spaceBetween: 15,
        },
        768: {
          slidesPerView: 4,
        },
        992: {
          slidesPerView: 5,
          spaceBetween: 15,
        },
        1200: {
          slidesPerView: 5,
        },
        1400: {
          slidesPerView: 5,
        },
      },
    };
  }, []);
  const settingsForUpcomingAuction = useMemo(() => {
    return {
      slidesPerView: "auto",
      speed: 1500,
      spaceBetween: 25,
      autoplay: {
        delay: 2500, // Autoplay duration in milliseconds
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".auction-slider-next",
        prevEl: ".auction-slider-prev",
      },

      breakpoints: {
        280: {
          slidesPerView: 1,
        },
        386: {
          slidesPerView: 1,
        },
        576: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 2,
        },
        992: {
          slidesPerView: 3,
        },
        1200: {
          slidesPerView: 4,
        },
        1400: {
          slidesPerView: 4,
        },
      },
    };
  }, []);

  // Function to handle thumbnail click
  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
    setShowVideo(false); // Switch back to image view
  };

  // Function to handle video thumbnail click
  const handleVideoThumbnailClick = (index) => {
    setSelectedVideoIndex(index);
    setShowVideo(true); // Switch to video view
  };

  // Function to switch between image and video view
  const toggleMediaView = () => {
    setShowVideo(!showVideo);
  };

  // Determine if the current user is the owner of the auction
  const isOwner =
    isLogged &&
    safeOwner &&
    auth.user._id === (safeOwner._id || safeOwner);

  // Handle bid submission for tender (lowest price bidding)
  const handleBidSubmit = async (e) => {
    e.preventDefault();

    console.log(
      "[MultipurposeDetails2] handleBidSubmit - isLogged:",
      isLogged,
      "auth.tokens:",
      auth.tokens,
      "auth.user:",
      auth.user
    );

    try {
      // Check if user is logged in
      if (!isLogged || !auth.tokens) {
        toast.error("Veuillez vous connecter pour soumettre une offre");
        router.push("/auth/login");
        return;
      }

      // Get bid amount from the quantity input
      const bidInput = document.querySelector(".quantity__input");
      if (!bidInput || !bidInput.value) {
        toast.error("Veuillez entrer un montant d'offre valide");
        return;
      }

      const bidAmountRaw = bidInput.value;
      console.log("[MultipurposeDetails2] Raw bid amount:", bidAmountRaw);

      // Clean the bid amount - remove formatting
      let cleanBidAmount = bidAmountRaw;
      
      // Remove ",00 " suffix if present
      cleanBidAmount = cleanBidAmount.replace(/,00\s*$/, "");
      
      // Remove all commas (thousands separators)
      cleanBidAmount = cleanBidAmount.replace(/,/g, "");
      
      // Remove any currency symbols or extra spaces
      cleanBidAmount = cleanBidAmount.replace(/[^\d.]/g, "");

      console.log("[MultipurposeDetails2] Cleaned bid amount:", cleanBidAmount);

      // Parse to number and validate
      const numericBidAmount = parseFloat(cleanBidAmount);
      
      if (isNaN(numericBidAmount) || numericBidAmount <= 0) {
        toast.error("Veuillez entrer un nombre valide pour le montant de l'offre");
        return;
      }

      // For tenders, only validate that the bid amount is positive
      // No maximum or minimum limits - tenders accept any price

      // Round to avoid floating point issues
      const finalBidAmount = Math.round(numericBidAmount);

      console.log("[MultipurposeDetails2] Final bid amount:", finalBidAmount);
      console.log("[MultipurposeDetails2] Tender data:", tenderData);

      // Prepare the payload for tender bid (only send bidAmount, controller will set bidder and tenderOwner)
      const payload = {
        bidAmount: finalBidAmount,
      };

      console.log("[MultipurposeDetails2] Sending tender bid payload:", payload);
      console.log("[MultipurposeDetails2] Payload types:", {
        bidAmount: typeof payload.bidAmount
      });

      // Validate required fields
      if (!auth.user._id) {
        toast.error("Utilisateur non valide. Veuillez vous reconnecter.");
        return;
      }

      try {
        // Send the tender bid using TendersAPI
        const bidResponse = await TendersAPI.submitTenderBid(tenderId, payload);
        console.log("[MultipurposeDetails2] Tender bid response:", bidResponse);
        
        // Also create an offer record for tracking
        try {
          const offerPayload = {
            price: finalBidAmount,
            user: auth.user._id,
            owner: safeOwner?._id || safeOwner,
          };
          
          console.log("[MultipurposeDetails2] Creating offer with payload:", offerPayload);
          const offerResponse = await OfferAPI.sendOffer(tenderId, offerPayload);
          console.log("[MultipurposeDetails2] Offer creation response:", offerResponse);
        } catch (offerErr) {
          console.warn("Offer creation failed (this is optional):", offerErr);
          // Don't show error as tender bid succeeded
        }
        
        // Show success message
        toast.success("Votre offre a été soumise avec succès !");
        
        // Clear the input
        if (bidInput) {
          bidInput.value = "";
        }
        
        // Refresh the tender data after placing a bid
        try {
          const refreshedResponse = await TendersAPI.getTenderById(tenderId);
          console.log("Refreshed tender response:", refreshedResponse);
          
          // Extract data from response using the same logic as initial fetch
          let refreshedData = null;
          if (refreshedResponse) {
            if (refreshedResponse.data) {
              refreshedData = refreshedResponse.data;
            } else if (refreshedResponse.success && refreshedResponse.data) {
              refreshedData = refreshedResponse.data;
            } else if (typeof refreshedResponse === 'object' && !refreshedResponse.success) {
              refreshedData = refreshedResponse;
            }
          }
          
          console.log("Extracted refreshed data:", refreshedData);
          if (refreshedData) {
            setTenderData(refreshedData);
          }
          
          // Refresh offers and bids
          await fetchOffers();
          await fetchTenderBids();
          await fetchMyTenderBids();
        } catch (refreshErr) {
          console.warn("Failed to refresh tender data after successful bid:", refreshErr);
        }
      } catch (submitError) {
        console.log("[MultipurposeDetails2] Tender bid submission error:", submitError);
        
        // Check if the error response contains a success flag
        if (submitError?.response?.data?.success === true) {
          console.log("[MultipurposeDetails2] Detected successful operation despite error:", submitError);
          toast.success("Votre offre a été soumise avec succès !");
          
          // Refresh data
          try {
            const refreshedResponse = await TendersAPI.getTenderById(tenderId);
            console.log("Error case refreshed tender response:", refreshedResponse);
            
            // Extract data from response using the same logic as initial fetch
            let refreshedData = null;
            if (refreshedResponse) {
              if (refreshedResponse.data) {
                refreshedData = refreshedResponse.data;
              } else if (refreshedResponse.success && refreshedResponse.data) {
                refreshedData = refreshedResponse.data;
              } else if (typeof refreshedResponse === 'object' && !refreshedResponse.success) {
                refreshedData = refreshedResponse;
              }
            }
            
            console.log("Error case extracted refreshed data:", refreshedData);
            if (refreshedData) {
              setTenderData(refreshedData);
            }
            
            await fetchOffers();
            await fetchTenderBids();
            await fetchMyTenderBids();
          } catch (refreshErr) {
            console.warn("Failed to refresh tender data:", refreshErr);
          }
        } else {
          // Re-throw the error to be caught by the outer catch block
          throw submitError;
        }
      }

    } catch (err) {
      console.error("Error placing tender bid:", err);
      
      // Extract user-friendly error message
      let errorMessage = "Échec de la soumission d'offre. Veuillez réessayer.";
      
      console.log("Error details:", err);
      console.log("Error response:", err?.response?.data);
      
      if (err?.response?.data?.message) {
        const serverMessage = err.response.data.message;
        console.log("Server error message:", serverMessage);
        
        // Handle specific error messages from server
        if (serverMessage.includes('Bid amount must be lower than current lowest bid')) {
          errorMessage = `Votre offre doit être inférieure à l'offre actuelle la plus basse. ${serverMessage}`;
        } else if (serverMessage.includes('Bid amount is below minimum acceptable price')) {
          errorMessage = `Le montant de votre offre est inférieur au prix minimum acceptable. ${serverMessage}`;
        } else if (serverMessage.includes('Tender is no longer accepting bids')) {
          errorMessage = "Cet appel d'offres n'accepte plus d'offres.";
        } else if (serverMessage.includes('Tender has ended')) {
          errorMessage = "Cet appel d'offres est terminé.";
        } else if (serverMessage.includes('Bid amount must be a positive number')) {
          errorMessage = "Le montant de l'offre doit être un nombre positif.";
        } else if (serverMessage.includes('Bidder ID is required')) {
          errorMessage = "Erreur d'authentification. Veuillez vous reconnecter.";
        } else if (serverMessage.includes('Tender owner ID is required')) {
          errorMessage = "Erreur de données. Veuillez réessayer.";
        } else {
          errorMessage = serverMessage;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    }
  };

  // Handle bid submission for similar tenders
  const handleSimilarTenderBid = async (similarTender) => {
    try {
      // Check if user is logged in
      if (!isLogged || !auth.tokens) {
        toast.error("Veuillez vous connecter pour soumettre une offre");
        router.push("/auth/login");
        return;
      }

      // Check if tender has ended
      const tenderEndDate = similarTender.endDate || similarTender.endingAt;
      if (tenderEndDate && new Date(tenderEndDate) <= new Date()) {
        toast.error("Cet appel d'offres est terminé");
        return;
      }

      // Check if user is the owner of the tender
      const isOwner = isLogged && auth.user._id === (similarTender.owner?._id || similarTender.owner);
      if (isOwner) {
        toast.error("Vous ne pouvez pas soumettre d'offre sur votre propre appel d'offres");
        return;
      }

      // For tenders, suggest a starting bid amount (user can change it)
      const suggestedBid = 1000; // Default starting bid - user can modify

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Voulez-vous soumettre une offre de ${formatPrice(suggestedBid)} pour "${similarTender.title || similarTender.name}" ?`
      );

      if (!confirmed) {
        return;
      }

      const bidPayload = {
        bidAmount: Math.floor(suggestedBid),
        bidder: auth.user._id,
        tenderOwner: similarTender.owner?._id || similarTender.owner,
      };
      
      console.log("[MultipurposeDetails2 ] Sending similar tender bid:", bidPayload);

      try {
        // Send the offer - using Math.floor to ensure whole number
        const offerResponse = await TendersAPI.submitTenderBid(similarTender._id, bidPayload);
        
        console.log("[MultipurposeDetails2 ] Similar tender bid response:", offerResponse);
        
        // Also try to send via OfferAPI as backup/additional method
        try {
          const offerAPIPayload = {
            price: Math.floor(suggestedBid),
            user: auth.user._id,
            owner: similarTender.owner?._id || similarTender.owner,
          };
          
          const offerAPIResponse = await OfferAPI.sendOffer(similarTender._id, offerAPIPayload);
          console.log("[MultipurposeDetails2 ] Similar tender OfferAPI response:", offerAPIResponse);
        } catch (offerAPIErr) {
          console.warn("Similar tender OfferAPI submission failed (this is optional):", offerAPIErr);
          // Don't show error as TendersAPI succeeded
        }
        
        // Always show success message if we got here (no exception thrown)
        toast.success("Votre offre a été soumise avec succès !");
        
        // Refresh the similar tenders data
        try {
          const response = await TendersAPI.getActiveTenders();
          const tendersData = response?.data || response || [];
          setAllTenders(Array.isArray(tendersData) ? tendersData : []);
          
          // Also refresh offers and bids
          await fetchOffers();
          await fetchTenderBids();
          await fetchMyTenderBids();
        } catch (refreshErr) {
          console.warn("Failed to refresh tender data after successful bid:", refreshErr);
        }
      } catch (submitError) {
        // If there was an error during submission, check if it has a status code
        // Status codes in the 2xx range indicate success despite the error
        const statusCode = submitError?.response?.status;
        const hasSuccessStatus = statusCode && statusCode >= 200 && statusCode < 300;
        
        console.log("[MultipurposeDetails2 ] Similar tender bid error:", submitError, "Status code:", statusCode);
        
        // If we have a success status code, treat it as success
        if (hasSuccessStatus) {
          toast.success("Votre offre a été soumise avec succès !");
          
          // Try to refresh the tender data
          try {
            const response = await TendersAPI.getActiveTenders();
            const tendersData = response?.data || response || [];
            setAllTenders(Array.isArray(tendersData) ? tendersData : []);
          } catch (refreshErr) {
            console.warn("Failed to refresh similar tenders data:", refreshErr);
          }
        } else {
          // Re-throw the error to be caught by the outer catch block
          throw submitError;
        }
      }

    } catch (err) {
      console.error("Error placing bid on similar tender:", err);
      
      // Check if the error response contains a success flag that's true
      // This handles cases where the offer was saved but error was thrown anyway
      if (err?.response?.data?.success === true) {
        console.log("[MultipurposeDetails2 ] Detected successful operation despite error:", err);
        toast.success("Votre offre a été soumise avec succès !");
        
        // Refresh the tender data
        try {
          const response = await TendersAPI.getActiveTenders();
          const tendersData = response?.data || response || [];
          setAllTenders(Array.isArray(tendersData) ? tendersData : []);
        } catch (refreshErr) {
          console.warn("Failed to refresh similar tenders data:", refreshErr);
        }
        return;
      }
      
      // Check if we have data despite the error
      if (err?.response?.data) {
        console.log("[MultipurposeDetails2 ] Error response contains data:", err.response.data);
        
        // If the data contains a valid offer object, consider it a success
        if (err.response.data.price || err.response.data._id) {
          console.log("[MultipurposeDetails2 ] Found offer data in error response, treating as success");
          toast.success("Votre offre a été soumise avec succès !");
          
          // Refresh the tender data
          try {
            const response = await TendersAPI.getActiveTenders();
            const tendersData = response?.data || response || [];
            setAllTenders(Array.isArray(tendersData) ? tendersData : []);
          } catch (refreshErr) {
            console.warn("Failed to refresh similar tenders data:", refreshErr);
          }
          return;
        }
      }
      
      let errorMessage = "Échec de la soumission d'offre. Veuillez réessayer.";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!isLogged || !auth.tokens) {
      toast.error("Veuillez vous connecter pour soumettre un avis");
      router.push("/auth/login");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Veuillez entrer votre comment.");
      return;
    }

    if (reviewRating === 0) {
      toast.error("Veuillez donner une note.");
      return;
    }

    try {
      const reviewData = {
        rating: reviewRating,
        comment: reviewText,
        user: auth.user._id, // Assuming auth.user._id is available
        auction: tenderId, // Pass the auction ID
      };

      await ReviewAPI.submitReview(tenderId, reviewData);
      toast.success("Votre avis a été soumis avec succès !");
      setReviewText("");
      setReviewRating(0);
      // Optionally refresh auction data to show new review
      const refreshedResponse = await TendersAPI.getTenderById(tenderId);
      console.log("Review refresh tender response:", refreshedResponse);
      
      // Extract data from response using the same logic as initial fetch
      let refreshedData = null;
      if (refreshedResponse) {
        if (refreshedResponse.data) {
          refreshedData = refreshedResponse.data;
        } else if (refreshedResponse.success && refreshedResponse.data) {
          refreshedData = refreshedResponse.data;
        } else if (typeof refreshedResponse === 'object' && !refreshedResponse.success) {
          refreshedData = refreshedResponse;
        }
      }
      
      console.log("Review extracted refreshed data:", refreshedData);
      if (refreshedData) {
        setTenderData(refreshedData);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Échec de la soumission de l'avis. Veuillez réessayer.");
      }
    }
  };

  // Function to format price with currency symbol - using Math.floor to ensure whole numbers
  const formatPrice = (price) => {
    return `${Math.floor(Number(price)).toLocaleString()},00 `;
  };

  // Handle auto-bid for professional users
  const handleAutoBidSave = async () => {
    if (!isLogged || !auth.tokens) {
      toast.error("Veuillez vous connecter pour sauvegarder l'auto-enchère");
      return;
    }

    if (!professionalAmount || parseFloat(professionalAmount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    const amount = parseFloat(professionalAmount);
    if (amount > safeMaxBudget) {
      toast.error(`Le montant ne peut pas dépasser le budget maximum de ${formatPrice(safeMaxBudget)}`);
      return;
    }

    try {
      setSavingAutoBid(true);
      
      // Call the auto-bid API using AutoBidAPI
      try {
        console.log("Calling createOrUpdateAutoBid with:", {
          tenderId,
          price: amount,
          user: auth.user._id,
          bid: tenderId
        });
        
        const result = await AutoBidAPI.createOrUpdateAutoBid(tenderId, {
          price: amount,
          user: auth.user._id,
          bid: tenderId
        });
        
        console.log("Auto-bid creation result:", result);
        
        // Immediately update UI state without waiting for a refresh
        setHasExistingAutoBid(true);
        setProfessionalAmount(amount.toString());
        
        toast.success("Auto-enchère sauvegardée avec succès !");
        
        // Also refresh the auction data to get any updates in the background
        try {
          const refreshedResponse = await TendersAPI.getTenderById(tenderId);
          console.log("Auto-bid refresh tender response:", refreshedResponse);
          
          // Extract data from response using the same logic as initial fetch
          let refreshedData = null;
          if (refreshedResponse) {
            if (refreshedResponse.data) {
              refreshedData = refreshedResponse.data;
            } else if (refreshedResponse.success && refreshedResponse.data) {
              refreshedData = refreshedResponse.data;
            } else if (typeof refreshedResponse === 'object' && !refreshedResponse.success) {
              refreshedData = refreshedResponse;
            }
          }
          
          console.log("Auto-bid extracted refreshed data:", refreshedData);
          if (refreshedData) {
            setTenderData(refreshedData);
            if (refreshedData?.offers) {
              setOffers(refreshedData.offers);
            }
          }
        } catch (refreshErr) {
          console.warn("Could not refresh auction data:", refreshErr);
          // Don't show error to user as auto-bid was saved successfully
        }
      } catch (autoBidError) {
        console.error("Error in createOrUpdateAutoBid:", autoBidError);
        
        // Check if the error response contains a success flag that's true
        const errorResponse = autoBidError?.response?.data;
        if (errorResponse && (errorResponse.success === true || errorResponse.data)) {
          console.log("Auto-bid created successfully despite error:", errorResponse);
          
          // Immediately update UI state
          setHasExistingAutoBid(true);
          setProfessionalAmount(amount.toString());
          
          toast.success("Auto-enchère sauvegardée avec succès !");
        } else {
          // Show error message
          let errorMessage = "Échec de la sauvegarde. Veuillez réessayer.";
          if (autoBidError?.response?.data?.message) {
            errorMessage = autoBidError.response.data.message;
          } else if (autoBidError?.message) {
            errorMessage = autoBidError.message;
          }
          toast.error(errorMessage);
        }
      }
      
    } finally {
      setSavingAutoBid(false);
      setLoadingAutoBid(false); // Make sure to reset loading state
    }
  };

  // Handle offer submission using OfferAPI as alternative method
  const handleOfferSubmission = async (tenderId, bidAmount, tenderOwner) => {
    try {
      const offerPayload = {
        price: bidAmount,
        user: auth.user._id,
        owner: tenderOwner,
      };
      
      console.log("Submitting offer via OfferAPI:", offerPayload);
      const response = await OfferAPI.sendOffer(tenderId, offerPayload);
      console.log("OfferAPI submission successful:", response);
      
      return response;
    } catch (err) {
      console.error("OfferAPI submission failed:", err);
      throw err;
    }
  };

  // Handle auto-bid deletion for professional users
  const handleAutoBidDelete = async () => {
    if (!isLogged || !auth.tokens) {
      toast.error("Veuillez vous connecter pour supprimer l'auto-enchère");
      return;
    }

    if (!hasExistingAutoBid) {
      toast.error("Aucune auto-enchère à supprimer");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer votre auto-enchère pour cette vente aux enchères ?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAutoBid(true);
      
      // Call the delete API
      try {
        console.log("Calling deleteAutoBid with:", {
          tenderId,
          userId: auth.user._id
        });
        
        await AutoBidAPI.deleteAutoBid(tenderId, auth.user._id);
        console.log("Auto-bid deletion successful");
        
        // Immediately update UI state without waiting for a refresh
        setHasExistingAutoBid(false);
        setProfessionalAmount(safeMaxBudget.toString());
        
        toast.success("Auto-enchère supprimée avec succès !");
      } catch (deleteBidError) {
        console.error("Error in deleteAutoBid:", deleteBidError);
        
        // Check if the error response contains a success flag
        const errorResponse = deleteBidError?.response?.data;
        if (errorResponse && errorResponse.success === true) {
          console.log("Auto-bid deleted successfully despite error:", errorResponse);
          
          // Immediately update UI state
          setHasExistingAutoBid(false);
          setProfessionalAmount(safeMaxBudget.toString());
          
          toast.success("Auto-enchère supprimée avec succès !");
        } else {
          // Show error message
          let errorMessage = "Échec de la suppression. Veuillez réessayer.";
          if (deleteBidError?.response?.data?.message) {
            errorMessage = deleteBidError.response.data.message;
          } else if (deleteBidError?.message) {
            errorMessage = deleteBidError.message;
          }
          toast.error(errorMessage);
          return; // Exit early if there was an error
        }
      }
      
    } finally {
      setDeletingAutoBid(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {loading ? (
        <div
          className="auction-details-section mb-110"
          style={{ marginTop: 0, paddingTop: 0 }}
        >
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 text-center">
                <div className="spinner-border text-warning" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h3 className="mt-3">Chargement des détails de l'appel d'offres...</h3>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div
          className="auction-details-section mb-110"
          style={{ marginTop: 0, paddingTop: 0 }}
        >
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 text-center">
                <div className="alert alert-danger">
                  <h3>{error}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !tenderData ? (
        <div
          className="auction-details-section mb-110"
          style={{ marginTop: 0, paddingTop: 0 }}
        >
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 text-center">
                <div className="alert alert-warning">
                  <h3>Aucune donnée d'appel d'offres trouvée</h3>
                  <p>L'appel d'offres demandé n'existe pas ou a été supprimé.</p>
                  <div style={{ marginTop: '20px' }}>
                    <button 
                      className="btn btn-primary me-2"
                      onClick={() => window.location.reload()}
                    >
                      Actualiser
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => router.push('/tenders')}
                    >
                      Retour aux appels d'offres
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {showCongrats && (
            <div style={{
              position: 'sticky', top: 0, zIndex: 50,
              background: 'linear-gradient(90deg, #0f9d58, #34a853)', color: '#fff',
              padding: '14px 16px', borderRadius: 12, marginBottom: 16,
              boxShadow: '0 8px 24px rgba(52,168,83,0.35)'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: 18
                  }}>🎉</div>
                  <div>
                    <div style={{fontWeight:700, fontSize:16}}>Félicitations ! Vous avez remporté cet appel d'offres</div>
                    <div style={{opacity:0.95, fontSize:13}}>Un chat avec l'acheteur est prêt pour finaliser les détails.</div>
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button
                    onClick={() => router.push('/messages')}
                    style={{
                      background:'#fff', color:'#0f9d58', border:'none',
                      padding:'10px 14px', borderRadius:10, fontWeight:700, cursor:'pointer'
                    }}
                    title="Ouvrir le chat avec l'acheteur"
                  >
                    Ouvrir le chat
                  </button>
                  <button
                    onClick={() => setShowCongrats(false)}
                    style={{
                      background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)',
                      padding:'10px 12px', borderRadius:10, cursor:'pointer'
                    }}
                    title="Masquer"
                  >
                    Masquer
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAcceptedModal && (
            <div style={{
              position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
              display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
            }}>
              <div style={{
                width:'min(520px, 92vw)', background:'#fff', borderRadius:16,
                boxShadow:'0 24px 64px rgba(0,0,0,0.25)', overflow:'hidden'
              }}>
                <div style={{
                  background:'linear-gradient(135deg,#4caf50,#2e7d32)', color:'#fff', padding:'18px 22px'
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:12}}>
                    <div style={{
                      width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.2)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:22
                    }}>🎉</div>
                    <div>
                      <div style={{fontSize:18, fontWeight:800}}>Félicitations !</div>
                      <div style={{opacity:0.95, fontSize:14}}>Votre offre a été acceptée par l'acheteur</div>
                    </div>
                  </div>
                </div>
                <div style={{padding:'20px 22px'}}>
                  <p style={{marginTop:0, color:'#333', lineHeight:1.6}}>
                    Vous avez remporté cet appel d'offres. Un chat est prêt pour démarrer la discussion et finaliser les détails.
                  </p>
                  <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:16}}>
                    <button
                      onClick={() => setShowAcceptedModal(false)}
                      style={{
                        background:'#f1f3f5', color:'#333', border:'1px solid #e0e0e0', padding:'10px 14px',
                        borderRadius:10, cursor:'pointer', fontWeight:600
                      }}
                    >Plus tard</button>
                    <button
                      onClick={() => router.push('/messages')}
                      style={{
                        background:'linear-gradient(90deg,#2e7d32,#4caf50)', color:'#fff', border:'none',
                        padding:'10px 16px', borderRadius:10, cursor:'pointer', fontWeight:800,
                        boxShadow:'0 6px 16px rgba(76,175,80,0.35)'
                      }}
                    >Ouvrir le chat</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className="auction-details-section auction-details-modern mb-110"
            style={{ marginTop: 0, paddingTop: 0 }}
          >
            <div className="container">
              <div className="row gy-5">
                {/* Left Column - Image Section */}
                <div className="col-xl-7">
                  <div className="main-image-container" style={{ position: 'relative' }}>
                    {showVideo && safeVideos.length > 0 ? (
                      <video
                        src={`${app.route}${safeVideos[selectedVideoIndex]?.url}`}
                        controls
                        className="main-video"
                        crossOrigin="use-credentials"
                        style={{
                          width: '100%',
                          height: '400px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                    <img
                      src={
                        safeAttachments.length > 0
                          ? `${app.route}${safeAttachments[selectedImageIndex]?.url}`
                          : DEFAULT_AUCTION_IMAGE
                      }
                      alt={safeTitle}
                      className="main-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_AUCTION_IMAGE;
                      }}
                      crossOrigin="use-credentials"
                    />
                    )}
                    
                    {/* Media type toggle buttons */}
                    {(safeAttachments.length > 0 || safeVideos.length > 0) && (
                      <div className="media-toggle-buttons" style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        display: 'flex',
                        gap: '8px',
                        zIndex: 10
                      }}>
                        {safeAttachments.length > 0 && (
                          <button
                            onClick={() => setShowVideo(false)}
                            className={`media-toggle-btn ${!showVideo ? 'active' : ''}`}
                            style={{
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              backgroundColor: !showVideo ? '#007bff' : 'rgba(255,255,255,0.8)',
                              color: !showVideo ? 'white' : '#333',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
                            📷 Images ({safeAttachments.length})
                          </button>
                        )}
                        {safeVideos.length > 0 && (
                          <button
                            onClick={() => setShowVideo(true)}
                            className={`media-toggle-btn ${showVideo ? 'active' : ''}`}
                            style={{
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              backgroundColor: showVideo ? '#007bff' : 'rgba(255,255,255,0.8)',
                              color: showVideo ? 'white' : '#333',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
                            🎥 Videos ({safeVideos.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="thumbnail-gallery-container">
                    <Swiper {...settings} className="swiper thumbnail-gallery">
                      {/* Image thumbnails */}
                      {safeAttachments.length > 0 && safeAttachments.map((attachment, index) => (
                        <SwiperSlide className="swiper-slide" key={`img-${index}`}>
                            <div
                              className={`thumbnail ${
                              !showVideo && index === selectedImageIndex ? "active" : ""
                              }`}
                            style={{ position: 'relative' }}
                            >
                              <img
                                src={`${app.route}${attachment.url}`}
                              alt={`${safeTitle} - Image ${index + 1}`}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = DEFAULT_AUCTION_IMAGE;
                                }}
                                crossOrigin="use-credentials"
                                onClick={() => handleThumbnailClick(index)}
                              style={{ cursor: 'pointer' }}
                            />
                            <div 
                              className="media-type-indicator"
                              style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}
                            >
                              📷
                            </div>
                            </div>
                          </SwiperSlide>
                      ))}
                      
                      {/* Video thumbnails */}
                      {safeVideos.length > 0 && safeVideos.map((video, index) => (
                        <SwiperSlide className="swiper-slide" key={`vid-${index}`}>
                          <div
                            className={`thumbnail ${
                              showVideo && index === selectedVideoIndex ? "active" : ""
                            }`}
                            style={{ position: 'relative' }}
                          >
                            <video
                              src={`${app.route}${video.url}`}
                              style={{
                                width: '100%',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                              }}
                              crossOrigin="use-credentials"
                              onClick={() => handleVideoThumbnailClick(index)}
                              muted
                              preload="metadata"
                            />
                            <div 
                              className="media-type-indicator"
                              style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}
                            >
                              🎥
                            </div>
                            <div 
                              className="play-overlay"
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px'
                              }}
                            >
                              ▶
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                      
                      {/* Default thumbnail if no media */}
                      {safeAttachments.length === 0 && safeVideos.length === 0 && (
                        <SwiperSlide className="swiper-slide">
                          <div className="thumbnail active">
                            <img
                              src={DEFAULT_AUCTION_IMAGE}
                              alt="Default Auction Item"
                              crossOrigin="use-credentials"
                            />
                          </div>
                        </SwiperSlide>
                      )}
                    </Swiper>
                  </div>
                </div>

                {/* Right Column - Auction Details */}
                <div className="col-xl-5">
                  <div className="auction-details-content">
                    <h1 className="auction-title">
                      {safeTitle}
                    </h1>

                    
                    {/* Auction timer and bid information */}
                    <div className="bid-container">
                      <div className="boxTime">
                        <div className="countdown-timer">
                          {/* Changed ul to div and applied inline styles for layout and appearance */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                background: "rgba(255, 255, 255, 0.2)",
                                backdropFilter: "blur(10px)",
                                borderRadius: "8px",
                                padding: "4px 8px",
                                minWidth: "35px",
                                textAlign: "center",
                                fontSize: "20px", // Larger font for numbers
                                fontWeight: "700", // Bolder font for numbers
                              }}
                            >
                              {time.day}
                              <div
                                style={{
                                  fontSize: "10px",
                                  opacity: 0.8,
                                  fontWeight: "normal",
                                }}
                              >
                                J
                              </div>
                            </div>
                            <span
                              style={{
                                opacity: 0.8,
                                fontSize: "20px",
                                fontWeight: "bold",
                              }}
                            >
                              :
                            </span>
                            <div
                              style={{
                                background: "rgba(255, 255, 255, 0.2)",
                                backdropFilter: "blur(10px)",
                                borderRadius: "8px",
                                padding: "4px 8px",
                                minWidth: "35px",
                                textAlign: "center",
                                fontSize: "20px",
                                fontWeight: "700",
                              }}
                            >
                              {time.hour}
                              <div
                                style={{
                                  fontSize: "10px",
                                  opacity: 0.8,
                                  fontWeight: "normal",
                                }}
                              >
                                H
                              </div>
                            </div>
                            <span
                              style={{
                                opacity: 0.8,
                                fontSize: "20px",
                                fontWeight: "bold",
                              }}
                            >
                              :
                            </span>
                            <div
                              style={{
                                background: "rgba(255, 255, 255, 0.2)",
                                backdropFilter: "blur(10px)",
                                borderRadius: "8px",
                                padding: "4px 8px",
                                minWidth: "35px",
                                textAlign: "center",
                                fontSize: "20px",
                                fontWeight: "700",
                              }}
                            >
                              {time.mun}
                              <div
                                style={{
                                  fontSize: "10px",
                                  opacity: 0.8,
                                  fontWeight: "normal",
                                }}
                              >
                                M
                              </div>
                            </div>
                            <span
                              style={{
                                opacity: 0.8,
                                fontSize: "20px",
                                fontWeight: "bold",
                              }}
                            >
                              :
                            </span>
                            <div
                              style={{
                                background: "rgba(255, 255, 255, 0.2)",
                                backdropFilter: "blur(10px)",
                                borderRadius: "8px",
                                padding: "4px 8px",
                                minWidth: "35px",
                                textAlign: "center",
                                fontSize: "20px",
                                fontWeight: "700",
                              }}
                            >
                              {time.sec}
                              <div
                                style={{
                                  fontSize: "10px",
                                  opacity: 0.8,
                                  fontWeight: "normal",
                                }}
                              >
                                S
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="auction-details-table mb-4">
                        <table className="table">
                          <tbody>
                            <tr>
                              <td className="fw-bold">Quantité</td>
                              <td>
                                {safeTenderData.quantity || "Non spécifiée"}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Type d'appel d'offres</td>
                              <td>{safeTenderType}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Catégorie</td>
                              <td>{safeCategory?.name || "Non spécifiée"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Localisation</td>
                              <td>{safeLocation} {safeWilaya && `, ${safeWilaya}`}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Statut</td>
                              <td>
                                <span className="status-badge">
                                  {safeStatus}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bid-section">
                        <p className="bid-label">Votre offre</p>
                        {isOwner && (
                          <div
                            style={{
                              backgroundColor: "#fff3cd",
                              border: "1px solid #ffeaa7",
                              borderRadius: "8px",
                              padding: "12px",
                              marginBottom: "16px",
                              color: "#856404",
                              fontSize: "14px",
                              fontWeight: "500",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            Vous ne pouvez pas soumettre d'offre sur votre propre
                            appel d'offres.
                          </div>
                        )}
                        
                        {/* Tender Bidding Instructions */}
                        {!isOwner && (
                          <div
                            style={{
                              backgroundColor: "#e3f2fd",
                              border: "1px solid #bbdefb",
                              borderRadius: "8px",
                              padding: "12px",
                              marginBottom: "16px",
                              color: "#1565c0",
                              fontSize: "13px",
                              fontWeight: "500",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              style={{ marginTop: "2px", flexShrink: 0 }}
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                            <div>
                              <strong>Instructions pour l'appel d'offres :</strong>
                              <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px" }}>
                                <li>Entrez le prix que vous proposez pour ce projet</li>
                                <li>Vous pouvez proposer n'importe quel prix</li>
                                <li>Le gagnant sera sélectionné par l'acheteur selon ses critères</li>
                                <li>Aucune limite de prix - soumettez votre offre</li>
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        <div className="quantity-counter-and-btn-area">
                          <HandleQuantity
                            initialValue=""
                            startingPrice={0}
                            placeholder="Entrez n'importe quel prix"
                          />
                          <button
                            className="bid-btn-modern"
                            onClick={isOwner ? undefined : handleBidSubmit}
                            disabled={isOwner}
                            style={{
                              opacity: isOwner ? 0.5 : 1,
                              cursor: isOwner ? "not-allowed" : "pointer",
                              pointerEvents: isOwner ? "none" : "auto",
                            }}
                            title={
                              isOwner
                                ? "Vous ne pouvez pas soumettre d'offre sur votre propre appel d'offres."
                                : "Soumettre votre offre"
                            }
                          >
                            <div className="btn-content">
                              <span>Soumettre une Offre</span>
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.4301 5.92993L20.5001 11.9999L14.4301 18.0699"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeMiterlimit="10"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M3.5 12H20.33"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeMiterlimit="10"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Professional User Special Access Box */}
                    {isLogged && auth.user?.type === 'PROFESSIONAL' && (
                      <div className="professional-access-box" style={{
                        marginTop: '24px',
                        padding: '24px',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        position: 'relative'
                      }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          {/* Header */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '20px'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
                              </svg>
                            </div>
                            <div>
                              <h4 style={{
                                margin: 0,
                                color: '#333',
                                fontSize: '18px',
                                fontWeight: '600'
                              }}>
                                Accès Professionnel
                                {loadingAutoBid && (
                                  <span style={{
                                    marginLeft: '8px',
                                    fontSize: '14px',
                                    color: '#666',
                                    fontWeight: 'normal'
                                  }}>
                                    (Chargement...)
                                  </span>
                                )}
                                {hasExistingAutoBid && !loadingAutoBid && (
                                  <span style={{
                                    marginLeft: '8px',
                                    fontSize: '12px',
                                    color: '#28a745',
                                    fontWeight: '500',
                                    background: '#d4edda',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    border: '1px solid #c3e6cb'
                                  }}>
                                    ✓ Auto-enchère active
                                  </span>
                                )}
                              </h4>
                              <p style={{
                                margin: '4px 0 0 0',
                                color: '#666',
                                fontSize: '14px'
                              }}>
                                {hasExistingAutoBid 
                                  ? "Vous avez une auto-enchère configurée pour cette vente" 
                                  : "Accès spécial pour les professionnels"
                                }
                              </p>
                            </div>
                          </div>

                          {/* Input Section */}
                          <div style={{
                            background: '#f8f9fa',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '20px',
                            border: '1px solid #e9ecef'
                          }}>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              color: '#333',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>
                              {hasExistingAutoBid ? 'Montant Auto-enchère Actuel (DA)' : 'Montant spécial (DA)'}
                            </label>
                            <input
                              type="number"
                              value={professionalAmount || safeMaxBudget}
                              onChange={(e) => setProfessionalAmount(e.target.value)}
                              placeholder={
                                loadingAutoBid 
                                  ? (savingAutoBid ? "Mise à jour..." : "Chargement...") 
                                  : "Entrez le montant"
                              }
                              disabled={loadingAutoBid}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                background: loadingAutoBid ? '#f5f5f5' : 'white',
                                color: loadingAutoBid ? '#999' : '#333',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                cursor: loadingAutoBid ? 'not-allowed' : 'text'
                              }}
                              onFocus={(e) => {
                                if (!loadingAutoBid) {
                                  e.target.style.borderColor = '#0063b1';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 99, 177, 0.1)';
                                }
                              }}
                              onBlur={(e) => {
                                if (!loadingAutoBid) {
                                  e.target.style.borderColor = '#ddd';
                                  e.target.style.boxShadow = 'none';
                                }
                              }}
                            />
                            <p style={{
                              margin: '8px 0 0 0',
                              color: '#666',
                              fontSize: '12px',
                            }}>
                              Quantité: {safeTenderData.quantity || "Non spécifiée"}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div style={{
                            display: 'flex',
                            gap: '12px'
                          }}>
                            {!hasExistingAutoBid ? (
                              /* Create New Auto-Bid Buttons */
                              <>
                                <button
                                  onClick={handleAutoBidSave}
                                  disabled={savingAutoBid || loadingAutoBid}
                                  style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: (savingAutoBid || loadingAutoBid) ? '#ccc' : 'linear-gradient(90deg, #0063b1, #00a3e0)',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: (savingAutoBid || loadingAutoBid) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: (savingAutoBid || loadingAutoBid) ? 'none' : '0 4px 12px rgba(0, 99, 177, 0.3)'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!savingAutoBid && !loadingAutoBid) {
                                      e.target.style.transform = 'translateY(-2px)';
                                      e.target.style.boxShadow = '0 6px 16px rgba(0, 99, 177, 0.4)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!savingAutoBid && !loadingAutoBid) {
                                      e.target.style.transform = 'translateY(0)';
                                      e.target.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.3)';
                                    }
                                  }}
                                >
                                  {savingAutoBid ? 'Création...' : 'Créer Auto-enchère'}
                                </button>
                                <button
                                  onClick={() => setProfessionalAmount('')}
                                  disabled={loadingAutoBid}
                                  style={{
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    background: loadingAutoBid ? '#f5f5f5' : 'white',
                                    color: loadingAutoBid ? '#999' : '#666',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: loadingAutoBid ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!loadingAutoBid) {
                                      e.target.style.background = '#f8f9fa';
                                      e.target.style.transform = 'translateY(-2px)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!loadingAutoBid) {
                                      e.target.style.background = 'white';
                                      e.target.style.transform = 'translateY(0)';
                                    }
                                  }}
                                >
                                  Effacer
                                </button>
                              </>
                            ) : (
                              /* Update/Delete Auto-Bid Buttons */
                              <>
                                <button
                                  onClick={handleAutoBidSave}
                                  disabled={savingAutoBid || loadingAutoBid}
                                  style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: (savingAutoBid || loadingAutoBid) ? '#ccc' : 'linear-gradient(90deg, #ffa500, #ff8c00)',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: (savingAutoBid || loadingAutoBid) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: (savingAutoBid || loadingAutoBid) ? 'none' : '0 4px 12px rgba(255, 165, 0, 0.3)'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!savingAutoBid && !loadingAutoBid) {
                                      e.target.style.transform = 'translateY(-2px)';
                                      e.target.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.4)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!savingAutoBid && !loadingAutoBid) {
                                      e.target.style.transform = 'translateY(0)';
                                      e.target.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.3)';
                                    }
                                  }}
                                >
                                  {savingAutoBid ? 'Mise à jour...' : 'Mettre à jour'}
                                </button>
                                <button
                                  onClick={handleAutoBidDelete}
                                  disabled={deletingAutoBid || loadingAutoBid}
                                  style={{
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: (deletingAutoBid || loadingAutoBid) ? '#ccc' : 'linear-gradient(90deg, #dc3545, #c82333)',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: (deletingAutoBid || loadingAutoBid) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: (deletingAutoBid || loadingAutoBid) ? 'none' : '0 4px 12px rgba(220, 53, 69, 0.3)'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!deletingAutoBid && !loadingAutoBid) {
                                      e.target.style.transform = 'translateY(-2px)';
                                      e.target.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.4)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!deletingAutoBid && !loadingAutoBid) {
                                      e.target.style.transform = 'translateY(0)';
                                      e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
                                    }
                                  }}
                                >
                                  {deletingAutoBid ? 'Suppression...' : 'Supprimer'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <ul className="question-and-wishlist-area">
                      <li>
                        <Link href="/how-to-bid">
                          <span>
                            <svg
                              width={11}
                              height={11}
                              viewBox="0 0 11 11"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g>
                                <path d="M5.5 0C2.46015 0 0 2.45988 0 5.5C0 8.5398 2.45988 11 5.5 11C8.53985 11 11 8.54012 11 5.5C11 2.46015 8.54012 0 5.5 0ZM5.5 10.2326C2.89046 10.2326 0.767443 8.10956 0.767443 5.5C0.767443 2.89044 2.89046 0.767443 5.5 0.767443C8.10956 0.767443 10.2326 2.89044 10.2326 5.5C10.2326 8.10956 8.10956 10.2326 5.5 10.2326Z" />
                              </g>
                            </svg>
                          </span>
                          Poser une question
                        </Link>
                      </li>
                      <li>
                        <a href="#">
                          <span>
                            <svg
                              width={11}
                              height={11}
                              viewBox="0 0 18 18"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g clipPath="url(#clip0_168_378)">
                                <path d="M16.528 2.20919C16.0674 1.71411 15.5099 1.31906 14.8902 1.04859C14.2704 0.778112 13.6017 0.637996 12.9255 0.636946C12.2487 0.637725 11.5794 0.777639 10.959 1.048C10.3386 1.31835 9.78042 1.71338 9.31911 2.20854L9.00132 2.54436L8.68352 2.20854C6.83326 0.217151 3.71893 0.102789 1.72758 1.95306C1.63932 2.03507 1.5541 2.12029 1.47209 2.20854C-0.490696 4.32565 -0.490696 7.59753 1.47209 9.71463L8.5343 17.1622C8.77862 17.4201 9.18579 17.4312 9.44373 17.1868C9.45217 17.1788 9.46039 17.1706 9.46838 17.1622L16.528 9.71463C18.4907 7.59776 18.4907 4.32606 16.528 2.20919ZM15.5971 8.82879H15.5965L9.00132 15.7849L2.40553 8.82879C0.90608 7.21113 0.90608 4.7114 2.40553 3.09374C3.76722 1.61789 6.06755 1.52535 7.5434 2.88703C7.61505 2.95314 7.68401 3.0221 7.75012 3.09374L8.5343 3.92104C8.79272 4.17781 9.20995 4.17781 9.46838 3.92104L10.2526 3.09438C11.6142 1.61853 13.9146 1.52599 15.3904 2.88767C15.4621 2.95378 15.531 3.02274 15.5971 3.09438C17.1096 4.71461 17.1207 7.2189 15.5971 8.82879Z" />
                              </g>
                            </svg>
                          </span>
                          Ajouter aux favoris
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Product Description Section */}
              <div className="row mt-5">
                <div className="col-12">
                  <div className="auction-details-description-area">
                    <div className="tab-container">
                      <button
                        className={`tab-button ${
                          activeTab === "description" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("description")}
                        type="button"
                        role="tab"
                        aria-controls="nav-description"
                        aria-selected={activeTab === "description"}
                      >
                        Description
                      </button>
                      <button
                        className={`tab-button ${
                          activeTab === "reviews" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("reviews")}
                        type="button"
                        role="tab"
                        aria-controls="nav-reviews"
                        aria-selected={activeTab === "reviews"}
                      >
                        Commentaires ({tenderData?.reviews?.length || 0})
                      </button>
                      <button
                        className={`tab-button ${
                          activeTab === "offers" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("offers")}
                        type="button"
                        role="tab"
                        aria-controls="nav-offers"
                        aria-selected={activeTab === "offers"}
                      >
                        Offres ({offers?.length || 0})
                      </button>
                    </div>

                    <div className="tab-content" id="nav-tabContent">
                      <div
                        className={`tab-pane fade ${
                          activeTab === "description" ? "show active" : ""
                        }`}
                        id="nav-description"
                        role="tabpanel"
                        aria-labelledby="nav-description-tab"
                      >
                        <div className="description-content">
                          <h3>{safeTitle}</h3>
                          <p>
                            {safeDescription}
                          </p>
                          
                          {/* Requirements Section */}
                          {safeRequirements.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                              <h4 style={{ marginBottom: '10px', color: '#333' }}>Exigences:</h4>
                              <ul style={{ paddingLeft: '20px' }}>
                                {safeRequirements.map((requirement, index) => (
                                  <li key={index} style={{ marginBottom: '5px' }}>
                                    {requirement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Additional Details */}
                          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            {safeQuantity && (
                              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <strong>Quantité:</strong> {safeQuantity}
                              </div>
                            )}
                            {safeMinimumPrice > 0 && (
                              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <strong>Prix minimum:</strong> {formatPrice(safeMinimumPrice)}
                              </div>
                            )}
                            {safeStartingAt && (
                              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <strong>Début:</strong> {new Date(safeStartingAt).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                            {safeEndingAt && (
                              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <strong>Fin:</strong> {new Date(safeEndingAt).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                          <ul className="features-list">
                            <li>
                              <svg
                                width={13}
                                height={11}
                                viewBox="0 0 13 11"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M12.2986 0.0327999C9.89985 0.832756 6.86143 2.97809 4.03623 6.6688L2.36599 4.778C2.09946 4.4871 1.63748 4.4871 1.38872 4.778L0.162693 6.17792C-0.0682981 6.45063 -0.0505298 6.86879 0.19823 7.12332L3.96516 10.814C4.28499 11.1231 4.78251 11.0322 4.99574 10.6504C7.00358 6.92333 9.17134 4.15985 12.7961 0.996384C13.2581 0.596406 12.8672 -0.167189 12.2986 0.0327999Z" />
                              </svg>
                              Appel d'offres vérifié
                            </li>
                            <li>
                              <svg
                                width={13}
                                height={11}
                                viewBox="0 0 13 11"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M12.2986 0.0327999C9.89985 0.832756 6.86143 2.97809 4.03623 6.6688L2.36599 4.778C2.09946 4.4871 1.63748 4.4871 1.38872 4.778L0.162693 6.17792C-0.0682981 6.45063 -0.0505298 6.86879 0.19823 7.12332L3.96516 10.814C4.28499 11.1231 4.78251 11.0322 4.99574 10.6504C7.00358 6.92333 9.17134 4.15985 12.7961 0.996384C13.2581 0.596406 12.8672 -0.167189 12.2986 0.0327999Z" />
                              </svg>
                              Procédure transparente
                            </li>
                            <li>
                              <svg
                                width={13}
                                height={11}
                                viewBox="0 0 13 11"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M12.2986 0.0327999C9.89985 0.832756 6.86143 2.97809 4.03623 6.6688L2.36599 4.778C2.09946 4.4871 1.63748 4.4871 1.38872 4.778L0.162693 6.17792C-0.0682981 6.45063 -0.0505298 6.86879 0.19823 7.12332L3.96516 10.814C4.28499 11.1231 4.78251 11.0322 4.99574 10.6504C7.00358 6.92333 9.17134 4.15985 12.7961 0.996384C13.2581 0.596406 12.8672 -0.167189 12.2986 0.0327999Z" />
                              </svg>
                              Contrat sécurisé
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div
                        className={`tab-pane fade ${
                          activeTab === "reviews" ? "show active" : ""
                        }`}
                        id="nav-reviews"
                        role="tabpanel"
                        aria-labelledby="nav-reviews-tab"
                      >
                        <div className="reviews-area">
                          <div className="number-of-review mb-4">
                            <h4>{t('auctionDetails.reviews')} ({tenderData?.reviews?.length || 0})</h4>
                          </div>

                          {/* Warning Message */}
                          <div
                            className="alert alert-warning"
                            style={{
                              fontSize: "0.875rem",
                              color: "#856404",
                              backgroundColor: "#fff3cd",
                              fontWeight: "normal",
                              border: "1px solid #ffeaa7",
                              borderRadius: "5px",
                              padding: "12px",
                              marginBottom: "20px",
                            }}
                          >
                            {t('auctionDetails.reviewWarning')}
                          </div>

                          <div className="review-list-area mb-40">
                            <ul className="comment p-0">
                              {tenderData?.reviews &&
                              tenderData.reviews.length > 0 ? (
                                tenderData.reviews.map((review, index) => (
                                  <li key={index}>
                                    <div className="single-comment-area">
                                      <div className="author-img">
                                        <img
                                          src={
                                            review.user?.photoURL ||
                                            DEFAULT_USER_AVATAR
                                          }
                                          alt={
                                            review.user?.fullName || "Reviewer"
                                          }
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = DEFAULT_USER_AVATAR;
                                          }}
                                        />
                                      </div>
                                      <div className="comment-content">
                                        <div className="author-and-review">
                                          <div className="author-name-deg">
                                            <h6>
                                              {review.user?.fullName ||
                                                "Utilisateur Anonyme"}
                                            </h6>
                                            <span>
                                              {new Date(
                                                review.createdAt
                                              ).toLocaleDateString("fr-FR", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                              })}
                                            </span>
                                          </div>
                                          {/* Modified for enhanced star display */}
                                          <ul className="review d-flex flex-row align-items-center review-star-container">
                                            {[...Array(5)].map((_, i) => (
                                              <li key={i}>
                                                <i
                                                  className={`bi bi-star${
                                                    i < review.rating
                                                      ? "-fill"
                                                      : ""
                                                  } review-star ${
                                                    i < review.rating
                                                      ? "filled"
                                                      : ""
                                                  }`}
                                                ></i>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        <p>{review.comment}</p>
                                      </div>
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <li>
                                  <div className="single-comment-area">
                                    <div className="comment-content text-center w-100">
                                      <p>
                                        Pas d'avis disponibles pour le moment.
                                      </p>
                                    </div>
                                  </div>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* --- Comments Section (from backend) --- */}
                          <div
                            className="comments-area"
                            style={{ marginBottom: 32 }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                                borderBottom: "2px solid #f0f0f0",
                                paddingBottom: "10px",
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  color: "#333",
                                  fontSize: "18px",
                                }}
                              >
                                💬 Commentaires (
                                {tenderData?.comments?.length || 0})
                              </h4>
                            </div>

                            {/* Comment Form */}
                            {isLogged ? (
                              <div
                                style={{
                                  background: "#f8f9fa",
                                  borderRadius: "12px",
                                  padding: "16px",
                                  marginBottom: "20px",
                                  border: "1px solid #e9ecef",
                                }}
                              >
                                <form
                                  onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!newComment.trim()) return;
                                    setSubmitting(true);
                                    try {
                                      console.log("[Comment Submit] Sending:", {
                                        comment: newComment,
                                        user: auth.user._id,
                                        bid: tenderId,
                                      });
                                      const response =
                                        await CommentAPI.setForBid(tenderId, {
                                          comment: newComment,
                                          user: auth.user._id,
                                        });
                                      console.log(
                                        "[Comment Submit] Success:",
                                        response
                                      );
                                      setNewComment("");
                                      // Re-fetch auction details to update comments
                                      const data =
                                        await TendersAPI.getTenderById(
                                          tenderId
                                        );
                                      setTenderData(data);
                                    } catch (err) {
                                      console.error(
                                        "[Comment Submit] Error:",
                                        err,
                                        err?.response
                                      );
                                      toast.error(
                                        "Erreur lors de l'envoi du commentaire."
                                      );
                                    }
                                    setSubmitting(false);
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: "12px",
                                    }}
                                  >
                                    <img
                                      src={
                                        auth.user?.photoURL ||
                                        DEFAULT_USER_AVATAR
                                      }
                                      alt="Your avatar"
                                      style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "2px solid #0063b1",
                                      }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = DEFAULT_USER_AVATAR;
                                      }}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <textarea
                                        value={newComment}
                                        onChange={(e) =>
                                          setNewComment(e.target.value)
                                        }
                                        placeholder="Partagez votre opinion sur cet appel d'offres..."
                                        required
                                        rows={2}
                                        style={{
                                          width: "100%",
                                          padding: "12px",
                                          borderRadius: "8px",
                                          border: "1px solid #ddd",
                                          marginBottom: "8px",
                                          fontFamily: "inherit",
                                          fontSize: "14px",
                                          resize: "vertical",
                                          minHeight: "60px",
                                        }}
                                      />
                                      <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                          background: submitting
                                            ? "#ccc"
                                            : "#0063b1",
                                          color: "#fff",
                                          border: "none",
                                          borderRadius: "6px",
                                          padding: "8px 16px",
                                          cursor: submitting
                                            ? "not-allowed"
                                            : "pointer",
                                          fontSize: "14px",
                                          fontWeight: "500",
                                          transition: "background 0.3s ease",
                                        }}
                                      >
                                        {submitting ? "Envoi..." : "Publier"}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            ) : (
                              <div
                                style={{
                                  background: "#fff3cd",
                                  border: "1px solid #ffeaa7",
                                  borderRadius: "8px",
                                  padding: "12px",
                                  marginBottom: "20px",
                                  color: "#856404",
                                  textAlign: "center",
                                }}
                              >
                                <span>
                                  🔒 Connectez-vous pour ajouter un commentaire
                                </span>
                              </div>
                            )}

                            {/* Comments List */}
                            {tenderData?.comments?.length > 0 ? (
                              <div>
                                <div
                                  className="comments-list"
                                  style={{
                                    maxHeight: showAllComments
                                      ? "none"
                                      : "400px",
                                    overflow: "hidden",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  {(showAllComments
                                    ? tenderData.comments
                                    : tenderData.comments.slice(0, 5)
                                  ).map((c, index) => (
                                    <div
                                      key={c._id}
                                      style={{
                                        display: "flex",
                                        gap: "12px",
                                        padding: "12px",
                                        marginBottom: "8px",
                                        background:
                                          index % 2 === 0
                                            ? "#ffffff"
                                            : "#f8f9fa",
                                        borderRadius: "8px",
                                        border: "1px solid #e9ecef",
                                        transition:
                                          "transform 0.2s ease, box-shadow 0.2s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform =
                                          "translateY(-2px)";
                                        e.currentTarget.style.boxShadow =
                                          "0 4px 12px rgba(0,0,0,0.1)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform =
                                          "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                          "none";
                                      }}
                                    >
                                      <img
                                        src={
                                          c.user?.photoURL ||
                                          DEFAULT_USER_AVATAR
                                        }
                                        alt="User avatar"
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          borderRadius: "50%",
                                          objectFit: "cover",
                                          border: "1px solid #ddd",
                                          flexShrink: 0,
                                        }}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = DEFAULT_USER_AVATAR;
                                        }}
                                      />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: "6px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontWeight: "600",
                                              fontSize: "13px",
                                              color: "#333",
                                              marginRight: "8px",
                                            }}
                                          >
                                            {c.user?.fullName ||
                                              c.user?.email ||
                                              "Utilisateur"}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: "11px",
                                              color: "#888",
                                              flexShrink: 0,
                                            }}
                                          >
                                            {c.createdAt
                                              ? new Date(
                                                  c.createdAt
                                                ).toLocaleDateString("fr-FR", {
                                                  day: "numeric",
                                                  month: "short",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })
                                              : ""}
                                          </span>
                                        </div>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: "14px",
                                            lineHeight: "1.4",
                                            color: "#555",
                                            wordBreak: "break-word",
                                          }}
                                        >
                                          {c.comment}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Show More/Less Button */}
                                {tenderData.comments.length > 5 && (
                                  <div
                                    style={{
                                      textAlign: "center",
                                      marginTop: "16px",
                                    }}
                                  >
                                    <button
                                      onClick={() =>
                                        setShowAllComments(!showAllComments)
                                      }
                                      style={{
                                        background:
                                          "linear-gradient(135deg, #0063b1, #004c8c)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "20px",
                                        padding: "8px 20px",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        boxShadow:
                                          "0 2px 8px rgba(0,99,177,0.3)",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.transform =
                                          "translateY(-2px)";
                                        e.target.style.boxShadow =
                                          "0 4px 12px rgba(0,99,177,0.4)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.transform =
                                          "translateY(0)";
                                        e.target.style.boxShadow =
                                          "0 2px 8px rgba(0,99,177,0.3)";
                                      }}
                                    >
                                      {showAllComments
                                        ? `Voir moins de commentaires ▲`
                                        : `Voir ${
                                            tenderData.comments.length - 5
                                          } commentaires supplémentaires ▼`}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "40px 20px",
                                  color: "#888",
                                  background: "#f8f9fa",
                                  borderRadius: "12px",
                                  border: "1px dashed #ddd",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "48px",
                                    marginBottom: "16px",
                                  }}
                                >
                                  💬
                                </div>
                                <p style={{ margin: 0, fontSize: "16px" }}>
                                  Aucun commentaire pour cet appel d'offres.
                                </p>
                                <p
                                  style={{
                                    margin: "8px 0 0 0",
                                    fontSize: "14px",
                                    color: "#aaa",
                                  }}
                                >
                                  Soyez le premier à partager votre avis !
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* --- Offers Section --- */}
                      <div
                        className={`tab-pane fade ${
                          activeTab === "offers" ? "show active" : ""
                        }`}
                        id="nav-offers"
                        role="tabpanel"
                        aria-labelledby="nav-offers-tab"
                      >
                        <div className="offers-area">
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "20px",
                              borderBottom: "2px solid #f0f0f0",
                              paddingBottom: "10px",
                            }}
                          >
                            <h4
                              style={{
                                margin: 0,
                                color: "#333",
                                fontSize: "18px",
                              }}
                            >
                              💰 Offres ({offers?.length || 0})
                            </h4>
                          </div>

                          {/* User's Offers Section */}
                          {isLogged && myOffers && myOffers.length > 0 && (
                            <div style={{ marginBottom: '30px' }}>
                              <h5 style={{
                                color: '#0063b1',
                                marginBottom: '15px',
                                fontSize: '16px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                🎯 Mes Offres ({myOffers.length})
                              </h5>
                              <div className="my-offers-list">
                                {myOffers.map((offer, index) => (
                                  <div
                                    key={offer._id || offer.id || index}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "15px",
                                      padding: "15px",
                                      marginBottom: "10px",
                                      background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                                      borderRadius: "10px",
                                      border: "2px solid #0063b1",
                                      boxShadow: "0 4px 12px rgba(0, 99, 177, 0.15)",
                                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = "translateY(-3px)";
                                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 99, 177, 0.25)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = "translateY(0)";
                                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 99, 177, 0.15)";
                                    }}
                                  >
                                    <div style={{
                                      width: "45px",
                                      height: "45px",
                                      borderRadius: "50%",
                                      background: "linear-gradient(135deg, #0063b1, #00a3e0)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "white",
                                      fontSize: "18px",
                                      fontWeight: "bold",
                                      flexShrink: 0,
                                    }}>
                                      👤
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                      <p style={{
                                        margin: 0,
                                        fontSize: "15px",
                                        fontWeight: "600",
                                        color: "#333",
                                      }}>
                                        Votre Offre
                                      </p>
                                      <p style={{
                                        margin: "4px 0 0 0",
                                        fontSize: "13px",
                                        color: "#666",
                                      }}>
                                        Soumise le: {new Date(offer.createdAt || offer.created_at).toLocaleDateString("fr-FR", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                    <div style={{
                                      fontSize: "18px",
                                      fontWeight: "700",
                                      color: "#0063b1",
                                      flexShrink: 0,
                                    }}>
                                      {formatPrice(offer.price || offer.amount)}
                                    </div>
                                    <div style={{
                                      padding: "4px 8px",
                                      background: offer.status === 'accepted' ? '#d4edda' : 
                                                 offer.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                                      color: offer.status === 'accepted' ? '#155724' : 
                                            offer.status === 'rejected' ? '#721c24' : '#856404',
                                      borderRadius: "12px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      textTransform: "uppercase",
                                    }}>
                                      {offer.status || 'En attente'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* All Offers Section */}
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{
                              color: '#333',
                              marginBottom: '15px',
                              fontSize: '16px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              💰 Toutes les Offres ({offers?.length || 0})
                              {loadingOffers && (
                                <span style={{
                                  fontSize: '12px',
                                  color: '#666',
                                  fontWeight: 'normal'
                                }}>
                                  (Chargement...)
                                </span>
                              )}
                            </h5>
                          </div>

                          {offers && offers.length > 0 ? (
                            <div className="offers-list">
                              {offers.map((offer, index) => (
                                <div
                                  key={offer._id || index}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "15px",
                                    padding: "15px",
                                    marginBottom: "10px",
                                    background:
                                      index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                                    borderRadius: "10px",
                                    border: "1px solid #e9ecef",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                    transition:
                                      "transform 0.2s ease, box-shadow 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform =
                                      "translateY(-3px)";
                                    e.currentTarget.style.boxShadow =
                                      "0 6px 16px rgba(0,0,0,0.1)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform =
                                      "translateY(0)";
                                    e.currentTarget.style.boxShadow =
                                      "0 2px 8px rgba(0,0,0,0.05)";
                                  }}
                                >
                                  <img
                                    src={
                                      offer.user?.avatar?.url
                                        ? `${app.route}${offer.user.avatar.url}`
                                        : DEFAULT_USER_AVATAR
                                    }
                                    alt={offer.user?.firstName || "User"}
                                    style={{
                                      width: "45px",
                                      height: "45px",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      border: "2px solid #0063b1",
                                      flexShrink: 0,
                                    }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = DEFAULT_USER_AVATAR;
                                    }}
                                    crossOrigin="use-credentials"
                                  />
                                  <div style={{ flexGrow: 1 }}>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: "15px",
                                        fontWeight: "600",
                                        color: "#333",
                                      }}
                                    >
                                      {offer.user?.firstName}{" "}
                                      {offer.user?.lastName ||
                                        "Utilisateur Anonyme"}
                                    </p>
                                    <p
                                      style={{
                                        margin: "4px 0 0 0",
                                        fontSize: "13px",
                                        color: "#666",
                                      }}
                                    >
                                      Offre placée le:{" "}
                                      {new Date(
                                        offer.createdAt
                                      ).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "18px",
                                      fontWeight: "700",
                                      color: "#0063b1",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {formatPrice(offer.price)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "40px 20px",
                                color: "#888",
                                background: "#f8f9fa",
                                borderRadius: "12px",
                                border: "1px dashed #ddd",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "48px",
                                  marginBottom: "16px",
                                }}
                              >
                                💸
                              </div>
                              <p style={{ margin: 0, fontSize: "16px" }}>
                                Aucune offre n'a été soumise pour cet appel d'offres.
                              </p>
                              <p
                                style={{
                                  margin: "8px 0 0 0",
                                  fontSize: "14px",
                                  color: "#aaa",
                                }}
                              >
                                Soyez le premier à soumettre une offre !
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Tenders Section */}
          <div className="related-auction-section mb-110">
            <div className="container">
              <div className="row mb-50">
                <div className="col-lg-12 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="section-title">
                    <h2 className="related-auction-title">
                      Appels d'Offres <span>Similaires</span>
                    </h2>
                  </div>
                  <div className="slider-btn-grp">
                    <div className="slider-btn auction-slider-prev">
                      <svg
                        width={9}
                        height={15}
                        viewBox="0 0 9 15"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M0 7.50009L9 0L3.27273 7.50009L9 15L0 7.50009Z" />
                      </svg>
                    </div>
                    <div className="slider-btn auction-slider-next">
                      <svg
                        width={9}
                        height={15}
                        viewBox="0 0 9 15"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9 7.50009L0 0L5.72727 7.50009L0 15L9 7.50009Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="auction-slider-area">
                <div className="row">
                  <div className="col-lg-12">
                    <Swiper
                      {...settingsForUpcomingAuction}
                      className="swiper auction-slider"
                    >
                      <div className="swiper-wrapper">
                        {allTenders && allTenders.length > 1 ? (
                          allTenders
                            .filter((tender) => tender._id !== tenderId)
                            .slice(0, 4)
                            .map((tender, index) => {
                              const hasTenderEnded =
                                similarTenderTimers[index]?.total <= 0;
                              // defaultTimer is not needed here as getTimeRemaining handles "00" for ended auctions
                              // const defaultTimer = { days: '--', hours: '--', minutes: '--', seconds: '--' };

                              return (
                                <SwiperSlide
                                  className="swiper-slide"
                                  key={tender._id || index}
                                >
                                  <div
                                    className="modern-auction-card"
                                    style={{
                                      background: hasTenderEnded
                                        ? "#f0f0f0"
                                        : "white",
                                      borderRadius: "20px",
                                      overflow: "hidden",
                                      boxShadow: hasTenderEnded
                                        ? "none"
                                        : "0 8px 25px rgba(0, 0, 0, 0.08)",
                                      height: "100%",
                                      maxWidth: "300px",
                                      display: "flex",
                                      flexDirection: "column",
                                      position: "relative",
                                      transition:
                                        "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
                                      border: hasTenderEnded
                                        ? "1px solid #d0d0d0"
                                        : "1px solid rgba(0, 0, 0, 0.05)",
                                      cursor: hasTenderEnded
                                        ? "not-allowed"
                                        : "pointer", // Change cursor
                                      opacity: hasTenderEnded ? 0.6 : 1,
                                      pointerEvents: hasTenderEnded
                                        ? "none"
                                        : "auto", // Disable clicks
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!hasTenderEnded) {
                                        // Only apply hover effects if not ended
                                        e.currentTarget.style.transform =
                                          "translateY(-10px)";
                                        e.currentTarget.style.boxShadow =
                                          "0 20px 40px rgba(0, 99, 177, 0.15)";
                                        e.currentTarget.style.borderColor =
                                          "rgba(0, 99, 177, 0.2)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!hasTenderEnded) {
                                        // Only apply hover effects if not ended
                                        e.currentTarget.style.transform =
                                          "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                          "0 8px 25px rgba(0, 0, 0, 0.08)";
                                        e.currentTarget.style.borderColor =
                                          "rgba(0, 0, 0, 0.05)";
                                      }
                                    }}
                                  >
                                    {/* Auction Image */}
                                    <div
                                      className="auction-image"
                                      style={{
                                        height: "220px",
                                        position: "relative",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <Link
                                        href={
                                          hasTenderEnded
                                            ? "#"
                                            : `/tender-details/${tender._id}`
                                        }
                                        style={{
                                          display: "block",
                                          height: "100%",
                                          cursor: hasTenderEnded
                                            ? "not-allowed"
                                            : "pointer",
                                        }}
                                      >
                                        <img
                                          src={
                                            tender.attachments &&
                                            tender.attachments.length > 0
                                              ? `${app.route}${tender.attachments[0].url}`
                                              : DEFAULT_AUCTION_IMAGE
                                          }
                                          alt={tender.title || "Appel d'offres"}
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            transition: "transform 0.5s ease",
                                            filter: hasTenderEnded
                                              ? "grayscale(100%)"
                                              : "none",
                                          }}
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src =
                                              DEFAULT_AUCTION_IMAGE;
                                          }}
                                          crossOrigin="use-credentials"
                                        />
                                      </Link>

                                      {/* Live Badge - Conditionally render based on hasTenderEnded */}
                                      {!hasTenderEnded && (
                                        <div
                                          className="live-badge"
                                          style={{
                                            position: "absolute",
                                            top: "15px",
                                            left: "15px",
                                            background:
                                              "linear-gradient(90deg, #0063b1, #00a3e0)",
                                            color: "white",
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            boxShadow:
                                              "0 2px 8px rgba(0, 0, 0, 0.15)",
                                            zIndex: 2,
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: "6px",
                                              height: "6px",
                                              borderRadius: "50%",
                                              background: "#fff",
                                            }}
                                          ></div>
                                          EN DIRECT
                                        </div>
                                      )}

                                      {/* Countdown Timer */}
                                      <div
                                        className="countdown-overlay"
                                        style={{
                                          position: "absolute",
                                          bottom: "0",
                                          left: "0",
                                          right: "0",
                                          background: hasTenderEnded
                                            ? "rgba(0, 0, 0, 0.6)"
                                            : "linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), transparent)",
                                          padding: "20px 15px 15px",
                                          color: "white",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: "8px",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                          }}
                                        >
                                          <div
                                            style={{
                                              background: hasTenderEnded
                                                ? "rgba(100, 100, 100, 0.7)"
                                                : "rgba(255, 255, 255, 0.2)",
                                              backdropFilter: "blur(10px)",
                                              borderRadius: "8px",
                                              padding: "4px 8px",
                                              minWidth: "35px",
                                              textAlign: "center",
                                            }}
                                          >
                                            {similarTenderTimers[index]?.days}
                                            <div
                                              style={{
                                                fontSize: "10px",
                                                opacity: 0.8,
                                              }}
                                            >
                                              J
                                            </div>
                                          </div>
                                          <span style={{ opacity: 0.8 }}>
                                            :
                                          </span>
                                          <div
                                            style={{
                                              background: hasTenderEnded
                                                ? "rgba(100, 100, 100, 0.7)"
                                                : "rgba(255, 255, 255, 0.2)",
                                              backdropFilter: "blur(10px)",
                                              borderRadius: "8px",
                                              padding: "4px 8px",
                                              minWidth: "35px",
                                              textAlign: "center",
                                            }}
                                          >
                                            {similarTenderTimers[index]?.hours}
                                            <div
                                              style={{
                                                fontSize: "10px",
                                                opacity: 0.8,
                                              }}
                                            >
                                              H
                                            </div>
                                          </div>
                                          <span style={{ opacity: 0.8 }}>
                                            :
                                          </span>
                                          <div
                                            style={{
                                              background: hasTenderEnded
                                                ? "rgba(100, 100, 100, 0.7)"
                                                : "rgba(255, 255, 255, 0.2)",
                                              backdropFilter: "blur(10px)",
                                              borderRadius: "8px",
                                              padding: "4px 8px",
                                              minWidth: "35px",
                                              textAlign: "center",
                                            }}
                                          >
                                            {
                                              similarTenderTimers[index]
                                                ?.minutes
                                            }
                                            <div
                                              style={{
                                                fontSize: "10px",
                                                opacity: 0.8,
                                              }}
                                            >
                                              M
                                            </div>
                                          </div>
                                          <span style={{ opacity: 0.8 }}>
                                            :
                                          </span>
                                          <div
                                            style={{
                                              background: hasTenderEnded
                                                ? "rgba(100, 100, 100, 0.7)"
                                                : "rgba(255, 255, 255, 0.2)",
                                              backdropFilter: "blur(10px)",
                                              borderRadius: "8px",
                                              padding: "4px 8px",
                                              minWidth: "35px",
                                              textAlign: "center",
                                            }}
                                          >
                                            {
                                              similarTenderTimers[index]
                                                ?.seconds
                                            }
                                            <div
                                              style={{
                                                fontSize: "10px",
                                                opacity: 0.8,
                                              }}
                                            >
                                              S
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Auction Content */}
                                    <div
                                      style={{
                                        padding: "20px",
                                        flexGrow: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                      }}
                                    >
                                      {/* Title */}
                                      <h3
                                        style={{
                                          fontSize: "18px",
                                          fontWeight: "600",
                                          color: hasTenderEnded
                                            ? "#666"
                                            : "#333",
                                          marginBottom: "12px",
                                          lineHeight: "1.3",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <Link
                                          href={
                                          hasTenderEnded
                                              ? "#"
                                            : `/tender-details/${tender._id}`
                                          } // Prevent navigation if ended
                                          style={{
                                            color: "inherit",
                                            textDecoration: "none",
                                            cursor: hasTenderEnded
                                              ? "not-allowed"
                                              : "pointer",
                                          }}
                                        >
                                          {tender.title ||
                                            tender.name ||
                                            "Appel d'offres sans titre"}
                                        </Link>
                                      </h3>

                                      {/* Price Info */}
                                      <div
                                        style={{
                                          marginBottom: "16px",
                                          padding: "12px",
                                          background: hasTenderEnded
                                            ? "#e8e8e8"
                                            : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                                          borderRadius: "12px",
                                          border: hasTenderEnded
                                            ? "1px solid #d8d8d8"
                                            : "1px solid rgba(0, 99, 177, 0.1)",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <div>
                                            <p
                                              style={{
                                                fontSize: "12px",
                                                color: hasTenderEnded
                                                  ? "#888"
                                                  : "#666",
                                                margin: "0 0 4px 0",
                                                fontWeight: "500",
                                              }}
                                            >
                                              {hasTenderEnded
                                                ? "Appel d'offres terminé"
                                                : "Quantité"}
                                            </p>
                                            <p
                                              style={{
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                margin: 0,
                                                color: hasTenderEnded
                                                  ? "#888"
                                                  : "#333",
                                              }}
                                            >
                                              {tender.quantity || "Non spécifiée"}
                                            </p>
                                          </div>
                                          <div
                                            style={{
                                              width: "40px",
                                              height: "40px",
                                              borderRadius: "50%",
                                              background: hasTenderEnded
                                                ? "#cccccc"
                                                : "linear-gradient(90deg, #0063b1, #00a3e0)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              color: "white",
                                              fontSize: "18px",
                                              boxShadow: hasTenderEnded
                                                ? "none"
                                                : "0 4px 12px rgba(0, 99, 177, 0.3)",
                                            }}
                                          >
                                            🔥
                                          </div>
                                        </div>
                                      </div>

                                      {/* Seller Info */}
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          marginBottom: "16px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: "32px",
                                              height: "32px",
                                              borderRadius: "50%",
                                              background: hasTenderEnded
                                                ? "#dcdcdc"
                                                : "linear-gradient(135deg, #e9ecef, #f8f9fa)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              overflow: "hidden",
                                              border: hasTenderEnded
                                                ? "2px solid #c0c0c0"
                                                : "2px solid rgba(0, 99, 177, 0.1)",
                                            }}
                                          >
                                            <img
                                              src={
                                                tender.owner?.avatar?.url
                                                  ? `${app.route}${tender.owner.avatar.url}`
                                                  : DEFAULT_PROFILE_IMAGE
                                              }
                                              alt="Owner"
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                filter: hasTenderEnded
                                                  ? "grayscale(100%)"
                                                  : "none",
                                              }}
                                              onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src =
                                                  DEFAULT_PROFILE_IMAGE;
                                              }}
                                              crossOrigin="use-credentials"
                                            />
                                          </div>
                                          <div>
                                            <p
                                              style={{
                                                fontSize: "13px",
                                                color: hasTenderEnded
                                                  ? "#888"
                                                  : "#666",
                                                margin: "0",
                                                fontWeight: "500",
                                              }}
                                            >
                                              {(() => {
                                                // Check if tender is hidden (anonymous)
                                                if (tender.hidden === true) {
                                                  return t('common.anonymous');
                                                }
                                                
                                                // Try owner firstName + lastName first
                                                if (
                                                  tender.owner?.firstName &&
                                                  tender.owner?.lastName
                                                ) {
                                                  return `${tender.owner.firstName} ${tender.owner.lastName}`;
                                                }
                                                // Try owner name field
                                                if (tender.owner?.name) {
                                                  return tender.owner.name;
                                                }
                                                // Try seller name
                                                if (tender.seller?.name) {
                                                  return tender.seller.name;
                                                }
                                                // Default fallback
                                                return 'Acheteur';
                                              })()}
                                            </p>
                                          </div>
                                        </div>

                                        <div
                                          style={{
                                            padding: "4px 8px",
                                            background: hasTenderEnded
                                              ? "rgba(180, 180, 180, 0.3)"
                                              : "rgba(0, 99, 177, 0.1)",
                                            borderRadius: "12px",
                                            fontSize: "11px",
                                            fontWeight: "600",
                                            color: hasTenderEnded
                                              ? "#888"
                                              : "#0063b1",
                                          }}
                                        >
                                          {tender.status || "ACTIVE"}
                                        </div>
                                      </div>

                                      {/* Bid Button */}
                                      <button
                                        onClick={() => !hasTenderEnded && handleSimilarTenderBid(tender)}
                                        disabled={hasTenderEnded}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "8px",
                                          padding: "12px 20px",
                                          background: hasTenderEnded
                                            ? "#cccccc"
                                            : "linear-gradient(90deg, #0063b1, #00a3e0)",
                                          color: hasTenderEnded
                                            ? "#888"
                                            : "white", // Grey text when ended
                                          textDecoration: "none",
                                          borderRadius: "12px",
                                          fontWeight: "600",
                                          fontSize: "14px",
                                          transition: "all 0.3s ease",
                                          boxShadow: hasTenderEnded
                                            ? "none"
                                            : "0 4px 12px rgba(0, 99, 177, 0.3)",
                                          marginTop: "auto",
                                          cursor: hasTenderEnded
                                            ? "not-allowed"
                                            : "pointer",
                                          pointerEvents: hasTenderEnded
                                            ? "none"
                                            : "auto", // Disable clicks
                                          border: "none",
                                          outline: "none",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!hasTenderEnded) {
                                            // Only apply hover effects if not ended
                                            e.currentTarget.style.background =
                                              "linear-gradient(90deg, #00a3e0, #0063b1)";
                                            e.currentTarget.style.transform =
                                              "translateY(-2px)";
                                            e.currentTarget.style.boxShadow =
                                              "0 6px 16px rgba(0, 99, 177, 0.4)";
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!hasTenderEnded) {
                                            // Only apply hover effects if not ended
                                            e.currentTarget.style.background =
                                              "linear-gradient(90deg, #0063b1, #00a3e0)";
                                            e.currentTarget.style.transform =
                                              "translateY(0)";
                                            e.currentTarget.style.boxShadow =
                                              "0 4px 12px rgba(0, 99, 177, 0.3)";
                                          }
                                        }}
                                        title={hasTenderEnded ? "Appel d'offres terminé" : "Soumettre une offre"}
                                      >
                                        Soumettre une Offre
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill={
                                            hasTenderEnded
                                              ? "#888"
                                              : "currentColor"
                                          }
                                        >
                                          {" "}
                                          {/* Grey SVG fill */}
                                          <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </SwiperSlide>
                              );
                            })
                        ) : (
                          <SwiperSlide className="swiper-slide">
                            <div
                              style={{
                                minHeight: "300px",
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                                gap: "30px",
                                background: "white",
                                borderRadius: "12px",
                                padding: "30px",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              <div
                                style={{
                                  flex: "1 1 auto",
                                  minWidth: "300px",
                                  maxWidth: "500px",
                                }}
                              >
                                <h3
                                  style={{
                                    fontSize: "24px",
                                    marginBottom: "20px",
                                    color: "#333",
                                  }}
                                >
                                  Aucun appel d'offres similaire
                                </h3>
                                <p
                                  style={{
                                    fontSize: "16px",
                                    color: "#666",
                                    lineHeight: "1.6",
                                  }}
                                >
                                  Consultez la page principale pour voir plus d'appels d'offres
                                </p>
                              </div>
                              <div style={{ flex: "0 0 auto" }}>
                                <Link
                    href="/tenders"
                                  className="primary-btn btn-hover"
                                  style={{
                                    display: "inline-block",
                                    padding: "12px 25px",
                                    borderRadius: "30px",
                                    background: "#0063b1",
                                    color: "white",
                                    fontWeight: "600",
                                    textDecoration: "none",
                                    boxShadow:
                                      "0 4px 8px rgba(0, 99, 177, 0.3)",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                    Voir tous les appels d'offres
                                </Link>
                              </div>
                            </div>
                          </SwiperSlide>
                        )}
                      </div>
                    </Swiper>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MultipurposeDetails2;