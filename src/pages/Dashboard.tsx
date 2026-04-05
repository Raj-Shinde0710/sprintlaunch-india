import { useAuth } from "@/contexts/AuthContext";
import { FounderDashboard } from "@/components/dashboard/FounderDashboard";
import { BuilderDashboard } from "@/components/dashboard/BuilderDashboard";
import { BackerDashboard } from "@/components/dashboard/BackerDashboard";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Dashboard() {
  const { userRole } = useAuth();

  return (
    <AppLayout>
      <div className="p-6">
        {userRole === "founder" && <FounderDashboard />}
        {userRole === "builder" && <BuilderDashboard />}
        {userRole === "backer" && <BackerDashboard />}
        {!userRole && (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
