"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TendersAPI } from '@/app/api/tenders';
import { Tender, TENDER_STATUS } from '@/types/tender';
import useAuth from '@/hooks/useAuth';
import app from '@/config';
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';

export default function TendersPage() {
  const t = (key: string, _opts?: any) => key;
  const router = useRouter();
  const { isLogged } = useAuth();
  
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const response = await TendersAPI.getActiveTenders();
      setTenders(response);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = !searchTerm || 
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filter === 'all' || 
      (filter === 'open' && tender.status === TENDER_STATUS.OPEN) ||
      (filter === 'closed' && tender.status !== TENDER_STATUS.OPEN);
    
    const matchesCategory = categoryFilter === 'all' || 
      tender.category?._id === categoryFilter;
    
    const matchesType = typeFilter === 'all' || 
      tender.tenderType === typeFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesType;
  });

  const calculateTimeRemaining = (endingAt: string) => {
    const now = new Date().getTime();
    const endTime = new Date(endingAt).getTime();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) return t('tenders.ended');

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUniqueCategories = () => {
    const categories = tenders
      .map(tender => tender.category)
      .filter((category, index, self) => 
        category && self.findIndex(c => c?._id === category._id) === index
      );
    return categories;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #28a745',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
    );
  }

  return (
    <SnackbarProvider>
      <AxiosInterceptor>
        <RequestProvider>
          <Header />
          <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .page-header {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 60px 40px;
          border-radius: 20px;
          margin-bottom: 40px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(40, 167, 69, 0.2);
        }
        
        .filters-section {
          background: white;
          padding: 30px;
          border-radius: 16px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 20px;
          align-items: end;
        }
        
        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .filter-label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        
        .filter-input {
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s ease;
        }
        
        .filter-input:focus {
          outline: none;
          border-color: #28a745;
        }
        
        .tenders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
        }
        
        .tender-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }
        
        .tender-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          border-color: #28a745;
        }
        
        .tender-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .tender-title {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }
        
        .tender-category {
          background: #f8f9fa;
          color: #666;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .tender-description {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 20px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .tender-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .stat-item {
          text-align: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #28a745;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #666;
        }
        
        .tender-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }
        
        .tender-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .tender-location {
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .tender-date {
          font-size: 12px;
          color: #666;
        }
        
        .time-remaining {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }
        
        .time-remaining.expired {
          background: #dc3545;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        
        .badge-success {
          background: #28a745;
          color: white;
        }
        
        .badge-danger {
          background: #dc3545;
          color: white;
        }
        
        .badge-info {
          background: #17a2b8;
          color: white;
        }
        
        .badge-warning {
          background: #ffc107;
          color: #212529;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 40px;
          color: #666;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 20px;
          opacity: 0.3;
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        paddingTop: '100px',
        paddingBottom: '50px',
      }}>
        <div className="container">
          {/* Page Header */}
          <div className="page-header">
            <h1 style={{ margin: '0 0 16px 0', fontSize: '48px', fontWeight: '700' }}>
              {t('tenders.title')}
            </h1>
            <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
              {t('tenders.description')}
            </p>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">{t('common.search')}</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder={t('tenders.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label className="filter-label">{t('tenders.status')}</label>
                <select
                  className="filter-input"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">{t('tenders.all')}</option>
                  <option value="open">{t('tenders.open')}</option>
                  <option value="closed">{t('tenders.closed')}</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">{t('tenders.type')}</label>
                <select
                  className="filter-input"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">{t('tenders.all')}</option>
                  <option value="PRODUCT">{t('tenders.product')}</option>
                  <option value="SERVICE">{t('tenders.service')}</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">{t('tenders.category')}</label>
                <select
                  className="filter-input"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">{t('tenders.all')}</option>
                  {getUniqueCategories().map((category) => (
                    <option key={category?._id} value={category?._id}>
                      {category?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div style={{ 
            marginBottom: '30px', 
            color: '#666',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            {t('tenders.tendersFound', { count: filteredTenders.length })}
          </div>

          {/* Tenders Grid */}
          {filteredTenders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{t('tenders.noTendersFound')}</h3>
              <p>{t('tenders.tryModifyingSearch')}</p>
            </div>
          ) : (
            <div className="tenders-grid">
              {filteredTenders.map((tender) => {
                const timeRemaining = calculateTimeRemaining(tender.endingAt);
                const isExpired = tender.status !== TENDER_STATUS.OPEN || timeRemaining === t('tenders.ended');
                
                return (
                  <div
                    key={tender._id}
                    className="tender-card"
                    onClick={() => router.push(`/tender-details/${tender._id}`)}
                  >
                    <div className="tender-header">
                      <div style={{ flex: 1 }}>
                        <div>
                          <span className={`badge ${tender.status === TENDER_STATUS.OPEN ? 'badge-success' : 'badge-danger'}`}>
                            {tender.status === TENDER_STATUS.OPEN ? t('tenders.open') : t('tenders.closed')}
                          </span>
                          <span className="badge badge-info" style={{ marginLeft: '8px' }}>
                            {tender.tenderType === 'PRODUCT' ? t('tenders.product') : t('tenders.service')}
                          </span>
                        </div>
                        <h3 className="tender-title">{tender.title}</h3>
                      </div>
                      
                      {tender.category && (
                        <div className="tender-category">
                          {tender.category.name}
                        </div>
                      )}
                    </div>
                    
                    <p className="tender-description">
                      {tender.description}
                    </p>
                    
                    <div className="tender-stats">
                      <div className="stat-item">
                        <div className="stat-value">
                          {tender.maxBudget.toLocaleString()} DA
                        </div>
                        <div className="stat-label">{t('tenders.maxBudget')}</div>
                      </div>
                      
                      <div className="stat-item">
                        <div className="stat-value">
                          {tender.currentLowestBid.toLocaleString()} DA
                        </div>
                        <div className="stat-label">{t('tenders.bestOffer')}</div>
                      </div>
                    </div>
                    
                    <div className="tender-footer">
                      <div className="tender-meta">
                        <div className="tender-location">
                          📍 {tender.location}, {tender.wilaya}
                        </div>
                        <div className="tender-date">
                          {t('tenders.until')} {formatDate(tender.endingAt)}
                        </div>
                      </div>
                      
                      <div className={`time-remaining ${isExpired ? 'expired' : ''}`}>
                        {timeRemaining}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </RequestProvider>
  </AxiosInterceptor>
</SnackbarProvider>
  );
}
