const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Aquí el Backend lee las llaves de tu archivo .env
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CHIPI_API_URL = "https://api.chipipay.com/v1"; // Revisa la URL en su doc, suele ser esta
const CHIPI_SECRET = process.env.CHIPI_SECRET_KEY;
const ORG_ID = "org_5b917683-4872-4f0c-b2c6-1ac66d12cc6e";

//const chipi = new Chipipay(process.env.CHIPI_SECRET_KEY);

app.post('/api/vaults', async (req, res) => {
    const { name, target_amount, type, num_people } = req.body;

    try {
        console.log("🛠️ Creando baúl en Supabase (Modo Desarrollo)...");

        const { data, error } = await supabase
            .from('vaults')
            .insert([{ 
                name, 
                target_amount: parseFloat(target_amount), 
                type: type || 'pool', 
                num_people: parseInt(num_people) || 1,
                wallet_address: `https://checkout.chipipay.com/mock-id-${Date.now()}`, 
                collected_amount: 0,
                participants: []
            }])
            .select();

        if (error) throw error;
        
        console.log("✅ Baúl guardado correctamente.");
        res.status(201).json(data[0]);

    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ error: "Error al guardar el baúl" });
    }
});

// Obtener todos los baúles
app.get('/api/vaults', async (req, res) => {
    console.log("--- Intento de lectura de baúles ---");
    try {
        const { data, error } = await supabase
            .from('vaults')
            .select('*');

        if (error) {
            // ESTO ES LO QUE NECESITAMOS LEER EN TU TERMINAL
            console.error("❌ ERROR ESPECÍFICO DE SUPABASE:", error.message);
            console.error("CÓDIGO DE ERROR:", error.code);
            return res.status(500).json({ error: error.message });
        }

        console.log("✅ Baúles recuperados:", data.length);
        res.json(data || []);
    } catch (err) {
        console.error("❌ ERROR FATAL DEL SERVIDOR:", err);
        res.status(500).json([]);
    }
});

// Obtener detalle de un baúl específico
app.get('/api/vaults/:id', async (req, res) => {
    const { id } = req.params;
    
    const { data, error } = await supabase
        .from('vaults') // o 'pools', el que estés usando
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return res.status(404).json({ error: "Baúl no encontrado" });
    }

    res.json(data);
});

// Ruta para que un usuario se una al baúl
app.post('/api/vaults/:id/join', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        // 1. Primero obtenemos el baúl actual para ver quiénes ya están
        const { data: vault, error: fetchError } = await supabase
            .from('vaults')
            .select('participants')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Creamos la nueva lista de participantes
        // Si no hay nadie (null), empezamos una lista nueva con el nombre
        const currentParticipants = vault.participants || [];
        
        // Evitamos duplicados: si el nombre ya está, no hacemos nada
        if (currentParticipants.includes(name)) {
            return res.status(200).json({ message: "Ya eres parte de este baúl" });
        }

        const updatedParticipants = [...currentParticipants, name];

        // 3. Actualizamos la fila en Supabase
        const { data, error: updateError } = await supabase
            .from('vaults')
            .update({ participants: updatedParticipants })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json(data);
    } catch (err) {
        console.error("Error al unirse:", err);
        res.status(500).json({ error: "No se pudo unir al baúl" });
    }
});



app.listen(3001, () => {
    console.log("🚀 Servidor corriendo en http://localhost:3001");
});