'use client'

import { useEffect, useState } from 'react'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet'

const SafeMapContainer = MapContainer as any

import L, { LeafletMouseEvent } from 'leaflet'

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

const redIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const blackIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const categories = [
  { label: '全部', keyword: '' },
  { label: '🩺 内科', keyword: '内科' },
  { label: '👶 小児科', keyword: '小児科' },
  { label: '👂 耳鼻科', keyword: '耳鼻科' },
  { label: '👁 眼科', keyword: '眼科' },
  { label: '🦴 整形外科', keyword: '整形外科' },
  { label: '🧴 皮膚科', keyword: '皮膚科' },
]

type MapWatcherProps = {
  onMove: (lat: number, lng: number) => void
}

function MapWatcher({ onMove }: MapWatcherProps) {
  useMapEvents({
    moveend: (e: LeafletMouseEvent) => {
      const map = e.target as any
      const center = map.getCenter()

      onMove(center.lat, center.lng)
    },
  })

  return null
}

function ChangeMapCenter({
  position,
}: {
  position: [number, number]
}) {
  const map = useMapEvents({})

  useEffect(() => {
    map.setView(position)
  }, [position, map])

  return null
}

export default function ClinicMap() {
  const [clinics, setClinics] = useState<Clinic[]>([])

  const [position, setPosition] = useState<[number, number]>([
    35.4437,
    139.638,
  ])

  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')

  async function fetchClinics(
    lat: number,
    lng: number,
    searchKeyword = keyword
  ) {
    try {
      const res = await fetch(
        `/api/clinics?lat=${lat}&lng=${lng}&keyword=${searchKeyword}`
      )

      const data = await res.json()
      setClinics(data.results || [])
    } catch (err) {
      console.error(err)
    }
  }

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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        setPosition([lat, lng])
        fetchClinics(lat, lng)
      },
      () => {
        alert('位置情報を許可してください')
      }
    )
  }, [])

  useEffect(() => {
    fetchClinics(position[0], position[1])
  }, [keyword])

  return (
    <div>
      {/* UIパネル */}
      <div
        style={{
          position: 'absolute',
          zIndex: 1000,
          top: 10,
          left: 10,
          background: 'white',
          padding: '12px',
          borderRadius: '12px',
          width: '340px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="地名を検索"
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 8,
              border: '1px solid #ccc',
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

        <div style={{ fontWeight: 'bold', marginBottom: 10 }}>
          診療科
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((cat) => (
            <button
              key={cat.keyword}
              onClick={() => setKeyword(cat.keyword)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #ccc',
                background:
                  keyword === cat.keyword ? '#2563eb' : 'white',
                color:
                  keyword === cat.keyword ? 'white' : 'black',
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 地図 */}
      <SafeMapContainer
  center={position}
  zoom={14}
  zoomControl={false}
  style={{
    height: '100vh',
    width: '100%',
  }}
>
        center={position}
        zoom={14}
        zoomControl={false}
        style={{ height: '100vh', width: '100%' }}
      >
        <ZoomControl position="topright" />

        <ChangeMapCenter position={position} />

        <MapWatcher
          onMove={(lat, lng) => fetchClinics(lat, lng)}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
              ⭐ {clinic.rating || 'なし'}
              <br />
              レビュー {clinic.user_ratings_total || 0}
              <br />
              <span
                style={{
                  color: clinic.opening_hours?.open_now
                    ? 'red'
                    : 'black',
                }}
              >
                {clinic.opening_hours?.open_now
                  ? '診療中'
                  : '時間外'}
              </span>

              <br /><br />

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  clinic.name + ' ' + clinic.vicinity
                )}`}
                target="_blank"
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