import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { ComparePage } from "./pages/ComparePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { RepresentativeProfilePage } from "./pages/RepresentativeProfilePage";
import { StateAnalyticsPage } from "./pages/StateAnalyticsPage";
import { FloatingAIChat } from "./components/ui/FloatingAIChat";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/states" element={<StateAnalyticsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/representative/:id" element={<RepresentativeProfilePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <FloatingAIChat />
    </BrowserRouter>
  );
}
