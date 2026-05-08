import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the domain service before importing the route
vi.mock('@/lib/services/domain', () => ({
  resolveDomainToSlug: vi.fn(),
}))

// We need to set the env variable BEFORE the module loads
const MOCK_SECRET = 'test-internal-secret-xyz'

describe('API: /api/internal/domain-lookup', () => {

  beforeEach(() => {
    vi.stubEnv('INTERNAL_API_SECRET', MOCK_SECRET)
  })

  async function callDomainLookup(domain: string | null, secret: string | null) {
    // Re-import to get fresh module with env vars
    vi.resetModules()
    const { GET } = await import('@/app/api/internal/domain-lookup/route')
    const { resolveDomainToSlug } = await import('@/lib/services/domain')

    const url = domain
      ? `http://localhost/api/internal/domain-lookup?domain=${encodeURIComponent(domain)}`
      : 'http://localhost/api/internal/domain-lookup'

    const headers = new Headers()
    if (secret) headers.set('x-internal-secret', secret)

    const req = new Request(url, { headers })
    return { response: await GET(req), resolveDomainToSlug }
  }

  it('TC1: Menolak request tanpa x-internal-secret header', async () => {
    const { response } = await callDomainLookup('example.com', null)
    expect(response.status).toBe(403)
  })

  it('TC2: Menolak request dengan secret yang salah', async () => {
    const { response } = await callDomainLookup('example.com', 'wrong-secret')
    expect(response.status).toBe(403)
  })

  it('TC3: Mengembalikan error 400 jika parameter domain tidak diisi', async () => {
    const { response } = await callDomainLookup(null, MOCK_SECRET)
    expect(response.status).toBe(400)
  })

  it('TC4: Mengembalikan 404 jika domain tidak ditemukan di database', async () => {
    vi.resetModules()
    const { resolveDomainToSlug } = await import('@/lib/services/domain')
    vi.mocked(resolveDomainToSlug).mockResolvedValue(null)

    const { response } = await callDomainLookup('unknown-domain.com', MOCK_SECRET)
    expect(response.status).toBe(404)
  })

  it('TC5: Mengembalikan slug yang valid jika domain ditemukan', async () => {
    vi.resetModules()
    const { resolveDomainToSlug } = await import('@/lib/services/domain')
    vi.mocked(resolveDomainToSlug).mockResolvedValue('sma-nusantara')

    const { response } = await callDomainLookup('sma-nusantara.sch.id', MOCK_SECRET)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.slug).toBe('sma-nusantara')
  })

  it('TC6: Response mengandung Cache-Control header', async () => {
    vi.resetModules()
    const { resolveDomainToSlug } = await import('@/lib/services/domain')
    vi.mocked(resolveDomainToSlug).mockResolvedValue('test-school')

    const { response } = await callDomainLookup('test.sch.id', MOCK_SECRET)
    expect(response.headers.get('Cache-Control')).toContain('max-age=300')
  })
})
