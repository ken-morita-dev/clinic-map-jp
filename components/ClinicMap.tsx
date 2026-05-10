'use client'

import { useEffect, useState } from 'react'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from 'react-leaflet'

import L from 'leaflet'

// ===============================
// Leaflet CSS（必須）
// ===============================
import 'leaflet/dist/leaflet.css'

// ===============================
// 型
// ===============================
type Clinic = {
  place_id: string
  name: string
  vicinity: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  opening_hours?: {
    open_now: boolean
  }
}

// ===============================
// ★ 超安定版アイコン
// （Vercel対応版）
// ===============================
const redIcon = new L.Icon({
  iconUrl:
    'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const blackIcon = new L.Icon({
  iconUrl:
    'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-black.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// ===============================
// 診療科
// ===============================
const categories = [
  { label: '全部', keyword: '' },
  { label: '内科', keyword: '内科' },
  { label: '小児科', keyword: '小児科' },
  { label: '耳鼻科', keyword: '耳鼻科' },
  { label: '眼科', keyword: '眼科' },
  { label: '整形外科', keyword: '整形外科' },
  { label: '皮膚科', keyword: '皮膚科' },
]

// ===============================
// メイン
// ===============================
export default function ClinicMap() {
  const [clinics, setClinics] = useState<Clinic[]>([])

  const [position, setPosition] = useState<[number, number]>([
    35.4437,
    139.638,
  ])

  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')

  // ===============================
  // API取得
  // ===============================
  async function fetchClinics(
    lat: number,
    lng: number,
    kw = keyword
  ) {
    try {
      const res = await fetch(
        `/api/clinics?lat=${lat}&lng=${lng}&keyword=${kw}`
      )

      const data = await res.json()

      console.log('clinics data', data)

      setClinics(data.results || [])
    } catch (err) {
      console.error(err)
    }
  }

  // ===============================
  // 地名検索
  // ===============================
  async function searchPlace() {
    if (!searchText) return

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchText
        )}`
      )

      const data = await res.json()

      if (data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)

        setPosition([lat, lng])

        fetchClinics(lat, lng)
      } else {
        alert('場所が見つかりません')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ===============================
  // 初期位置
  // ===============================
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        setPosition([lat, lng])

        fetchClinics(lat, lng)
      },
      () => {
        fetchClinics(position[0], position[1])
      }
    )
  }, [])

  // ===============================
  // UI
  // ===============================
  return (
    <div>
      {/* ================= UIパネル ================= */}
      <div
        style={{
          position: 'absolute',
          zIndex: 1000,
          top: 10,
          left: 10,
          background: 'white',
          padding: 12,
          borderRadius: 12,
          width: 340,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}
      >
        {/* 検索 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="地名検索"
            style={{
              flex: 1,
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 8,
            }}
          />

          <button
            onClick={searchPlace}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            検索
          </button>
        </div>

        {/* 診療科 */}
        <div style={{ fontWeight: 'bold', marginBottom: 10 }}>
          診療科
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((cat) => (
            <button
              key={cat.keyword}
              onClick={() => {
                setKeyword(cat.keyword)

                fetchClinics(
                  position[0],
                  position[1],
                  cat.keyword
                )
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: 8,
                background:
                  keyword === cat.keyword
                    ? '#2563eb'
                    : 'white',
                color:
                  keyword === cat.keyword
                    ? 'white'
                    : 'black',
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 地図 ================= */}
      <MapContainer
        center={position}
        zoom={14}
        zoomControl={false}
        style={{
          height: '100vh',
          width: '100%',
        }}
      >
        <ZoomControl position="topright" />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ピン */}
        {clinics.map((clinic) => (
          <Marker
            key={clinic.place_id}
            position={[
              clinic.geometry.location.lat,
              clinic.geometry.location.lng,
            ]}
            icon={
              clinic.opening_hours?.open_now
                ? redIcon
                : blackIcon
            }
          >
            <Popup>
              <b>{clinic.name}</b>

              <br />

              {clinic.vicinity}

              <br />
              <br />

              <div>
                ⭐ {clinic.rating ?? 'なし'}
              </div>

              <div>
                レビュー {clinic.user_ratings_total ?? 0}
              </div>

              <div
                style={{
                  color:
                    clinic.opening_hours?.open_now
                      ? 'red'
                      : 'black',

                  fontWeight: 'bold',
                }}
              >
                {clinic.opening_hours?.open_now
                  ? '🟢 診療中'
                  : '⚫ 時間外'}
              </div>

              <br />

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  clinic.name + ' ' + clinic.vicinity
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#2563eb',
                  fontWeight: 'bold',
                }}
              >
                Google Mapsで開く
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}