import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreatePool() {
  const [name, setName] = useState('');
  const [target, setTarget] = useState(0);
  const [numPeople, setNumPeople] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsCreating(true);
  
  try {
    const res = await fetch('http://localhost:3001/api/vaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, target_amount: target, num_people: numPeople })
    });

    if (res.ok) {
      const data = await res.json();
      navigate(`/vault/${data.id}`); // ¡Esto ahora sí va a funcionar!
    }
  } catch (err) {
    alert("Error de conexión");
  } finally {
    setIsCreating(false);
  }
};

  return (
    <div className="p-10 max-w-md mx-auto text-center">
      <h2 className="text-3xl font-black text-yellow-500 mb-8 italic tracking-tighter uppercase">Crear nuevo baúl</h2>
      
      <form onSubmit={handleCreate} className="flex flex-col gap-4">
        <div className="text-left">
          <label className="text-xs font-bold text-gray-500 ml-2 uppercase">Nombre del objetivo</label>
          <input 
            required
            className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-800 focus:border-yellow-500 outline-none transition-colors" 
            placeholder="Ej. Cena de graduación" 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div className="text-left">
          <label className="text-xs font-bold text-gray-500 ml-2 uppercase">Monto Total (USD)</label>
          <input 
            required
            className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-800 focus:border-yellow-500 outline-none transition-colors" 
            placeholder="0.00" 
            type="number" 
            onChange={e => setTarget(Number(e.target.value))} 
          />
        </div>

        <div className="text-left">
          <label className="text-xs font-bold text-gray-500 ml-2 uppercase">¿Entre cuántos dividimos?</label>
          <input 
            required
            className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-800 focus:border-yellow-500 outline-none transition-colors" 
            placeholder="1" 
            type="number" 
            min="1"
            value={numPeople}
            onChange={e => setNumPeople(Number(e.target.value))} 
          />
        </div>

        {target > 0 && (
          <div className="mt-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <p className="text-sm text-gray-400">Cada persona aportará:</p>
            <p className="text-2xl font-black text-yellow-500">${(target / numPeople).toFixed(2)}</p>
          </div>
        )}

        <button 
          disabled={isCreating}
          type="submit"
          className="bg-yellow-500 text-black p-4 rounded-2xl font-black text-lg mt-6 shadow-xl shadow-yellow-500/20 hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isCreating ? "CONECTANDO CON CHIPIPAY..." : "GENERAR VAULT"}
        </button>
      </form>
    </div>
  );
}