import { AppLayout } from "@/components/layout/AppLayout";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home } from "@/pages/home";
import { Search } from "@/pages/search";
import { Library } from "@/pages/library";
import { Artist } from "@/pages/artist";
import { Album } from "@/pages/album";
import { Playlist } from "@/pages/playlist";
import { Admin } from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { SignUpPrompt } from "@/components/auth/SignUpPrompt";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/library" component={Library} />
      <Route path="/artist/:id" component={Artist} />
      <Route path="/album/:id" component={Album} />
      <Route path="/playlist/:id" component={Playlist} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PlayerProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppLayout>
                <Router />
              </AppLayout>
              <InstallBanner />
              <SignUpPrompt />
            </WouterRouter>
          </PlayerProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
