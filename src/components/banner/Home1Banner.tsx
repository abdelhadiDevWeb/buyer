import Link from "next/link";
import React from "react";

type Home1BannerProps = object;

const Home1Banner: React.FC<Home1BannerProps> = () => {

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -500px 0;
          }
          100% {
            background-position: 500px 0;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes verticalMarquee {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
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
        .banner-main {
          background: linear-gradient(120deg, #f0f4ff 0%, #eaf6ff 100%);
          border-radius: clamp(16px, 4vw, 32px);
          box-shadow: 0 8px 40px rgba(37,99,235,0.08);
          padding: clamp(32px, 8vw, 56px) clamp(16px, 4vw, 32px);
          margin: 0 auto clamp(16px, 4vw, 32px) auto;
          max-width: 1400px;
          opacity: 0;
          transform: translateY(30px);
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: clamp(24px, 6vw, 48px);
          flex-direction: column;
        }
        .banner-left {
          flex: 1 1 0;
          min-width: 0;
          overflow: hidden;
          height: clamp(300px, 50vw, 420px);
          position: relative;
          opacity: 0;
          transform: translateX(-50px);
          animation: slideInFromLeft 0.8s ease-out 0.2s forwards;
          width: 100%;
        }
        .marquee-outer {
          height: clamp(300px, 50vw, 420px);
          overflow: hidden;
          position: relative;
        }
        .marquee-inner {
          display: flex;
          flex-direction: column;
          animation: verticalMarquee 12s linear infinite;
        }
        .banner-heading {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 24px;
          color: #222;
        }
        .banner-animated {
          display: inline-block;
          background: linear-gradient(90deg, #2563eb, #3b82f6, #2563eb, #3b82f6);
          background-size: 200% auto;
          color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 2.5s linear infinite;
          font-size: inherit;
          font-weight: inherit;
        }
        .banner-subtitle {
          font-size: 1.25rem;
          color: #4b5563;
          margin-bottom: 40px;
          max-width: 500px;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease-out 0.4s forwards;
        }
        .banner-actions {
          margin-bottom: 48px;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease-out 0.6s forwards;
        }
        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(90deg, #2563eb 60%, #3b82f6 100%);
          color: #fff;
          padding: 18px 38px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 4px 24px rgba(37,99,235,0.18);
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        .cta-button:hover::before {
          left: 100%;
        }
        .cta-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 32px rgba(37,99,235,0.25);
        }
        .banner-features {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(12px, 3vw, 20px);
          max-width: 100%;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease-out 0.8s forwards;
        }
        .feature-item {
          background: #f3f6fd;
          border-radius: clamp(12px, 2vw, 16px);
          border: 1.5px solid #e0e7ff;
          padding: clamp(14px, 3vw, 18px) clamp(16px, 3vw, 20px);
          display: flex;
          align-items: center;
          gap: clamp(10px, 2vw, 14px);
          box-shadow: 0 2px 8px rgba(37,99,235,0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          min-height: 44px;
        }
        .feature-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(37,99,235,0.15);
          border-color: #2563eb;
        }
        .feature-icon {
          background: #e0e7ff;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .feature-item:hover .feature-icon {
          background: #2563eb;
          transform: scale(1.1);
        }
        .feature-item:hover .feature-icon svg {
          stroke: white;
        }
        .banner-right {
          flex: 1 1 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateX(50px);
          animation: slideInFromRight 0.8s ease-out 0.4s forwards;
          width: 100%;
          order: -1; /* Show video first on mobile */
        }
        .video-box {
          width: 100%;
          max-width: 700px;
          aspect-ratio: 16/9;
          background: linear-gradient(120deg, #e0e7ff 0%, #f0f4ff 100%);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(37,99,235,0.10);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .video-box:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 40px rgba(37,99,235,0.15);
        }
        .video-play {
          width: 90px;
          height: 90px;
          background: linear-gradient(90deg, #2563eb 60%, #3b82f6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(37,99,235,0.18);
          animation: float 2.5s infinite;
          transition: all 0.3s ease;
        }
        .video-play:hover {
          animation: pulse 1s infinite;
          transform: scale(1.1);
        }
        .video-label {
          margin-top: 24px;
          color: #374151;
          font-size: 1.15rem;
          font-weight: 600;
        }
        .video-desc {
          color: #6b7280;
          font-size: 1rem;
          margin-top: 6px;
        }
        /* Mobile First Responsive Design */
        @media (min-width: 640px) {
          .banner-features {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (min-width: 768px) {
          .banner-content {
            flex-direction: row;
            align-items: stretch;
          }
          .banner-right {
            order: 2; /* Normal order on tablet and up */
          }
          .banner-features {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .banner-content {
            gap: 48px;
          }
          .banner-left {
            flex: 1.2;
          }
          .banner-right {
            flex: 1.5;
          }
        }

        /* Legacy support for existing breakpoint */
        @media (max-width: 767px) {
          .banner-content {
            flex-direction: column;
            gap: clamp(20px, 4vw, 32px);
            text-align: center;
          }
          .banner-right, .banner-left {
            width: 100%;
            min-width: 0;
          }
          .video-box {
            max-width: 100%;
            margin: 0 auto;
          }
          .banner-left, .marquee-outer {
            height: clamp(250px, 40vw, 340px);
          }
          .feature-item {
            justify-content: center;
            text-align: center;
          }
          /* Disable animations on mobile for better performance */
          .marquee-inner {
            animation: none;
          }
        }
      `}</style>
      <div className="banner-main">
        <div className="banner-content">
          {/* Left Side */}
          <div className="banner-left">
            <div className="marquee-outer">
              <div className="marquee-inner">
                <div className="banner-heading">
                  Plateforme d'Enchères Moderne
                  <br />
                  <span className="banner-animated">Pour les Professionnels</span>
                </div>
                <div className="banner-subtitle">
                  Accédez à des actifs premium et enchérissez en toute sécurité.
                </div>
                <div className="banner-actions">
                  <Link href="/auction-sidebar" className="cta-button">
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#fff"/><path d="M12 7v6l4 2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Accéder aux enchères
                  </Link>
                </div>
                <div className="banner-features">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <h4 style={{color: '#222', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0'}}>Plateforme sécurisée</h4>
                      <p style={{color: '#4b5563', fontSize: '13px', margin: 0}}>Transactions protégées et fiables.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <h4 style={{color: '#222', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0'}}>Support dédié</h4>
                      <p style={{color: '#4b5563', fontSize: '13px', margin: 0}}>Assistance rapide et efficace.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M17 21v-2c0-1.1-.45-2.15-1.17-2.83C15.08 15.42 14.06 15 13 15H5c-1.06 0-2.08.42-2.83 1.17C1.45 16.85 1 17.9 1 19v2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="2"/></svg>
                    </div>
                    <div>
                      <h4 style={{color: '#222', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0'}}>Communauté active</h4>
                      <p style={{color: '#4b5563', fontSize: '13px', margin: 0}}>Réseau d'acheteurs et vendeurs fiables.</p>
                    </div>
                  </div>
                </div>
                {/* Duplicate for seamless marquee */}
                <div className="banner-heading">
                  Plateforme d'Enchères Moderne
                  <br />
                  <span className="banner-animated">Pour les Professionnels</span>
                </div>
                <div className="banner-subtitle">
                  Accédez à des actifs premium et enchérissez en toute sécurité.
                </div>
                <div className="banner-actions">
                  <Link href="/auction-sidebar" className="cta-button">
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#fff"/><path d="M12 7v6l4 2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Accéder aux enchères
                  </Link>
                </div>
                <div className="banner-features">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <h4 style={{color: '#222', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0'}}>Plateforme sécurisée</h4>
                      <p style={{color: '#4b5563', fontSize: '13px', margin: 0}}>Transactions protégées et fiables.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <h4 style={{color: '#222', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0'}}>Support dédié</h4>
                      <p style={{color: '#4b5563', fontSize: '13px', margin: 0}}>Assistance rapide et efficace.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M17 21v-2c0-1.1-.45-2.15-1.17-2.83C15.08 15.42 14.06 15 13 15H5c-1.06 0-2.08.42-2.83 1.17C1.45 16.85 1 17.9 1 19v2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="2"/></svg>
                    </div>
                    <div>
                      <h4 style={{color: '#222', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0'}}>Communauté active</h4>
                      <p style={{color: '#4b5563', fontSize: '13px', margin: 0}}>Réseau d'acheteurs et vendeurs fiables.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right Side - Video */}
          <div className="banner-right">
            <div className="video-box">
              <div className="video-play">
                <svg width={40} height={40} viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div className="video-label">Découvrir la plateforme</div>
              <div className="video-desc">Expérience moderne, fluide et sécurisée.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home1Banner;
