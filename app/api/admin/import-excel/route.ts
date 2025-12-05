import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import slugify from 'slugify';
import { ObjectId } from 'bson';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

// Helper function to parse dates from various formats
function parseDateString(dateStr: any): Date {
  if (!dateStr || dateStr.toString().trim() === '') {
    return new Date();
  }
  
  const str = dateStr.toString().trim();
  
  // Try parsing DD-MM-YYYY format (European/Indian)
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Check if it's DD-MM-YYYY (day is likely > 12)
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        // If day > 12, assume DD-MM-YYYY
        if (day > 12 && day <= 31 && month >= 1 && month <= 12) {
          return new Date(year, month - 1, day);
        }
        // Otherwise try MM-DD-YYYY
        else if (month > 12 && month <= 31 && day >= 1 && day <= 12) {
          return new Date(year, day - 1, month);
        }
      }
    }
  }
  
  // Try standard parsing
  const date = new Date(str);
  return isNaN(date.getTime()) ? new Date() : date;
}

// Helper function to clean phone numbers
const cleanPhone = (phone: any): string | undefined => {
  if (!phone) return undefined;
  
  const phoneStr = String(phone);
  // Handle negative numbers (Excel conversion issue)
  if (phoneStr.startsWith('-')) {
    const positive = phoneStr.substring(1);
    return `+${positive}`;
  }
  
  // Remove non-numeric except +, -, (, )
  const cleaned = phoneStr.replace(/[^\d\+\-\(\)]/g, '');
  return cleaned || undefined;
};

// Helper function to generate unique slug
const generateUniqueSlug = async (slug: string, index: number): Promise<string> => {
  // If no slug provided, create one with index
  if (!slug || slug.trim() === '') {
    return `event-${Date.now()}-${index}`;
  }
  
  // Clean the slug
  const cleanSlug = slugify(slug, { lower: true, strict: true });
  
  // Check if slug already exists
  const existingEvent = await prisma.event.findUnique({
    where: { slug: cleanSlug },
  });
  
  // If slug doesn't exist, use it
  if (!existingEvent) {
    return cleanSlug;
  }
  
  // If slug exists, add suffix
  let suffix = 1;
  let newSlug = `${cleanSlug}-${suffix}`;
  
  while (true) {
    const existingWithSuffix = await prisma.event.findUnique({
      where: { slug: newSlug },
    });
    
    if (!existingWithSuffix) {
      return newSlug;
    }
    
    suffix++;
    newSlug = `${cleanSlug}-${suffix}`;
  }
};

