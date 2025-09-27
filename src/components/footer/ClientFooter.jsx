"use client";
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('./Footer'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default Footer; 