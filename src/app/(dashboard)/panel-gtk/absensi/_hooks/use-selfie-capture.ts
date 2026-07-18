"use client"
import { useRef, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export function useSelfieCapture(tenantId?: string) {
  const { toast } = useToast()
  const [photoPreview, setPhotoPreview] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }, [])

  const startCamera = async () => {
    setPhotoPreview("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      setIsCameraOpen(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.error("Auto-play failed:", e))
        }
      }, 100)
    } catch {
      toast({ title: "Gagal akses kamera", description: "Pastikan izin kamera diberikan di browser", variant: "destructive" })
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)

    stopCamera()
    setUploadingPhoto(true)

    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" })

      const fd = new FormData()
      fd.append("file", file)
      fd.append("subDir", "attendance")
      if (tenantId) fd.append("tenantId", tenantId)

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await uploadRes.json()
      if (uploadRes.ok && d.url) {
        setPhotoPreview(d.url)
      } else {
        toast({ title: "Gagal upload", description: d.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal memproses foto", variant: "destructive" })
    } finally {
      setUploadingPhoto(false)
    }
  }

  return {
    photoPreview, setPhotoPreview,
    uploadingPhoto,
    isCameraOpen,
    videoRef,
    canvasRef,
    stopCamera,
    startCamera,
    capturePhoto,
  }
}
