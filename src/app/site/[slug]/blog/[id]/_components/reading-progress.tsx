"use client"

import { useEffect, useState } from "react"

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const currentScrollY = window.scrollY
      const scrollHeight = document.body.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        setProgress(Number((currentScrollY / scrollHeight).toFixed(2)) * 100)
      }
    }

    window.addEventListener("scroll", updateProgress, { passive: true })
    updateProgress() // Initial check

    return () => window.removeEventListener("scroll", updateProgress)
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 bg-transparent z-[100]">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
