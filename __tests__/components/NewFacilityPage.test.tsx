import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NewFacilityPage from '@/app/(dashboard)/admin/website/facilities/new/page'

// --- Mock Setup ---

// Mock useRouter
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock useTenantBranding
vi.mock('@/components/providers/tenant-branding-provider', () => ({
  useTenantBranding: () => ({
    branding: { id: 'tenant-1' }
  })
}))

// Mock Server Actions
const mockCreateFacility = vi.fn()
vi.mock('@/lib/actions/facilities', () => ({
  createFacility: (...args: any[]) => mockCreateFacility(...args)
}))

// Mock Toast Notification
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: any[]) => mockToast(...args)
}))

describe('UI Component: NewFacilityPage', () => {
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('TC1: Mencegah submit form jika nama fasilitas kosong (Validasi Frontend)', async () => {
    render(<NewFacilityPage />)
    
    // Temukan tombol submit berdasarkan text
    const submitBtn = screen.getByText(/Simpan Fasilitas/i)
    
    // Karena nama masih kosong, tombol harusnya di-disable
    expect(submitBtn.hasAttribute('disabled')).toBe(true)
    
    // Memastikan tidak pernah menembak API / Server Action jika kosong
    expect(mockCreateFacility).not.toHaveBeenCalled()
  })

  it('TC2: Berhasil submit form ketika nama terisi dan mengalihkan halaman', async () => {
    render(<NewFacilityPage />)
    
    // Mengisi nama fasilitas
    const inputName = screen.getByLabelText(/Nama Fasilitas/i)
    fireEvent.change(inputName, { target: { value: 'Laboratorium Sains' } })
    
    // Mock server action agar berhasil (resolved)
    mockCreateFacility.mockResolvedValueOnce({ id: 'fac-new' })
    
    // Klik tombol submit
    const submitBtn = screen.getByText(/Simpan Fasilitas/i)
    fireEvent.click(submitBtn)
    
    // Menunggu event asinkron (pemanggilan server action & router push)
    await waitFor(() => {
      // Memastikan Server Action dipanggil dengan data yang tepat
      expect(mockCreateFacility).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
        name: 'Laboratorium Sains',
        description: '', // string kosong karena tak diisi
      }))
      
      // Memastikan memanggil notifikasi sukses
      expect(mockToast).toHaveBeenCalledWith({
        title: "Fasilitas berhasil disimpan!"
      })
      
      // Memastikan berpindah ke halaman daftar fasilitas
      expect(mockPush).toHaveBeenCalledWith('/dashboard/website/facilities')
    })
  })
})
