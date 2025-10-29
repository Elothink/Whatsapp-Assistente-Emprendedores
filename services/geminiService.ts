import { GoogleGenAI, Type, Chat } from "@google/genai";

export const RATE_LIMIT_EXCEEDED_ERROR = 'RATE_LIMIT_EXCEEDED';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using a mock response.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

let chat: Chat | null = null;

const getChat = () => {
    if (!ai) return null;
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'Você é um assistente prestativo para pequenos empreendedores. Responda a perguntas sobre negócios, marketing, atendimento ao cliente e outros tópicos relevantes de forma clara e concisa em português do Brasil.',
            },
        });
    }
    return chat;
}

const handleError = (error: any, context: string): string => {
    console.error(`Error in ${context}:`, error);
    const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error(RATE_LIMIT_EXCEEDED_ERROR);
    }
    return "Desculpe, ocorreu um erro. Por favor, tente novamente.";
}


export const geminiService = {
  analyzeMessage: async (message: string, customResponses: string[]): Promise<{ suggestion: string; isAppointment: boolean; }> => {
    if (!ai) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const isAppointment = ["agendar", "marcar", "horário", "disponível", "atendimento"].some(keyword => message.toLowerCase().includes(keyword));
      const suggestion = isAppointment
        ? "Olá! Tenho um horário disponível para você. Podemos confirmar?"
        : `Obrigado por sua mensagem! Em breve retornaremos. Mensagem recebida: "${message}"`;
      return { suggestion, isAppointment };
    }

    const customResponsesText = customResponses.length > 0
      ? `Considere estas respostas personalizadas como base, se aplicável: \n${customResponses.map(r => `- ${r}`).join('\n')}`
      : "";

    const prompt = `
      Analise a seguinte mensagem de um cliente para um pequeno negócio.
      Gere uma resposta curta, amigável e profissional para a mensagem, em português do Brasil.
      Determine também se a mensagem é um pedido para marcar ou agendar um horário.

      Mensagem do Cliente: "${message}"

      ${customResponsesText}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestion: {
                type: Type.STRING,
                description: 'A resposta curta, amigável e profissional para a mensagem do cliente em português do Brasil.'
              },
              isAppointment: {
                type: Type.BOOLEAN,
                description: 'True se a mensagem for um pedido de agendamento, false caso contrário.'
              }
            },
            required: ["suggestion", "isAppointment"]
          }
        }
      });

      const jsonResponse = JSON.parse(response.text);
      return jsonResponse;

    } catch (error) {
       console.error("Error in analyzeMessage:", error);
       const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
       if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
         throw new Error(RATE_LIMIT_EXCEEDED_ERROR);
       }
       // Fallback on other errors
       const isAppointment = ["agendar", "marcar", "horário", "disponível", "atendimento"].some(keyword => message.toLowerCase().includes(keyword));
       return {
           suggestion: "Desculpe, não consegui processar sua mensagem. Poderia tentar novamente?",
           isAppointment,
       };
    }
  },
  
  sendChatMessage: async (message: string): Promise<string> => {
    const geminiChat = getChat();
    if (!geminiChat) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "Olá! Como posso ajudar você hoje?";
    }

    try {
      const response = await geminiChat.sendMessage({ message });
      return response.text.trim();
    } catch (error) {
      chat = null; // Reset chat on error
      return handleError(error, "sendChatMessage");
    }
  },

  getCompetitorNews: async (businessType: string): Promise<string> => {
    if (!ai) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "O modo de análise de concorrentes não está disponível no momento. Verifique sua chave de API.";
    }

    const prompt = `
      Atue como um analista de negócios para um pequeno empreendedor no Brasil.
      Pesquise na web usando o Google Search por 3 a 5 notícias ou atualizações recentes e relevantes sobre concorrentes na área de "${businessType}".
      Para cada notícia encontrada, forneça:
      1. O nome do concorrente.
      2. Um resumo claro da notícia.
      3. Uma sugestão de "plano de ação" que o pequeno empreendedor pode tomar com base nessa informação.

      Formate a resposta final de forma clara e organizada usando markdown (títulos, listas, negrito).
      Liste todas as fontes consultadas no final.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
      });

      let responseText = response.text.trim();
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
          .map(chunk => chunk.web?.uri)
          .filter((uri, index, self) => uri && self.indexOf(uri) === index);

        if (sources.length > 0) {
          responseText += "\n\n---\n\n**Fontes:**\n";
          sources.forEach(uri => {
            responseText += `- ${uri}\n`;
          });
        }
      }

      return responseText;
    } catch (error) {
      return handleError(error, "getCompetitorNews");
    }
  }
};