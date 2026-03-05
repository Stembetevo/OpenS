
import { SponsorPage } from './components/SponsorPage';
import './index.css';

function App() {
  // Get the current pathname
  const pathname = window.location.pathname;

  return (
    <div>
      {pathname === '/sponsor' ? (
        <SponsorPage />
      ) : (
        // Default to SponsorPage if on root or other paths
        <SponsorPage />
      )}
    </div>
  );
}

export default App;
