import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Home } from "@/pages/Home";
import { ArticleList } from "@/pages/articles/ArticleList";
import { ArticleDetail } from "@/pages/articles/ArticleDetail";
import { CategoryList } from "@/pages/categories/CategoryList";
import { CategoryDetail } from "@/pages/categories/CategoryDetail";
import { KnowledgeHub } from "@/pages/knowledge/KnowledgeHub";
import { SearchResults } from "@/pages/search/SearchResults";
import { ConsultationsList } from "@/pages/consultations/ConsultationsList";
import { BookConsultation } from "@/pages/consultations/BookConsultation";
import { UserDashboard } from "@/pages/dashboard/UserDashboard";
import { About } from "@/pages/about/About";
import { Contact } from "@/pages/contact/Contact";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/articles" component={ArticleList} />
      <Route path="/articles/:slug" component={ArticleDetail} />
      <Route path="/categories" component={CategoryList} />
      <Route path="/categories/:slug" component={CategoryDetail} />
      <Route path="/knowledge" component={KnowledgeHub} />
      <Route path="/search" component={SearchResults} />
      <Route path="/consultations" component={ConsultationsList} />
      <Route path="/consultations/book" component={BookConsultation} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
