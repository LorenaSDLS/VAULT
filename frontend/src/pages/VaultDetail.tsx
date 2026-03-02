import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react'; // Importamos Clerk para saber quién es el usuario

export default function VaultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser(); // Obtenemos el usuario actual
  const [vault, setVault] = useState<any>(null);

  // 1. Función para traer los datos (la sacamos del useEffect para poder re-usarla)
  const fetchVaultData = () => {
    fetch(`http://localhost:3001/api/vaults/${id}`)
      .then(res => res.json())
      .then(data => setVault(data))
      .catch(err => console.error("Error cargando baúl:", err));
  };

  useEffect(() => {
    fetchVaultData();
  }, [id]);

  // 2. Función para unirse al baúl
  const handleJoin = async () => {
    if (!user) return alert("Debes iniciar sesión para unirte");

    const res = await fetch(`http://localhost:3001/api/vaults/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: user.fullName || user.username })
    });

    if (res.ok) {
      fetchVaultData(); // Refrescamos la lista para que aparezca el nombre
    }
  };

  const qrUrl = vault?.wallet_address 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${vault.wallet_address}&color=fbbf24`
    : "";

  // Cálculo de cuánto paga cada uno
  const shareAmount = vault ? (vault.target_amount / (vault.num_people || 1)).toFixed(2) : 0;

  return (
    <div className="p-10 text-center flex flex-col items-center min-h-screen bg-gray-950 text-white">
      <h2 className="text-4xl font-black text-yellow-500 mb-2 tracking-tighter">VAULT DETAIL</h2>
      
      {/* QR Code Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-yellow-500/10 my-8 border-8 border-gray-900">
        {qrUrl ? (
          <img src={qrUrl} alt="QR de pago" className="w-52 h-52" />
        ) : (
          <div className="w-52 h-52 bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">
             <span className="text-gray-400 text-xs">Generando...</span>
          </div>
        )}
      </div>

      {/* Info del Baúl */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold uppercase">{vault?.name || "Cargando..."}</h3>
        <p className="text-yellow-500 font-bold text-xl mt-2 italic">CUOTA: ${shareAmount} USD</p>
        <p className="text-gray-500 text-sm italic">Total Meta: ${vault?.target_amount}</p>
      </div>

      {/* BOTÓN MÁGICO PARA UNIRSE */}
      {vault && (!vault.participants || !vault.participants.includes(user?.fullName)) && (
        <button 
          onClick={handleJoin}
          className="bg-yellow-500 text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform mb-10 shadow-xl shadow-yellow-500/20"
        >
          🙋‍♂️ UNIRME Y PAGAR MI PARTE
        </button>
      )}

      {/* LISTA DE PARTICIPANTES DINÁMICA */}
      <div className="w-full max-w-sm text-left">
        <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-widest uppercase">Participantes ({vault?.participants?.length || 0}/{vault?.num_people || 0})</h4>
        <div className="flex flex-col gap-2">
          {vault?.participants?.map((p: string, index: number) => (
            <div key={index} className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl border border-gray-800">
              <span className="font-bold">{p}</span>
              <span className="text-green-400 text-xs font-bold uppercase">Listo ✅</span>
            </div>
          ))}
          
          {/* Slots vacíos visuales */}
          {Array.from({ length: (vault?.num_people || 0) - (vault?.participants?.length || 0) }).map((_, i) => (
            <div key={i} className="flex justify-between items-center bg-gray-900/30 p-4 rounded-2xl border border-dashed border-gray-800 opacity-50">
              <span className="text-gray-600 italic text-sm">Esperando alguien...</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => navigate('/')}
        className="mt-12 text-gray-500 text-sm font-bold hover:text-white transition-colors"
      >
        ← Volver al inicio
      </button>
    </div>
  );
}