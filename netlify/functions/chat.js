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

        if (!apiKey) {
            console.error("OPENROUTER_API_KEY não configurada no ambiente do Netlify.");
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    error: "Chave da API não configurada no servidor. Configure OPENROUTER_API_KEY nas variáveis de ambiente do Netlify."
                })
            };
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "X-Title": "Concessionaria Francisco IA"
            },
            body: JSON.stringify({
                // Adicionamos um modelo gratuito de fallback
                model: body.model || "meta-llama/llama-3.1-8b-instruct:free", 
                messages: body.messages,
                temperature: 0.7,
                // NOVA LINHA: Limita a resposta para evitar estouro de limite gratuito
                max_tokens: 1500 
            })
        });
       
        const data = await response.json();

        // AQUI ESTAVA O BUG: antes sempre retornava 200, mesmo quando a
        // OpenRouter respondia com um erro (chave inválida, sem créditos,
        // modelo indisponível, rate limit, etc). Agora propagamos o status
        // real e logamos o motivo para aparecer nos Function logs do Netlify.
        if (!response.ok) {
            console.error("Erro retornado pela OpenRouter:", response.status, JSON.stringify(data));
            return {
                statusCode: response.status,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    error: data.error?.message || "Erro ao consultar a OpenRouter",
                    details: data
                })
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Erro interno na função proxy:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Erro interno no proxy da função", details: error.message })
        };
    }
};
