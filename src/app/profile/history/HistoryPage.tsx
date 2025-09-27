"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import useAuth from '@/hooks/useAuth';
import { OfferAPI } from '@/app/api/offer';
import { Pagination, Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material';
import { styled } from '@mui/system';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; 
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { extractErrorMessage } from '@/types/Error'; 

interface OfferHistoryItem {
  _id: string;
  price: number;
  status?: 'en attente' | 'accepted' | 'declined'; 
  createdAt: string;
  bid: {
    title: string;
    _id: string;
  };
  user: {
    firstName: string;
    lastName: string;
  };
}



// --- Styled Components ---

const HistoryContainer = styled(Box)(({ theme }) => ({
  padding: '40px', // Increased padding for a more premium feel
  backgroundColor: '#ffffff', // Clean white background for the main content area
  borderRadius: '20px', // More significantly rounded corners
  boxShadow: '0 15px 45px rgba(0,0,0,0.1)', // Deeper, softer shadow for elevation
  border: '1px solid #e0e0e0', // Subtle border for definition
  position: 'relative',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #f8fbfd 0%, #edf2f7 100%)', // Very light, subtle gradient
  [theme.breakpoints.down('sm')]: {
    padding: '20px', // Adjust padding for smaller screens
  },
}));

const OfferCard = styled(Card)(({ theme }) => ({
  marginBottom: '25px', // More space between cards
  borderRadius: '16px', // Consistent, slightly more rounded corners
  boxShadow: '0 8px 25px rgba(0,0,0,0.08)', // Deeper shadow for elevation
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  backgroundColor: '#ffffff', // White card background
  border: '1px solid #f5f5f5', // Very light border
  '&:hover': {
    transform: 'translateY(-10px)', // More pronounced lift on hover
    boxShadow: '0 15px 40px rgba(0,0,0,0.15)', // Even deeper shadow on hover
    backgroundColor: '#fdfdfd', // Slight background change on hover
  },
  [theme.breakpoints.down('sm')]: {
    marginBottom: '15px',
  },
}));

const StatusChip = styled(Chip)<{ status: string }>(({ status, theme }) => ({
  fontWeight: '600',
  color: 'white',
  padding: '6px 12px', // More padding for a softer, pill-like look
  borderRadius: '20px', // More rounded, pill shape
  fontSize: '0.8rem', // Slightly larger font for readability
  textTransform: 'uppercase',
  letterSpacing: '0.7px', // More letter spacing
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)', // Consistent shadow for chips
  ...(status === 'accepted' && {
    backgroundColor: '#28a745', // Success green
    boxShadow: '0 4px 12px rgba(40,167,69,0.3)',
  }),
  ...(status === 'en attente' && {
    backgroundColor: '#ffc107', // Warning yellow
    color: '#495057', // Darker text for contrast on yellow
    boxShadow: '0 4px 12px rgba(255,193,7,0.3)',
  }),
  ...(status === 'declined' && {
    backgroundColor: '#dc3545', // Danger red
    boxShadow: '0 4px 12px rgba(220,53,69,0.3)',
  }),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.7rem',
    padding: '4px 8px',
  },
}));

// --- Loading Skeleton Component ---

const LoadingSkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {[...Array(3)].map((_, index) => (
      <OfferCard key={index}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <Box sx={{ height: 28, backgroundColor: '#e0e0e0', borderRadius: '8px', width: '60%', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <Box sx={{ height: 24, backgroundColor: '#e0e0e0', borderRadius: '12px', width: '20%', animation: 'pulse 1.5s infinite ease-in-out 0.1s' }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ height: 20, backgroundColor: '#e0e0e0', borderRadius: '6px', width: '40%', animation: 'pulse 1.5s infinite ease-in-out 0.2s' }} />
            <Box sx={{ height: 20, backgroundColor: '#e0e0e0', borderRadius: '6px', width: '30%', animation: 'pulse 1.5s infinite ease-in-out 0.3s' }} />
          </Box>
        </CardContent>
      </OfferCard>
    ))}
    <style jsx global>{`
      @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 0.4; }
        100% { opacity: 0.8; }
      }
    `}</style>
  </Box>
);


