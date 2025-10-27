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
import { IdentityAPI } from "@/app/api/identity"
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
    [key: string]: any; // Allow any additional properties
}

import app, { getSellerUrl } from '@/config';

const API_BASE_URL = app.baseURL;
const STATIC_URL = app.route;

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

    // Document management state
    const [identity, setIdentity] = useState<any>(null);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isUploadingDocument, setIsUploadingDocument] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const documentFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Document field configurations
    const requiredDocuments = [
        {
            key: 'identityCard',
            label: 'Carte d\'identité',
            description: 'Document d\'identité officiel',
            required: true
        },
        {
            key: 'registreCommerceCarteAuto',
            label: 'RC/ Autres',
            description: 'Registre de commerce ou autres documents',
            required: true
        },
        {
            key: 'nifRequired',
            label: 'NIF/N° Articles',
            description: 'NIF ou Numéro d\'articles',
            required: true
        },
        {
            key: 'carteFellah',
            label: 'Carte Fellah',
            description: 'Carte Fellah pour agriculteurs',
            required: true
        }
    ];

    const optionalDocuments = [
        {
            key: 'nis',
            label: 'NIS',
            description: 'Numéro d\'identification sociale',
            required: false
        },
        {
            key: 'c20',
            label: 'C20',
            description: 'Document C20',
            required: false
        },
        {
            key: 'misesAJourCnas',
            label: 'Mises à jour CNAS/CASNOS',
            description: 'Mises à jour CNAS/CASNOS et CACOBAPT',
            required: false
        },
        {
            key: 'last3YearsBalanceSheet',
            label: 'Bilan des 3 dernières années',
            description: 'Bilan financier des 3 dernières années',
            required: false
        },
        {
            key: 'certificates',
            label: 'Certificats',
            description: 'Certificats professionnels ou autres',
            required: false
        },
        {
            key: 'paymentProof',
            label: 'Preuve de paiement',
            description: 'Justificatif de paiement de souscription',
            required: false
        }
    ];

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
            // Handle string avatar (direct URL or path)
            if (avatar.startsWith('http')) {
                // Full URL - replace localhost with production
                return avatar.replace('http://localhost:3000', 'https://api.mazad.click');
            } else {
                // Relative path - ensure we use the correct base URL
                const cleanPath = avatar.startsWith('/') ? avatar.substring(1) : avatar;
                return `${API_BASE_URL}/static/${cleanPath}`;
            }
        }

        if (avatar?.fullUrl) {
            return avatar.fullUrl.replace('http://localhost:3000', 'https://api.mazad.click');
        }

        if (avatar?.url) {
            if (avatar.url.startsWith('http')) {
                return avatar.url.replace('http://localhost:3000', 'https://api.mazad.click');
            } else {
                // Ensure proper URL construction
                const cleanPath = avatar.url.startsWith('/') ? avatar.url.substring(1) : avatar.url;
                return `${API_BASE_URL}/static/${cleanPath}`;
            }
        }

        if (avatar?.filename) {
            return `${API_BASE_URL}/static/${avatar.filename}`;
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
                router.push(`${getSellerUrl()}login`);
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
                router.push(`${getSellerUrl()}login`);
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
            console.log('📦 Avatar user data:', response?.user?.avatar);

            if (response && response.success) {
                // Clear the input immediately to prevent re-triggering
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                // Force a cache-bust for the avatar
                setAvatarKey(Date.now());

                // Show success message
                enqueueSnackbar(response.message || t("avatarUpdated"), { variant: "success" });

                // Log the actual URL being returned
                const user = response.user || response.data;
                const avatar = user?.avatar;
                if (avatar?.url || avatar?.filename) {
                    const actualUrl = avatar.url || `/static/${avatar.filename}`;
                    console.log('🔗 Actual avatar URL from server:', actualUrl);
                    
                    // Test if the URL is accessible
                    fetch(actualUrl.startsWith('http') ? actualUrl : `https://api.mazad.click${actualUrl}`)
                        .then(res => {
                            if (res.ok) {
                                console.log('✅ Avatar URL is accessible');
                            } else {
                                console.warn('⚠️ Avatar URL returned status:', res.status);
                            }
                        })
                        .catch(err => {
                            console.warn('⚠️ Avatar URL test failed:', err);
                        });
                }

                // Fetch fresh user data once, without triggering updates
                await fetchFreshUserData();
            } else {
                console.error('❌ Upload response indicates failure:', response);
                enqueueSnackbar('Avatar upload failed - no success response', { variant: "error" });
            }
        } catch (error: any) {
            console.error('❌ Error uploading avatar:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload avatar';
            enqueueSnackbar(errorMessage, { variant: "error" });
        } finally {
            setIsUploadingAvatar(false);
            // Ensure input is cleared
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleStartResellerConversion = () => {
        router.push("/become-reseller");
    };

    // Document management functions
    const fetchIdentity = async () => {
        try {
            setIsLoadingDocuments(true);
            const response = await IdentityAPI.getMyIdentity();
            if (response.success && response.data) {
                setIdentity(response.data);
            } else {
                enqueueSnackbar('Aucune identité trouvée', { variant: 'info' });
            }
        } catch (error) {
            console.error('Error fetching identity:', error);
            enqueueSnackbar('Erreur lors du chargement des documents', { variant: 'error' });
        } finally {
            setIsLoadingDocuments(false);
        }
    };

    const handleFileSelect = (fieldKey: string, file: File) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            enqueueSnackbar('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.', { variant: 'error' });
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            enqueueSnackbar('Fichier trop volumineux. Taille maximale: 5MB', { variant: 'error' });
            return;
        }

        setUploadingFile(file);
        uploadDocument(fieldKey, file);
    };

    const uploadDocument = async (fieldKey: string, file: File) => {
        try {
            setIsUploadingDocument(fieldKey);
            
            const response = await IdentityAPI.updateDocument(identity._id, fieldKey, file);
            
            if (response.success) {
                enqueueSnackbar('Document mis à jour avec succès', { variant: 'success' });
                // Update local state
                setIdentity((prev: any) => prev ? {
                    ...prev,
                    [fieldKey]: response.data[fieldKey as keyof typeof response.data]
                } as any : null);
            } else {
                throw new Error(response.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            enqueueSnackbar('Erreur lors de la mise à jour du document', { variant: 'error' });
        } finally {
            setIsUploadingDocument(null);
            setUploadingFile(null);
        }
    };

    const getDocumentUrl = (document: any): string => {
        if (!document) return '';
        if (document.fullUrl) return document.fullUrl;
        if (document.url) {
            if (document.url.startsWith('http')) {
                return document.url;
            }
            // Remove leading slash from document.url to avoid double slashes
            const cleanUrl = document.url.startsWith('/') ? document.url.substring(1) : document.url;
            return `${API_BASE_URL}${cleanUrl}`;
        }
        return '';
    };

    const getDocumentName = (document: any): string => {
        if (!document) return '';
        return document.filename || 'Document';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Load identity when documents tab is active
    useEffect(() => {
        if (activeTab === 'documents' && !identity) {
            fetchIdentity();
        }
    }, [activeTab]);

    // Helper function to render document cards
    const renderDocumentCards = (documents: any[], sectionTitle: string, isRequired: boolean) => {
        return (
            <div className="modern-document-section">
                <div className="modern-document-section-header">
                    <h3 className="modern-document-section-title">
                        <i className={`bi-${isRequired ? 'exclamation-triangle-fill' : 'plus-circle-fill'}`}></i>
                        {sectionTitle}
                    </h3>
                    <div className={`modern-document-section-badge ${isRequired ? 'required' : 'optional'}`}>
                        {isRequired ? 'Obligatoire' : 'Optionnel'}
                    </div>
                </div>
                
                {!isRequired && (
                    <div className="modern-document-optional-note">
                        <div className="modern-document-note-card">
                            <i className="bi-info-circle-fill"></i>
                            <div className="modern-document-note-content">
                                <h4>Documents Optionnels</h4>
                                <p>Ajoutez ces documents si vous souhaitez être vérifié en tant que professionnel. Ils ne sont pas obligatoires mais peuvent accélérer le processus de vérification.</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="modern-document-grid">
                    {documents.map((field, index) => {
                        const document = identity[field.key];
                        const isUploadingThisField = isUploadingDocument === field.key;
                        const hasDocument = document && document.url;

                        return (
                            <motion.div
                                key={field.key}
                                className={`modern-document-card ${hasDocument ? 'has-document' : 'no-document'} ${isUploadingThisField ? 'uploading' : ''} ${isRequired ? 'required-card' : 'optional-card'}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="modern-document-header">
                                    <div className="modern-document-icon">
                                        <i className={hasDocument ? "bi-file-earmark-check-fill" : "bi-file-earmark-plus"}></i>
                                    </div>
                                    <div className="modern-document-info">
                                        <h3 className="modern-document-title">
                                            {field.label}
                                            {field.required && <span className="required-badge">*</span>}
                                        </h3>
                                        <p className="modern-document-description">{field.description}</p>
                                    </div>
                                </div>

                                {hasDocument && (
                                    <div className="modern-document-preview">
                                        <div className="modern-document-file">
                                            {document.mimetype?.startsWith('image/') ? (
                                                <div className="modern-document-image-preview">
                                                    <img 
                                                        src={getDocumentUrl(document)} 
                                                        alt={getDocumentName(document)}
                                                        className="modern-document-thumbnail"
                                                        onClick={() => window.open(getDocumentUrl(document), '_blank')}
                                                        onError={(e) => {
                                                            // Fallback to icon if image fails to load
                                                            e.currentTarget.style.display = 'none';
                                                            if (e.currentTarget.nextElementSibling) {
                                                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                    <div className="modern-document-icon-fallback" style={{ display: 'none' }}>
                                                        <i className="bi-file-earmark-image"></i>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="modern-document-icon">
                                                    <i className={`bi-${document.mimetype?.includes('pdf') ? 'file-earmark-pdf' : 'file-earmark-text'}`}></i>
                                                </div>
                                            )}
                                            <div className="modern-document-info-text">
                                                <span className="modern-document-name">{getDocumentName(document)}</span>
                                                <span className="modern-document-type">{document.mimetype || 'Document'}</span>
                                            </div>
                                        </div>
                                        <div className="modern-document-actions">
                                            <a
                                                href={getDocumentUrl(document)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="modern-btn modern-btn-outline modern-btn-sm"
                                            >
                                                <i className="bi-eye"></i>
                                                Voir
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="modern-document-upload">
                                    <input
                                        ref={el => { documentFileInputRefs.current[field.key] = el; }}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileSelect(field.key, file);
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    
                                    <motion.button
                                        className={`modern-btn ${hasDocument ? 'modern-btn-outline' : 'modern-btn-primary'} modern-btn-full`}
                                        onClick={() => documentFileInputRefs.current[field.key]?.click()}
                                        disabled={isUploadingThisField}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isUploadingThisField ? (
                                            <>
                                                <div className="modern-spinner-sm"></div>
                                                Upload en cours...
                                            </>
                                        ) : hasDocument ? (
                                            <>
                                                <i className="bi-arrow-clockwise"></i>
                                                Remplacer
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi-upload"></i>
                                                Ajouter
                                            </>
                                        )}
                                    </motion.button>
                                </div>

                                {isUploadingThisField && uploadingFile && (
                                    <div className="modern-upload-progress">
                                        <div className="modern-upload-info">
                                            <span className="modern-upload-filename">{uploadingFile.name}</span>
                                            <span className="modern-upload-size">{formatFileSize(uploadingFile.size)}</span>
                                        </div>
                                        <div className="modern-progress-bar">
                                            <div className="modern-progress-fill"></div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Construct avatar source with multiple fallback options
    const getAvatarSrc = () => {
        if (!auth.user) return "/assets/images/avatar.jpg";
        
        console.log('🖼️ Constructing avatar URL from:', auth.user);
        
        // Priority 1: photoURL (direct from backend)
        if (auth.user.photoURL && auth.user.photoURL.trim() !== "") {
            const cleanUrl = auth.user.photoURL.replace('http://localhost:3000', 'https://api.mazad.click');
            console.log('📸 Using photoURL:', cleanUrl);
            return `${cleanUrl}?v=${avatarKey}`;
        }
        
        // Priority 2: avatar object with fullUrl
        if (auth.user.avatar && 'fullUrl' in auth.user.avatar && auth.user.avatar.fullUrl) {
            const avatarUrl = (auth.user.avatar as any).fullUrl.replace('http://localhost:3000', 'https://api.mazad.click');
            console.log('📸 Using avatar.fullUrl:', avatarUrl);
            return `${avatarUrl}?v=${avatarKey}`;
        }
        
        // Priority 3: avatar.url
        if (auth.user.avatar?.url) {
            let avatarUrl = auth.user.avatar.url;
            if (!avatarUrl.startsWith('http')) {
                if (avatarUrl.startsWith('/static/')) {
                    avatarUrl = `${API_BASE_URL}${avatarUrl}`;
                } else if (avatarUrl.startsWith('/')) {
                    avatarUrl = `${API_BASE_URL}/static${avatarUrl}`;
                } else {
                    avatarUrl = `${API_BASE_URL}/static/${avatarUrl}`;
                }
            }
            avatarUrl = avatarUrl.replace('http://localhost:3000', 'https://api.mazad.click');
            console.log('📸 Using avatar.url:', avatarUrl);
            return `${avatarUrl}?v=${avatarKey}`;
        }
        
        // Priority 4: avatar.filename
        if (auth.user.avatar?.filename) {
            const avatarUrl = `${API_BASE_URL}/static/${auth.user.avatar.filename}`.replace('http://localhost:3000', 'https://api.mazad.click');
            console.log('📸 Using avatar.filename:', avatarUrl);
            return `${avatarUrl}?v=${avatarKey}`;
        }
        
        // Priority 5: fallback
        console.log('📸 Using fallback avatar');
        return "/assets/images/avatar.jpg";
    };
    
    const avatarSrc = getAvatarSrc();

    // Show login prompt if not logged in
    if (isReady && !isLogged) {
        return (
            <div className="profile-login-required">
                <div className="login-prompt">
                    <h2>Authentication Required</h2>
                    <p>Please log in to access your profile.</p>
                    <button onClick={() => router.push(`${getSellerUrl()}login`)}>Go to Login</button>
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
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'cover',
                                                    borderRadius: '50%'
                                                }}
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    const attemptedUrl = target.src;
                                                    
                                                    console.log('🖼️ Image failed to load:', attemptedUrl);
                                                    console.log('🖼️ User avatar data:', auth.user?.avatar);
                                                    
                                                    // Prevent infinite loop
                                                    if (attemptedUrl.includes('avatar.jpg')) {
                                                        return;
                                                    }
                                                    
                                                    // Try alternative URL constructions
                                                    if (auth.user?.avatar?.url && !attemptedUrl.includes('static')) {
                                                        const cleanUrl = auth.user.avatar.url.startsWith('http') 
                                                            ? auth.user.avatar.url 
                                                            : `https://api.mazad.click${auth.user.avatar.url}`;
                                                        console.log('🔄 Trying alternative URL:', cleanUrl);
                                                        target.src = cleanUrl;
                                                        return;
                                                    }
                                                    
                                                    // Try with filename
                                                    if (auth.user?.avatar?.filename) {
                                                        const filenameUrl = `https://api.mazad.click/static/${auth.user.avatar.filename}`;
                                                        console.log('🔄 Trying filename URL:', filenameUrl);
                                                        target.src = filenameUrl;
                                                        return;
                                                    }
                                                    
                                                    // Try localhost fallback for development
                                                    if (attemptedUrl.includes('api.mazad.click') && !attemptedUrl.includes('localhost')) {
                                                        const localhostUrl = attemptedUrl.replace('https://api.mazad.click', 'http://localhost:3000');
                                                        console.log('🔄 Trying localhost fallback:', localhostUrl);
                                                        target.src = localhostUrl;
                                                        return;
                                                    }
                                                    
                                                    // Show user-friendly message for production 404s
                                                    if (attemptedUrl.includes('api.mazad.click')) {
                                                        console.warn('⚠️ Avatar not available on production server. This is a deployment issue.');
                                                        // You could show a toast notification here if needed
                                                    }
                                                    
                                                    // Final fallback
                                                    target.onerror = null;
                                                    target.src = "/assets/images/avatar.jpg";
                                                }}
                                                onLoad={() => {
                                                    // Avatar loaded successfully
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
                                    { id: "documents", icon: "bi-file-earmark-text-fill", label: "Documents" },
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

                                    {/* Documents Tab */}
                                    {activeTab === "documents" && (
                                        <motion.div
                                            key="documents"
                                            className="modern-tab-content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.6, type: "spring" }}
                                        >
                                            <div className="modern-section">
                                                <div className="modern-section-header">
                                                    <h2 className="modern-section-title">
                                                        <i className="bi-file-earmark-text-fill"></i>
                                                        Gestion des Documents
                                                    </h2>
                                                    <p className="modern-section-description">
                                                        Gérez vos documents d'identité. Vous pouvez remplacer les documents existants ou ajouter de nouveaux documents optionnels.
                                                    </p>
                                                </div>

                                                {isLoadingDocuments ? (
                                                    <div className="modern-loading">
                                                        <div className="modern-spinner"></div>
                                                        <p>Chargement des documents...</p>
                                                    </div>
                                                ) : !identity ? (
                                                    <div className="modern-empty-state">
                                                        <i className="bi-file-earmark-x"></i>
                                                        <h3>Aucune identité trouvée</h3>
                                                        <p>Vous devez d'abord soumettre une demande d'identité pour gérer vos documents.</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {renderDocumentCards(requiredDocuments, "Documents Obligatoires", true)}
                                                        {renderDocumentCards(optionalDocuments, "Documents Optionnels", false)}
                                                        
                                                        <div className="modern-document-footer">
                                                            <div className="modern-document-status">
                                                                <div className={`modern-status-badge ${identity.status.toLowerCase()}`}>
                                                                    <i className={`bi-${identity.status === 'DONE' ? 'check-circle-fill' : identity.status === 'REJECTED' ? 'x-circle-fill' : 'clock-fill'}`}></i>
                                                                    Statut: {identity.status === 'DONE' ? 'Approuvé' : identity.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                                                                </div>
                                                            </div>
                                                            <p className="modern-document-note">
                                                                <i className="bi-info-circle"></i>
                                                                Les documents marqués d'un astérisque (*) sont obligatoires. Vous pouvez remplacer ou ajouter des documents à tout moment.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
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
