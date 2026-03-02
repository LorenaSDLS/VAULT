import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [vaults, setVaults] = useState<any[]>([]);

  useEffect(() => {
  fetch('http://localhost:3001/api/vaults')
    .then(res => res.json())
    .then(data => {
      // SIEMPRE verificamos que sea un arreglo antes de guardar
      if (Array.isArray(data)) {
        setVaults(data);
      } else {
        console.error("El servidor no mandó una lista:", data);
        setVaults([]); // Evita el error de .map
      }
    })
    .catch(err => {
      console.error("Error de red:", err);
      setVaults([]);
    });
}, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">VAULTS CREADOS</h2>
          <p className="text-gray-500 text-sm">Gestiona tus pagos grupales</p>
        </div>
        <Link 
          to="/create-pool" 
          className="bg-yellow-500 text-black px-6 py-3 rounded-2xl font-black hover:scale-105 transition-transform shadow-lg shadow-yellow-500/20"
        >
          + NUEVO BAÚL
        </Link>
      </div>

      {vaults.length === 0 ? (
        <div className="border-2 border-dashed border-gray-800 rounded-[2rem] p-20 text-center">
          <p className="text-gray-600 font-bold">No tienes baúles activos todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault: any) => (
            <Link 
              to={`/vault/${vault.id}`} 
              key={vault.id}
              className="bg-gray-900 p-6 rounded-[2rem] border border-gray-800 hover:border-yellow-500/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  {vault.type}
                </span>
                <span className="text-gray-600 text-xs font-mono">
                  {vault.participants?.length || 0}/{vault.num_people} Slots
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors uppercase truncate">
                {vault.name}
              </h3>
              
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500 uppercase font-bold text-[10px]">Meta</span>
                  <span className="text-white font-bold">${vault.target_amount} USD</span>
                </div>
                {/* Barra de progreso visual */}
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full transition-all duration-1000" 
                    style={{ width: `${((vault.participants?.length || 0) / (vault.num_people || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}