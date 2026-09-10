import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { OnboardingGate } from './components/OnboardingGate'
import { DashboardLayout } from './layouts/DashboardLayout'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import RadarPage from './pages/RadarPage'
import SavedPage from './pages/SavedPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ResumePage from './pages/ResumePage'
import PreferencesPage from './pages/PreferencesPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
    <Route element={<ProtectedRoute><OnboardingGate><DashboardLayout /></OnboardingGate></ProtectedRoute>}>
      <Route path="/radar" element={<RadarPage />} />
      <Route path="/saved" element={<SavedPage />} />
      <Route path="/applications" element={<ApplicationsPage />} />
      <Route path="/resume" element={<ResumePage />} />
      <Route path="/preferences" element={<PreferencesPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/radar" replace />} />
  </Routes>
}
