import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContentPage from './pages/ContentPage';
import ScreensPage from './pages/ScreensPage';
import PlaylistsPage from './pages/PlaylistsPage';
import SettingsPage from './pages/SettingsPage';

// Layout
import Layout from './components/Layout/Layout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="screens" element={<ScreensPage />} />
            <Route path="playlists" element={<PlaylistsPage />} />
	    <Route path="/settings" element={<SettingsPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      
      <Toaster position="top-right" />
    </>
  );
}

export default App;
