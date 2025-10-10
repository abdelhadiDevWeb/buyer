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

                    enqueueSnackbar('Profile updated successfully', { variant: 'success' });
                    setIsEditing(false);
                }
            } else {
                console.error('❌ No response received from updateProfile');
                throw new Error('No response from server');
            }
        } catch (error: any) {
            console.error('❌ Error updating profile:', error);

            if (error.response?.status === 401) {
                enqueueSnackbar('Session expired', { variant: 'error' });
                set({ tokens: undefined, user: undefined });
                router.push('/auth/login');
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
                enqueueSnackbar(errorMessage, { variant: "error" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            enqueueSnackbar(t("passwordsDoNotMatch"), { variant: "error" });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            enqueueSnackbar(t("passwordTooShort"), { variant: "error" });
            return;
        }

        setIsPasswordChanging(true);

        try {
            console.log('🔐 Changing password...');

            const response = await UserAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            enqueueSnackbar(response.message || t("passwordChanged"), { variant: "success" });

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

        } catch (error: any) {
            console.error('❌ Error changing password:', error);

            if (error.response?.status === 401) {
                enqueueSnackbar(t("sessionExpired"), { variant: 'error' });
                set({ tokens: undefined, user: undefined });
                router.push('/auth/login');
            } else {
                const errorMessage = error.message || t("failedToUpdatePassword");
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
            console.log('🖼️ Uploading avatar...');

            const formDataToUpload = new FormData();
            formDataToUpload.append('avatar', file);
            const response = await UserAPI.uploadAvatar(formDataToUpload);

            console.log('✅ Avatar upload response:', response);

            if (response) {
                if (response.user || response.data) {
                    const backendUser = (response.user as any)?.user || (response.data as any)?.user || (response.user as any) || (response.data as any);
                    const currentUser = auth.user;
                    const updatedUser = {
                        ...currentUser,
                        avatar: backendUser?.avatar ?? currentUser?.avatar,
                        photoURL: backendUser?.photoURL || backendUser?.avatar?.fullUrl || currentUser?.photoURL,
                        firstName: currentUser?.firstName || '',
                        lastName: currentUser?.lastName || '',
                        email: currentUser?.email || ''
                    };

                    console.log('👤 Updated user with new avatar:', updatedUser);

                    if (updatedUser.firstName && updatedUser.lastName && updatedUser.email) {
                        set({
                            tokens: auth.tokens,
                            user: updatedUser as any
                        });
                    }

                    setAvatarKey(Date.now());

                    enqueueSnackbar(response.message || t("avatarUpdated"), { variant: "success" });
                } else {
                    console.log('📄 No user data in response, fetching fresh data...');
                    await fetchFreshUserData();
                    setAvatarKey(Date.now());
                    enqueueSnackbar(response.message || t("avatarUpdated"), { variant: "success" });
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

                {/* Page Header with Title */}
                <motion.div
                    className="profile-page-header"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="profile-header-content">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="profile-page-title"
                        >
                            My Profile
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="profile-page-subtitle"
                        >
                            Manage your profile
                        </motion.p>
                    </div>
                </motion.div>

                <div className="modern-profile-container">
                    {/* Hero Section - Full Width */}
                    <motion.div
                        className="modern-profile-hero"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <motion.div
                            className="hero-content"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                        >
                            {/* Profile Avatar Card - Centered */}
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
                                            title={isUploadingAvatar ? "Uploading..." : "Change avatar"}
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

                                        {/* Professional and Verified Badges */}
                                        <motion.div
                                            className="user-badges-container"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 1.3 }}
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginTop: '8px',
                                                flexWrap: 'wrap',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {/* Professional Badge */}
                                            {auth.user?.type === "PROFESSIONAL" && (
                                                <motion.div
                                                    className="user-badge professional"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3, delay: 1.4 }}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '4px 8px',
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: 'white',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                                    }}
                                                >
                                                    <i className="bi bi-star-fill" style={{ fontSize: '10px' }}></i>
                                                    <span>PRO</span>
                                                </motion.div>
                                            )}

                                            {/* Verified Badge */}
                                            {(auth.user as any)?.isVerified && (
                                                <motion.div
                                                    className="user-badge verified"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3, delay: 1.5 }}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '4px 8px',
                                                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                        color: 'white',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        boxShadow: '0 2px 8px rgba(17, 153, 142, 0.3)',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                                    }}
                                                >
                                                    <i className="bi bi-check-circle-fill" style={{ fontSize: '10px' }}></i>
                                                    <span>VERIFIED</span>
                                                </motion.div>
                                            )}
                                        </motion.div>

                                        {/* Modern Star Rating Display */}
                                        <motion.div
                                            className="modern-star-rating-container"
                                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.8, delay: 1.3, type: "spring", stiffness: 120 }}
                                        >
                                            <div className="rating-header">
                                                <motion.h4
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 1.5, duration: 0.6 }}
                                                    className="rating-title"
                                                >
                                                    User rating
                                                </motion.h4>
                                                <motion.div
                                                    className="rating-score"
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 1.6, type: "spring", stiffness: 200 }}
                                                >
                                                    <span className="score-number">{auth.user?.rate?.toFixed(1) || '0.0'}</span>
                                                    <span className="score-total">/10.0</span>
                                                </motion.div>
                                            </div>

                                            <div className="modern-stars-container">
                                                <div className="stars-background"></div>
                                                <div className="stars-glow"></div>

                                                <div className="rating-stars-modern">
                                                    {auth.user?.rate && auth.user.rate > 0 ? (
                                                        Array(10).fill(0).map((_, index) => {
                                                            const userRate = auth.user?.rate || 0;
                                                            const isStarFilled = index < Math.floor(userRate);
                                                            const isPartialFill = index === Math.floor(userRate) && userRate % 1 > 0;
                                                            const fillPercentage = isPartialFill ? (userRate % 1) * 100 : 0;

                                                            return (
                                                                <motion.div
                                                                    key={index}
                                                                    className="star-wrapper"
                                                                    initial={{
                                                                        opacity: 0,
                                                                        scale: 0,
                                                                        rotate: -180,
                                                                        y: 50
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                        scale: 1,
                                                                        rotate: 0,
                                                                        y: 0
                                                                    }}
                                                                    transition={{
                                                                        delay: 1.7 + (index * 0.15),
                                                                        duration: 0.8,
                                                                        type: "spring",
                                                                        stiffness: 150,
                                                                        damping: 12
                                                                    }}
                                                                    whileHover={{
                                                                        scale: 1.2,
                                                                        rotate: 15,
                                                                        y: -5,
                                                                        transition: { duration: 0.3, type: "spring", stiffness: 400 }
                                                                    }}
                                                                >
                                                                    {/* Star Background */}
                                                                    <motion.div
                                                                        className="star-background"
                                                                        animate={isStarFilled ? {
                                                                            scale: [1, 1.1, 1],
                                                                            opacity: [0.3, 0.6, 0.3]
                                                                        } : {}}
                                                                        transition={{
                                                                            duration: 2,
                                                                            repeat: Number.POSITIVE_INFINITY,
                                                                            delay: index * 0.2
                                                                        }}
                                                                    />

                                                                    {/* Star Icon */}
                                                                    <motion.i
                                                                        className={`bi bi-star${isStarFilled ? '-fill' : ''} star-icon`}
                                                                        animate={isStarFilled ? {
                                                                            textShadow: [
                                                                                "0 0 10px rgba(255, 215, 0, 0.5)",
                                                                                "0 0 20px rgba(255, 215, 0, 0.8)",
                                                                                "0 0 30px rgba(255, 215, 0, 0.6)",
                                                                                "0 0 10px rgba(255, 215, 0, 0.5)"
                                                                            ]
                                                                        } : {}}
                                                                        transition={{
                                                                            duration: 3,
                                                                            repeat: Number.POSITIVE_INFINITY,
                                                                            delay: index * 0.3
                                                                        }}
                                                                    />

                                                                    {/* Partial Fill Overlay */}
                                                                    {isPartialFill && (
                                                                        <motion.div
                                                                            className="star-partial-fill"
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${fillPercentage}%` }}
                                                                            transition={{
                                                                                delay: 2.2 + (index * 0.1),
                                                                                duration: 1,
                                                                                ease: "easeOut"
                                                                            }}
                                                                        >
                                                                            <i className="bi bi-star-fill star-icon partial" />
                                                                        </motion.div>
                                                                    )}

                                                                    {/* Sparkle Effects */}
                                                                    {isStarFilled && (
                                                                        <>
                                                                            <motion.div
                                                                                className="star-sparkle sparkle-1"
                                                                                animate={{
                                                                                    scale: [0, 1, 0],
                                                                                    rotate: [0, 180, 360],
                                                                                    opacity: [0, 1, 0]
                                                                                }}
                                                                                transition={{
                                                                                    duration: 2,
                                                                                    repeat: Number.POSITIVE_INFINITY,
                                                                                    delay: 2.5 + (index * 0.4)
                                                                                }}
                                                                            />
                                                                            <motion.div
                                                                                className="star-sparkle sparkle-2"
                                                                                animate={{
                                                                                    scale: [0, 1, 0],
                                                                                    rotate: [360, 180, 0],
                                                                                    opacity: [0, 0.8, 0]
                                                                                }}
                                                                                transition={{
                                                                                    duration: 2.5,
                                                                                    repeat: Number.POSITIVE_INFINITY,
                                                                                    delay: 3 + (index * 0.3)
                                                                                }}
                                                                            />
                                                                        </>
                                                                    )}

                                                                    {/* Shooting Star Effect */}
                                                                    {isStarFilled && index === Math.floor(userRate) - 1 && (
                                                                        <motion.div
                                                                            className="shooting-star"
                                                                            initial={{
                                                                                x: -100,
                                                                                y: -100,
                                                                                opacity: 0,
                                                                                rotate: 45
                                                                            }}
                                                                            animate={{
                                                                                x: 100,
                                                                                y: 100,
                                                                                opacity: [0, 1, 0],
                                                                                rotate: 45
                                                                            }}
                                                                            transition={{
                                                                                duration: 2,
                                                                                repeat: Number.POSITIVE_INFINITY,
                                                                                repeatDelay: 5,
                                                                                delay: 4
                                                                            }}
                                                                        />
                                                                    )}
                                                                </motion.div>
                                                            );
                                                        })
                                                    ) : (
                                                        <motion.div
                                                            className="no-rating-modern"
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 1.8 }}
                                                        >
                                                            <i className="bi bi-star-half"></i>
                                                            <span>No rating available</span>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* Floating Particles */}
                                                {auth.user?.rate && auth.user.rate > 0 && (
                                                    <div className="rating-particles">
                                                        {Array(8).fill(0).map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                className="particle"
                                                                animate={{
                                                                    y: [-20, -60, -20],
                                                                    x: [0, Math.random() * 40 - 20, 0],
                                                                    opacity: [0, 1, 0],
                                                                    scale: [0, 1, 0]
                                                                }}
                                                                transition={{
                                                                    duration: 3,
                                                                    repeat: Number.POSITIVE_INFINITY,
                                                                    delay: 3 + (i * 0.5),
                                                                    ease: "easeInOut"
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <motion.div
                                                className="rating-progress-bar"
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{
                                                    width: `${((auth.user?.rate || 0) / 5) * 100}%`,
                                                    opacity: 1
                                                }}
                                                transition={{
                                                    delay: 2.5,
                                                    duration: 1.5,
                                                    ease: "easeOut"
                                                }}
                                            >
                                                <motion.div
                                                    className="progress-glow"
                                                    animate={{
                                                        x: ["-100%", "100%"],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Number.POSITIVE_INFINITY,
                                                        repeatDelay: 3,
                                                        delay: 3.5
                                                    }}
                                                />
                                            </motion.div>
                                        </motion.div>

                                        {/* User Type Badge */}
                                        {/* {identityStatus === "WAITING" && (
                                            <motion.div
                                                className="user-type-badge waiting"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.5, type: "spring", delay: 1.4 }}
                                            >
                                                <i className="bi bi-clock"></i>
                                                <span>Under review</span>
                                            </motion.div>
                                        )} */}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="modern-content-grid">
                        {/* Reseller Status Cards Section */}
                        {/* <motion.div
                            className="modern-reseller-section"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.0 }}
                        >
                            {/* Case 1: User is already a RESELLER */}
                            {/* {auth.user?.type === "RESELLER" && (
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
                                            <h3>You're a reseller</h3>
                                            <p>You have access to reseller features</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )} */}

                            {/* Case 2: User has identity but is NOT RESELLER - Wait for support */}
                            {/* {auth.user?.type !== "RESELLER" && auth.user?.isHasIdentity && (
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
                                            <h3>Identity verified</h3>
                                            <p>Please wait while we upgrade your account</p>
                                        </div>
                                    </div>
                                    <div className="status-details">
                                        <div className="detail-item">
                                            <i className="bi bi-check-circle"></i>
                                            <span>Identity verification completed</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="bi bi-hourglass-split"></i>
                                            <span>Account upgrade in progress</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="bi bi-headset"></i>
                                            <span>We'll notify you when ready</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )} */}

                            {/* Case 3: User does NOT have identity and is NOT RESELLER - Show become reseller button */}
                            {/* {auth.user?.type !== "RESELLER" && !auth.user?.isHasIdentity && !isLoadingIdentity && (
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
                                            <h3>Upgrade to reseller</h3>
                                            <p>Start selling and earning</p>
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
                                        <span className="btn-text">Change account to reseller</span>
                                        <motion.i
                                            className="bi bi-arrow-right"
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                                        />
                                    </motion.button>
                                </motion.div>
                            )} */}
                        {/* </motion.div> */}

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
                                    { id: "personal-info", icon: "bi-person-circle", label: "Personal information" },
                                    { id: "security", icon: "bi-shield-lock-fill", label: "Security" },
                                    { id: "notifications", icon: "bi-bell-fill", label: "Notifications" },
                                    { id: "history", icon: "bi-clock-history", label: "Offer history" }
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
                                                            <h2>Personal info</h2>
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
                                                        <span>{isEditing ? "Cancel" : "Edit"}</span>
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
                                                            <label htmlFor="firstName">First name</label>
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
                                                            <label htmlFor="lastName">Last name</label>
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
                                                            <label htmlFor="email">Email</label>
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
                                                            <label htmlFor="phone">Phone</label>
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
                                                                <span>Cancel</span>
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
                                                                        <span>Saving...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="bi bi-check-circle"></i>
                                                                        <span>Save changes</span>
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
                                                            <h2>Security</h2>
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
                                                            { name: "currentPassword", label: "Current password", icon: "bi-lock" },
                                                            { name: "newPassword", label: "New password", icon: "bi-key" },
                                                            { name: "confirmPassword", label: "Confirm password", icon: "bi-check-circle" }
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
                                                                    <span>Updating...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="bi bi-shield-check"></i>
                                                                    <span>Update password</span>
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
                                                            <h2>Notifications</h2>
                                                            <p>Manage your notification preferences</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <motion.div
                                                    className="modern-notifications-grid"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.6, delay: 0.3 }}
                                                >
                                                    {[
                                                        {
                                                            icon: "bi-envelope-heart",
                                                            title: "Email notifications",
                                                            desc: "Receive email notifications",
                                                            color: "primary",
                                                            gradient: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)"
                                                        },
                                                        {
                                                            icon: "bi-bell-fill",
                                                            title: "New auction alerts",
                                                            desc: "Receive alerts for new auctions",
                                                            color: "success",
                                                            gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                                        },
                                                        {
                                                            icon: "bi-heart-pulse",
                                                            title: "Bid updates",
                                                            desc: "Receive updates about bids",
                                                            color: "warning",
                                                            gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                                        }
                                                    ].map((notification, index) => (
                                                        <motion.div
                                                            key={notification.title}
                                                            className="modern-notification-card"
                                                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            transition={{
                                                                duration: 0.6,
                                                                delay: 0.4 + index * 0.15,
                                                                type: "spring",
                                                                stiffness: 100
                                                            }}
                                                            whileHover={{
                                                                scale: 1.03,
                                                                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                                                                y: -5
                                                            }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <div className="notification-card-background">
                                                                <div
                                                                    className="card-gradient"
                                                                    style={{ background: notification.gradient }}
                                                                ></div>
                                                            </div>

                                                            <div className="notification-content">
                                                                <motion.div
                                                                    className={`notification-icon ${notification.color}`}
                                                                    whileHover={{
                                                                        rotate: 10,
                                                                        scale: 1.1
                                                                    }}
                                                                    transition={{ type: "spring", stiffness: 300 }}
                                                                >
                                                                    <motion.i
                                                                        className={notification.icon}
                                                                        animate={{
                                                                            scale: [1, 1.1, 1],
                                                                        }}
                                                                        transition={{
                                                                            duration: 2,
                                                                            repeat: Number.POSITIVE_INFINITY,
                                                                            delay: index * 0.3
                                                                        }}
                                                                    />
                                                                </motion.div>

                                                                <div className="notification-text">
                                                                    <motion.h3
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: 0.5 + index * 0.1 }}
                                                                    >
                                                                        {notification.title}
                                                                    </motion.h3>
                                                                    <motion.p
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: 0.6 + index * 0.1 }}
                                                                    >
                                                                        {notification.desc}
                                                                    </motion.p>
                                                                </div>
                                                            </div>

                                                            <motion.div
                                                                className="modern-switch-container"
                                                                whileHover={{ scale: 1.05 }}
                                                            >
                                                                <label className="modern-switch">
                                                                    <input
                                                                        type="checkbox"
                                                                        defaultChecked
                                                                        className="switch-input"
                                                                    />
                                                                    <motion.span
                                                                        className="switch-slider"
                                                                        whileTap={{ scale: 0.95 }}
                                                                    >
                                                                        <motion.span
                                                                            className="switch-thumb"
                                                                            layout
                                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                                        />
                                                                    </motion.span>
                                                                </label>
                                                                <motion.div
                                                                    className="switch-glow"
                                                                    animate={{
                                                                        opacity: [0.5, 1, 0.5]
                                                                    }}
                                                                    transition={{
                                                                        duration: 2,
                                                                        repeat: Number.POSITIVE_INFINITY,
                                                                        delay: index * 0.5
                                                                    }}
                                                                />
                                                            </motion.div>
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