// Helper function to safely parse arrays from CSV
const parseArray = (value: any, delimiter: string = ','): string[] => {
  if (!value && value !== 0) return []; // Handle 0 as a valid value
  
  // If it's already an array, return it
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(item => item !== '');
  }
  
  // If it's a string, split it
  if (typeof value === 'string') {
    return value.split(delimiter).map((item: string) => item.trim()).filter(item => item !== '');
  }
  
  // For any other type, convert to string and split
  return String(value).split(delimiter).map((item: string) => item.trim()).filter(item => item !== '');
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Read Excel file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    const imported: string[] = [];
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        // -------------------------------
        // 1️⃣ Create/Update Organizer
        // -------------------------------
        const organizer = await prisma.user.upsert({
          where: { email: row.organizerEmail },
          update: {
            firstName: row.organizerName?.split(' ')[0] || 'Organizer',
            lastName: row.organizerName?.split(' ').slice(1).join(' ') || '',
            role: 'ORGANIZER',
            isVerified: true,
            isActive: true,
          },
          create: {
            id: new ObjectId().toString(),
            email: row.organizerEmail,
            firstName: row.organizerName?.split(' ')[0] || 'Organizer',
            lastName: row.organizerName?.split(' ').slice(1).join(' ') || '',
            role: 'ORGANIZER',
            isVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // -------------------------------
        // 2️⃣ Create/Update Venue (if provided)
        // -------------------------------
        let venueId: string | undefined;
        if (row.venueEmail || row.venueName) {
          // Fix venueZipCode - ensure it's a string
          const venueZipCode = row.venueZipCode ? String(row.venueZipCode) : undefined;
          const venuePhone = cleanPhone(row.venuePhone);
          
          // Use parseArray for venue arrays
          const amenities = parseArray(row.amenities);
          const venueImages = parseArray(row.venueImages);
          const venueVideos = parseArray(row.venueVideos);
          const floorPlans = parseArray(row.floorPlans);
          
          const venueUser = await prisma.user.upsert({
            where: { email: row.venueEmail || `${row.venueName?.toLowerCase().replace(/\s+/g, '-')}@venue.com` },
            update: {
              firstName: row.venueName || 'Venue',
              lastName: '',
              role: 'VENUE_MANAGER',
              venueName: row.venueName,
              venueAddress: row.venueAddress,
              venueCity: row.venueCity,
              venueState: row.venueState,
              venueCountry: row.venueCountry,
              venueZipCode: venueZipCode,
              venuePhone: venuePhone,
              venueEmail: row.venueEmail,
              venueWebsite: row.venueWebsite,
              maxCapacity: row.maxCapacity ? parseInt(row.maxCapacity) : undefined,
              totalHalls: row.totalHalls ? parseInt(row.totalHalls) : undefined,
              amenities: amenities,
              venueImages: venueImages,
              venueVideos: venueVideos,
              floorPlans: floorPlans,
              virtualTour: row.virtualTour,
              basePrice: row.basePrice ? parseFloat(row.basePrice) : undefined,
              venueCurrency: row.venueCurrency || 'USD',
              latitude: row.latitude ? parseFloat(row.latitude) : undefined,
              longitude: row.longitude ? parseFloat(row.longitude) : undefined,
            },
            create: {
              id: new ObjectId().toString(),
              email: row.venueEmail || `${row.venueName?.toLowerCase().replace(/\s+/g, '-')}@venue.com`,
              firstName: row.venueName || 'Venue',
              lastName: '',
              role: 'VENUE_MANAGER',
              isVerified: true,
              isActive: true,
              venueName: row.venueName,
              venueAddress: row.venueAddress,
              venueCity: row.venueCity,
              venueState: row.venueState,
              venueCountry: row.venueCountry,
              venueZipCode: venueZipCode,
              venuePhone: venuePhone,
              venueEmail: row.venueEmail,
              venueWebsite: row.venueWebsite,
              maxCapacity: row.maxCapacity ? parseInt(row.maxCapacity) : undefined,
              totalHalls: row.totalHalls ? parseInt(row.totalHalls) : undefined,
              amenities: amenities,
              venueImages: venueImages,
              venueVideos: venueVideos,
              floorPlans: floorPlans,
              virtualTour: row.virtualTour,
              basePrice: row.basePrice ? parseFloat(row.basePrice) : undefined,
              venueCurrency: row.venueCurrency || 'USD',
              latitude: row.latitude ? parseFloat(row.latitude) : undefined,
              longitude: row.longitude ? parseFloat(row.longitude) : undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          venueId = venueUser.id;
        }

        // -------------------------------
        // 3️⃣ Parse Event Data with FIXED DATE PARSING
        // -------------------------------
        // Use the parseDateString helper for all dates
        const startDate = parseDateString(row.startDate);
        const endDate = parseDateString(row.endDate);
        const registrationStart = row.registrationStart ? parseDateString(row.registrationStart) : startDate;
        const registrationEnd = row.registrationEnd ? parseDateString(row.registrationEnd) : endDate;

        // Validate dates aren't invalid
        const validateDate = (date: Date, fieldName: string): Date => {
          if (isNaN(date.getTime())) {
            console.warn(`Invalid ${fieldName}, using current date`);
            return new Date();
          }
          return date;
        };

        const safeStartDate = validateDate(startDate, 'startDate');
        const safeEndDate = validateDate(endDate, 'endDate');
        const safeRegistrationStart = validateDate(registrationStart, 'registrationStart');
        const safeRegistrationEnd = validateDate(registrationEnd, 'registrationEnd');

        // Parse arrays using helper function
        const categories = parseArray(row.category);
        const eventTypes = parseArray(row.eventType);
        const tags = parseArray(row.tags);
        const images = parseArray(row.images);
        const videos = parseArray(row.videos);
        const documents = parseArray(row.documents);

        // Parse booleans
        const isFeatured = row.isFeatured?.toString().toLowerCase() === 'true';
        const isVIP = row.isVIP?.toString().toLowerCase() === 'true';
        const isPublic = row.isPublic?.toString().toLowerCase() !== 'false';
        const requiresApproval = row.requiresApproval?.toString().toLowerCase() === 'true';
        const allowWaitlist = row.allowWaitlist?.toString().toLowerCase() === 'true';
        const isVirtual = row.isVirtual?.toString().toLowerCase() === 'true';

        // Parse numbers
        const maxAttendees = row.maxAttendees ? parseInt(row.maxAttendees) : undefined;

        // Status mapping
        const statusMap: Record<string, any> = {
          'DRAFT': 'DRAFT',
          'PUBLISHED': 'PUBLISHED',
          'CANCELLED': 'CANCELLED',
          'COMPLETED': 'COMPLETED',
        };
        const status = statusMap[row.status?.toUpperCase()] || 'DRAFT';

        // -------------------------------
        // 4️⃣ Generate Unique Slug
        // -------------------------------
        const uniqueSlug = await generateUniqueSlug(
          row.slug || row.eventTitle, 
          index
        );

        // -------------------------------
        // 5️⃣ Create Event
        // -------------------------------
        const event = await prisma.event.create({
          data: {
            id: new ObjectId().toString(),
            title: row.eventTitle,
            description: row.eventDescription || '',
            shortDescription: row.shortDescription,
            slug: uniqueSlug,  // Use the unique slug
            edition: row.edition,
            status,
            category: categories,
            eventType: eventTypes,
            tags,
            isFeatured,
            isVIP,
            startDate: safeStartDate,
            endDate: safeEndDate,
            registrationStart: safeRegistrationStart,
            registrationEnd: safeRegistrationEnd,
            timezone: row.timezone || 'UTC',
            venueId: venueId,
            isVirtual,
            virtualLink: row.virtualLink,
            maxAttendees,
            currentAttendees: 0,
            currency: row.currency || 'USD',
            images,
            videos,
            brochure: row.brochure,
            layoutPlan: row.layoutPlan,
            documents,
            bannerImage: row.bannerImage,
            thumbnailImage: row.thumbnailImage,
            isPublic,
            requiresApproval,
            allowWaitlist,
            refundPolicy: row.refundPolicy,
            metaTitle: row.metaTitle,
            metaDescription: row.metaDescription,
            organizerId: organizer.id,
            averageRating: 0,
            totalReviews: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // -------------------------------
        // 6️⃣ Create Event Categories (Many-to-Many)
        // -------------------------------
        if (row.eventCategoryNames) {
          const categoryNames = parseArray(row.eventCategoryNames);
          
          for (const categoryName of categoryNames) {
            try {
              const category = await prisma.eventCategory.upsert({
                where: { name: categoryName },
                update: {},
                create: {
                  id: new ObjectId().toString(),
                  name: categoryName,
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });

              await prisma.eventsOnCategories.create({
                data: {
                  id: new ObjectId().toString(),
                  eventId: event.id,
                  categoryId: category.id,
                  assignedAt: new Date(),
                },
              });
            } catch (error: any) {
              console.warn(`Error creating category ${categoryName}:`, error.message);
              // Skip category errors but continue
            }
          }
        }

        // -------------------------------
        // 7️⃣ Create Countries and Cities (Many-to-Many) - FIXED
        // -------------------------------
        if (row.countryNames) {
          const countryNames = parseArray(row.countryNames);
          
          for (const countryName of countryNames) {
            try {
              // First, try to find the country by name
              let country = await prisma.country.findFirst({
                where: { name: countryName }
              });
              
              if (!country) {
                // Generate a code for the country
                const generateCountryCode = (name: string): string => {
                  const countryMap: Record<string, string> = {
                    'United States': 'USA',
                    'United Kingdom': 'UK',
                    'Canada': 'CAN',
                    'Australia': 'AUS',
                    'India': 'IND',
                    'Germany': 'DEU',
                    'France': 'FRA',
                    'Japan': 'JPN',
                    'China': 'CHN',
                    'Brazil': 'BRA',
                  };
                  
                  if (countryMap[name]) {
                    return countryMap[name];
                  }
                  
                  const words = name.split(' ');
                  if (words.length === 1) {
                    return name.substring(0, 3).toUpperCase();
                  } else {
                    const code = words.map(word => word[0]).join('').toUpperCase();
                    return code.length >= 3 ? code.substring(0, 3) : code.padEnd(3, 'X');
                  }
                };

                const countryCode = generateCountryCode(countryName);
                
                // Check if code already exists
                const existingWithCode = await prisma.country.findFirst({
                  where: { code: countryCode }
                });
                
                if (existingWithCode) {
                  // If code exists, append something unique
                  const uniqueCode = `${countryCode}${Date.now().toString().slice(-3)}`;
                  country = await prisma.country.create({
                    data: {
                      id: new ObjectId().toString(),
                      name: countryName,
                      code: uniqueCode,
                      currency: 'USD',
                      timezone: 'UTC',
                      isActive: true,
                      isPermitted: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  });
                } else {
                  // Create with generated code
                  country = await prisma.country.create({
                    data: {
                      id: new ObjectId().toString(),
                      name: countryName,
                      code: countryCode,
                      currency: 'USD',
                      timezone: 'UTC',
                      isActive: true,
                      isPermitted: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  });
                }
              }
              
              // Check if relationship already exists
              const existingRelation = await prisma.eventsOnCountries.findFirst({
                where: {
                  eventId: event.id,
                  countryId: country.id
                }
              });
              
              if (!existingRelation) {
                await prisma.eventsOnCountries.create({
                  data: {
                    id: new ObjectId().toString(),
                    eventId: event.id,
                    countryId: country.id,
                    assignedAt: new Date(),
                  },
                });
              }
            } catch (error: any) {
              console.warn(`Error processing country ${countryName}:`, error.message);
              // Skip country errors but continue with event
            }
          }
        }

        if (row.cityNames) {
          const cityNames = parseArray(row.cityNames);
          
          for (const cityName of cityNames) {
            try {
              const city = await prisma.city.upsert({
                where: {
                  name_countryId: {
                    name: cityName,
                    countryId: (await prisma.country.findFirst({ where: { isActive: true } }))?.id || new ObjectId().toString(),
                  }
                },
                update: {},
                create: {
                  id: new ObjectId().toString(),
                  name: cityName,
                  countryId: (await prisma.country.findFirst({ where: { isActive: true } }))?.id || new ObjectId().toString(),
                  timezone: 'UTC',
                  isActive: true,
                  isPermitted: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });

              await prisma.eventsOnCities.create({
                data: {
                  id: new ObjectId().toString(),
                  eventId: event.id,
                  cityId: city.id,
                  assignedAt: new Date(),
                },
              });
            } catch (error: any) {
              console.warn(`Error creating city ${cityName}:`, error.message);
              // Skip city errors but continue
            }
          }
        }

        // -------------------------------
        // 8️⃣ Create Speakers
        // -------------------------------
        if (row.speakerEmails) {
          const speakerEmails = parseArray(row.speakerEmails, '|');
          const speakerNames = row.speakerNames ? parseArray(row.speakerNames, '|') : [];
          
          for (let i = 0; i < speakerEmails.length; i++) {
            if (speakerEmails[i]) {
              try {
                const speaker = await prisma.user.upsert({
                  where: { email: speakerEmails[i] },
                  update: {
                    firstName: speakerNames[i]?.split(' ')[0] || `Speaker ${i + 1}`,
                    lastName: speakerNames[i]?.split(' ').slice(1).join(' ') || '',
                    role: 'SPEAKER',
                  },
                  create: {
                    id: new ObjectId().toString(),
                    email: speakerEmails[i],
                    firstName: speakerNames[i]?.split(' ')[0] || `Speaker ${i + 1}`,
                    lastName: speakerNames[i]?.split(' ').slice(1).join(' ') || '',
                    role: 'SPEAKER',
                    isVerified: true,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });

                // Create a default speaker session
                await prisma.speakerSession.create({
                  data: {
                    id: new ObjectId().toString(),
                    eventId: event.id,
                    speakerId: speaker.id,
                    title: `Presentation by ${speaker.firstName}`,
                    description: 'Speaker presentation',
                    sessionType: 'PRESENTATION',
                    duration: 45,
                    startTime: safeStartDate,
                    endTime: new Date(safeStartDate.getTime() + 45 * 60000),
                    status: 'SCHEDULED',
                    averageRating: 0,
                    totalRatings: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });
              } catch (error: any) {
                console.warn(`Error creating speaker ${speakerEmails[i]}:`, error.message);
                // Skip speaker errors but continue
              }
            }
          }
        }

        // -------------------------------
        // 9️⃣ Create Exhibitors
        // -------------------------------
        if (row.exhibitorEmails) {
          const exhibitorEmails = parseArray(row.exhibitorEmails, '|');
          const exhibitorNames = row.exhibitorNames ? parseArray(row.exhibitorNames, '|') : [];
          
          for (let i = 0; i < exhibitorEmails.length; i++) {
            if (exhibitorEmails[i]) {
              try {
                const exhibitor = await prisma.user.upsert({
                  where: { email: exhibitorEmails[i] },
                  update: {
                    firstName: exhibitorNames[i] || `Exhibitor ${i + 1}`,
                    lastName: '',
                    role: 'EXHIBITOR',
                    company: exhibitorNames[i],
                  },
                  create: {
                    id: new ObjectId().toString(),
                    email: exhibitorEmails[i],
                    firstName: exhibitorNames[i] || `Exhibitor ${i + 1}`,
                    lastName: '',
                    role: 'EXHIBITOR',
                    company: exhibitorNames[i],
                    isVerified: true,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });

                // Create exhibition space if not exists
                let space = await prisma.exhibitionSpace.findFirst({
                  where: { eventId: event.id, name: 'Main Hall' }
                });

                if (!space) {
                  space = await prisma.exhibitionSpace.create({
                    data: {
                      id: new ObjectId().toString(),
                      eventId: event.id,
                      spaceType: 'RAW_SPACE',
                      name: 'Main Hall',
                      description: 'Main exhibition hall',
                      area: 1000,
                      basePrice: 5000,
                      currency: 'USD',
                      isAvailable: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  });
                }

                // Create exhibitor booth
                await prisma.exhibitorBooth.create({
                  data: {
                    id: new ObjectId().toString(),
                    eventId: event.id,
                    exhibitorId: exhibitor.id,
                    spaceId: space.id,
                    boothNumber: `B${i + 1}`,
                    companyName: exhibitorNames[i] || `Exhibitor ${i + 1}`,
                    description: 'Exhibitor booth',
                    totalCost: 5000,
                    currency: 'USD',
                    status: 'BOOKED',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });
              } catch (error: any) {
                console.warn(`Error creating exhibitor ${exhibitorEmails[i]}:`, error.message);
                // Skip exhibitor errors but continue
              }
            }
          }
        }

        imported.push(event.title);
        
      } catch (error: any) {
        errors.push(`Row ${index + 1}: ${error.message}`);
        console.error(`Error processing row ${index + 1}:`, error);
      }
    }

    const response: any = {
      message: `✅ Successfully imported ${imported.length} out of ${rows.length} events`,
      imported,
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json(
      { message: 'Import failed', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}