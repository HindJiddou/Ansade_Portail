import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Categories from "./pages/Categories";
import Themes from "./pages/Themes";
import Tableaux from "./pages/Tableaux";
import Accueil from "./pages/Accueil";
import ChefDepartementDashboard from "./pages/ChefDepartementDashboard";
import MainLayout from "./layouts/MainLayout";
import TableauDetail from "./pages/TableauDetail";
import ChoixAnalyse from "./pages/ChoixAnalyse";
import AnalyseGraphique from "./pages/AnalyseGraphique";

import AnalyseCarte from "./pages/AnalyseCarte";
import SourcesPage from "./pages/SourcesPage";
import RecherchePage from "./pages/RecherchePage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import 'leaflet/dist/leaflet.css';


function App() {
  return (
    <Router>
      <Routes>
     
          <Route element={<MainLayout />}>
          <Route index element={<Accueil />} />
          <Route path="accueil" element={<Accueil />} />

        

          <Route path="chef-departement" element={
              <ProtectedRoute>
                <ChefDepartementDashboard />
              </ProtectedRoute>
            } />
          <Route path="categories" element={<Categories />} />
          <Route path="categories/:id" element={<Themes />} />
          <Route path="themes/:id" element={<Tableaux />} />
          <Route path="tableaux/:id" element={<TableauDetail />} />
          <Route path="/tableaux/:id/analyser" element={<ChoixAnalyse />} />
          <Route path="/tableaux/:id/analyser/graphique" element={<AnalyseGraphique />} />
          <Route path="/tableaux/:id/analyser/carte" element={<AnalyseCarte />} />
          <Route path="/sources" element={<SourcesPage />}/>,
          <Route path="/recherche" element={<RecherchePage />} />
          <Route path="/login" element={<LoginPage />} />



          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
