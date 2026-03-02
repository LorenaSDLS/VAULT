import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateVault() {
  const [type, setType] = useState<'pool' | 'scholarship'>('pool');
  const [name, setName] = useState('');
  const [target, setTarget] = useState(0);
  
  // Estados para Pool
  const [numPeople, setNumPeople] = useState(1);

  // Estados para Scholarship
  const [durationMonths, setDurationMonths] = useState(6);
  const [releaseWeeks, setReleaseWeeks] = useState(2);
  const [criteria, setCriteria] = useState({ tasks: true, attendance: true, grades: false });

  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    // Filtramos los criterios seleccionados para enviar solo los "true"
    const selectedCriteria = Object.entries(criteria)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    try {
      const res = await fetch('http://localhost:3001/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          target_amount: target, 
          type,
          // Datos específicos según el tipo
          num_people: type === 'pool' ? numPeople : 1,
          duration_months: type === 'scholarship' ? durationMonths : null,
          release_weeks: type === 'scholarship' ? releaseWeeks : null,
          criteria: type === 'scholarship' ? selectedCriteria : []
        })
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/vault/${data.id}`);
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-10 max-w-lg mx-auto text-center">
      <h2 className="text-3xl font-black text-yellow-500 mb-6 italic tracking-tighter uppercase">Crear Nuevo Vault</h2>
      
      {/* Selector de Tipo */}
      <div className="flex gap-2 mb-8 bg-gray-900 p-1 rounded-2xl border border-gray-800">
        <button 
          onClick={() => setType('pool')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'pool' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}
        >
          👥 Fondo Grupal
        </button>
        <button 
          onClick={() => setType('scholarship')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'scholarship' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}
        >
          🎓 Beca Académica
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-5">
        <div className="text-left">
          <label className="text-xs font-bold text-gray-500 ml-2 uppercase">Nombre del {type === 'pool' ? 'Fondo' : 'Proyecto de Beca'}</label>
          <input 
            required
            className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-800 focus:border-yellow-500 outline-none transition-colors" 
            placeholder={type === 'pool' ? "Ej. Viaje de graduación" : "Ej. Beca Ingeniería 2024"} 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div className="text-left">
          <label className="text-xs font-bold text-gray-500 ml-2 uppercase">Monto Meta (USD)</label>
          <input 
            required
            className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-800 focus:border-yellow-500 outline-none transition-colors" 
            placeholder="0.00" 
            type="number" 
            onChange={e => setTarget(Number(e.target.value))} 
          />
        </div>

        {/* --- CAMPOS DINÁMICOS PARA POOL --- */}
        {type === 'pool' && (
          <div className="text-left animate-in fade-in duration-300">
            <label className="text-xs font-bold text-gray-500 ml-2 uppercase">¿Entre cuántos dividimos?</label>
            <input 
              required
              className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-800 focus:border-yellow-500 outline-none transition-colors" 
              type="number" min="1" value={numPeople}
              onChange={e => setNumPeople(Number(e.target.value))} 
            />
          </div>
        )}

        {/* --- CAMPOS DINÁMICOS PARA SCHOLARSHIP --- */}
        {type === 'scholarship' && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="text-left">
              <label className="text-xs font-bold text-gray-500 ml-2 uppercase">Duración (Meses)</label>
              <input 
                className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-800 focus:border-yellow-500 outline-none" 
                type="number" value={durationMonths}
                onChange={e => setDurationMonths(Number(e.target.value))} 
              />
            </div>
            <div className="text-left">
              <label className="text-xs font-bold text-gray-500 ml-2 uppercase">Pago (Semanas)</label>
              <input 
                className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-800 focus:border-yellow-500 outline-none" 
                type="number" value={releaseWeeks}
                onChange={e => setReleaseWeeks(Number(e.target.value))} 
              />
            </div>
            <div className="col-span-2 text-left">
              <label className="text-xs font-bold text-gray-500 ml-2 uppercase mb-2 block">Criterios de Desembolso</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(criteria).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCriteria({...criteria, [key as keyof typeof criteria]: !criteria[key as keyof typeof criteria]})}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                      criteria[key as keyof typeof criteria] 
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' 
                      : 'border-gray-800 text-gray-500'
                    }`}
                  >
                    {key.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Resumen dinámico */}
        {target > 0 && (
          <div className="mt-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <p className="text-sm text-gray-400">
              {type === 'pool' ? 'Cada persona aportará:' : `Cada ${releaseWeeks} semanas se liberarán:`}
            </p>
            <p className="text-2xl font-black text-yellow-500">
              ${type === 'pool' ? (target / numPeople).toFixed(2) : (target / ((durationMonths * 4) / releaseWeeks)).toFixed(2)}
            </p>
          </div>
        )}

        <button 
          disabled={isCreating}
          type="submit"
          className="bg-yellow-500 text-black p-4 rounded-2xl font-black text-lg mt-4 shadow-xl shadow-yellow-500/20 hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isCreating ? "CREANDO..." : "GENERAR VAULT"}
        </button>
      </form>
    </div>
  );
}