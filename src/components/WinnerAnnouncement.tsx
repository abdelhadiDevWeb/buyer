"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateSocket } from '@/contexts/socket';
import { authStore } from '@/contexts/authStore';
import { toast } from 'react-toastify';

type WinnerData = {
  tenderTitle?: string;
  message?: string;
};

export default function WinnerAnnouncement() {
  const router = useRouter();
  const { isLogged } = authStore();
  const socketContext = useCreateSocket();

  const [show, setShow] = useState(false);
  const [data, setData] = useState<WinnerData | null>(null);

  useEffect(() => {
    if (!isLogged || !socketContext?.socket) return;

    const handleNotification = (notification: any) => {
      try {
        const type: string = notification?.type || '';
        const isWin = type === 'BID_WON' || type === 'OFFER_ACCEPTED' || notification?.title?.includes('Félicitations');
        if (!isWin) return;

        const tenderTitle = notification?.data?.tenderTitle || notification?.data?.tender?.title || notification?.message || '';

        // Debounce duplicates using a short-term storage key
        const key = `winner-shown-${notification?._id || tenderTitle}`;
        const recently = sessionStorage.getItem(key);
        if (recently) return;
        sessionStorage.setItem(key, '1');

        setData({
          tenderTitle,
          message: notification?.message || 'Vous avez remporté cet appel d\'offres.'
        });
        setShow(true);
        toast.success('🎉 Félicitations ! Vous avez remporté un appel d\'offres.');
      } catch (_) {}
    };

    // Ensure no duplicate listeners
    try {
      socketContext.socket?.off('notification', handleNotification);
    } catch {}
    socketContext.socket?.on('notification', handleNotification);

    return () => {
      try { socketContext.socket?.off('notification', handleNotification); } catch {}
    };
  }, [isLogged, socketContext?.socket]);

  if (!show) return null;

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000
    }}>
      <div style={{
        width:'min(540px, 94vw)', background:'#fff', borderRadius:16,
        boxShadow:'0 24px 64px rgba(0,0,0,0.25)', overflow:'hidden'
      }}>
        <div style={{
          background:'linear-gradient(135deg,#0f9d58,#34a853)', color:'#fff', padding:'18px 22px'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div style={{
              width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22
            }}>🎉</div>
            <div>
              <div style={{fontSize:18, fontWeight:800}}>Félicitations !</div>
              <div style={{opacity:0.95, fontSize:14}}>Vous avez remporté cet appel d'offres</div>
            </div>
          </div>
        </div>
        <div style={{padding:'20px 22px'}}>
          {data?.tenderTitle && (
            <div style={{fontWeight:700, marginBottom:8, color:'#333'}}>{data.tenderTitle}</div>
          )}
          <p style={{marginTop:0, color:'#333', lineHeight:1.6}}>
            {data?.message || "Un chat est prêt pour démarrer la discussion et finaliser les détails."}
          </p>
          <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:16}}>
            <button
              onClick={() => setShow(false)}
              style={{
                background:'#f1f3f5', color:'#333', border:'1px solid #e0e0e0', padding:'10px 14px',
                borderRadius:10, cursor:'pointer', fontWeight:600
              }}
            >Plus tard</button>
            <button
              onClick={() => router.push('/messages')}
              style={{
                background:'linear-gradient(90deg,#2e7d32,#4caf50)', color:'#fff', border:'none',
                padding:'10px 16px', borderRadius:10, cursor:'pointer', fontWeight:800,
                boxShadow:'0 6px 16px rgba(76,175,80,0.35)'
              }}
            >Ouvrir le chat</button>
          </div>
        </div>
      </div>
    </div>
  );
}


