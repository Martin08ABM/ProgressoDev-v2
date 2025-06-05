import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const openai = new OpenAI({ // Clave api key de openai
  apiKey: process.env.OPENAI_API_KEY;
});

// Configuración de Supabase para el lado del servidor
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const NORMAS_CHATGPT = `
Eres un asistente que genera roadmaps visuales. Cuando recibas un prompt, debes:
    1. Crear una descripción de una imagen que represente el roadmap.
    2. Generar un prompt adecuado para DALL·E-3 que permita crear esa imagen empieza con "Prompt para la imagen: ".
    3. Proporcionar una breve descripción textual del roadmap.
    4. Crear un resumen con viñetas de los hitos del roadmap.
    5. Indicar si algún paso requiere conocimientos técnicos, y cuáles.
    6. Debuelve la imagen con un nombre TecnologiaRoadmap.png (por ejemplo: ReactRoadmap, AstroRoadmap, etc)L
    7. Debes indicar que la imagen debe estar en la máxima calidad posible
`;

export const prerender = false;

export async function POST({ request }) { // Exportación de la función POST
    try {

        const req = await request.json();
        const { prompt, userId  } = req;  // Recibimos el userId

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'No input provided' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        // Verificar límites de uso según el estado PRO del usuario
        if (userId) {
            const { data: userData, error: userError } = await supabase
                .from('user_identifiers')
                .select('is_pro, times_visited')
                .eq('unique_id', userId)
                .single();

            // Si el usuario no es PRO y ha utilizado todos sus inputs gratuitos, rechazar la solicitud
            if (!userError && userData && !userData.is_pro && userData.times_visited > 3) {
                return new Response(JSON.stringify({
                    error: 'Has alcanzado el límite de solicitudes gratuitas. Actualiza a la versión PRO para continuar.'
                }), {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }
        }

        const prompt_con_normas = `${NORMAS_CHATGPT}\n\nPrompt del usuario: ${prompt}`;

        // Paso 1: generar respuesta de GPT-4
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
                { role: "user", content: prompt_con_normas }
            ],
            temperature: 0.9,
            max_tokens: 1500,
        });

        const respuestaChat = chatResponse.choices[0].message.content;

        // Buscar el prompt visual dentro de la respuesta
        const lines = respuestaChat.split('\n');
        const lineaPrompt = lines.find(line => line.toLowerCase().includes("prompt para la imagen"));
        const promptVisual = lineaPrompt ? lineaPrompt.split(':').slice(1).join(':').trim() : null;

        if (!promptVisual) {
            return new Response(JSON.stringify({ error: 'No se encontró prompt visual' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        // Paso 2: generar imagen con DALL·E-3
        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: promptVisual,
            size: "1920x1080",
            n: 1,
        });

        const imageUrl = imageResponse.data[0].url;

        // Registrar la generación de roadmap en Supabase si hay userId
        if (userId) {
            await supabase
                .from('user_actions')
                .insert({
                    user_id: userId,
                    action_type: 'roadmap_generated',
                    action_data: {
                        userPrompt: prompt,
                        generatedImageUrl: imageUrl,
                        timestamp: new Date().toISOString()
                    },
                    timestamp: new Date().toISOString()
                });
        } else if (!userId) {
          
        }

        return new Response(JSON.stringify([
            {tipo: "imagen", contenido: imageUrl},
            {tipo: "texto", contenido: respuestaChat}
        ]), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });

    } catch (error) {
        console.error("Error al comunicarse con OpenAI:", error);
        return new Response(JSON.stringify({ error: 'Error al procesar la solicitud' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}