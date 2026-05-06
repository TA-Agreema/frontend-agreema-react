import { Link, useLocation } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import type { SidebarMenuItemType } from "./sidebar-menu";

type NavMainProps = {
  items: SidebarMenuItemType[];
};

export function NavMain({ items }: NavMainProps) {
  const location = useLocation();

  const isActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            className={
              isActive(item.url)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : ""
            }>
            <Link
              to={item.url}
              className={`flex items-center gap-2 transition-colors duration-200 ${
                isActive(item.url)
                  ? "bg-emerald-100 text-emerald-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}>
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
          {item.items && item.items.length > 0 && (
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    className={
                      isActive(subItem.url)
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : ""
                    }>
                    <Link
                      to={subItem.url}
                      className={`transition-colors duration-200 ${
                        isActive(subItem.url)
                          ? "text-emerald-700 font-semibold"
                          : "text-gray-600 hover:text-emerald-600"
                      }`}>
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
