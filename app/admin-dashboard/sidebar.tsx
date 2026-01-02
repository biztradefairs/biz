"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SuperAdminManagement from "./superadminmanagement"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Mic,   
  MapPin,
  UserCircle,
  DollarSign,
  FileText,
  Megaphone,
  BarChart3,
  Plug,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ArrowLeft,
} from "lucide-react"

// Import all section components
import DashboardOverview from "./dashboard-overview"
import EventManagement from "./event-management"
import OrganizerManagement from "./organizer-management"
import ExhibitorManagement from "./exhibitor-management"
import SpeakerManagement from "./speaker-management"
import VenueManagement from "./venue-management"
// import ContentManagement from "./content-management"
import SystemSettings from "./system-settings"
import SubAdminManagement from "./subadmin-management"
import { CreateEventForm } from "./eventManagement/createEvent/create-event"
import { signOut } from "next-auth/react"
import CountriesManagement from "./countries-management"
import VisitorManagement from "./visitor-management"
import EventCategories from "./event-categories"
import ImportPage from "./import"
import MainHelpSupport from "./help-support/main-help-support"
import SupportTickets from "./help-support/support-tickets"
import SupportContacts from "./help-support/support-contacts"
import FAQManagement from "./help-support/faq-management"
import AdminNotes from "./help-support/support-notes"
import AddOrganizerForm from "./add-organizer-form"
import OrganizerConnectionsPage from "./organizer/connections"
import OrganizerPromotionsPage from "./organizer/promotions"
import OrganizerVenueBookingsPage from "./organizer/venue-bookings"
import OrganizerFeedbackPage from "./organizer/feedback"
import AddExhibitorForm from "./add-exhibitor-form"
import ExhibitorPromotionsPage from "./exhibitors/promotions"
import ExhibitorFollowersPage from "./exhibitors/followers"
import ExhibitorAppointmentsPage from "./exhibitors/appointments"
import ExhibitorFeedbackPage from "./exhibitors/feedback"
import AddSpeaker from "./AddSpeaker"
import SpeakerFollowersPage from "./speaker/followers"
import SpeakerFeedbackPage from "./speaker/feedback"
// import AddVenue from "./add-venue"
import AddVenueComponent from "./AddVenue"
import VenuesEventsPage from "./venue/events"
import VenueBookingsPage from "./venue/bookings"
import VisitorEventsPage from "./visitors/events"
import VisitorConnectionsPage from "./visitors/connections"
import VisitorAppointmentsPage from "./visitors/appointments"
import VenueFeedbackPage from "./venue/venue-feedback/page"
import EmailTemplates from "./email-templates"
import EmailCampaigns from "./email-notifications"
import PushNotifications from "./push-notifications"
import PushTemplates from "./push-templates"
import FinancialPaymentsPage from "./financial/payments/page"
import FinancialSubscriptionsPage from "./financial/subscriptions/page"
import FinancialInvoicesPage from "./financial/invoices/page"
import FinancialTransactionsPage from "./financial/transactions/page"
import PaymentIntegrationsPage from "./integrations/page"
import CommunicationIntegrationsPage from "./integrations/communication"
import TravelIntegrationsPage from "./integrations/travel"
import SettingsModulesPage from "./settings/modules"
import SettingsNotificationsPage from "./settings/notifications"
import SettingsSecurityPage from "./settings/security"
import SettingsLanguagePage from "./settings/languages"
import SettingsBackupPage from "./settings/backup"
import BannersPage from "./content/banners"
import PromotionPackagesPage from "./financial/packeges/page"
import PromotionPackagesPagee from "./financial/packeges/page"
import EventApprovalDashboard from "./EventApprovalDashboard"

interface AdminDashboardProps {
  userRole: "SUPER_ADMIN" | "SUB_ADMIN"
  userPermissions: string[]
}

