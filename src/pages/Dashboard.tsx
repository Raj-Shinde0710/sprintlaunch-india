import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FounderDashboard } from "@/components/dashboard/FounderDashboard";
import { BuilderDashboard } from "@/components/dashboard/BuilderDashboard";
import { BackerDashboard } from "@/components/dashboard/BackerDashboard";
import { Navbar } from "@/components/layout/Navbar";

export default function Dashboard() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-founder"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        {userRole === "founder" && <FounderDashboard />}
        {userRole === "builder" && <BuilderDashboard />}
        {userRole === "backer" && <BackerDashboard />}
        {!userRole && (
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
