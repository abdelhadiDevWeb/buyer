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
import { AuctionsAPI } from "@/app/api/auctions";
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

const MultipurposeDetails1 = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [auctionData, setAuctionData] = useState(null);
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
  const [allAuctions, setAllAuctions] = useState([]);
  const [similarAuctionTimers, setSimilarAuctionTimers] = useState([]);
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
  const [professionalAmount, setProfessionalAmount] = useState(""); // State for professional amount
  const [savingAutoBid, setSavingAutoBid] = useState(false); // State for saving auto bid
  const [loadingAutoBid, setLoadingAutoBid] = useState(false); // State for loading auto bid
  const [hasExistingAutoBid, setHasExistingAutoBid] = useState(false); // State to track if user has existing auto-bid
  const [deletingAutoBid, setDeletingAutoBid] = useState(false); // State for deleting auto bid

  // Get auction ID from URL params or search params
  const routeId = params?.id;
  const queryId = searchParams.get("id");
  const auctionId = routeId || queryId;
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
                    onClick={() => router.push('/auction-sidebar')}
                  >
                    Retour aux enchères
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
    if (!auctionData) return;
    let inter = setInterval(() => {
      try {
        // Use the local getTimeRemaining for consistent formatting
        const dataTimer = getTimeRemaining(auctionData.endingAt);
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
  }, [auctionData]);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      try {
        if (!auctionId) {
          console.error("No auction ID found in URL parameters");
          setError("ID d'enchère introuvable. Veuillez vérifier l'URL.");
          setErrorDetails({
            type: "MISSING_AUCTION_ID",
            routeId,
            queryId,
            params: params,
            searchParams: searchParams ? Object.fromEntries(searchParams.entries()) : null
          });
          setLoading(false);
          return;
        }

        console.log("Fetching auction details for ID:", auctionId);
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

        const data = await AuctionsAPI.getAuctionById(auctionId);
        console.log("Auction data received:", data);
        
        if (!data) {
          throw new Error("Aucune donnée reçue du serveur");
        }
        
        setAuctionData(data);
        // Assuming offers are populated within auctionData
        if (data?.offers) {
          setOffers(data.offers);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching auction details:", err);
        
        // Enhanced error handling
        let errorMessage = "Impossible de charger les détails de l'enchère. Veuillez réessayer plus tard.";
        let errorType = "UNKNOWN_ERROR";
        
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
          errorType = "NETWORK_ERROR";
        } else if (err.response) {
          // Server responded with error status
          const status = err.response.status;
          if (status === 404) {
            errorMessage = "Enchère introuvable. Elle a peut-être été supprimée.";
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
          auctionId,
          apiUrl: `${app.baseURL}bid/${auctionId}`,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
        });
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [auctionId, params, searchParams]);

  // Extract fetchAutoBidData as a reusable function
  const fetchAutoBidData = async () => {
    if (!isLogged || !auth.tokens || !auctionId || !auctionData) {
      return;
    }

    // Only fetch for PROFESSIONAL users
    if (auth.user?.type !== 'PROFESSIONAL') {
      return;
    }

    // Compute starting price to avoid dependency issues
    const startingPrice = auctionData?.startingPrice || 0;

    try {
      setLoadingAutoBid(true);
      console.log("Fetching auto-bid data for auction:", auctionId);
      
      const autoBidResponse = await AutoBidAPI.getAutoBidByAuctionAndUser(auctionId);
      console.log("Auto-bid response:", autoBidResponse);

      if (autoBidResponse.success && autoBidResponse.data) {
        // User has an auto-bid for this auction, use that price
        console.log("Found existing auto-bid:", autoBidResponse.data);
        setProfessionalAmount(autoBidResponse.data.price.toString());
        setHasExistingAutoBid(true);
      } else {
        // No auto-bid found, use starting price
        console.log("No auto-bid found, using starting price");
        setProfessionalAmount(startingPrice.toString());
        setHasExistingAutoBid(false);
      }
    } catch (err) {
      console.error("Error fetching auto-bid data:", err);
      // If error, use starting price as fallback and assume no existing auto-bid
      setProfessionalAmount(startingPrice.toString());
      setHasExistingAutoBid(false);
    } finally {
      setLoadingAutoBid(false);
    }
  };

  // Fetch auto-bid data for professional users on component mount and data changes
  useEffect(() => {
    fetchAutoBidData();
  }, [isLogged, auth.tokens, auctionId, auctionData, auth.user?.type]);

  useEffect(() => {
    // Fetch all auctions for 'Enchères Similaires'
    const fetchAllAuctions = async () => {
      try {
        const data = await AuctionsAPI.getAuctions();
        setAllAuctions(data);
      } catch (err) {
        // Optionally handle error
        setAllAuctions([]);
      }
    };
    fetchAllAuctions();
  }, []);

  // Update timers for similar auctions
  useEffect(() => {
    if (!allAuctions || allAuctions.length === 0) return;
    const filtered = allAuctions
      .filter((auction) => auction._id !== auctionId)
      .slice(0, 4);
    function updateTimers() {
      setSimilarAuctionTimers(
        filtered.map((auction) => {
          const endDate =
            auction.endDate || auction.endingAt || "2024-09-23 11:42:00";
          return getTimeRemaining(endDate); // getTimeRemaining now formats with leading zeros
        })
      );
    }
    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [allAuctions, auctionId]);

  // Using the real end date if available, otherwise fallback to static date
  const endDate = auctionData?.endDate || auctionData?.endingAt || "2024-09-23 11:42:00";
  const { days, hours, minutes, seconds } = useCountdownTimer(endDate);

  // Add null checks for critical data
  const safeAuctionData = auctionData || {};
  const safeThumbs = safeAuctionData.thumbs || [];
  const safeVideos = safeAuctionData.videos || [];
  const safeTitle = safeAuctionData.title || safeAuctionData.name || "Article d'enchère";
  const safeStartingPrice = safeAuctionData.startingPrice || 0;
  const safeCurrentPrice = safeAuctionData.currentPrice || 0;
  const safeOwner = safeAuctionData.owner || null;

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

  // Handle bid submission
  // Fixed handleBidSubmit function for MultipurposeDetails1.jsx
const handleBidSubmit = async (e) => {
  e.preventDefault();

  console.log(
    "[MultipurposeDetails1] handleBidSubmit - isLogged:",
    isLogged,
    "auth.tokens:",
    auth.tokens,
    "auth.user:",
    auth.user
  );

  try {
    // Check if user is logged in
    if (!isLogged || !auth.tokens) {
      toast.error("Veuillez vous connecter pour placer une enchère");
      router.push("/auth/login");
      return;
    }

    // Get bid amount from the quantity input
    const bidInput = document.querySelector(".quantity__input");
    if (!bidInput || !bidInput.value) {
      toast.error("Veuillez entrer un montant d'enchère valide");
      return;
    }

    const bidAmountRaw = bidInput.value;
    console.log("[MultipurposeDetails1] Raw bid amount:", bidAmountRaw);

    // Clean the bid amount - remove formatting
    let cleanBidAmount = bidAmountRaw;
    
    // Remove ",00 " suffix if present
    cleanBidAmount = cleanBidAmount.replace(/,00\s*$/, "");
    
    // Remove all commas (thousands separators)
    cleanBidAmount = cleanBidAmount.replace(/,/g, "");
    
    // Remove any currency symbols or extra spaces
    cleanBidAmount = cleanBidAmount.replace(/[^\d.]/g, "");

    console.log("[MultipurposeDetails1] Cleaned bid amount:", cleanBidAmount);

    // Parse to number and validate
    const numericBidAmount = parseFloat(cleanBidAmount);
    
    if (isNaN(numericBidAmount) || numericBidAmount <= 0) {
      toast.error("Veuillez entrer un nombre valide pour le montant de l'enchère");
      return;
    }

    // Ensure the bid is higher than current price
    const currentPrice = auctionData?.currentPrice || auctionData?.startingPrice || 0;
    if (numericBidAmount <= currentPrice) {
      toast.error(`Votre enchère doit être supérieure au prix actuel de ${formatPrice(currentPrice)}`);
      return;
    }

    // Round to avoid floating point issues
    const finalBidAmount = Math.round(numericBidAmount);

    console.log("[MultipurposeDetails1] Final bid amount:", finalBidAmount);
    console.log("[MultipurposeDetails1] Current price:", currentPrice);

    // Prepare the payload
    const payload = {
      price: finalBidAmount,
      user: auth.user._id,
      owner: auth.user._id, // This should be the bidder's ID, not the auction owner's ID
    };

    console.log("[MultipurposeDetails1] Sending offer payload:", payload);

    // Validate required fields
    if (!payload.user) {
      toast.error("Utilisateur non valide. Veuillez vous reconnecter.");
      return;
    }

    try {
      // Send the offer
      const offerResponse = await OfferAPI.sendOffer(auctionId, payload);
      
      console.log("[MultipurposeDetails1] Offer submission response:", offerResponse);
      
      // Always show success message if we got here (no exception thrown)
      toast.success("Votre enchère a été placée avec succès !");
      
      // Clear the input
      if (bidInput) {
        bidInput.value = formatPrice(finalBidAmount);
      }
      
      // Refresh the auction data after placing a bid
      try {
        const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
        setAuctionData(refreshedData);
        if (refreshedData?.offers) {
          setOffers(refreshedData.offers);
        }
      } catch (refreshErr) {
        console.warn("Failed to refresh auction data after successful bid:", refreshErr);
        // Don't show error for this as the bid was successful
      }
    } catch (submitError) {
      // If there was an error during submission, check if it has a status code
      // Status codes in the 2xx range indicate success despite the error
      const statusCode = submitError?.response?.status;
      const hasSuccessStatus = statusCode && statusCode >= 200 && statusCode < 300;
      
      console.log("[MultipurposeDetails1] Offer submission error:", submitError, "Status code:", statusCode);
      
      // If we have a success status code, treat it as success
      if (hasSuccessStatus) {
        toast.success("Votre enchère a été placée avec succès !");
        
        // Clear the input
        if (bidInput) {
          bidInput.value = formatPrice(finalBidAmount);
        }
        
        // Try to refresh the auction data
        try {
          const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
          setAuctionData(refreshedData);
          if (refreshedData?.offers) {
            setOffers(refreshedData.offers);
          }
        } catch (refreshErr) {
          console.warn("Failed to refresh auction data after successful bid:", refreshErr);
        }
      } else {
        // Re-throw the error to be caught by the outer catch block
        throw submitError;
      }
    }

  } catch (err) {
    console.error("Error placing bid:", err);
    
    // Check if the error response contains a success flag that's true
    // This handles cases where the offer was saved but error was thrown anyway
    if (err?.response?.data?.success === true) {
      console.log("[MultipurposeDetails1] Detected successful operation despite error:", err);
      toast.success("Votre enchère a été placée avec succès !");
      
      // Refresh the auction data
      try {
        const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
        setAuctionData(refreshedData);
        if (refreshedData?.offers) {
          setOffers(refreshedData.offers);
        }
      } catch (refreshErr) {
        console.warn("Failed to refresh auction data:", refreshErr);
      }
      return;
    }
    
    // Extract user-friendly error message
    let errorMessage = "Échec de l'enchère. Veuillez réessayer.";
    
    if (err?.response?.data?.message) {
      const serverMessage = err.response.data.message;
      
      // Handle specific error messages from server
      switch (serverMessage) {
        case 'OFFER.INVALID_PRICE':
          errorMessage = "Montant d'enchère invalide. Vérifiez que votre enchère est supérieure au prix actuel.";
          break;
        case 'OFFER.AUCTION_ENDED':
          errorMessage = "Cette enchère est terminée.";
          break;
        case 'OFFER.INSUFFICIENT_AMOUNT':
          errorMessage = "Le montant de votre enchère est insuffisant.";
          break;
        case 'OFFER.OWNER_CANNOT_BID':
          errorMessage = "Vous ne pouvez pas enchérir sur votre propre enchère.";
          break;
        default:
          errorMessage = serverMessage;
      }
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    // Check if we have data despite the error
    if (err?.response?.data) {
      console.log("[MultipurposeDetails1] Error response contains data:", err.response.data);
      
      // If the data contains a valid offer object, consider it a success
      if (err.response.data.price || err.response.data._id) {
        console.log("[MultipurposeDetails1] Found offer data in error response, treating as success");
        toast.success("Votre enchère a été placée avec succès !");
        
        // Try to refresh auction data
        try {
          const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
          setAuctionData(refreshedData);
          if (refreshedData?.offers) {
            setOffers(refreshedData.offers);
          }
        } catch (refreshErr) {
          console.warn("Failed to refresh auction data:", refreshErr);
        }
        return;
      }
    }
    
    toast.error(errorMessage);
  }
};

  // Handle bid submission for similar auctions
  const handleSimilarAuctionBid = async (similarAuction) => {
    try {
      // Check if user is logged in
      if (!isLogged || !auth.tokens) {
        toast.error("Veuillez vous connecter pour placer une enchère");
        router.push("/auth/login");
        return;
      }

      // Check if auction has ended
      const auctionEndDate = similarAuction.endDate || similarAuction.endingAt;
      if (auctionEndDate && new Date(auctionEndDate) <= new Date()) {
        toast.error("Cette enchère est terminée");
        return;
      }

      // Check if user is the owner of the auction
      const isOwner = isLogged && auth.user._id === (similarAuction.owner?._id || similarAuction.owner);
      if (isOwner) {
        toast.error("Vous ne pouvez pas enchérir sur votre propre enchère");
        return;
      }

      // Calculate suggested bid amount (current price + 5% of starting price)
      const currentPrice = similarAuction.currentPrice || similarAuction.startingPrice || 0;
      const startingPrice = similarAuction.startingPrice || 0;
      // Using Math.floor to ensure whole number
      const suggestedBid = Math.floor(currentPrice + Math.max(1, Math.floor(startingPrice * 0.05)));

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Voulez-vous placer une enchère de ${formatPrice(suggestedBid)} sur "${similarAuction.title || similarAuction.name}" ?`
      );

      if (!confirmed) {
        return;
      }

      const bidPayload = {
        price: Math.floor(suggestedBid),
        user: auth.user._id,
        owner: auth.user._id,
      };
      
      console.log("[MultipurposeDetails1] Sending similar auction bid:", bidPayload);

      try {
        // Send the offer - using Math.floor to ensure whole number
        const offerResponse = await OfferAPI.sendOffer(similarAuction._id, bidPayload);
        
        console.log("[MultipurposeDetails1] Similar auction bid response:", offerResponse);
        
        // Always show success message if we got here (no exception thrown)
        toast.success("Votre enchère a été placée avec succès !");
        
        // Refresh the similar auctions data
        try {
          const refreshedData = await AuctionsAPI.getAuctions();
          setAllAuctions(refreshedData);
        } catch (refreshErr) {
          console.warn("Failed to refresh auction data after successful bid:", refreshErr);
        }
      } catch (submitError) {
        // If there was an error during submission, check if it has a status code
        // Status codes in the 2xx range indicate success despite the error
        const statusCode = submitError?.response?.status;
        const hasSuccessStatus = statusCode && statusCode >= 200 && statusCode < 300;
        
        console.log("[MultipurposeDetails1] Similar auction bid error:", submitError, "Status code:", statusCode);
        
        // If we have a success status code, treat it as success
        if (hasSuccessStatus) {
          toast.success("Votre enchère a été placée avec succès !");
          
          // Try to refresh the auction data
          try {
            const refreshedData = await AuctionsAPI.getAuctions();
            setAllAuctions(refreshedData);
          } catch (refreshErr) {
            console.warn("Failed to refresh similar auctions data:", refreshErr);
          }
        } else {
          // Re-throw the error to be caught by the outer catch block
          throw submitError;
        }
      }

    } catch (err) {
      console.error("Error placing bid on similar auction:", err);
      
      // Check if the error response contains a success flag that's true
      // This handles cases where the offer was saved but error was thrown anyway
      if (err?.response?.data?.success === true) {
        console.log("[MultipurposeDetails1] Detected successful operation despite error:", err);
        toast.success("Votre enchère a été placée avec succès !");
        
        // Refresh the auction data
        try {
          const refreshedData = await AuctionsAPI.getAuctions();
          setAllAuctions(refreshedData);
        } catch (refreshErr) {
          console.warn("Failed to refresh similar auctions data:", refreshErr);
        }
        return;
      }
      
      // Check if we have data despite the error
      if (err?.response?.data) {
        console.log("[MultipurposeDetails1] Error response contains data:", err.response.data);
        
        // If the data contains a valid offer object, consider it a success
        if (err.response.data.price || err.response.data._id) {
          console.log("[MultipurposeDetails1] Found offer data in error response, treating as success");
          toast.success("Votre enchère a été placée avec succès !");
          
          // Refresh the auction data
          try {
            const refreshedData = await AuctionsAPI.getAuctions();
            setAllAuctions(refreshedData);
          } catch (refreshErr) {
            console.warn("Failed to refresh similar auctions data:", refreshErr);
          }
          return;
        }
      }
      
      let errorMessage = "Échec de l'enchère. Veuillez réessayer.";
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
        auction: auctionId, // Pass the auction ID
      };

      await ReviewAPI.submitReview(auctionId, reviewData);
      toast.success("Votre avis a été soumis avec succès !");
      setReviewText("");
      setReviewRating(0);
      // Optionally refresh auction data to show new review
      const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
      setAuctionData(refreshedData);
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
    return `${Math.floor(Number(price)).toLocaleString()} `;
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
    if (amount < safeStartingPrice) {
      toast.error(`Le montant doit être au moins ${formatPrice(safeStartingPrice)}`);
      return;
    }

    try {
      setSavingAutoBid(true);
      
      // Call the auto-bid API using AutoBidAPI
      try {
        console.log("Calling createOrUpdateAutoBid with:", {
          auctionId,
          price: amount,
          user: auth.user._id,
          bid: auctionId
        });
        
        const result = await AutoBidAPI.createOrUpdateAutoBid(auctionId, {
          price: amount,
          user: auth.user._id,
          bid: auctionId
        });
        
        console.log("Auto-bid creation result:", result);
        
        // Immediately update UI state without waiting for a refresh
        setHasExistingAutoBid(true);
        setProfessionalAmount(amount.toString());
        
        toast.success("Auto-enchère sauvegardée avec succès !");
        
        // Also refresh the auction data to get any updates in the background
        try {
          const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
          setAuctionData(refreshedData);
          if (refreshedData?.offers) {
            setOffers(refreshedData.offers);
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
          auctionId,
          userId: auth.user._id
        });
        
        await AutoBidAPI.deleteAutoBid(auctionId, auth.user._id);
        console.log("Auto-bid deletion successful");
        
        // Immediately update UI state without waiting for a refresh
        setHasExistingAutoBid(false);
        setProfessionalAmount(safeStartingPrice.toString());
        
        toast.success("Auto-enchère supprimée avec succès !");
      } catch (deleteBidError) {
        console.error("Error in deleteAutoBid:", deleteBidError);
        
        // Check if the error response contains a success flag
        const errorResponse = deleteBidError?.response?.data;
        if (errorResponse && errorResponse.success === true) {
          console.log("Auto-bid deleted successfully despite error:", errorResponse);
          
          // Immediately update UI state
          setHasExistingAutoBid(false);
          setProfessionalAmount(safeStartingPrice.toString());
          
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
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        .auction-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .auction-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 99, 177, 0.15);
        }

        .timer-digit {
          animation: pulse 1s infinite;
        }

        .timer-digit.urgent {
          animation: pulse 0.5s infinite;
          color: #ff4444;
        }
      `}</style>

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
                <h3 className="mt-3">Chargement des détails de l'enchère...</h3>
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
      ) : (
        <>
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
                        safeThumbs.length > 0
                          ? `${app.route}${safeThumbs[selectedImageIndex]?.url}`
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
                    {(safeThumbs.length > 0 || safeVideos.length > 0) && (
                      <div className="media-toggle-buttons" style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        display: 'flex',
                        gap: '8px',
                        zIndex: 10
                      }}>
                        {safeThumbs.length > 0 && (
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
                            📷 Images ({safeThumbs.length})
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
                      {safeThumbs.length > 0 && safeThumbs.map((thumb, index) => (
                        <SwiperSlide className="swiper-slide" key={`img-${index}`}>
                            <div
                              className={`thumbnail ${
                              !showVideo && index === selectedImageIndex ? "active" : ""
                              }`}
                            style={{ position: 'relative' }}
                            >
                              <img
                                src={`${app.route}${thumb.url}`}
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
                      {safeThumbs.length === 0 && safeVideos.length === 0 && (
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
                              <td className="fw-bold">Prix de départ</td>
                              <td>
                                {formatPrice(safeStartingPrice)}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Prix actuel</td>
                              <td>
                                {formatPrice(safeCurrentPrice)}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Quantité disponible</td>
                              <td>
                                <span style={{
                                  color: '#0063b1',
                                  fontWeight: '600',
                                  fontSize: '16px'
                                }}>
                                  {auctionData?.quantity || "Non spécifiée"}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Prix total (Prix actuel × Quantité)</td>
                              <td>
                                <span style={{
                                  color: '#28a745',
                                  fontWeight: '700',
                                  fontSize: '18px'
                                }}>
                                  {auctionData?.quantity && auctionData?.quantity !== "Non spécifiée" 
                                    ? formatPrice(safeCurrentPrice * parseInt(auctionData.quantity))
                                    : formatPrice(safeCurrentPrice)
                                  }
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Type d'enchère</td>
                              <td>{auctionData?.bidType || "PRODUCT"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Statut</td>
                              <td>
                                <span className="status-badge">
                                  {auctionData?.status || "OPEN"}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bid-section">
                        <p className="bid-label">Votre enchère</p>
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
                            Vous ne pouvez pas enchérir sur votre propre
                            enchère.
                          </div>
                        )}
                        <div className="quantity-counter-and-btn-area">
                          <HandleQuantity
                            initialValue={formatPrice(safeCurrentPrice)}
                            startingPrice={safeStartingPrice}
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
                                ? "Vous ne pouvez pas enchérir sur votre propre enchère."
                                : undefined
                            }
                          >
                            <div className="btn-content">
                              <span>Placer une Enchère</span>
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
                              value={professionalAmount || safeCurrentPrice}
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
                              fontSize: '12px'
                            }}>
                              Montant minimum: {formatPrice(safeStartingPrice)}
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
                        Avis ({auctionData?.reviews?.length || 0})
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
                          <h3>{auctionData?.name || "Détails du Produit"}</h3>
                          <p>
                            {auctionData?.description ||
                              "Aucune description disponible."}
                          </p>
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
                              Produit de Qualité
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
                              Excellent État
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
                              Livraison Disponible
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
                            <h4>{t('auctionDetails.reviews')} ({auctionData?.reviews?.length || 0})</h4>
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
                              {auctionData?.reviews &&
                              auctionData.reviews.length > 0 ? (
                                auctionData.reviews.map((review, index) => (
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
                                {auctionData?.comments?.length || 0})
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
                                        bid: auctionId,
                                      });
                                      const response =
                                        await CommentAPI.setForBid(auctionId, {
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
                                        await AuctionsAPI.getAuctionById(
                                          auctionId
                                        );
                                      setAuctionData(data);
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
                                        placeholder="Partagez votre opinion sur cette enchère..."
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
                            {auctionData?.comments?.length > 0 ? (
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
                                    ? auctionData.comments
                                    : auctionData.comments.slice(0, 5)
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
                                {auctionData.comments.length > 5 && (
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
                                            auctionData.comments.length - 5
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
                                  Aucun commentaire pour cette enchère.
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
                                Aucune offre n'a été faite pour cette enchère.
                              </p>
                              <p
                                style={{
                                  margin: "8px 0 0 0",
                                  fontSize: "14px",
                                  color: "#aaa",
                                }}
                              >
                                Soyez le premier à faire une offre !
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

          {/* Similar Auctions Section */}
          <div className="related-auction-section mb-110">
            <div className="container">
              <div className="row mb-50">
                <div className="col-lg-12 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="section-title">
                    <h2 className="related-auction-title">
                      Enchères <span>Similaires</span>
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
                        {allAuctions && allAuctions.length > 1 ? (
                          allAuctions
                            .filter((auction) => auction._id !== auctionId)
                            .slice(0, 4)
                            .map((auction, index) => {
                              const hasAuctionEnded =
                                similarAuctionTimers[index]?.total <= 0;
                              const timer = similarAuctionTimers[index] || { days: "00", hours: "00", minutes: "00", seconds: "00" };
                              const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30;

                              // Get seller display name (handles anonymous sellers)
                              const getSellerDisplayName = (auction) => {
                                if (auction.hidden === true) {
                                  return t('common.anonymous');
                                }
                                if (auction.owner?.firstName && auction.owner?.lastName) {
                                  return `${auction.owner.firstName} ${auction.owner.lastName}`;
                                }
                                if (auction.owner?.name) {
                                  return auction.owner.name;
                                }
                                if (auction.seller?.name) {
                                  return auction.seller.name;
                                }
                                return t('liveAuction.seller');
                              };

                              const displayName = getSellerDisplayName(auction);

                              return (
                                <SwiperSlide
                                  className="swiper-slide"
                                  key={auction._id || index}
                                  style={{ height: 'auto', display: 'flex', justifyContent: 'center' }}
                                >
                                  <div
                                    className="auction-card-hover"
                                    style={{
                                      background: hasAuctionEnded ? "#f0f0f0" : "white",
                                      borderRadius: "clamp(16px, 3vw, 20px)",
                                      overflow: "hidden",
                                      boxShadow: hasAuctionEnded ? "none" : "0 8px 25px rgba(0, 0, 0, 0.08)",
                                      border: hasAuctionEnded ? "1px solid #d0d0d0" : "1px solid rgba(0, 0, 0, 0.05)",
                                      width: "100%",
                                      maxWidth: "320px",
                                      position: "relative",
                                      minHeight: "360px",
                                      cursor: hasAuctionEnded ? "not-allowed" : "pointer",
                                      opacity: hasAuctionEnded ? 0.6 : 1,
                                      pointerEvents: hasAuctionEnded ? "none" : "auto",
                                      transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!hasAuctionEnded) {
                                        e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                                        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 99, 177, 0.15)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!hasAuctionEnded) {
                                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.08)";
                                      }
                                    }}
                                  >
                                    {/* Auction Image */}
                                    <div style={{
                                      position: "relative",
                                      height: "clamp(160px, 25vw, 200px)",
                                      overflow: "hidden",
                                    }}>
                                      <img
                                        src={
                                          auction.thumbs && auction.thumbs.length > 0
                                            ? `${app.route}${auction.thumbs[0].url}`
                                            : DEFAULT_AUCTION_IMAGE
                                        }
                                        alt={auction.title || auction.name || "Auction"}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                          transition: "transform 0.4s ease",
                                          filter: hasAuctionEnded ? "grayscale(100%)" : "none",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!hasAuctionEnded) {
                                            e.currentTarget.style.transform = "scale(1.1)";
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = "scale(1)";
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
                                        }}
                                        crossOrigin="use-credentials"
                                      />

                                      {/* Professional Badge */}
                                      {auction.isPro && !hasAuctionEnded && (
                                        <div style={{
                                          position: "absolute",
                                          top: "10px",
                                          left: "10px",
                                          background: "linear-gradient(45deg, #ffd700, #ffed4e)",
                                          color: "#1a1a1a",
                                          padding: "6px 12px",
                                          borderRadius: "20px",
                                          fontSize: "11px",
                                          fontWeight: "700",
                                          boxShadow: "0 4px 12px rgba(255, 215, 0, 0.4)",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          zIndex: 2,
                                        }}>
                                          <span>👑</span>
                                          <span>PRO</span>
                                        </div>
                                      )}

                                      {/* Timer Overlay */}
                                      <div style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        background: hasAuctionEnded 
                                          ? "rgba(100, 100, 100, 0.8)" 
                                          : isUrgent 
                                            ? "linear-gradient(45deg, #ff4444, #ff6666)" 
                                            : "linear-gradient(45deg, #0063b1, #00a3e0)",
                                        color: "white",
                                        padding: "8px 12px",
                                        borderRadius: "20px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                                      }}>
                                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                          <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.hours}</span>
                                          <span>:</span>
                                          <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.minutes}</span>
                                          <span>:</span>
                                          <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.seconds}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Auction Details */}
                                    <div style={{ padding: "clamp(16px, 3vw, 20px)" }}>
                                      {/* Title */}
                                      <h3 style={{
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        color: hasAuctionEnded ? "#666" : "#333",
                                        marginBottom: "12px",
                                        lineHeight: "1.3",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}>
                                        <Link
                                          href={hasAuctionEnded ? "#" : `/auction-details/${auction._id}`}
                                          style={{
                                            color: "inherit",
                                            textDecoration: "none",
                                            cursor: hasAuctionEnded ? "not-allowed" : "pointer",
                                          }}
                                        >
                                          {auction.title || auction.name || "Enchère sans titre"}
                                        </Link>
                                      </h3>

                                      {/* Quantity and Location Info */}
                                      <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "12px",
                                        marginBottom: "16px",
                                      }}>
                                        <div>
                                          <p style={{
                                            fontSize: "12px",
                                            color: hasAuctionEnded ? "#888" : "#666",
                                            margin: "0 0 4px 0",
                                            fontWeight: "600",
                                          }}>
                                            Quantité
                                          </p>
                                          <p style={{
                                            fontSize: "14px",
                                            color: hasAuctionEnded ? "#888" : "#333",
                                            margin: 0,
                                            fontWeight: "500",
                                          }}>
                                            {auction.quantity || "Non spécifiée"}
                                          </p>
                                        </div>

                                        <div>
                                          <p style={{
                                            fontSize: "12px",
                                            color: hasAuctionEnded ? "#888" : "#666",
                                            margin: "0 0 4px 0",
                                            fontWeight: "600",
                                          }}>
                                            Localisation
                                          </p>
                                          <p style={{
                                            fontSize: "14px",
                                            color: hasAuctionEnded ? "#888" : "#333",
                                            margin: 0,
                                            fontWeight: "500",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}>
                                            {auction.location || auction.wilaya || "Non spécifiée"}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Separator Line */}
                                      <div style={{
                                        width: "100%",
                                        height: "1px",
                                        background: "linear-gradient(90deg, transparent, #e9ecef, transparent)",
                                        margin: "0 0 16px 0",
                                      }}></div>

                                      {/* Description */}
                                      {auction.description && (
                                        <div style={{ marginBottom: "16px" }}>
                                          <p style={{
                                            fontSize: "12px",
                                            color: hasAuctionEnded ? "#888" : "#666",
                                            margin: "0 0 4px 0",
                                            fontWeight: "600",
                                          }}>
                                            Description
                                          </p>
                                          <p style={{
                                            fontSize: "13px",
                                            color: hasAuctionEnded ? "#888" : "#555",
                                            margin: 0,
                                            lineHeight: "1.4",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}>
                                            {auction.description}
                                          </p>
                                        </div>
                                      )}

                                      {/* Separator Line after Description */}
                                      {auction.description && (
                                        <div style={{
                                          width: "100%",
                                          height: "1px",
                                          background: "linear-gradient(90deg, transparent, #e9ecef, transparent)",
                                          margin: "0 0 16px 0",
                                        }}></div>
                                      )}

                                      {/* Price Info */}
                                      <div style={{
                                        background: hasAuctionEnded 
                                          ? "#e8e8e8" 
                                          : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                                        borderRadius: "12px",
                                        padding: "12px",
                                        marginBottom: "16px",
                                        border: hasAuctionEnded 
                                          ? "1px solid #d8d8d8" 
                                          : "1px solid #e9ecef",
                                      }}>
                                        <div style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "8px",
                                        }}>
                                          <div style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            background: hasAuctionEnded ? "#888" : "#28a745",
                                            animation: hasAuctionEnded ? "none" : "pulse 2s infinite",
                                          }}></div>
                                          <span style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: hasAuctionEnded ? "#888" : "#28a745",
                                          }}>
                                            Prix actuel
                                          </span>
                                        </div>
                                        <div style={{ textAlign: "center", marginTop: "8px" }}>
                                          <p style={{
                                            fontSize: "22px",
                                            fontWeight: "800",
                                            margin: 0,
                                            color: hasAuctionEnded ? "#888" : "#0063b1",
                                            background: hasAuctionEnded 
                                              ? "#888" 
                                              : "linear-gradient(90deg, #0063b1, #00a3e0)",
                                            WebkitBackgroundClip: "text",
                                            backgroundClip: "text",
                                            WebkitTextFillColor: hasAuctionEnded ? "#888" : "transparent",
                                          }}>
                                            {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} DA
                                          </p>
                                        </div>
                                      </div>

                                      {/* Quantity Section */}
                                      <div style={{
                                        background: hasAuctionEnded 
                                          ? "#f8f8f8" 
                                          : "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                                        borderRadius: "12px",
                                        padding: "12px",
                                        marginBottom: "12px",
                                        border: hasAuctionEnded 
                                          ? "1px solid #e0e0e0" 
                                          : "1px solid rgba(0, 99, 177, 0.1)",
                                      }}>
                                        <div style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "8px",
                                        }}>
                                          <div style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            background: hasAuctionEnded ? "#888" : "#0063b1",
                                            animation: hasAuctionEnded ? "none" : "pulse 2s infinite",
                                          }}></div>
                                          <span style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: hasAuctionEnded ? "#888" : "#0063b1",
                                          }}>
                                            Quantité disponible
                                          </span>
                                        </div>
                                        <div style={{ textAlign: "center", marginTop: "8px" }}>
                                          <p style={{
                                            fontSize: "18px",
                                            fontWeight: "700",
                                            margin: 0,
                                            color: hasAuctionEnded ? "#888" : "#0063b1",
                                          }}>
                                            {auction.quantity || "Non spécifiée"}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Total Price Section */}
                                      <div style={{
                                        background: hasAuctionEnded 
                                          ? "#f8f8f8" 
                                          : "linear-gradient(135deg, #e8f5e8, #f0f8f0)",
                                        borderRadius: "12px",
                                        padding: "12px",
                                        marginBottom: "12px",
                                        border: hasAuctionEnded 
                                          ? "1px solid #e0e0e0" 
                                          : "1px solid rgba(40, 167, 69, 0.2)",
                                      }}>
                                        <div style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "8px",
                                        }}>
                                          <div style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            background: hasAuctionEnded ? "#888" : "#28a745",
                                            animation: hasAuctionEnded ? "none" : "pulse 2s infinite",
                                          }}></div>
                                          <span style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: hasAuctionEnded ? "#888" : "#28a745",
                                          }}>
                                            Prix total (Prix actuel × Quantité)
                                          </span>
                                        </div>
                                        <div style={{ textAlign: "center", marginTop: "8px" }}>
                                          <p style={{
                                            fontSize: "20px",
                                            fontWeight: "800",
                                            margin: 0,
                                            color: hasAuctionEnded ? "#888" : "#28a745",
                                            background: hasAuctionEnded 
                                              ? "#888" 
                                              : "linear-gradient(90deg, #28a745, #20c997)",
                                            WebkitBackgroundClip: "text",
                                            backgroundClip: "text",
                                            WebkitTextFillColor: hasAuctionEnded ? "#888" : "transparent",
                                          }}>
                                            {auction.quantity && auction.quantity !== "Non spécifiée" 
                                              ? (Number(auction.currentPrice || auction.startingPrice || 0) * parseInt(auction.quantity)).toLocaleString() + " DA"
                                              : Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString() + " DA"
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      {/* Separator Line after Price */}
                                      <div style={{
                                        width: "100%",
                                        height: "1px",
                                        background: "linear-gradient(90deg, transparent, #e9ecef, transparent)",
                                        margin: "0 0 16px 0",
                                      }}></div>

                                      {/* Bidders Count */}
                                      <div style={{
                                        background: hasAuctionEnded 
                                          ? "#e8e8e8" 
                                          : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                                        borderRadius: "12px",
                                        padding: "12px",
                                        marginBottom: "16px",
                                        border: hasAuctionEnded 
                                          ? "1px solid #d8d8d8" 
                                          : "1px solid #e9ecef",
                                      }}>
                                        <div style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "8px",
                                        }}>
                                          <div style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            background: hasAuctionEnded ? "#888" : "#0063b1",
                                            animation: hasAuctionEnded ? "none" : "pulse 2s infinite",
                                          }}></div>
                                          <span style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: hasAuctionEnded ? "#888" : "#0063b1",
                                          }}>
                                            {auction.biddersCount || 0} participant{(auction.biddersCount || 0) !== 1 ? "s" : ""}
                                          </span>
                                          <span style={{
                                            fontSize: "12px",
                                            color: hasAuctionEnded ? "#888" : "#666",
                                          }}>
                                            ont enchéri
                                          </span>
                                        </div>
                                      </div>

                                      {/* Separator Line after Bidders Count */}
                                      <div style={{
                                        width: "100%",
                                        height: "1px",
                                        background: "linear-gradient(90deg, transparent, #e9ecef, transparent)",
                                        margin: "0 0 16px 0",
                                      }}></div>

                                      {/* Seller Info */}
                                      <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        marginBottom: "16px",
                                      }}>
                                        <img
                                          src={auction.seller?.photoURL || auction.owner?.photoURL || DEFAULT_PROFILE_IMAGE}
                                          alt={displayName}
                                          style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            filter: hasAuctionEnded ? "grayscale(100%)" : "none",
                                          }}
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                                          }}
                                        />
                                        <span style={{
                                          fontSize: "14px",
                                          color: hasAuctionEnded ? "#888" : "#666",
                                          fontWeight: "500",
                                        }}>
                                          {displayName}
                                        </span>
                                      </div>

                                      {/* View Auction Button */}
                                      <Link
                                        href={hasAuctionEnded ? "#" : `/auction-details/${auction._id}`}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "8px",
                                          width: "100%",
                                          padding: "12px 20px",
                                          background: hasAuctionEnded 
                                            ? "#cccccc" 
                                            : "linear-gradient(90deg, #0063b1, #00a3e0)",
                                          color: hasAuctionEnded ? "#888" : "white",
                                          textDecoration: "none",
                                          borderRadius: "25px",
                                          fontWeight: "600",
                                          fontSize: "14px",
                                          transition: "all 0.3s ease",
                                          boxShadow: hasAuctionEnded ? "none" : "0 4px 12px rgba(0, 99, 177, 0.3)",
                                          cursor: hasAuctionEnded ? "not-allowed" : "pointer",
                                          pointerEvents: hasAuctionEnded ? "none" : "auto",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!hasAuctionEnded) {
                                            e.currentTarget.style.background = "linear-gradient(90deg, #00a3e0, #0063b1)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 99, 177, 0.4)";
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!hasAuctionEnded) {
                                            e.currentTarget.style.background = "linear-gradient(90deg, #0063b1, #00a3e0)";
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 99, 177, 0.3)";
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
                                  {t('auctionDetails.noSimilarAuctions')}
                                </h3>
                                <p
                                  style={{
                                    fontSize: "16px",
                                    color: "#666",
                                    lineHeight: "1.6",
                                  }}
                                >
                                  {t('auctionDetails.checkMainPage')}
                                </p>
                              </div>
                              <div style={{ flex: "0 0 auto" }}>
                                <Link
                                  href="/auction-sidebar"
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
                                  Voir toutes les enchères
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

export default MultipurposeDetails1;