"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

const cities = [
  { id: 1, name: "London", icon: "/icon/London.jpg", color: "text-red-600" },
  { id: 2, name: "Dubai", icon: "/icon/Dubai.png", color: "text-yellow-600" },
  { id: 3, name: "Berlin", icon: "/icon/berlin.png", color: "text-red-600" },
  { id: 4, name: "Amsterdam", icon: "/icon/Amsterdam.png", color: "text-blue-600" },
  { id: 5, name: "Paris", icon: "/icon/paris-01.png", color: "text-green-600" },
  { id: 6, name: "Washington DC", icon: "/icon/Washington DC.png", color: "text-purple-600" },
  { id: 7, name: "New York", icon: "/icon/new york-01.png", color: "text-purple-600" },
  { id: 8, name: "Barcelona", icon: "/icon/Barcelona.png", color: "text-green-600" },
  { id: 9, name: "Kuala Lumpur", icon: "/icon/Kuala Lumpur.png", color: "text-blue-600" },
  { id: 10, name: "Orlando", icon: "/icon/Orlando.png", color: "text-yellow-600" },
  { id: 11, name: "Chicago", icon: "/icon/chicago.png", color: "text-purple-600" },
  { id: 12, name: "Munich", icon: "/icon/munich.png", color: "text-purple-600" },
]

interface CityCount {
  city: string
  count: number
}

export default function BrowseByCity() {
  const router = useRouter()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCityCounts = async () => {
      try {
        setLoading(true)
        // Add include=cities parameter to get city data
        const res = await fetch("/api/events/stats?include=cities")
        if (!res.ok) throw new Error("Failed to fetch city stats")
        
        const data = await res.json()
        
        if (data.success && data.cities) {
          const map: Record<string, number> = {}
          data.cities.forEach((c: CityCount) => {
            if (c.city) {
              map[c.city] = c.count
            }
          })
          setCounts(map)
        }
      } catch (error) {
        console.error("Error fetching city stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCityCounts()
  }, [])

  const handleCityClick = (city: (typeof cities)[0]) => {
    router.push(`/event?location=${encodeURIComponent(city.name)}`)
  }

  const getCityCount = (cityName: string): number => {
    return counts[cityName] || 0
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
      <div className="w-full max-w-7xl mx-auto mb-12 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Events By City
          </h2>
          <p className="text-gray-600 text-lg">Find events in your favorite cities</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 animate-pulse">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-start">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Events By City
          </h2>
          <p className="text-gray-600 text-lg">Find events in your favorite cities</p>
        </div>

        {/* City Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {cities.map((city) => {
            const count = getCityCount(city.name)
            const hasEvents = count > 0
            
            return (
              <button
                key={city.id}
                onClick={() => handleCityClick(city)}
                className="group bg-white  p-6 shadow-md border border-gray-100 hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* City Icon */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300 flex items-center justify-center">
                      <div className="relative w-10 h-10">
                        <Image
                          src={city.icon || "/placeholder.svg"}
                          alt={city.name}
                          fill
                          sizes="40px"
                          className="object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* City Name */}
                  <div>
                    <h3 className={`text-base font-bold text-gray-900 mb-1 ${city.color}`}>
                      {city.name}
                    </h3>
                    <p className="text-sm font-semibold text-gray-500">
                      {formatCount(count)} Events
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}