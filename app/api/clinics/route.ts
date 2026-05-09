import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const keywordInput = searchParams.get('keyword')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'missing params' })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  const keywords = keywordInput
    ? [keywordInput]
    : [
        '病院',
        'クリニック',
        '内科',
        '小児科',
        '耳鼻科',
        '皮膚科',
      ]

  let allResults: any[] = []

  // =========================
  // ① Nearby Search（安定枠）
  // =========================
  try {
    const nearbyUrl =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}` +
      `&radius=3000` +
      `&type=hospital` +
      `&language=ja` +
      `&key=${apiKey}`

    const res = await fetch(nearbyUrl)
    const data = await res.json()

    if (data.results) {
      allResults.push(...data.results)
    }
  } catch (err) {
    console.error('nearby error', err)
  }

  // =========================
  // ② Text Search（補助）
  // =========================
  for (const keyword of keywords) {
    try {
      const textUrl =
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(keyword)}` +
        `&location=${lat},${lng}` +
        `&radius=15000` +
        `&language=ja` +
        `&key=${apiKey}`

      const res = await fetch(textUrl)
      const data = await res.json()

      if (data.results) {
        allResults.push(...data.results)
      }
    } catch (err) {
      console.error('text error', err)
    }
  }

  // =========================
  // ③ 重複削除
  // =========================
  const uniqueResults = Array.from(
    new Map(allResults.map((p) => [p.place_id, p])).values()
  )

  // =========================
  // ④ Place Details（評価・営業時間補完）
  // =========================
  const detailedResults = await Promise.all(
    uniqueResults.map(async (place) => {
      try {
        const detailUrl =
          `https://maps.googleapis.com/maps/api/place/details/json` +
          `?place_id=${place.place_id}` +
          `&fields=name,rating,user_ratings_total,opening_hours,formatted_address,geometry` +
          `&language=ja` +
          `&key=${apiKey}`

        const res = await fetch(detailUrl)
        const data = await res.json()

        return {
          ...place,
          ...data.result,
        }
      } catch (err) {
        return place
      }
    })
  )

  // =========================
  // ⑤ return
  // =========================
  return NextResponse.json({
    results: detailedResults,
  })
}