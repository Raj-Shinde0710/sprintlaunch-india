import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import IdeaForm from "./pages/IdeaForm";
import IdeaDetail from "./pages/IdeaDetail";
import SprintWorkspace from "./pages/SprintWorkspace";
import DepartmentSelection from "./pages/DepartmentSelection";
import BuilderWorkspace from "./pages/BuilderWorkspace";
import BackerInvestmentDashboard from "./pages/BackerInvestmentDashboard";
import EquityCalculator from "./pages/EquityCalculator";
import HowItWorksPage from "./pages/HowItWorksPage";
import SuccessStories from "./pages/SuccessStories";
import BackersWorkspace from "./pages/BackersWorkspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ideas/new" element={<IdeaForm />} />
            <Route path="/idea/:id" element={<IdeaDetail />} />
            <Route path="/idea/:id/edit" element={<IdeaForm />} />
            <Route path="/sprint/:id" element={<DepartmentSelection />} />
            <Route path="/sprint/:id/department/:departmentId" element={<SprintWorkspace />} />
            <Route path="/builder-workspace/:id" element={<BuilderWorkspace />} />
            <Route path="/backer-dashboard/:id" element={<BackerInvestmentDashboard />} />
            <Route path="/backers" element={<BackersWorkspace />} />
            <Route path="/equity-calculator" element={<EquityCalculator />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
