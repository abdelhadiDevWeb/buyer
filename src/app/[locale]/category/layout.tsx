"use client";

import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'
import InteractiveBackground from '@/components/common/InteractiveBackground'

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <InteractiveBackground 
        theme="light" 
        enableDots={true}
        enableGeometry={true}
        enableWaves={true}
        enableMouseTrail={true}
        particleCount={50}
      />
      <Header />
      <section>
        {children}
      </section>
      <Footer />
    </>
  )
} 