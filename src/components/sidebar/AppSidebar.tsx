import * as React from "react";
import { Link } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { NavMain } from "./NavMain";
import { NavUser } from "./NavUser";
import { sidebarMenuItems, type SidebarMenuItemType } from "./sidebar-menu";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, permissions, roles } = useAuth();

  // Filter menu items based on user's permissions and roles
  const filteredMenuItems = React.useMemo(() => {
    return sidebarMenuItems.filter((item) => {
      // If no permissions or roles are specified, show the item
      if (!item.permissions && !item.roles) {
        return true;
      }

      // Check if user has any of the required permissions
      if (item.permissions && item.permissions.length > 0) {
        const hasPermission = item.permissions.some((permission) =>
          permissions.includes(permission),
        );
        if (hasPermission) {
          // Filter sub-items based on permissions
          if (item.items) {
            item.items = item.items.filter((subItem) => {
              if (!subItem.permissions) return true;
              return subItem.permissions.some((permission) =>
                permissions.includes(permission),
              );
            });
          }
          return true;
        }
      }

      // Check if user has any of the required roles
      if (item.roles && item.roles.length > 0) {
        const hasRole = item.roles.some((role) => roles.includes(role));
        if (hasRole) return true;
      }

      return false;
    }) as SidebarMenuItemType[];
  }, [permissions, roles]);

  const userData = {
    name: user?.user?.name || "User",
    email: user?.user?.email || "",
    avatar: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-15">
              <Link
                to="/dashboard"
                className="flex items-center justify-center w-full">
                <img
                  src="/Agreema.svg"
                  alt="Agreema Logo"
                  className="h-11.5 w-auto shrink-0"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredMenuItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
