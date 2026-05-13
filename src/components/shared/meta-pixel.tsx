"use client"

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export const MetaPixel = ({ pixelId }: { pixelId: string }) => {
  const pathname = usePathname()
  const [loaded, setLoaded] = useState(false)
  const [isPlatform, setIsPlatform] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      // Hanya aktifkan pixel di domain utama platform, JANGAN di web tenant (subdomain)
      const mainDomains = ['schoolpro.id', 'www.schoolpro.id', 'schoolpro.my.id', 'www.schoolpro.my.id', 'localhost']
      if (mainDomains.includes(hostname)) {
        setIsPlatform(true)
      }
    }
  }, [])

  useEffect(() => {
    // Only track if loaded and fbq is available AND we are on the main platform domain
    if (loaded && typeof window !== 'undefined' && (window as any).fbq && isPlatform) {
      // Trigger PageView only on Landing Page and Form Page
      if (pathname === '/' || pathname === '/daftarkan-sekolah') {
        (window as any).fbq('track', 'PageView')
      }
    }
  }, [pathname, loaded, isPlatform])

  // Jangan render script pixel sama sekali jika bukan di domain utama (tenant)
  if (!pixelId || !isPlatform) return null

  // The initial script injection.
  // We don't automatically call fbq('track', 'PageView') in the script string
  // because we want React to handle it via useEffect based on pathname.
  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
          `,
        }}
        onLoad={() => {
          setLoaded(true)
          // Fire initial PageView if we land directly on allowed pages
          if (typeof window !== 'undefined' && (window as any).fbq) {
            const path = window.location.pathname;
            if (path === '/' || path === '/daftarkan-sekolah') {
               (window as any).fbq('track', 'PageView');
            }
          }
        }}
      />
    </>
  )
}

// Utility to trigger events manually
export const trackMetaEvent = (eventName: string, data: any = {}) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    // Pastikan tidak trigger event jika dijalankan di subdomain tenant
    const hostname = window.location.hostname
    const mainDomains = ['schoolpro.id', 'www.schoolpro.id', 'schoolpro.my.id', 'www.schoolpro.my.id', 'localhost']
    
    if (mainDomains.includes(hostname)) {
      (window as any).fbq('track', eventName, data);
    }
  }
}
