import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

// Class dasar yang sama untuk SEMUA menu item (parent maupun child)
const baseItemClass =
  "flex items-center gap-2 w-full rounded-md transition-colors duration-200 " +
  "hover:bg-gray-100 hover:text-gray-900 ";

const activeItemClass = "bg-gray-100 text-gray-900 font-semibold";

export function NavMain({ items }: NavMainProps) {
  const location = useLocation();

  const isActive = (url: string, exact?: boolean) => {
    if (exact) return location.pathname === url;
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  const isSubActive = (item: SidebarMenuItemType) =>
    item.items?.some((sub) => isActive(sub.url, sub.exact)) ?? false;

  return (
    <SidebarMenu>
      {items.map((item) =>
        item.items && item.items.length > 0 ? (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={isSubActive(item)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={`${baseItemClass} ${
                    isSubActive(item) ? activeItemClass : "text-gray-700"
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                  <span className="flex-1">{item.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => {
                    const active = isActive(subItem.url, subItem.exact);
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          className={`${baseItemClass} ${
                            active ? activeItemClass : "text-gray-700"
                          }`}
                        >
                          <Link to={subItem.url}>
                            {subItem.icon && (
                              <subItem.icon
                                className={`h-4 w-4 shrink-0 ${
                                  active ? "text-gray-900" : "text-gray-600"
                                }`}
                              />
                            )}
                            <span className={active ? "text-gray-900 font-semibold" : "text-gray-700"}>
                              {subItem.title}
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              className={`${baseItemClass} ${
                isActive(item.url, item.exact)
                  ? activeItemClass
                  : "text-gray-700"
              }`}
            >
              <Link to={item.url} className="flex items-center gap-2 w-full">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
  );
}
