import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

export default function VaultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [vault, setVault] = useState<any>(null);

  const fetchVaultData = () => {
    fetch(`http://localhost:3001/api/vaults/${id}`)
      .then(res => res.json())
      .then(data => setVault(data))
      .catch(err => console.error("Error cargando baúl:", err));
  };

  useEffect(() => {
    fetchVaultData();
  }, [id]);

  // --- FUNCIÓN PARA UNIRSE COMO ESTUDIANTE ---
  const handleJoin = async () => {
    if (!user) return alert("Debes iniciar sesión para continuar");

    const res = await fetch(`http://localhost:3001/api/vaults/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: user.fullName || user.username,
        role: 'student' 
      })
    });

    if (res.ok) {
      fetchVaultData();
    }
  };

  // --- NUEVA FUNCIÓN PARA FONDEAR COMO PROVEEDOR ---
  const handleFund = async () => {
    if (!user) return alert("Inicia sesión para fondear");
    
    const res = await fetch(`http://localhost:3001/api/vaults/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: user.fullName || user.username,
        role: 'provider' 
      })
    });

    if (res.ok) {
      alert("¡Gracias! Ahora eres el patrocinador de esta beca.");
      fetchVaultData();
    }
  };

  const qrUrl = vault?.wallet_address 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${vault.wallet_address}&color=fbbf24`
    : "";

  const shareAmount = vault?.type === 'scholarship' 
    ? (vault.target_amount / ((vault.duration_months * 4) / vault.release_weeks)).toFixed(2)
    : (vault?.target_amount / (vault?.num_people || 1)).toFixed(2);

  if (!vault) return <div className="p-10 text-center text-gray-500">Cargando...</div>;

  // Comprobar si el usuario ya es el proveedor
  const isProvider = vault.participants?.includes(`🌟 ${user?.fullName || user?.username} (Proveedor)`);

  return (
    <div className="p-10 text-center flex flex-col items-center min-h-screen bg-gray-950 text-white">
      <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 ${
        vault.type === 'scholarship' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      }`}>
        {vault.type === 'scholarship' ? '🎓 Beca de Desempeño' : '👥 Fondo Grupal'}
      </span>

      <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">{vault.name}</h2>
      
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-yellow-500/10 my-6 border-8 border-gray-900">
        {qrUrl ? (
          <img src={qrUrl} alt="QR de pago" className="w-52 h-52" />
        ) : (
          <div className="w-52 h-52 bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">
             <span className="text-gray-400 text-xs">Generando...</span>
          </div>
        )}
      </div>

      <div className="text-center mb-8 max-w-md">
        {vault.type === 'scholarship' ? (
          <div className="space-y-4">
            <p className="text-yellow-500 font-black text-3xl italic">PAGO: ${shareAmount} USD</p>
            <p className="text-gray-400 text-sm">Frecuencia: Cada {vault.release_weeks} semanas durante {vault.duration_months} meses.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {Array.isArray(vault.criteria) ? (
                vault.criteria.map((c: string) => (
                  <span key={c} className="text-[10px] font-bold bg-gray-900 border border-gray-800 px-3 py-1 rounded-lg text-gray-300 uppercase">✓ {c}</span>
                ))
              ) : <span className="text-[10px] text-gray-600 uppercase italic">Sin requisitos específicos</span>}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-yellow-500 font-black text-3xl italic">CUOTA: ${shareAmount} USD</p>
            <p className="text-gray-500 text-sm mt-1 italic font-bold text-center uppercase">Total Meta: ${vault.target_amount}</p>
          </div>
        )}
      </div>

      {/* --- SECCIÓN DE BOTONES ACTUALIZADA --- */}
      <div className="flex flex-col gap-4 w-full max-w-sm mb-12">
        {vault.type === 'scholarship' ? (
          <>
            {/* Si NO es el proveedor, muestra botón de fondear */}
            {!isProvider ? (
              <button 
                onClick={handleFund}
                className="bg-yellow-500 text-black w-full py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-yellow-500/20"
              >
                💰 FONDEAR ESTA BECA
              </button>
            ) : (
              <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-2xl">
                <p className="text-green-400 font-bold uppercase text-sm">✨ Eres el Patrocinador</p>
              </div>
            )}

            {/* Si NO está en la lista de participantes, muestra botón de postularme */}
            {!vault.participants?.includes(user?.fullName || user?.username) && (
              <button 
                onClick={handleJoin}
                className="bg-transparent border-2 border-yellow-500 text-yellow-500 w-full py-4 rounded-2xl font-black text-lg hover:bg-yellow-500/10 transition-colors"
              >
                🎓 POSTULARME (RECLAMAR)
              </button>
            )}
          </>
        ) : (
          /* Botón original para Pool */
          (!vault.participants || !vault.participants.includes(user?.fullName || user?.username)) && (
            <button 
              onClick={handleJoin}
              className="bg-yellow-500 text-black w-full py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-yellow-500/20"
            >
              🙋‍♂️ UNIRME Y PAGAR MI PARTE
            </button>
          )
        )}
      </div>

      <div className="w-full max-w-sm text-left">
        <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-widest uppercase">
          {vault.type === 'scholarship' ? 'Becados y Patrocinadores' : `Participantes (${vault.participants?.length || 0}/${vault.num_people || 0})`}
        </h4>
        <div className="flex flex-col gap-2">
          {vault.participants?.map((p: string, index: number) => (
            <div key={index} className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl border border-gray-800">
              <span className="font-bold">{p}</span>
              <span className={`text-xs font-bold uppercase ${p.includes('🌟') ? 'text-yellow-500' : 'text-green-400'}`}>
                {p.includes('🌟') ? 'Proveedor 🌟' : (vault.type === 'scholarship' ? 'Aplicante 🎓' : 'Listo ✅')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => navigate('/')} className="mt-12 text-gray-500 text-sm font-bold hover:text-white transition-colors">
        ← Volver al inicio
      </button>
    </div>
  );
}