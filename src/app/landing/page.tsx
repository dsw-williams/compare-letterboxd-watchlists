import LandingPage from '@/components/LandingPage';

// Dev preview route — always shows the landing page regardless of data state.
// In production the landing page only appears on `/` when no data exists.
export default function LandingPreviewPage() {
  return <LandingPage />;
}
