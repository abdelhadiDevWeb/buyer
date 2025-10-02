"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (type: 'like' | 'dislike', comment: string) => void;
  targetUserId: string;
  auctionTitle?: string;
  isLoading?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmitReview,
  auctionTitle,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<'like' | 'dislike' | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!selectedType) return;
    onSubmitReview(selectedType, comment);
  };

  const handleClose = () => {
    setSelectedType(null);
    setComment('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#666';
                }}
              >
                ×
              </button>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  margin: '0 auto 15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  🎉
                </div>
                <h2 style={{
                  margin: '0 0 10px',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#333'
                }}>
                  {t('review.congratulations')}
                </h2>
                <p style={{
                  margin: 0,
                  color: '#666',
                  fontSize: '16px',
                  lineHeight: '1.5'
                }}>
                  {t('review.youWonAuction')} {auctionTitle && `"${auctionTitle}"`}
                </p>
              </div>

              {/* Review Section */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  {t('review.rateYourExperience')}
                </h3>

                {/* Like/Dislike Options */}
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType('like')}
                    style={{
                      flex: 1,
                      padding: '15px',
                      border: selectedType === 'like' ? '2px solid #4CAF50' : '2px solid #e0e0e0',
                      borderRadius: '12px',
                      background: selectedType === 'like' ? '#f8fff8' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: selectedType === 'like' ? '#4CAF50' : '#666',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>👍</span>
                    {t('review.like')}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType('dislike')}
                    style={{
                      flex: 1,
                      padding: '15px',
                      border: selectedType === 'dislike' ? '2px solid #f44336' : '2px solid #e0e0e0',
                      borderRadius: '12px',
                      background: selectedType === 'dislike' ? '#fff8f8' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: selectedType === 'dislike' ? '#f44336' : '#666',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>👎</span>
                    {t('review.dislike')}
                  </motion.button>
                </div>

                {/* Comment Section */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '8px'
                  }}>
                    {t('review.addComment')} ({t('review.optional')})
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('review.commentPlaceholder')}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0063b1';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {t('common.cancel')}
                </button>

                <motion.button
                  whileHover={!isLoading && selectedType ? { scale: 1.02 } : {}}
                  whileTap={!isLoading && selectedType ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={!selectedType || isLoading}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: selectedType && !isLoading 
                      ? 'linear-gradient(135deg, #0063b1, #0078d7)' 
                      : '#e0e0e0',
                    color: selectedType && !isLoading ? 'white' : '#999',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: selectedType && !isLoading ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {isLoading ? t('review.submitting') : t('review.submitReview')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Spinning animation */}
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal; 