const MENU_PERMISSIONS = {
  dashboard: "dashboard-overview",
  events: "events",
  "events-all": "events-all",
  "events-create": "events-create",
  "events-categories": "events-categories",
  "events-approvals": "events-approvals",
  "bulk-data": "bulk-data",
  organizers: "organizers",
  "organizers-all": "organizers-all",
  "organizers-add": "organizers-add",
  "organizers-connections": "organizers-connections",
  promotions: "promotions",
  "organizers-bookings": "organizers-bookings",
  "organizers-feedback": "organizers-feedback",
  exhibitors: "exhibitors",
  "exhibitors-all": "exhibitors-all",
  "exhibitors-add": "exhibitors-add",
  "exhibitors-promotions": "exhibitors-promotions",
  "exhibitors-followers": "exhibitors-followers",
  "exhibitors-appointments": "exhibitors-appointments",
  "exhibitors-feedback": "exhibitors-feedback",
  speakers: "speakers",
  "speakers-all": "speakers-all",
  "speakers-add": "speakers-add",
  "speakers-followers": "speakers-followers",
  "speakers-appointments": "speakers-appointments",
  "speakers-feedback": "speakers-feedback",
  venues: "venues",
  "venues-all": "venues-all",
  "venues-add": "venues-add",
  "venues-events": "venues-events",
  "venues-bookings": "venues-bookings",
  "venues-feedback": "venues-feedback",
  visitors: "visitors",
  "visitors-all": "visitors-all",
  "visitors-events": "visitors-events",
  "visitors-connections": "visitors-connections",
  "visitors-appointments": "visitors-appointments",
  financial: "financial",
  "financial-payments": "financial-payments",
  "financial-subscriptions": "financial-subscription",
  "financial-invoices": "financial-invoices",
  "financial-transactions": "financial-transactions",
  content: "content",
  "content-news": "content-news",
  "content-blog": "content-blog",
  "content-banners": "content-banners",
  "content-featured": "content-featured",
  "content-media": "content-media",
  marketing: "marketing",
  "marketing-email": "marketing-email",
  "marketing-notifications": "marketing-notifications",
  "marketing-traffic": "marketing-traffic",
  "marketing-seo": "marketing-seo",
  reports: "reports",
  "reports-events": "reports-events",
  "reports-engagement": "reports-engagement",
  "reports-revenue": "reports-revenue",
  "reports-system": "reports-system",
  integrations: "integrations",
  "integrations-payment": "integrations-payment",
  "integrations-communication": "integrations-communication",
  "integrations-calendar": "integrations-calendar",
  "integrations-travel": "integrations-travel",
  roles: "roles",
  "roles-superadmin": "roles-superadmin",
  "roles-subadmins": "roles-subadmins",
  settings: "settings",
  "settings-modules": "settings-modules",
  "settings-notifications": "settings-notifications",
  "settings-security": "settings-security",
  "settings-language": "settings-language",
  "settings-backup": "settings-backup",
  support: "support",
  "support-tickets": "support-tickets",
  "support-contacts": "support-contacts",
  "support-notes": "support-notes",
  "support-faq": "support-faq",
  // Add permissions for locations
  locations: "locations",
  countries: "countries",
  cities: "cities",
}

