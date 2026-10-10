import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import RfqDetail from "./pages/RfqDetail";
import QuoteBuilder from "./pages/QuoteBuilder";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";

function Router() {
  const [location] = useLocation();
  if (location === "/login") return <Login />;

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/inbox" component={Inbox} />
        <Route path="/rfq/:id" component={RfqDetail} />
        <Route path="/quotes" component={QuoteBuilder} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