export default function HistoryPage() {
  const { auth, isLogged } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [offers, setOffers] = useState<OfferHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchOfferHistory = async () => {
      // --- Debugging console logs ---
      console.log('HistoryPage: useEffect triggered.');
      console.log('HistoryPage: isLogged:', isLogged);
      console.log('HistoryPage: auth.user?._id:', auth.user?._id);
      // --- End Debugging console logs ---

      // Ensure auth.user?._id is available before making the API call
      if (!isLogged || !auth.user?._id) {
        setIsLoading(false);
        console.log('HistoryPage: Not logged in or user ID not available. Skipping fetch.');
        return;
      }

      setIsLoading(true);
      try {
        // Correctly access the response: it's the array directly, not response.data
        const response = await OfferAPI.getOffersByUserId(auth.user._id);

        // --- Debugging console logs ---
        console.log('HistoryPage: API Response:', response); // Log the full response
        // --- End Debugging console logs ---

        // The API returns a wrapped response, so access the data property and map to the expected format
        const apiOffers = response?.data || [];
        const fetchedOffers: OfferHistoryItem[] = apiOffers.map(offer => ({
          _id: offer.id,
          price: offer.amount,
          status: offer.status === 'pending' ? 'en attente' : offer.status === 'accepted' ? 'accepted' : 'declined',
          createdAt: offer.createdAt,
          bid: {
            title: `Auction ${offer.auctionId}`, // You might want to fetch actual auction title
            _id: offer.auctionId
          },
          user: {
            firstName: 'User', // You might want to fetch actual user data
            lastName: 'Name'
          }
        }));

        // --- Debugging console logs ---
        console.log('HistoryPage: Fetched Offers (after direct access):', fetchedOffers); // Log the extracted data
        // --- End Debugging console logs ---

        // Implement client-side pagination
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setOffers(fetchedOffers.slice(startIndex, endIndex));
        setTotalPages(Math.ceil(fetchedOffers.length / itemsPerPage));

      } catch (error: unknown) {
        console.error('Error fetching offer history:', error);
        enqueueSnackbar(extractErrorMessage(error) || 'Failed to fetch offer history.', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfferHistory();
  }, [isLogged, auth.user?._id, enqueueSnackbar, page]); // Re-fetch when user ID or page changes

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Use 12-hour format
    };
    return date.toLocaleString('en-US', options);
  };

  return (
    <HistoryContainer>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '40px' }} // Increased bottom margin for header
      >
        <Typography variant="h4" component="h2" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px', // More space around icon
          color: '#2C3E50', // Deep charcoal for main title
          fontWeight: 700,
          marginBottom: '10px',
          fontSize: '2.2rem', // Slightly larger font size for impact
        }}>
          <i className="bi bi-clock-history" style={{ fontSize: '2.5rem', color: '#5DADE2' }}></i> {/* Brighter blue for icon */}
          My Offer History
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{
          fontSize: '1.15rem', // Slightly larger description text
          color: '#7F8C8D', // Softer, professional grey for description
        }}>
          Review all the offers you&apos;ve made and track their current status.
        </Typography>
      </motion.div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          {offers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center', padding: '80px 30px', color: '#90a4ae', backgroundColor: '#fdfdfd', borderRadius: '16px', border: '2px dashed #cfd8dc' }} // Enhanced empty state styling
            >
              <i className="bi bi-folder-x" style={{ fontSize: '5rem', marginBottom: '30px', color: '#b0bec5' }}></i> {/* More relevant icon */}
              <Typography variant="h5" sx={{ fontWeight: 700, marginBottom: '15px', color: '#5D6D7E' }}>No Offers Yet</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#7F8C8D' }}>
                It looks like you haven&apos;t made any offers. Start exploring auctions today!
              </Typography>
              {/* Optional: Add a button to navigate to auctions page */}
              {/* <Button variant="contained" color="primary" sx={{ marginTop: '20px' }}>Browse Auctions</Button> */}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {offers.map((offer) => (
                  <Box key={offer._id}>
                    <OfferCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                          <Typography variant="h6" component="div" sx={{ color: '#34495E', fontWeight: 600, fontSize: '1.4rem' }}>
                            {offer.bid?.title || 'Untitled Bid'}
                          </Typography>
                          {/* Corrected: Apply optional chaining and nullish coalescing consistently */}
                          <StatusChip
                            label={(offer.status?.toUpperCase() ?? 'en attente')}
                            status={(offer.status ?? 'en attente')}
                            size="medium" 
                          />
                        </Box>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' }, 
                          gap: { xs: '10px', sm: '0' }, 
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AttachMoneyIcon sx={{ color: '#607d8b', fontSize: '1.4rem' }} />
                            Offer Amount: <Typography component="span" sx={{ fontWeight: 700, color: '#27AE60', fontSize: '1.1rem' }}>${offer.price.toFixed(2)}</Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CalendarTodayIcon sx={{ color: '#607d8b', fontSize: '1.3rem' }} />
                            Date: {formatDateTime(offer.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </OfferCard>
                  </Box>
                ))}
              </Box>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: '12px', // More rounded pagination items
                        padding: '8px 16px', // More clickable area
                        fontWeight: 600,
                        '&.Mui-selected': {
                          backgroundColor: '#3f51b5', // Primary color for selected
                          color: 'white',
                          boxShadow: '0 4px 15px rgba(63,81,181,0.3)',
                          '&:hover': {
                            backgroundColor: '#303f9f', // Darker on hover for selected
                          },
                        },
                        '&:hover': {
                          backgroundColor: '#e3f2fd', // Light hover for unselected
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </HistoryContainer>
  );
}