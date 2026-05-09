'use client'

import dynamic from 'next/dynamic'

const ClinicMap = dynamic(
  () => import('../components/ClinicMap'),
  {
    ssr: false,
  }
)

export default function Home() {
  return <ClinicMap />
}