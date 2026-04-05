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
import BuilderWorkspace from "./pages/BuilderWorkspace";
import BackerInvestmentDashboard from "./pages/BackerInvestmentDashboard";
import EquityCalculator from "./pages/EquityCalculator";
import HowItWorksPage from "./pages/HowItWorksPage";
import SuccessStories from "./pages/SuccessStories";
import Tasks from "./pages/Tasks";
import Repository from "./pages/Repository";
import Timeline from "./pages/Timeline";
import AIMentorPage from "./pages/AIMentorPage";
import TrialRoom from "./pages/TrialRoom";
import SOPPlaybook from "./pages/SOPPlaybook";
import Automation from "./pages/Automation";
import Validation from "./pages/Validation";
import Finance from "./pages/Finance";
import InvestorTracker from "./pages/InvestorTracker";
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
            <Route path="/sprint/:id" element={<SprintWorkspace />} />
            <Route path="/builder-workspace/:id" element={<BuilderWorkspace />} />
            <Route path="/backer-dashboard/:id" element={<BackerInvestmentDashboard />} />
            <Route path="/equity-calculator" element={<EquityCalculator />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/repository" element={<Repository />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/ai-mentor" element={<AIMentorPage />} />
            <Route path="/trial-room" element={<TrialRoom />} />
            <Route path="/sop" element={<SOPPlaybook />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/validation" element={<Validation />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/investor-tracker" element={<InvestorTracker />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
