"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import "./hide-scrollbar.css" // 👈 optional external file (see below)

export default function FeaturedOrganizers() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchOrganizer() {
      try {
        const res = await fetch("/api/organizers")
        if (!res.ok) throw new Error("Failed to fetch organizers")
        const data = await res.json()
        setOrganizers(data.organizers)
      } catch (err) {
        console.error("Error fetching organizers:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrganizer()
  }, [])

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" })
  }

  // 🌀 Auto-scroll
  useEffect(() => {
    if (!scrollRef.current) return
    const scrollContainer = scrollRef.current
    const scrollStep = 300
    const intervalTime = 3000

    const interval = setInterval(() => {
      if (!isHovering && scrollContainer) {
        if (
          scrollContainer.scrollLeft + scrollContainer.clientWidth >=
          scrollContainer.scrollWidth - 10
        ) {
          scrollContainer.scrollTo({ left: 0, behavior: "smooth" })
        } else {
          scrollContainer.scrollBy({ left: scrollStep, behavior: "smooth" })
        }
      }
    }, intervalTime)

    return () => clearInterval(interval)
  }, [isHovering, organizers])

  if (loading) return <p className="text-center py-10">Loading organizers...</p>

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="py-6 border-b border-gray-200 text-left">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          Featured Organizers
        </h2>
        <p className="text-gray-600">Worldwide Organizers</p>
      </div>

      <div
        className="relative group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Scroll Buttons */}
        <button
          onClick={() => scrollByAmount(-300)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <button
          onClick={() => scrollByAmount(300)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>

        {/* Scrollable Logos */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth py-6 hide-scrollbar items-center"
        >
          {organizers.map((organizer: any) => (
            <div
              onClick={() => router.push(`/organizer/${organizer.id}`)}
              key={organizer.id}
              className="w-[200px] h-[120px] flex items-center justify-center 
                         bg-white border border-gray-200 rounded-lg p-4 
                         flex-shrink-0 hover:shadow-lg hover:border-blue-300 
                         transition duration-200 cursor-pointer"
            >
              <img
                src={organizer.image}
                alt={organizer.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}

          <Link href="/organizers">
            <button
              className="w-[200px] h-[120px] flex items-center justify-center 
                         bg-gray-50 border-2 border-dashed border-gray-300 
                         rounded-lg hover:border-blue-400 hover:bg-blue-50 
                         transition-all duration-200 flex-shrink-0"
            >
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                View All
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
