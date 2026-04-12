import {
  LayoutDashboard,
  Lightbulb,
  Zap,
  Wallet,
  LogOut,
  Rocket,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Ideas", url: "/discover", icon: Lightbulb },
  { title: "Sprints", url: "/dashboard", icon: Zap, hash: "#sprints" },
  { title: "Backers Workspace", url: "/backers", icon: Wallet },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-founder/10 group-hover:scale-110 transition-transform">
            <Rocket className="w-5 h-5 text-founder" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg text-foreground">
              FounderOS
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      activeClassName="bg-founder/10 text-founder font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-founder/10 flex items-center justify-center text-xs font-bold text-founder">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || user.email?.split("@")[0]}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Log Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
