import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, Calendar, CreditCard, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Validate that a URL is safe for navigation (internal links only)
const isInternalLink = (url: string): boolean => {
  // Allow relative paths starting with /
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }
  // Allow same-origin URLs
  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.origin === window.location.origin;
  } catch {
    return false;
  }
};

const API_BASE_URL = "https://homecareservice.runasp.net/api";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: "appointment" | "payment" | "report" | "system" | "reminder";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/Notifications/GetAll`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    // Return empty array if endpoint doesn't exist yet
    return [];
  }
  return response.json();
};

const markAsRead = async (id: number): Promise<void> => {
  const token = getAuthToken();
  await fetch(`${API_BASE_URL}/Notifications/MarkAsRead/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const markAllAsRead = async (): Promise<void> => {
  const token = getAuthToken();
  await fetch(`${API_BASE_URL}/Notifications/MarkAllAsRead`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const deleteNotification = async (id: number): Promise<void> => {
  const token = getAuthToken();
  await fetch(`${API_BASE_URL}/Notifications/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "appointment":
      return <Calendar className="h-4 w-4 text-primary" />;
    case "payment":
      return <CreditCard className="h-4 w-4 text-green-500" />;
    case "report":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "reminder":
      return <Bell className="h-4 w-4 text-orange-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      // Security: Only allow internal links to prevent open redirect attacks
      if (isInternalLink(notification.link)) {
        navigate(notification.link);
      } else {
        // Log potential security issue without exposing to user
        console.warn('Blocked external redirect attempt from notification');
        toast.error('Invalid notification link');
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
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
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                    !notification.isRead && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm line-clamp-1",
                        !notification.isRead && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notification.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-xs h-8"
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
