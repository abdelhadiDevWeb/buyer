"use client";

import PageLoader from "@/components/common/PageLoader";

export default function Loading() {
  return (
    <div className="category-page-loading" style={{ padding: '100px 0', background: '#f9fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
        <PageLoader
          variant="ripple"
          size="xl"
          color="primary"
          text="Nous préparons la liste complète des catégories pour vous."
        />
        
        {/* Loading Skeletons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '30px',
          margin: '60px auto 0 auto',
        }}>
          {Array(6).fill(0).map((_, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              height: '350px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
            }}>
              {/* Skeleton Image */}
              <div style={{
                height: '220px',
                background: 'linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%)',
                backgroundSize: '200% 100%',
                animation: 'shine 1.5s linear infinite',
              }}></div>
              
              {/* Skeleton Content */}
              <div style={{ padding: '24px' }}>
                <div style={{
                  height: '28px',
                  width: '70%',
                  background: 'linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%)',
                  backgroundSize: '200% 100%',
                  animation: 'shine 1.5s linear infinite',
                  borderRadius: '4px',
                  marginBottom: '20px',
                }}></div>
                
                <div style={{
                  height: '14px',
                  width: '40%',
                  background: 'linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%)',
                  backgroundSize: '200% 100%',
                  animation: 'shine 1.5s linear infinite',
                  borderRadius: '4px',
                }}></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes shine {
            to {
              background-position-x: -200%;
            }
          }
        `}</style>
      </div>
    </div>
  )
} 