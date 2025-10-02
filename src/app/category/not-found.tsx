import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div style={{ 
      padding: '100px 20px', 
      minHeight: '100vh', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafc'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        textAlign: 'center',
        background: 'white',
        borderRadius: '20px',
        padding: '50px 30px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
      }}>
        <svg 
          width="80" 
          height="80" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ 
            color: 'var(--primary-color, #0063b1)',
            marginBottom: '20px'
          }}
        >
          <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#333', 
          marginBottom: '10px',
          fontWeight: '800'
        }}>
          {t('notFound.categoriesNotFound')}
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          color: '#666', 
          marginBottom: '30px',
          lineHeight: 1.6
        }}>
          {t('notFound.categoriesDescription')}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              background: 'var(--primary-color, #0063b1)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '15px 25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              {t('notFound.backToHome')}
            </button>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '10px',
              padding: '15px 25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#ccc';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            {t('notFound.backToPrevious')}
          </button>
        </div>
      </div>
    </div>
  );
} 