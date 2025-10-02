"use client"

import React, { useState, useEffect, useRef } from "react"
import Header from "@/components/header/Header"
import Footer from "@/components/footer/Footer"
import useAuth from "@/hooks/useAuth"
import { useSnackbar } from "notistack"
import RequestProvider from "@/contexts/RequestContext"
import SocketProvider from "@/contexts/socket"
import { motion, AnimatePresence } from "framer-motion"
import "./modern-styles.css"
import { UserAPI } from "@/app/api/users"
import { useIdentityStatus } from "@/hooks/useIdentityStatus"
import { useRouter } from "next/navigation"
import HistoryPage from "./history/HistoryPage"
import { useTranslation } from "react-i18next"
import { authStore } from "@/contexts/authStore"

const ProfilePageWrapper = () => {
  const [show, setShow] = useState(false)
  const [check, setCheck] = useState(false)

  return (
    <SocketProvider setShow={setShow} setCheck={setCheck}>
      <div className={`${show && "AllPages"}`}>
        <RequestProvider>
            <ProfilePage />
        </RequestProvider>
      </div>
    </SocketProvider>
  )
}

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  rate: number
}

interface AvatarData {
  fullUrl?: string;
  url?: string;
  _id?: string;
  filename?: string;
}

import app from '@/config';

const API_BASE_URL = app.baseURL;