export default function AdminDashboard({ userRole, userPermissions }: AdminDashboardProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [activeSubSection, setActiveSubSection] = useState("")
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set(["dashboard"]))

  console.log("[v0] User Role:", userRole)
  console.log("[v0] User Permissions:", userPermissions)

  const hasPermission = (itemId: string): boolean => {
    // Super admin has access to everything
    if (userRole === "SUPER_ADMIN") return true

    // Sub admin needs specific permission
    const requiredPermission = MENU_PERMISSIONS[itemId as keyof typeof MENU_PERMISSIONS]
    if (!requiredPermission) return false

    return userPermissions.includes(requiredPermission)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/sign-in" })
  }

  const toggleMenu = (menuId: string) => {
    const newOpenMenus = new Set(openMenus)
    if (newOpenMenus.has(menuId)) {
      newOpenMenus.delete(menuId)
    } else {
      newOpenMenus.add(menuId)
    }
    setOpenMenus(newOpenMenus)
  }

  const sidebarItems = [
    {
      title: "Dashboard Overview",
      icon: LayoutDashboard,
      id: "dashboard",
    },
    {
      title: "Events",
      icon: Calendar,
      id: "events",
      subItems: [
        { title: "All Events", id: "events-all" },
        { title: "Create New Event", id: "events-create" },
        { title: "Event Categories", id: "events-categories" },
        { title: "Event Approvals", id: "events-approvals" }, 
        { title: "Bulk Data", id: "bulk-data" },
      ],
    },
    {
      title: "Locations",
      icon: MapPin,
      id: "locations",
      subItems: [
        { title: "Countries", id: "countries" },
        // { title: "Cities", id: "cities" },
      ],
    },
    {
      title: "Organizer",
      icon: Users,
      id: "organizers",
      subItems: [
        { title: "All Organizers", id: "organizers-all" },
        { title: "Add Organizer", id: "organizers-add" },
        { title: "Followers", id: "organizers-connections" },
        { title: "Promotions", id: "promotions" },
        { title: "Venue Bookings", id: "organizers-bookings" },
        { title: "Event Feedback", id: "organizers-feedback" },
      ],
    },
    {
      title: "Exhibitor",
      icon: Building2,
      id: "exhibitors",
      subItems: [
        { title: "All Exhibitors", id: "exhibitors-all" },
        { title: "Add Exhibitor", id: "exhibitors-add" },
        { title: "Promotions", id: "exhibitors-promotions" },
        // { title: "Followers", id: "exhibitors-followers" },
        { title: "Appointments", id: "exhibitors-appointments" },
        { title: "Feedback", id: "exhibitors-feedback" },
      ],
    },
    {
      title: "Speaker",
      icon: Mic,
      id: "speakers",
      subItems: [
        { title: "All Speakers", id: "speakers-all" },
        { title: "Add Speaker", id: "speakers-add" },
        { title: "Followers", id: "speakers-followers" },
        // { title: "Appointments", id: "speakers-appointments" },
        { title: "Feedback", id: "speakers-feedback" },
      ],
    },
    {
      title: "Venue",
      icon: MapPin,
      id: "venues",
      subItems: [
        { title: "All Venues", id: "venues-all" },
        { title: "Add Venue", id: "venues-add" },
        { title: "Events by Venue", id: "venues-events" },
        { title: "Booking Enquiries", id: "venues-bookings" },
        { title: "Feedback", id: "venues-feedback" },
      ],
    },
    {
      title: "Visitor",
      icon: UserCircle,
      id: "visitors",
      subItems: [
        { title: "All visitors", id: "visitors-all" },
        { title: "Events by Visitor", id: "visitors-events" },
        { title: "Connections", id: "visitors-connections" },
        { title: "Appointments", id: "visitors-appointments" },
      ],
    },
    {
      title: "Financial & Transactions",
      icon: DollarSign,
      id: "financial",
      subItems: [
        { title: "Payments Dashboard", id: "financial-payments" },
        { title: "Subscriptions & Plans", id: "financial-subscriptions" },
        { title: "Invoices & Receipts", id: "financial-invoices" },
        { title: "promotions", id: "admin-promotions" },
        { title: "Transaction History", id: "financial-transactions" },
      ],
    },
    {
      title: "Content",
      icon: FileText,
      id: "content",
      subItems: [
        { title: "News & Announcements", id: "content-news" },
        { title: "Blog & Articles", id: "content-blog" },
        { title: "Banner & Ads Manager", id: "content-banners" },
        { title: "Featured Events", id: "content-featured" },
        { title: "Media Library", id: "content-media" },
      ],
    },
    {
      title: "Marketing & Communication",
      icon: Megaphone,
      id: "marketing",
      subItems: [
        { title: "Email Campaigns", id: "marketing-email" },
        { title: "Push Notifications", id: "marketing-notifications" },
        { title: "Email Templates", id: "template-email" },
        { title: "Push Templates", id: "template-notifications" },
        { title: "Traffic Analytics", id: "marketing-traffic" },
        { title: "SEO & Keywords", id: "marketing-seo" },
      ],
    },

    {
      title: "Reports & Analytics",
      icon: BarChart3,
      id: "reports",
      subItems: [
        { title: "Event Performance", id: "reports-events" },
        { title: "User Engagement", id: "reports-engagement" },
        { title: "Revenue Reports", id: "reports-revenue" },
        { title: "System Health", id: "reports-system" },
      ],
    },
    {
      title: "Integrations",
      icon: Plug,
      id: "integrations",
      subItems: [
        { title: "Payment Gateways", id: "integrations-payment" },
        { title: "Email/SMS Providers", id: "integrations-communication" },
        // { title: "Calendar & API", id: "integrations-calendar" },
        { title: "Hotel & Travel Partners", id: "integrations-travel" },
      ],
    },
    {
      title: "User Roles & Permissions",
      icon: Shield,
      id: "roles",
      subItems: [
        { title: "Super Admin", id: "roles-superadmin" },
        { title: "Sub Admins", id: "roles-subadmins" },
      ],
    },
    {
      title: "Settings & Configuration",
      icon: Settings,
      id: "settings",
      subItems: [
        { title: "Module Management", id: "settings-modules" },
        { title: "Notifications", id: "settings-notifications" },
        { title: "Security", id: "settings-security" },
        { title: "Language & Localization", id: "settings-language" },
        { title: "Backup & Restore", id: "settings-backup" },
      ],
    },
    {
      title: "Help & Support",
      icon: HelpCircle,
      id: "support",
      subItems: [
        { title: "Support Tickets", id: "support-tickets" },
        { title: "Contact Logs", id: "support-contacts" },
        { title: "FAQ Management", id: "support-faq" },
        { title: "Admin Notes", id: "support-notes" },
      ],
    },
  ]

  const filteredSidebarItems = sidebarItems
    .map((item) => {
      // For items with subitems, check if user has permission for any child
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter((subItem) => hasPermission(subItem.id))

        // If no subitems are accessible, hide the parent
        if (filteredSubItems.length === 0) return null

        return { ...item, subItems: filteredSubItems }
      }

      // For items without subitems, check direct permission
      if (!hasPermission(item.id)) return null

      return item
    })
    .filter(Boolean) as typeof sidebarItems

  const renderContent = () => {
    const section = activeSection
    const subSection = activeSubSection

    console.log("Active Section:", section)
    console.log("Active Sub Section:", subSection)

    // Handle sub-sections first
    if (subSection) {
      switch (subSection) {
        // Roles
        case "roles-superadmin":
          return <SuperAdminManagement />
        case "roles-subadmins":
          return <SubAdminManagement />

        // Events
        case "events-create":
          return <CreateEventForm />
        case "events-all":
          return <EventManagement />
        case "events-categories":
          return <EventCategories />
        case "bulk-data":
          return <ImportPage />

        // Organizers
        case "organizers-add":
          return <AddOrganizerForm />
        case "organizers-connections":
          return <OrganizerConnectionsPage />
        case "promotions":
          return <OrganizerPromotionsPage />
        case "organizers-bookings":
          return <OrganizerVenueBookingsPage />
        case "organizers-feedback":
          return <OrganizerFeedbackPage />

        // Exhibitors
        case "exhibitors-add":
          return <AddExhibitorForm />
        case "exhibitors-promotions":
          return <ExhibitorPromotionsPage />
        case "exhibitors-followers":
          return <ExhibitorFollowersPage />
        case "exhibitors-appointments":
          return <ExhibitorAppointmentsPage />
        case "exhibitors-feedback":
          return <ExhibitorFeedbackPage />

        // Speakers
        case "speakers-add":
          return <AddSpeaker />
        case "speakers-followers":
          return <SpeakerFollowersPage />
        case "speakers-feedback":
          return <SpeakerFeedbackPage />

        // Venues
        case "venues-add":
          return <AddVenueComponent />
        case "venues-events":
          return <VenuesEventsPage />
        case "venues-bookings":
          return <VenueBookingsPage />
        case "venues-feedback":
          return <VenueFeedbackPage />
        case "events-approvals":
  return <EventApprovalDashboard />

        // Visitors
        case "visitors-events":
          return <VisitorEventsPage />
        case "visitors-connections":
          return <VisitorConnectionsPage />
        case "visitors-appointments":
          return <VisitorAppointmentsPage />

        // Financial
        case "financial-payments":
          return <div>Page will updated-----soon</div>//<FinancialPaymentsPage />
        case "financial-subscriptions":
          return <div>Page will updated-----soon</div>//<FinancialSubscriptionsPage />
        case "financial-invoices":
          return <div>Page will updated-----soon</div>//<FinancialInvoicesPage />
        case "financial-transactions":
          return <div>Page will updated-----soon</div>//<FinancialTransactionsPage />

        case "admin-promotions":
          return <PromotionPackagesPage />

      

        // Help & Support sub-sections
        case "support-tickets":
          return <SupportTickets />
        case "support-contacts":
          return <SupportContacts />
        case "support-faq":
          return <FAQManagement />
        case "support-notes":
          return <AdminNotes />
        

          case "marketing-email":
            return <EmailCampaigns />

          case "template-email":
            return < EmailTemplates />

          case "marketing-notifications":
            return <PushNotifications />

          case "template-notifications" :
            return <PushTemplates />


            case "integrations-payment":
              return <PaymentIntegrationsPage />

            case "integrations-communication":
              return <CommunicationIntegrationsPage />

            case "integrations-travel":
              return <TravelIntegrationsPage />


        //settings
        case "settings-modules":
          return <SettingsModulesPage />

        case "settings-notifications":
          return <SettingsNotificationsPage />

        case "settings-security":
          return <SettingsSecurityPage />

        case "settings-language":
          return <SettingsLanguagePage />

        case "settings-backup":
          return <SettingsBackupPage />


      //content
      case "content-banners":
        return <BannersPage />

        default:
          console.log("Unknown sub-section:", subSection)
          break
      }
    }

    // Handle main sections
    switch (section) {
      case "dashboard":
        return <DashboardOverview />
      case "events":
        return <EventManagement />
      case "locations":
        return <CountriesManagement /> 
      case "organizers":
        return <OrganizerManagement />
      case "exhibitors":
        return <ExhibitorManagement />
      case "speakers":
        return <SpeakerManagement />
      case "venues":
        return <VenueManagement />
      case "visitors":
        return <VisitorManagement />
      case "financial":
        return <div>Financial Management - Coming Soon</div>
      case "content":
        return <div>Content Management - Coming Soon</div>//<ContentManagement />
      case "marketing":
        return <div>Marketing Management - Coming Soon</div>
      case "reports":
        return <div>Reports & Analytics - Coming Soon</div>
      case "integrations":
        return <div>Integrations Management - Coming Soon</div>
      case "roles":
        return <SuperAdminManagement />
      case "settings":
        return <SystemSettings />
      case "support":
        return <MainHelpSupport />
      default:
        return <DashboardOverview />
    }
  }

  const handleSectionClick = (id: string) => {
    console.log("Main section clicked:", id)
    setActiveSection(id)
    setActiveSubSection("")
  }

  const handleSubSectionClick = (parentId: string, subId: string) => {
    console.log("Sub-section clicked:", parentId, subId)
    setActiveSection(parentId)
    setActiveSubSection(subId)
  }

  const isMenuOpen = (menuId: string) => openMenus.has(menuId)
  const isActive = (id: string) => activeSection === id
  const isSubActive = (id: string) => activeSubSection === id

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 text-sm flex flex-col">
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              {filteredSidebarItems.map((item) => (
                <div key={item.id} className="mb-1">
                  {item.subItems ? (
                    <div className="rounded-lg">
                      <button
                        onClick={() => toggleMenu(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isActive(item.id)
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isMenuOpen(item.id) ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isMenuOpen(item.id) && (
                        <div className="mt-1 ml-4 space-y-1 border-l border-gray-200 pl-2">
                          {item.subItems.map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => handleSubSectionClick(item.id, subItem.id)}
                              className={`w-full text-left p-2 rounded-lg transition-colors ${
                                isSubActive(subItem.id)
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <span className="text-sm">{subItem.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSectionClick(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive(item.id)
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  )}
                </div>
              ))}

              {/* Logout Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{renderContent()}</main>
      </div>
    </div>
  )
}