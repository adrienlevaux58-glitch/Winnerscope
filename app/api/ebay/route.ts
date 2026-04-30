import { NextRequest, NextResponse } from 'next/server'

const EBAY_API_URL = 'https://api.ebay.com'
const EBAY_AUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token'

async function getEbayToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(EBAY_AUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
    next: { revalidate: 6000 }, // cache le token 100 min
  })

  const data = await res.json()
  return data.access_token
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  try {
    const token = await getEbayToken()

    const searchRes = await fetch(
      `${EBAY_API_URL}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=20&filter=buyingOptions:{FIXED_PRICE}&filter=conditions:{NEW|UNSPECIFIED}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR',
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await searchRes.json()
    const items = data.itemSummaries || []

    if (items.length === 0) {
      return NextResponse.json({ score: null, reason: 'no_results' })
    }

    // Prix en EUR
    const prices = items
      .map((i: any) => parseFloat(i.price?.value))
      .filter((p: number) => !isNaN(p) && p > 0)

    const medianPrice = prices.sort((a: number, b: number) => a - b)[Math.floor(prices.length / 2)]
    const totalResults = data.total || items.length
    const sellerCount = new Set(items.map((i: any) => i.seller?.username)).size

    return NextResponse.json({
      medianPrice,
      totalResults,
      sellerCount,
      currency: 'EUR',
    })
  } catch (err) {
    console.error('eBay API error:', err)
    return NextResponse.json({ error: 'eBay API failed' }, { status: 500 })
  }
}