import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, CreditCard, BookOpen, Megaphone, Activity, Settings, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Sessões", url: "/sessions", icon: MessageSquare },
  { title: "Assinaturas", url: "/subscriptions", icon: CreditCard },
  { title: "Documentação API", url: "/api-docs", icon: BookOpen },
];

const adminItems: NavItem[] = [
  { title: "Anúncios", url: "/announcements", icon: Megaphone, adminOnly: true },
  { title: "Monitoramento", url: "/monitoring", icon: Activity, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const isCollapsed = state === "collapsed";

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsSuperAdmin(userData?.role === "superadmin");
      }
    };
    checkAdmin();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "justify-center" : ""}>
            {isCollapsed ? "📊" : "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <>
            <Separator />
            <SidebarGroup>
              <SidebarGroupLabel className={isCollapsed ? "justify-center" : ""}>
                {isCollapsed ? "⚡" : "Administração"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={isCollapsed ? item.title : undefined}
                      >
                        <a href={item.url}>
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={isCollapsed ? "Sair" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!isCollapsed && userEmail && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {userEmail}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
