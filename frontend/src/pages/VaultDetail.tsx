import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

export default function VaultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Para detectar el regreso del pago
  const { user } = useUser();
  
  const [vault, setVault] = useState<any>(null);
  const [userWallet, setUserWallet] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchVaultData = () => {
    fetch(`http://localhost:3001/api/vaults/${id}`)
      .then(res => res.json())
      .then(data => setVault(data))
      .catch(err => console.error("Error cargando baúl:", err));
  };

  // 1. Cargar datos del baúl y verificar si venimos de un pago exitoso
  useEffect(() => {
    fetchVaultData();

    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('status') === 'success') {
      // 1. Mostrar visualmente que estamos procesando
      setIsProcessing(true);
      
      // 2. Recuperar el rol que guardamos ANTES de ir al pago
      const role = localStorage.getItem('pendingRole') || 'member';
      
      // 3. Esperar a que el usuario de Clerk esté listo para mandarlo a Supabase
      if (user) {
        fetch(`http://localhost:3001/api/vaults/${id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: user.fullName || user.username,
            role: role 
          })
        })
        .then(() => {
          // Limpiamos la URL quitando el ?status=success para que no se repita
          navigate(`/vault/${id}`, { replace: true });
          
          setTimeout(() => {
            setIsProcessing(false);
            fetchVaultData();
            localStorage.removeItem('pendingRole');
          }, 2000);
        })
        .catch(err => console.error("Error al unir:", err));
      }
    }
  }, [id, location, user]); // Se dispara cuando cambia el ID, la URL o carga el Usuario

  // --- FUNCIÓN UNIFICADA PARA PAGAR CON CHIPIPAY ---
  const handlePayment = async (roleType: 'student' | 'provider' | 'member') => {
  if (!user) return alert("Debes iniciar sesión para continuar");
  setLoadingAction(true);
  
  // Guardamos el rol en el navegador para recordarlo al volver del pago
  localStorage.setItem('pendingRole', roleType);

  try {
    const amountToPay = (vault.type === 'scholarship' && roleType === 'provider') 
      ? vault.target_amount 
      : shareAmount;

    const res = await fetch('http://localhost:3001/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        vaultId: id,
        amount: amountToPay,
        userName: user.fullName || user.username,
        role: roleType 
      })
    });

    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    setLoadingAction(false);
  }
};

  const qrUrl = vault?.wallet_address 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${vault.wallet_address}&color=fbbf24`
    : "";

  const shareAmount = vault?.type === 'scholarship' 
    ? (vault.target_amount / ((vault.duration_months * 4) / vault.release_weeks)).toFixed(2)
    : (vault?.target_amount / (vault?.num_people || 1)).toFixed(2);

  if (!vault) return <div className="p-10 text-center text-gray-500">Cargando...</div>;

  const isProvider = vault.participants?.includes(`🌟 ${user?.fullName || user?.username} (Proveedor)`);
  const isParticipant = vault.participants?.includes(user?.fullName || user?.username);

  return (
    <div className="p-10 text-center flex flex-col items-center min-h-screen bg-gray-950 text-white">
      
      {/* NOTIFICACIÓN DE PROCESANDO */}
      {isProcessing && (
        <div className="fixed top-24 bg-yellow-500 text-black px-6 py-3 rounded-full font-black animate-bounce shadow-2xl z-50">
            {localStorage.getItem('pendingRole') === 'student'
            ? "🎓 REGISTRANDO POSTULACIÓN... ¡BIENVENIDO!"
            :"🚀 PROCESANDO PAGO... ¡ACTUALIZANDO BAÚL!"}
        </div>
      )}

      <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 ${
        vault.type === 'scholarship' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      }`}>
        {vault.type === 'scholarship' ? '🎓 Beca de Desempeño' : '👥 Fondo Grupal'}
      </span>

      <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">{vault.name}</h2>
      
      {/* SALDO DE LA WALLET (Visual) */}
      {userWallet && (
        <div className="mb-4 bg-gray-900 border border-gray-800 px-4 py-1 rounded-xl">
          <p className="text-[10px] text-gray-500 font-bold uppercase">Mi Billetera Chipi</p>
          <p className="text-yellow-500 font-black">${userWallet.balance || "0.00"} USD</p>
        </div>
      )}

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
            <p className="text-yellow-500 font-black text-3xl italic tracking-tight">BECA TOTAL: ${vault.target_amount} USD</p>
            <p className="text-gray-400 text-sm">Desembolsos: ${shareAmount} cada {vault.release_weeks} semanas.</p>
          </div>
        ) : (
          <div>
            <p className="text-yellow-500 font-black text-3xl italic tracking-tight uppercase">CUOTA: ${shareAmount} USD</p>
            <p className="text-gray-500 text-sm mt-1 italic font-bold uppercase tracking-widest">Meta: ${vault.target_amount}</p>
          </div>
        )}
      </div>

      {/* --- BOTONES CON LÓGICA DE CHIPIPAY --- */}
      <div className="flex flex-col gap-4 w-full max-w-sm mb-12">
        {vault.type === 'scholarship' ? (
          <>
            {!isProvider ? (
              <button 
                disabled={loadingAction}
                onClick={() => handlePayment('provider')}
                className="bg-yellow-500 text-black w-full py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-yellow-500/20 disabled:opacity-50"
              >
                {loadingAction ? 'CONECTANDO...' : '💰 FONDEAR ESTA BECA'}
              </button>
            ) : (
              <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-2xl">
                <p className="text-green-400 font-bold uppercase text-sm">✨ Eres el Patrocinador</p>
              </div>
            )}

            {!isParticipant && (
              <button 
                onClick={() => handlePayment('student')}
                className="bg-transparent border-2 border-yellow-500 text-yellow-500 w-full py-4 rounded-2xl font-black text-lg hover:bg-yellow-500/10 transition-colors"
              >
                🎓 POSTULARME (RECLAMAR)
              </button>
            )}
          </>
        ) : (
          /* BOTÓN PARA POOL */
          !isParticipant && (
            <button 
              disabled={loadingAction}
              onClick={() => handlePayment('member')}
              className="bg-yellow-500 text-black w-full py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-yellow-500/20 disabled:opacity-50"
            >
              {loadingAction ? 'CARGANDO...' : '🙋‍♂️ UNIRME Y PAGAR MI CUOTA'}
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