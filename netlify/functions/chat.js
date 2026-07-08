// netlify/functions/chat.js
exports.handler = async function (event, context) {
    // Liberar apenas requisições POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método Não Permitido" };
    }

    try {
        const body = JSON.parse(event.body);
        
        // Pega a chave diretamente das variáveis de ambiente seguras do Netlify
        const apiKey = process.env.OPENROUTER_API_KEY;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "X-Title": "Concessionaria Francisco IA"
            },
            body: JSON.stringify({
                model: body.model || "google/gemini-2.5-flash",
                messages: body.messages,
                temperature: 0.7
            })
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erro interno no proxy da função" })
        };
    }
};