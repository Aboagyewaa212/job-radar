import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { OnboardingGate } from './components/OnboardingGate'
import { CookieNotice } from './components/CookieNotice'
import { DashboardLayout } from './layouts/DashboardLayout'
import LandingPage from './pages/LandingPage'
import PolicyPage from './pages/PolicyPage'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import RadarPage from './pages/RadarPage'
import SavedPage from './pages/SavedPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ResumePage from './pages/ResumePage'
import PreferencesPage from './pages/PreferencesPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return <>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PolicyPage slug="privacy" />} />
      <Route path="/terms" element={<PolicyPage slug="terms" />} />
      <Route path="/cookies" element={<PolicyPage slug="cookies" />} />
      <Route path="/accessibility" element={<PolicyPage slug="accessibility" />} />
      <Route path="/refunds" element={<PolicyPage slug="refunds" />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <CookieNotice />
  </>
}
