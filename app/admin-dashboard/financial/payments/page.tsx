"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, DollarSign, CreditCard, TrendingUp, AlertCircle, Eye, RefreshCw } from "lucide-react"

interface Payment {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  currency: string
  status: string
  gateway: string
  gatewayTransactionId: string | null
  description: string | null
  refundAmount: number | null
  refundReason: string | null
  refundedAt: string | null
  createdAt: string
  updatedAt: string
  eventRegistrationsCount: number
  venueBookingsCount: number
}

interface Stats {
  totalPayments: number
  totalRevenue: number
  completedPayments: number
  pendingPayments: number
  failedPayments: number
  refundedAmount: number
}
// const payments: Payment[] = []
// const stats: Stats = {}
// const filteredPayments: Payment[] = []

export default function FinancialPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [gatewayFilter, setGatewayFilter] = useState("all")
  const [stats, setStats] = useState<Stats>({
    totalPayments: 0,
    totalRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refundedAmount: 0,
  })
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchQuery, statusFilter, gatewayFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/financial/payments")
      if (!response.ok) throw new Error("Failed to fetch payments")
      const data = await response.json()
      setPayments(data.payments)
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    if (searchQuery) {
      filtered = filtered.filter(
        (payment) =>
          payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.gatewayTransactionId?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter)
    }

    if (gatewayFilter !== "all") {
      filtered = filtered.filter((payment) => payment.gateway === gatewayFilter)
    }

    setFilteredPayments(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage all payment transactions and financial activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <p className="text-2xl font-bold">{stats.totalPayments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue, "USD")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-2xl font-bold">{stats.completedPayments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-2xl font-bold">{stats.pendingPayments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-2xl font-bold">{stats.failedPayments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Refunded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-600" />
              <p className="text-2xl font-bold">{formatCurrency(stats.refundedAmount, "USD")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>Search and filter all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by user, email, payment ID, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.userName}</p>
                          <p className="text-xs text-gray-500">{payment.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.gateway}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>{payment.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        {payment.eventRegistrationsCount > 0 && (
                          <Badge variant="outline" className="mr-1">
                            {payment.eventRegistrationsCount} Event{payment.eventRegistrationsCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {payment.venueBookingsCount > 0 && (
                          <Badge variant="outline">
                            {payment.venueBookingsCount} Booking{payment.venueBookingsCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(payment)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Complete information about this payment transaction</DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment ID</p>
                  <p className="font-mono text-sm mt-1">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={`${getStatusColor(selectedPayment.status)} mt-1`}>
                    {selectedPayment.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount</p>
                  <p className="text-lg font-bold mt-1">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Gateway</p>
                  <p className="capitalize mt-1">{selectedPayment.gateway}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">User Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Name</p>
                    <p className="mt-1">{selectedPayment.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="mt-1">{selectedPayment.userEmail}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Transaction Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gateway Transaction ID</p>
                    <p className="font-mono text-sm mt-1">{selectedPayment.gatewayTransactionId || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="mt-1">{selectedPayment.description || "No description"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created At</p>
                      <p className="text-sm mt-1">{formatDate(selectedPayment.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Updated At</p>
                      <p className="text-sm mt-1">{formatDate(selectedPayment.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPayment.refundAmount && (
                <div className="border-t pt-4 bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-purple-900">Refund Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Refund Amount</p>
                      <p className="font-bold mt-1">
                        {formatCurrency(selectedPayment.refundAmount, selectedPayment.currency)}
                      </p>
                    </div>
                    {selectedPayment.refundReason && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Refund Reason</p>
                        <p className="mt-1">{selectedPayment.refundReason}</p>
                      </div>
                    )}
                    {selectedPayment.refundedAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Refunded At</p>
                        <p className="text-sm mt-1">{formatDate(selectedPayment.refundedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Related Records</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Event Registrations</p>
                    <p className="text-2xl font-bold mt-1">{selectedPayment.eventRegistrationsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Venue Bookings</p>
                    <p className="text-2xl font-bold mt-1">{selectedPayment.venueBookingsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
