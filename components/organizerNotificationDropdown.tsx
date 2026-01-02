// components/UserNotificationsDropdown.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, AlertCircle, CheckCircle, XCircle, Eye, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    eventId?: string;
    eventTitle?: string;
    reason?: string;
    status?: string;
  };
}

export function UserNotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      fetchNotifications();
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [open]);

  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
  };

  // Fetch user notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/notifications?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EVENT_APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'EVENT_REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'EVENT_PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'EVENT_CREATED':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'TICKET_SOLD':
        return <Check className="h-4 w-4 text-purple-600" />;
      case 'REVIEW_RECEIVED':
        return <Check className="h-4 w-4 text-indigo-600" />;
      case 'LEAD_RECEIVED':
        return <Check className="h-4 w-4 text-teal-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'EVENT_APPROVED':
        return "border-l-green-500 bg-green-50 hover:bg-green-100";
      case 'EVENT_REJECTED':
        return "border-l-red-500 bg-red-50 hover:bg-red-100";
      case 'EVENT_PENDING':
        return "border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100";
      case 'EVENT_CREATED':
        return "border-l-blue-500 bg-blue-50 hover:bg-blue-100";
      case 'TICKET_SOLD':
        return "border-l-purple-500 bg-purple-50 hover:bg-purple-100";
      default:
        return "border-l-gray-500 bg-gray-50 hover:bg-gray-100";
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.metadata?.eventId) {
      router.push(`/organizer/events/${notification.metadata.eventId}`);
    } else if (notification.type === 'TICKET_SOLD') {
      router.push('/organizer/sales');
    } else if (notification.type === 'REVIEW_RECEIVED') {
      router.push('/organizer/reviews');
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-96 max-h-[80vh]" align="end" forceMount>
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
          
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 py-1 text-xs" 
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="px-2 py-4 text-center">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No notifications
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {notifications.map((notification) => (
              <div key={notification.id}>
                <DropdownMenuItem
                  className={cn(
                    "flex flex-col items-start p-3 cursor-pointer",
                    !notification.isRead && getNotificationColor(notification.type),
                    notification.isRead && "opacity-75"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex w-full justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium text-sm truncate">{notification.title}</span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                      )}
                    </div>

                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                  
                  {/* Show metadata if available */}
                  {notification.metadata && (
                    <div className="text-xs text-gray-500 mt-1">
                      {notification.metadata.eventTitle && (
                        <p className="font-medium">Event: {notification.metadata.eventTitle}</p>
                      )}
                      {notification.metadata.reason && (
                        <p className="mt-1 text-red-600">Reason: {notification.metadata.reason}</p>
                      )}
                      {notification.metadata.status && (
                        <p className="mt-1">Status: {notification.metadata.status}</p>
                      )}
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}