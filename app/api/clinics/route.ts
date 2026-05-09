import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const keywordInput = searchParams.get('keyword')

  if (!lat || !lng) {
    return NextResponse.json({
      error: 'missing params',
    })
  }

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  const keywords = keywordInput
    ? [keywordInput]
    : [
        '病院',
        'クリニック',
        '医院',
        '内科',
        '小児科',
        '耳鼻科',
        '皮膚科',
        'メディカル',
        '記念クリニック',
      ]

  let allResults: any[] = []

  for (const keyword of keywords) {
    try {
      // Nearby Search
      const nearbyUrl =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lng}` +
        `&radius=15000` +
        `&keyword=${encodeURIComponent(keyword)}` +
        `&language=ja` +
        `&key=${apiKey}`

      const nearbyRes = await fetch(nearbyUrl)
      const nearbyData = await nearbyRes.json()

      if (nearbyData.results) {
        allResults = [
          ...allResults,
          ...nearbyData.results,
        ]
      }

      // Text Search（追加）
      const textUrl =
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(keyword)}` +
        `&location=${lat},${lng}` +
        `&radius=15000` +
        `&language=ja` +
        `&key=${apiKey}`

      const textRes = await fetch(textUrl)
      const textData = await textRes.json()

      if (textData.results) {
        allResults = [
          ...allResults,
          ...textData.results,
        ]
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 重複削除
  const uniqueResults = Array.from(
    new Map(
      allResults.map((place) => [
        place.place_id,
        place,
      ])
    ).values()
  )

  return NextResponse.json({
    results: uniqueResults,
  })
}