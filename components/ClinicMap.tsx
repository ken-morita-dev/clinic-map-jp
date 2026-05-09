'use client'

import { useEffect, useState } from 'react'

// ★全部 any 化（ここ重要）
import * as RL from 'react-leaflet'
const MapContainer = RL.MapContainer as any
const TileLayer = RL.TileLayer as any
const Marker = RL.Marker as any
const Popup = RL.Popup as any
const useMapEvents = RL.useMapEvents as any
const ZoomControl = RL.ZoomControl as any

import L from 'leaflet'

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
  { label: '内科', keyword: '内科' },
  { label: '小児科', keyword: '小児科' },
  { label: '耳鼻科', keyword: '耳鼻科' },
  { label: '眼科', keyword: '眼科' },
  { label: '整形外科', keyword: '整形外科' },
  { label: '皮膚科', keyword: '皮膚科' },
]

// 地図移動監視
function MapWatcher({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend: (e: any) => {
      const map = e.target
      const center = map.getCenter()
      onMove(center.lat, center.lng)
    },
  })

  return null
}

// 中心移動
function ChangeMapCenter({ position }: { position: [number, number] }) {
  const map = useMapEvents({})

  useEffect(() => {
    map.setView(position)
  }, [position, map])

  return null
}

export default function ClinicMap() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [position, setPosition] = useState<[number, number]>([35.4437, 139.638])
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')

  async function fetchClinics(lat: number, lng: number, searchKeyword = keyword) {
    const res = await fetch(
      `/api/clinics?lat=${lat}&lng=${lng}&keyword=${searchKeyword}`
    )
    const data = await res.json()
    setClinics(data.results || [])
  }

  async function searchPlace() {
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
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setPosition([lat, lng])
      fetchClinics(lat, lng)
    })
  }, [])

  useEffect(() => {
    fetchClinics(position[0], position[1])
  }, [keyword])

  return (
    <div>
      {/* UI */}
      <div style={{ position: 'absolute', zIndex: 1000, top: 10, left: 10, background: 'white', padding: 12 }}>
        <input value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <button onClick={searchPlace}>検索</button>
      </div>

      {/* 地図 */}
      <MapContainer
        center={position}
        zoom={14}
        zoomControl={false}
        style={{ height: '100vh', width: '100%' }}
      >
        <ZoomControl position="topright" />

        <ChangeMapCenter position={position} />

        <MapWatcher onMove={(lat, lng) => fetchClinics(lat, lng)} />

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
            icon={clinic.opening_hours?.open_now ? redIcon : blackIcon}
          >
            <Popup>
              <b>{clinic.name}</b>
              <br />
              {clinic.vicinity}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}