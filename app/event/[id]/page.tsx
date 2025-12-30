import { Metadata } from 'next'
import EventPageClient from './EventPageClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Fetch event data server-side
    const response = await fetch(`${baseUrl}/api/events/${id}`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (!response.ok) {
      return {
        title: 'Event Details | BizTradeFairs',
        description: 'View event details on BizTradeFairs',
      }
    }
    
    const event = await response.json()
    
    // This is what makes search engines see the event title
    return {
      title: `${event.title || 'Event'} | BizTradeFairs`,
      description: event.description || event.shortDescription || 'Event details on BizTradeFairs',
      openGraph: {
        title: event.title || 'Event',
        description: event.description || event.shortDescription || '',
        type: 'website',
        url: `${baseUrl}/event/${id}`,
        images: event.bannerImage ? [event.bannerImage] : event.images?.[0] ? [event.images[0]] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Event Details | BizTradeFairs',
      description: 'View event details on BizTradeFairs',
    }
  }
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params
  
  // Fetch event data for the client component
  let event = null
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/events/${id}`, {
      cache: 'no-store'
    })
    
    if (response.ok) {
      event = await response.json()
    }
  } catch (error) {
    console.error('Error fetching event:', error)
  }
  
  return <EventPageClient 
    params={{ id }} 
    initialEvent={event}
  />
}