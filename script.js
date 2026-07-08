// script.js
import CONFIG from './config.js';
import { SYSTEM_PROMPT } from './prompt.js';

let chatHistory = [
    { role: "system", content: SYSTEM_PROMPT }
];

document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const messageText = userInput.value.trim();
        if (!messageText) return;

        appendMessage(messageText, "user");
        chatHistory.push({ role: "user", content: messageText });
        userInput.value = "";

        const typingIndicator = appendMessage("Francisco está pensando...", "bot-typing");

        try {
            // Requisição feita de forma segura para o nosso proxy local do Netlify
            const response = await fetch(CONFIG.BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: CONFIG.MODEL,
                    messages: chatHistory
                })
            });

            // NOVA VALIDAÇÃO: Se o servidor (Netlify ou OpenRouter) der erro, paramos aqui
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Erro retornado do Proxy/OpenRouter:", errorData);
                throw new Error(errorData.error || `Erro ${response.status} na comunicação.`);
            }

            const data = await response.json();
            typingIndicator.remove();

            if (data.choices && data.choices[0].message) {
                const botReply = data.choices[0].message.content;
                appendMessage(botReply, "bot");
                chatHistory.push({ role: "assistant", content: botReply });
            } else {
                throw new Error("Resposta em formato inesperado do servidor proxy.");
            }

        } catch (error) {
            console.error("Erro na comunicação:", error);
            typingIndicator.remove();
            appendMessage("Desculpe, tive um contratempo técnico aqui. Poderia repetir, por favor?", "error");
        }
    });

    function appendMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);
        
        if (sender === "bot") {
            messageDiv.innerHTML = text.replace(/\n/g, "<br>");
        } else {
            messageDiv.textContent = text;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }
});
