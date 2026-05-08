import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NewFacilityPage from '@/app/(dashboard)/admin/website/facilities/new/page'

// --- Mock Setup ---

// Mock useRouter
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
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

  it('TC1: Tombol submit disabled jika nama fasilitas kosong', async () => {
    render(<NewFacilityPage />)
    
    // Temukan tombol submit berdasarkan text
    const submitBtn = screen.getByText(/Simpan Fasilitas/i)
    
    // Karena nama masih kosong, tombol harus di-disable
    expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(true)
    
    // Memastikan tidak pernah menembak Server Action jika kosong
    expect(mockCreateFacility).not.toHaveBeenCalled()
  })

  it('TC2: Tombol submit enabled setelah nama diisi', async () => {
    render(<NewFacilityPage />)
    
    // Isi nama fasilitas
    const inputName = screen.getByLabelText(/Nama Fasilitas/i)
    fireEvent.change(inputName, { target: { value: 'Laboratorium Sains' } })
    
    // Tombol harus enabled sekarang
    const submitBtn = screen.getByText(/Simpan Fasilitas/i)
    expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(false)
  })

  it('TC3: Berhasil submit form dan redirect ke halaman daftar', async () => {
    render(<NewFacilityPage />)
    
    // Mengisi nama fasilitas
    const inputName = screen.getByLabelText(/Nama Fasilitas/i)
    fireEvent.change(inputName, { target: { value: 'Laboratorium Sains' } })
    
    // Mock server action agar berhasil
    mockCreateFacility.mockResolvedValueOnce({ id: 'fac-new' })
    
    // Klik tombol submit
    const submitBtn = screen.getByText(/Simpan Fasilitas/i)
    fireEvent.click(submitBtn)
    
    // Menunggu event asinkron
    await waitFor(() => {
      expect(mockCreateFacility).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
        name: 'Laboratorium Sains',
      }))
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Fasilitas berhasil disimpan!"
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/website/facilities')
    })
  })

  it('TC4: Form menampilkan semua field yang diperlukan', () => {
    render(<NewFacilityPage />)
    
    expect(screen.getByLabelText(/Nama Fasilitas/i)).toBeDefined()
    expect(screen.getByLabelText(/Deskripsi/i)).toBeDefined()
    expect(screen.getByLabelText(/Kategori/i)).toBeDefined()
    expect(screen.getByLabelText(/Kondisi/i)).toBeDefined()
    expect(screen.getByLabelText(/Hak Akses/i)).toBeDefined()
  })
})
