// app/api/events/stats/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// All possible categories from your list
const ALL_CATEGORIES = [
  "Education & Training",
  "Medical & Pharma",
  "IT & Technology",
  "Banking & Finance",
  "Business Services",
  "Industrial Engineering",
  "Building & Construction",
  "Power & Energy",
  "Entertainment & Media",
  "Wellness, Health & Fitness",
  "Science & Research",
  "Environment & Waste",
  "Agriculture & Forestry",
  "Food & Beverages",
  "Logistics & Transportation",
  "Electric & Electronics",
  "Arts & Crafts",
  "Auto & Automotive",
  "Home & Office",
  "Security & Defense",
  "Fashion & Beauty",
  "Travel & Tourism",
  "Telecommunication",
  "Apparel & Clothing",
  "Animals & Pets",
  "Baby, Kids & Maternity",
  "Hospitality",
  "Packing & Packaging",
  "Miscellaneous",
]

// List of cities to track
const CITIES_LIST = [
  "London",
  "Dubai",
  "Berlin",
  "Amsterdam",
  "Paris",
  "Washington DC",
  "New York",
  "Barcelona",
  "Kuala Lumpur",
  "Orlando",
  "Chicago",
  "Munich"
]

// List of countries to track
const COUNTRIES_LIST = [
  "USA",
  "Germany",
  "UK",
  "Canada",
  "UAE",
  "India",
  "Australia",
  "China",
  "Spain",
  "Italy",
  "France",
  "Japan"
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const include = searchParams.get("include") // Optional: "cities,countries,categories"
    
    let includeCities = false
    let includeCountries = false
    let includeCategories = true // Default true for backward compatibility
    
    if (include) {
      const includes = include.split(',')
      includeCities = includes.includes('cities')
      includeCountries = includes.includes('countries')
      includeCategories = includes.includes('categories')
    }

    const result: any = {
      success: true,
    }

    // Get categories data (default)
    if (includeCategories) {
      const categoryCounts = await Promise.all(
        ALL_CATEGORIES.map(async (category) => {
          const count = await prisma.event.count({
            where: {
              status: "PUBLISHED",
              isPublic: true,
              category: {
                has: category
              }
            }
          })
          return { category, count }
        })
      )

      const filteredCategories = categoryCounts
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)

      result.categories = filteredCategories
      result.totalCategories = filteredCategories.length
    }

    // Get cities data (if requested)
    if (includeCities) {
      const cityCounts = await Promise.all(
        CITIES_LIST.map(async (city) => {
          const count = await prisma.event.count({
            where: {
              status: "PUBLISHED",
              isPublic: true,
              venue: {
                venueCity: {
                  contains: city,
                  mode: "insensitive"
                }
              }
            }
          })
          return { city, count }
        })
      )

      const filteredCities = cityCounts
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)

      result.cities = filteredCities
      result.totalCities = filteredCities.length
    }

    // Get countries data (if requested)
    if (includeCountries) {
      const countryCounts = await Promise.all(
        COUNTRIES_LIST.map(async (country) => {
          const count = await prisma.event.count({
            where: {
              status: "PUBLISHED",
              isPublic: true,
              venue: {
                venueCountry: {
                  contains: country,
                  mode: "insensitive"
                }
              }
            }
          })
          return { country, count }
        })
      )

      const filteredCountries = countryCounts
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)

      result.countries = filteredCountries
      result.totalCountries = filteredCountries.length
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch stats",
      details: error.message
    }, { status: 500 })
  }
}