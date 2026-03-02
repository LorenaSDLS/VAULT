import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import Home from './pages/Home';
import CreatePool from './pages/CreateVault';
import VaultDetail from './pages/VaultDetail';

// Leemos la llave aquí adentro
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  if (!PUBLISHABLE_KEY) {
    return <div className="p-10 bg-red-900 text-white">Falta la llave VITE_CLERK_PUBLISHABLE_KEY en el .env</div>;
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white">
          {/* Barra de Navegación */}
          <nav className="p-4 flex justify-between items-center border-b border-gray-800">
            <h1 className="text-xl font-bold text-yellow-500">VAULT</h1>
            <div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
                    Conectar
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </nav>

          {/* Rutas de la App */}
          <main className="container mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create-pool" element={<CreatePool />} />
              <Route path="/vault/:id" element={<VaultDetail />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ClerkProvider>
  );
}