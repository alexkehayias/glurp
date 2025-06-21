import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen">
        <div className="flex flex-1 min-h-0 min-w-0">
          <AppSidebar className="h-full" />
          <main className="flex-1 min-h-0 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
