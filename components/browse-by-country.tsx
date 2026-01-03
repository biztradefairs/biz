"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Country = {
  id: number
  name: string
  flag: string
  code: string
}

const countries: Country[] = [
  { id: 1, name: "USA", flag: "/flags/USA.png", code: "US" },
  { id: 2, name: "Germany", flag: "/flags/Germany.png", code: "DE" },
  { id: 3, name: "UK", flag: "/flags/UK.png", code: "GB" },
  { id: 4, name: "Canada", flag: "/flags/Canada.png", code: "CA" },
  { id: 5, name: "UAE", flag: "/flags/UAE.png", code: "AE" },
  { id: 6, name: "India", flag: "/flags/India.png", code: "IN" },
  { id: 7, name: "Australia", flag: "/flags/Australiya.png", code: "AU" },
  { id: 8, name: "China", flag: "/flags/China.jpg", code: "CN" },
  { id: 9, name: "Spain", flag: "/flags/Spain.jpg", code: "ES" },
  { id: 10, name: "Italy", flag: "/flags/Itily.jpg", code: "IT" },
  { id: 11, name: "France", flag: "/flags/France.png", code: "FR" },
  { id: 12, name: "Japan", flag: "/flags/Japan Flag.png", code: "JP" },
]

interface CountryCount {
  country: string
  count: number
}

export default function BrowseByCountry() {
  const router = useRouter()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCountryCounts = async () => {
      try {
        setLoading(true)
        // Add include=countries parameter to get country data
        const res = await fetch("/api/events/stats?include=countries")
        if (!res.ok) throw new Error("Failed to fetch country stats")
        
        const data = await res.json()
        
        if (data.success && data.countries) {
          const map: Record<string, number> = {}
          data.countries.forEach((c: CountryCount) => {
            if (c.country) {
              map[c.country] = c.count
            }
          })
          setCounts(map)
        }
      } catch (error) {
        console.error("Error fetching country stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCountryCounts()
  }, [])

  const handleCountryClick = (country: Country) => {
    router.push(`/event?country=${encodeURIComponent(country.name)}`)
  }

  const getCountryCount = (countryName: string): number => {
    return counts[countryName] || 0
  }

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      const kValue = (count / 1000).toFixed(1)
      return kValue.endsWith('.0') ? `${(count / 1000).toFixed(0)}k` : `${kValue}k`
    }
    return count.toString()
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto mb-12">
        <div className="px-6 py-6 border-b border-gray-200 text-left">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Browse Event By Country
          </h2>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500">Loading countries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto mb-12">
      <div className="overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 text-left">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Browse Event By Country
          </h2>
        </div>

        {/* Country Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            {countries.map((country) => {
              const eventCount = getCountryCount(country.name)
              
              return (
                <button
                  key={country.id}
                  onClick={() => handleCountryClick(country)}
                  className="group bg-white shadow-xl p-4 hover:shadow-lg hover:shadow-gray-500 transition-all duration-200 hover:scale-105"
                >
                  <div className="aspect-[5/2] flex items-center justify-left">
                    <img
                      src={country.flag || "/placeholder.svg"}
                      alt={`${country.name} flag`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-left mt-2">
                    <p className="font-semibold text-gray-900">
                      {country.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCount(eventCount)} Events
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}