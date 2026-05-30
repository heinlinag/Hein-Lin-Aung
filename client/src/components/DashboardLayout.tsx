import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { ClipboardList, History, Settings2, Menu } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: ClipboardList, label: "Submit Order", path: "/submit-order" },
  { icon: History, label: "Stock History", path: "/stock-history" },
  { icon: Settings2, label: "Admin", path: "/admin" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-border"
          disableTransition={isResizing}
        >
          {/* Header */}
          <SidebarHeader className="h-14 justify-center border-b border-border px-4">
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-secondary transition-colors focus:outline-none"
                aria-label="Toggle navigation"
              >
                <Menu className="h-4 w-4 text-foreground" />
              </button>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="font-serif text-sm font-semibold text-foreground truncate">
                    Stock
                  </p>
                  <p className="editorial-label text-xs truncate">
                    Management
                  </p>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Nav */}
          <SidebarContent className="gap-0 pt-3">
            {!isCollapsed && (
              <p className="editorial-label px-4 pb-2 text-xs">
                Pages
              </p>
            )}
            <SidebarMenu className="px-2 gap-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-9 transition-colors sidebar-nav-item"
                      style={{
                        color: isActive ? "var(--primary)" : "var(--foreground)",
                        background: isActive ? "var(--accent)" : "transparent",
                      }}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-3 border-t border-border text-center">
              <p className="editorial-label text-xs">
                Corrugated Board
              </p>
              <p className="editorial-label text-xs">
                Management
              </p>
            </div>
          )}
        </Sidebar>

        {/* Resize handle (desktop only) */}
        {!isMobile && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors hover:bg-primary/20"
            onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
            style={{ zIndex: 50 }}
          />
        )}
      </div>

      <SidebarInset>
        {/* Mobile header */}
        {isMobile && (
          <MobileHeader activeLabel={activeMenuItem?.label} />
        )}
        {/* Main content */}
        <main className="flex-1 bg-background">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

function MobileHeader({ activeLabel }: { activeLabel?: string }) {
  const { worker } = useAuth();
  return (
    <div className="flex border-b border-border h-14 items-center justify-between bg-background px-4 sticky top-0 z-40">
      <SidebarTrigger className="h-8 w-8 rounded" />
      <span className="font-serif text-sm font-semibold text-foreground">
        {activeLabel ?? "Stock Management"}
      </span>
      {worker ? (
        <NotificationBell workerID={worker.workerID} workerName={worker.name} />
      ) : (
        <div className="w-8" />
      )}
    </div>
  );
}
