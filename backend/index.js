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
    const { name, target_amount, type, num_people, duration_months, release_weeks, criteria } = req.body;

    try {
        const { data, error } = await supabase
            .from('vaults')
            .insert([{ 
                name, 
                target_amount: parseFloat(target_amount), 
                type, 
                num_people,
                duration_months,
                release_weeks,
                criteria, // Asegúrate de que en Supabase esta columna sea de tipo 'text array' o '_text'
                wallet_address: `https://checkout.chipipay.com/mock-${Date.now()}`,
                collected_amount: 0,
                status: 'open'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    // CORRECCIÓN: En Express se usa req.params, NO useParams
    const { id } = req.params; 
    const { name, role } = req.body;

    try {
        console.log(`👤 Intento de unión: ${name} como ${role} al baúl ${id}`);

        // 1. Obtenemos el baúl actual
        const { data: vault, error: fetchError } = await supabase
            .from('vaults')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const currentParticipants = vault.participants || [];
        
        // 2. Definimos el identificador según el rol
        // Si es proveedor le ponemos la estrella, si no, solo el nombre
        const identifier = role === 'provider' ? `🌟 ${name} (Proveedor)` : name;

        // Evitamos duplicados
        if (currentParticipants.includes(identifier)) {
            return res.status(200).json({ message: "Ya registrado" });
        }

        const updatedParticipants = [...currentParticipants, identifier];

        // 3. Actualizamos en Supabase
        const { data, error: updateError } = await supabase
            .from('vaults')
            .update({ 
                participants: updatedParticipants,
                // Si alguien fondea, podrías marcar el baúl como lleno (opcional para el demo)
                collected_amount: role === 'provider' ? vault.target_amount : vault.collected_amount
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        console.log("✅ Registro actualizado con éxito");
        res.json(data);

    } catch (err) {
        console.error("❌ Error en el servidor:", err.message);
        res.status(500).json({ error: "No se pudo procesar la solicitud" });
    }
});



app.listen(3001, () => {
    console.log("🚀 Servidor corriendo en http://localhost:3001");
});