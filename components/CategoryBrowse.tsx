"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  Cross,
  TrendingUp,
  DollarSign,
  Briefcase,
  MoreHorizontal,
  ChevronUp,
  Factory,
  Building2,
  Zap,
  Clapperboard,
  HeartPulse,
  FlaskConical,
  Leaf,
  Trees,
  Utensils,
  Truck,
  Cpu,
  Palette,
  Car,
  Home,
  Shield,
  Sparkles,
  Plane,
  Phone,
  Shirt,
  Dog,
  Baby,
  Hotel,
  Package,
  Puzzle,
} from "lucide-react"

/* ---------------- CATEGORIES ---------------- */
const primaryCategories = [
  { id: "education", title: "Education & Training", icon: GraduationCap, filterValue: "Education & Training" },
  { id: "medical", title: "Medical & Pharma", icon: Cross, filterValue: "Medical & Pharma" },
  { id: "technology", title: "IT & Technology", icon: TrendingUp, filterValue: "IT & Technology" },
  { id: "finance", title: "Banking & Finance", icon: DollarSign, filterValue: "Banking & Finance" },
  { id: "business", title: "Business Services", icon: Briefcase, filterValue: "Business Services" },
]

const extraCategories = [
  { title: "Industrial Engineering", icon: Factory, filterValue: "Industrial Engineering" },
  { title: "Building & Construction", icon: Building2, filterValue: "Building & Construction" },
  { title: "Power & Energy", icon: Zap, filterValue: "Power & Energy" },
  { title: "Entertainment & Media", icon: Clapperboard, filterValue: "Entertainment & Media" },
  { title: "Wellness, Health & Fitness", icon: HeartPulse, filterValue: "Wellness, Health & Fitness" },
  { title: "Science & Research", icon: FlaskConical, filterValue: "Science & Research" },
  { title: "Environment & Waste", icon: Leaf, filterValue: "Environment & Waste" },
  { title: "Agriculture & Forestry", icon: Trees, filterValue: "Agriculture & Forestry" },
  { title: "Food & Beverages", icon: Utensils, filterValue: "Food & Beverages" },
  { title: "Logistics & Transportation", icon: Truck, filterValue: "Logistics & Transportation" },
  { title: "Electric & Electronics", icon: Cpu, filterValue: "Electric & Electronics" },
  { title: "Arts & Crafts", icon: Palette, filterValue: "Arts & Crafts" },
  { title: "Auto & Automotive", icon: Car, filterValue: "Auto & Automotive" },
  { title: "Home & Office", icon: Home, filterValue: "Home & Office" },
  { title: "Security & Defense", icon: Shield, filterValue: "Security & Defense" },
  { title: "Fashion & Beauty", icon: Sparkles, filterValue: "Fashion & Beauty" },
  { title: "Travel & Tourism", icon: Plane, filterValue: "Travel & Tourism" },
  { title: "Telecommunication", icon: Phone, filterValue: "Telecommunication" },
  { title: "Apparel & Clothing", icon: Shirt, filterValue: "Apparel & Clothing" },
  { title: "Animals & Pets", icon: Dog, filterValue: "Animals & Pets" },
  { title: "Baby, Kids & Maternity", icon: Baby, filterValue: "Baby, Kids & Maternity" },
  { title: "Hospitality", icon: Hotel, filterValue: "Hospitality" },
  { title: "Packing & Packaging", icon: Package, filterValue: "Packing & Packaging" },
  { title: "Miscellaneous", icon: Puzzle, filterValue: "Miscellaneous" },
]

export default function CategoryBrowser() {
  const router = useRouter()
  const [showAll, setShowAll] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const allCategories = [
    ...primaryCategories,
    ...extraCategories.map((c, i) => ({
      id: `extra-${i}`,
      ...c,
    })),
  ]

  const visibleCategories = showAll ? allCategories : primaryCategories

  useEffect(() => {
    fetch("/api/events/stats")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const map: Record<string, number> = {}
          data.categories.forEach((c: any) => (map[c.category] = c.count))
          setCounts(map)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const getCount = (name: string) => {
    const c = counts[name] || 0
    return c >= 1000 ? `${(c / 1000).toFixed(1)}k` : c
  }

  return (
    <div className="bg-[#F3F2F0] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-semibold text-start mb-10">
          Browse By Category
        </h2>

        {/* GRID — WIDER CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {visibleCategories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => router.push(`/event?category=${encodeURIComponent(cat.filterValue)}`)}
                className="bg-white border border-gray-200 px-6 py-5
                           shadow-xl hover:shadow-md hover:border-blue-500
                           transition-all duration-200"
              >
                <div className="grid items-center gap-4">
                  {/* ICON */}
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>

                  {/* TEXT */}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {cat.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {loading ? "—" : `${getCount(cat.filterValue)} Events`}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}

          {/* VIEW ALL */}
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-white border border-gray-200 px-6 py-5
                       shadow-xl hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                {showAll ? <ChevronUp size={18} /> : <MoreHorizontal size={18} />}
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {showAll ? "View Less" : "View All"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