function ProfilePage() {
  const { t } = useTranslation();
  const { auth, isLogged, isReady, initializeAuth, set, fetchFreshUserData } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { identityStatus, isLoading: isLoadingIdentity } = useIdentityStatus();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("personal-info");
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    rate: 0,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when auth.user changes
  useEffect(() => {
    if (auth.user) {
      setFormData({
        firstName: auth.user.firstName || "",
        lastName: auth.user.lastName || "",
        email: auth.user.email || "",
        phone: auth.user.phone || "",
        rate: auth.user.rate || 0,
      });
    }
  }, [auth.user]);

  const getAvatarUrl = (avatar: AvatarData | string): string => {
    if (typeof avatar === 'string') {
      return avatar.startsWith('http') ? avatar : `${API_BASE_URL}/${avatar}`;
    }
    
    if (avatar?.fullUrl) {
      return avatar.fullUrl;
    }
    
    if (avatar?.url) {
      return avatar.url.startsWith('http') ? avatar.url : `${API_BASE_URL}/${avatar.url}`;
    }
    
    return '/assets/images/avatar.jpg';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔄 Updating profile with data:', formData);

      const response = await UserAPI.updateProfile(formData);
      console.log('✅ Profile update response:', response);

      if (response) {
        let updatedUser;
        
        if (response.user) {
          updatedUser = response.user;
        } else if (response.data) {
          updatedUser = response.data as any;
        } else {
          updatedUser = response as any;
        }

        if (updatedUser) {
          const currentUser = auth.user;
          
          const mergedUser = {
            ...currentUser,
            _id: updatedUser._id || updatedUser.id || currentUser?._id,
            firstName: updatedUser.firstName || formData.firstName || currentUser?.firstName || '',
            lastName: updatedUser.lastName || formData.lastName || currentUser?.lastName || '',
            email: updatedUser.email || currentUser?.email || '',
            type: updatedUser.accountType || updatedUser.type || currentUser?.type || 'CLIENT',
            phone: updatedUser.phone || formData.phone || currentUser?.phone,
            avatar: updatedUser.avatar || currentUser?.avatar,
            rate: currentUser?.rate || 1,
            isPhoneVerified: (currentUser as any)?.isPhoneVerified,
            isVerified: (currentUser as any)?.isVerified,
            isHasIdentity: currentUser?.isHasIdentity,
            isActive: (currentUser as any)?.isActive,
            isBanned: (currentUser as any)?.isBanned,
            photoURL: currentUser?.photoURL,
            fullName: (currentUser as any)?.fullName
          };

          console.log('👤 Merged user data:', mergedUser);

          set({
            tokens: auth.tokens,
            user: mergedUser
          });

          enqueueSnackbar(t('profile.profileUpdated'), { variant: 'success' });
          setIsEditing(false);
        }
      } else {
        console.error('❌ No response received from updateProfile');
        throw new Error(t("profile.noResponseFromServer"));
      }
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);

      if (error.response?.status === 401) {
        enqueueSnackbar(t("profile.sessionExpired"), { variant: 'error' });
        set({ tokens: undefined, user: undefined });
        router.push('/auth/login');
      } else {
        const errorMessage = error.response?.data?.message || error.message || t("profile.failedToUpdateProfile");
        enqueueSnackbar(errorMessage, { variant: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      enqueueSnackbar(t("profile.passwordsDoNotMatch"), { variant: "error" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      enqueueSnackbar(t("profile.passwordTooShort"), { variant: "error" });
      return;
    }

    setIsPasswordChanging(true);

    try {
      console.log('🔐 Changing password...');

      const response = await UserAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      enqueueSnackbar(response.message || t("profile.passwordChanged"), { variant: "success" });
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

    } catch (error: any) {
      console.error('❌ Error changing password:', error);

      if (error.response?.status === 401) {
        enqueueSnackbar(t("profile.sessionExpired"), { variant: 'error' });
        set({ tokens: undefined, user: undefined });
        router.push('/auth/login');
      } else {
        const errorMessage = error.message || t("profile.failedToUpdatePassword");
        enqueueSnackbar(errorMessage, { variant: "error" });
      }
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📄 Selected file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('File size must be less than 5MB', { variant: 'error' });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      enqueueSnackbar('Please select a valid image file (JPEG, PNG, GIF, WebP)', { variant: 'error' });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      console.log('🖼️ Uploading avatar...');
      
      const response = await UserAPI.uploadAvatar(formData);
      
      console.log('✅ Avatar upload response:', response);

      if (response) {
        if (response.user) {
          const currentUser = auth.user;
          const updatedUser = {
            ...currentUser,
            avatar: response.user.avatar,
            photoURL: response.user.photoURL || response.user.avatar?.fullUrl
          };
          
          console.log('👤 Updated user with new avatar:', updatedUser);
          
          set({
            tokens: auth.tokens,
            user: updatedUser as any
          });

          setAvatarKey(Date.now());

          enqueueSnackbar(response.message || t("profile.avatarUpdated"), { variant: "success" });
        } else {
          console.log('📄 No user data in response, fetching fresh data...');
          await fetchFreshUserData();
          setAvatarKey(Date.now());
          enqueueSnackbar(response.message || t("profile.avatarUpdated"), { variant: "success" });
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error('❌ Error uploading avatar:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload avatar';
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleStartResellerConversion = () => {
    router.push("/become-reseller");
  };

  const avatarSrc = auth.user && auth.user.avatar
    ? `${getAvatarUrl(auth.user.avatar)}?v=${avatarKey}`
    : auth.user && auth.user.photoURL && auth.user.photoURL.trim() !== ""
      ? `${getAvatarUrl({ url: auth.user.photoURL })}?v=${avatarKey}`
      : "/assets/images/avatar.jpg";

  // Show login prompt if not logged in
  if (isReady && !isLogged) {
    return (
      <div className="profile-login-required">
        <div className="login-prompt">
          <h2>Authentication Required</h2>
          <p>Please log in to access your profile.</p>
          <button onClick={() => router.push('/auth/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="modern-profile-page">
        {/* Animated Background */}
        <div className="profile-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>

        <div className="modern-profile-container">
          {/* Hero Header Section */}
          <motion.div
            className="modern-profile-hero"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div 
              className="hero-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="hero-text">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  {t("profile.myProfile")}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  {t("profile.manageProfile")}
                </motion.p>
              </div>
              
              {/* Profile Avatar Card */}
              <motion.div
                className="hero-avatar-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.9, type: "spring", stiffness: 100 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="avatar-container">
                  <motion.div 
                    className="avatar-wrapper"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="avatar-frame">
                      <motion.img
                        key={avatarKey}
                        src={avatarSrc}
                        alt="Profile"
                        onError={(e) => {
                          console.log('❌ Avatar image failed to load, using fallback');
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/assets/images/avatar.jpg";
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="avatar-ring"></div>
                      <div className="status-indicator online">
                        <div className="pulse-ring"></div>
                      </div>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                    />
                    
                    <motion.button
                      className="modern-avatar-btn"
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      title={isUploadingAvatar ? t("profile.uploading") : t("profile.changeAvatar")}
                    >
                      {isUploadingAvatar ? (
                        <motion.div
                          className="loading-spinner"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <i className="bi bi-arrow-clockwise"></i>
                        </motion.div>
                      ) : (
                        <i className="bi bi-camera-fill"></i>
                      )}
                    </motion.button>
                  </motion.div>
                  
                  <div className="avatar-info">
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                    >
                      {auth.user?.firstName} {auth.user?.lastName || "User"}
                    </motion.h3>
                    <motion.p 
                      className="user-email"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                    >
                      {auth.user?.email}
                    </motion.p>
                    
                    {/* User Rating Display */}
                    <motion.div 
                      className="user-rating"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.3 }}
                    >
                      <div className="rating-stars">
                        {auth.user?.rate && auth.user.rate > 0 ? (
                          Array(5).fill(0).map((_, index) => (
                            <motion.i
                              key={index}
                              className={`bi bi-star${index < Math.floor((auth.user?.rate ?? 0)) ? '-fill' : ''}`}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.4 + (0.1 * index), type: "spring", stiffness: 200 }}
                              style={{
                                color: index < Math.floor((auth.user?.rate ?? 0)) ? '#FFD700' : '#E0E0E0'
                              }}
                            />
                          ))
                        ) : (
                          <span className="no-rating">{t("profile.noRatingAvailable")}</span>
                        )}
                      </div>
                      <span className="rating-text">{auth.user?.rate?.toFixed(1) || '0.0'}/5.0</span>
                    </motion.div>

                    {/* User Type Badge */}
                    {identityStatus === "WAITING" && (
                      <motion.div
                        className="user-type-badge waiting"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, type: "spring", delay: 1.4 }}
                      >
                        <i className="bi bi-clock"></i>
                        <span>{t("profile.underReview")}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="modern-content-grid">
            {/* Reseller Status Cards Section */}
            <motion.div
              className="modern-reseller-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              {/* Case 1: User is already a RESELLER */}
              {auth.user?.type === "RESELLER" && (
                <motion.div
                  className="modern-status-card reseller-active"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 25px 50px rgba(34, 197, 94, 0.15)"
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="card-background">
                    <div className="success-gradient"></div>
                  </div>
                  <div className="card-content">
                    <motion.div
                      className="status-icon success"
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(34, 197, 94, 0.4)",
                          "0 0 0 20px rgba(34, 197, 94, 0)",
                          "0 0 0 0 rgba(34, 197, 94, 0)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <i className="bi bi-check-circle-fill"></i>
                    </motion.div>
                    <div className="status-text">
                      <h3>{t("profile.youAreReseller")}</h3>
                      <p>{t("profile.resellerFeaturesAccess")}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Case 2: User has identity but is NOT RESELLER - Wait for support */}
              {auth.user?.type !== "RESELLER" && auth.user?.isHasIdentity && (
                <motion.div
                  className="modern-status-card pending"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 25px 50px rgba(245, 158, 11, 0.15)"
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="card-background">
                    <div className="warning-gradient"></div>
                  </div>
                  <div className="card-content">
                    <motion.div
                      className="status-icon warning"
                      animate={{
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <i className="bi bi-clock-history"></i>
                    </motion.div>
                    <div className="status-text">
                      <h3>{t("profile.identityVerified")}</h3>
                      <p>{t("profile.pleaseWaitAccountUpgrade")}</p>
                    </div>
                  </div>
                  <div className="status-details">
                    <div className="detail-item">
                      <i className="bi bi-check-circle"></i>
                      <span>{t("profile.identityVerificationCompleted")}</span>
                    </div>
                    <div className="detail-item">
                      <i className="bi bi-hourglass-split"></i>
                      <span>{t("profile.accountUpgradeInProgress")}</span>
                    </div>
                    <div className="detail-item">
                      <i className="bi bi-headset"></i>
                      <span>{t("profile.notifyWhenReady")}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Case 3: User does NOT have identity and is NOT RESELLER - Show become reseller button */}
              {auth.user?.type !== "RESELLER" && !auth.user?.isHasIdentity && !isLoadingIdentity && (
                <motion.div
                  className="modern-status-card action-needed"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.15)"
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="card-background">
                    <div className="primary-gradient"></div>
                  </div>
                  <div className="card-content">
                    <motion.div
                      className="status-icon primary"
                      animate={{
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <i className="bi bi-arrow-up-circle"></i>
                    </motion.div>
                    <div className="status-text">
                      <h3>{t("profile.upgradeToReseller")}</h3>
                      <p>{t("profile.startSellingEarning")}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleStartResellerConversion}
                    className="modern-upgrade-btn"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 15px 30px rgba(59, 130, 246, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span className="btn-text">{t("profile.changeAccountToReseller")}</span>
                    <motion.i 
                      className="bi bi-arrow-right"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>

            {/* Profile Tabs Section */}
            <motion.div
              className="modern-tabs-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              {/* Tab Navigation */}
              <div className="modern-tab-nav">
                {[
                  { id: "personal-info", icon: "bi-person-circle", label: t("profile.personalInformation") },
                  { id: "security", icon: "bi-shield-lock-fill", label: t("profile.security") },
                  { id: "notifications", icon: "bi-bell-fill", label: t("profile.notifications") },
                  { id: "history", icon: "bi-clock-history", label: t("profile.offerHistory") }
                ].map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    className={`modern-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + (index * 0.1), type: "spring" }}
                  >
                    <i className={tab.icon}></i>
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div 
                        className="tab-indicator"
                        layoutId="tab-indicator"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="modern-tab-content">
                <AnimatePresence mode="wait">
                  {/* Personal Info Tab */}
                  {activeTab === "personal-info" && (
                    <motion.div
                      key="personal-info"
                      className="modern-tab-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.6, type: "spring" }}
                    >
                      <div className="modern-section-card">
                        <div className="section-header">
                          <div className="header-content">
                            <motion.div 
                              className="header-icon"
                              whileHover={{ rotate: 10, scale: 1.1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <i className="bi bi-person-circle"></i>
                            </motion.div>
                            <div className="header-text">
                              <h2>{t("profile.personalInfo")}</h2>
                              <p>Manage your personal information and profile details</p>
                            </div>
                          </div>
                          <motion.button
                            className={`modern-edit-button ${isEditing ? "editing" : ""}`}
                            onClick={() => setIsEditing(!isEditing)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <motion.i 
                              className={`bi ${isEditing ? 'bi-x-circle' : 'bi-pencil-square'}`}
                              animate={{ rotate: isEditing ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                            />
                            <span>{isEditing ? t("profile.cancel") : t("profile.edit")}</span>
                          </motion.button>
                        </div>
                        
                        <motion.form
                          onSubmit={handleSubmit}
                          className="modern-profile-form"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.5 }}
                        >
                          <div className="modern-form-grid">
                            <motion.div 
                              className="modern-form-field"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.6 }}
                            >
                              <label htmlFor="firstName">{t("profile.firstName")}</label>
                              <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                required
                                placeholder="Enter your first name"
                              />
                            </motion.div>
                            
                            <motion.div 
                              className="modern-form-field"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.7 }}
                            >
                              <label htmlFor="lastName">{t("profile.lastName")}</label>
                              <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                required
                                placeholder="Enter your last name"
                              />
                            </motion.div>

                            <motion.div 
                              className="modern-form-field"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.8 }}
                            >
                              <label htmlFor="email">{t("profile.email")}</label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                required
                                placeholder="Enter your email address"
                              />
                            </motion.div>
                            
                            <motion.div 
                              className="modern-form-field"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.9 }}
                            >
                              <label htmlFor="phone">{t("profile.phone")}</label>
                              <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder="Enter your phone number"
                              />
                            </motion.div>
                          </div>

                          {isEditing && (
                            <motion.div 
                              className="modern-actions"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 1.0 }}
                            >
                              <motion.button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="modern-btn secondary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <i className="bi bi-x-circle"></i>
                                <span>{t("profile.cancel")}</span>
                              </motion.button>
                              
                              <motion.button
                                type="submit"
                                disabled={isLoading}
                                className="modern-btn primary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {isLoading ? (
                                  <>
                                    <div className="loading-spinner-lg"></div>
                                    <span>{t("profile.saving")}</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check-circle"></i>
                                    <span>{t("profile.saveChanges")}</span>
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          )}
                        </motion.form>
                      </div>
                    </motion.div>
                  )}

                  {/* Security Tab */}
                  {activeTab === "security" && (
                    <motion.div
                      key="security"
                      className="modern-tab-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.6, type: "spring" }}
                    >
                      <div className="modern-section-card">
                        <div className="section-header">
                          <div className="header-content">
                            <motion.div 
                              className="header-icon"
                              whileHover={{ rotate: 10, scale: 1.1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <i className="bi bi-shield-lock-fill"></i>
                            </motion.div>
                            <div className="header-text">
                              <h2>{t("profile.security")}</h2>
                              <p>Update your password and security settings</p>
                            </div>
                          </div>
                        </div>
                        
                        <motion.form
                          onSubmit={handlePasswordSubmit}
                          className="modern-profile-form"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        >
                          <div className="modern-form-grid">
                            {[
                              { name: "currentPassword", label: t("profile.currentPassword"), icon: "bi-lock" },
                              { name: "newPassword", label: t("profile.newPassword"), icon: "bi-key" },
                              { name: "confirmPassword", label: t("profile.confirmPassword"), icon: "bi-check-circle" }
                            ].map((field, index) => (
                              <motion.div
                                key={field.name}
                                className="modern-form-field"
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
                              >
                                <label htmlFor={field.name}>{field.label}</label>
                                <input
                                  type="password"
                                  id={field.name}
                                  name={field.name}
                                  value={passwordData[field.name as keyof typeof passwordData]}
                                  onChange={handlePasswordChange}
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                              </motion.div>
                            ))}
                          </div>

                          <motion.div 
                            className="modern-actions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                          >
                            <motion.button
                              type="submit"
                              disabled={isPasswordChanging}
                              className="modern-btn primary"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {isPasswordChanging ? (
                                <>
                                  <div className="loading-spinner-lg"></div>
                                  <span>{t("profile.updating")}</span>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-shield-check"></i>
                                  <span>{t("profile.updatePassword")}</span>
                                </>
                              )}
                            </motion.button>
                          </motion.div>
                        </motion.form>
                      </div>
                    </motion.div>
                  )}

                  {/* History Tab */}
                  {activeTab === "history" && (
                    <motion.div
                      key="history"
                      className="modern-tab-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.6, type: "spring" }}
                    >
                      <HistoryPage />
                    </motion.div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <motion.div
                      key="notifications"
                      className="modern-tab-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.6, type: "spring" }}
                    >
                      <div className="modern-section-card">
                        <div className="section-header">
                          <div className="header-content">
                            <motion.div 
                              className="header-icon"
                              whileHover={{ rotate: 10, scale: 1.1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <i className="bi bi-bell-fill"></i>
                            </motion.div>
                            <div className="header-text">
                              <h2>{t("profile.notifications")}</h2>
                              <p>Manage your notification preferences</p>
                            </div>
                          </div>
                        </div>

                        <motion.div
                          className="notifications-settings"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        >
                          {[
                            { icon: "bi-envelope", title: t("profile.emailNotificationsTitle"), desc: t("profile.emailNotifications") },
                            { icon: "bi-bell", title: t("profile.newAuctionAlertsTitle"), desc: t("profile.newAuctionAlerts") },
                            { icon: "bi-heart", title: t("profile.bidUpdatesTitle"), desc: t("profile.bidUpdates") }
                          ].map((notification, index) => (
                            <motion.div
                              key={notification.title}
                              className="notification-item"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                              whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}
                            >
                              <div>
                                <h3>
                                  <i className={notification.icon}></i>
                                  {notification.title}
                                </h3>
                                <p>{notification.desc}</p>
                              </div>
                              <label className="switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider round"></span>
                              </label>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ProfilePageWrapper
