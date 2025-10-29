import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { geminiService, RATE_LIMIT_EXCEEDED_ERROR } from '../services/geminiService';
import { BotIcon } from './icons/Icons';

interface ChatbotProps {
    setApiError: (error: string | null) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ setApiError }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou seu assistente de IA. Como posso ajudar você a gerenciar seu negócio hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingBusinessType, setIsAwaitingBusinessType] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;
    
    const currentInput = input;
    const userMessage: ChatMessage = { role: 'user', text: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (isAwaitingBusinessType) {
        setIsAwaitingBusinessType(false);
        try {
            const responseText = await geminiService.getCompetitorNews(currentInput);
            const modelMessage: ChatMessage = { role: 'model', text: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error: any) {
            if (error.message === RATE_LIMIT_EXCEEDED_ERROR) {
                setApiError("Você excedeu sua cota de API. Para continuar usando o assistente, por favor, configure o faturamento.");
            }
            const errorMessage: ChatMessage = { role: 'model', text: 'Desculpe, algo deu errado ao analisar a concorrência. Tente novamente.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    } else {
        try {
          const responseText = await geminiService.sendChatMessage(currentInput);
          const modelMessage: ChatMessage = { role: 'model', text: responseText };
          setMessages(prev => [...prev, modelMessage]);
        } catch (error: any) {
            if (error.message === RATE_LIMIT_EXCEEDED_ERROR) {
                setApiError("Você excedeu sua cota de API. Para continuar usando o assistente, por favor, configure o faturamento.");
            }
          const errorMessage: ChatMessage = { role: 'model', text: 'Desculpe, algo deu errado. Tente novamente.' };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
    }
  };

  const handleCompetitorAnalysis = async () => {
    if (isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: 'Pode analisar as últimas notícias dos meus concorrentes?' };
    const botQuestion: ChatMessage = { role: 'model', text: 'Com certeza! Para fazer a análise, por favor, me diga qual é o seu ramo de atividade. (ex: restaurante, salão de beleza, loja de roupas)' };
    setMessages(prev => [...prev, userMessage, botQuestion]);
    setIsAwaitingBusinessType(true);
  };


  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    // A small BotIcon that can fit inside the bubble
    const SmallBotIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    );
    return (
      <div className={`flex w-full items-start gap-2.5 my-2 ${isModel ? 'justify-start' : 'justify-end'}`}>
        {isModel && <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white"><SmallBotIcon /></div>}
        <div className={`flex flex-col w-full max-w-xs leading-1.5 p-3 border-gray-200 ${isModel ? 'bg-gray-100 rounded-e-xl rounded-es-xl' : 'bg-indigo-500 text-white rounded-s-xl rounded-ee-xl'}`}>
          <p className="text-sm font-normal" dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />') }}></p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 text-center">Assistente IA</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {messages.length === 1 && (
             <div className="my-4">
                <button 
                    onClick={handleCompetitorAnalysis}
                    disabled={isLoading}
                    className="w-full text-left p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    🔍 Analisar últimas notícias dos concorrentes
                </button>
            </div>
        )}
        {isLoading && (
          <div className="flex items-start gap-2.5 my-2">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white"><BotIcon /></div>
            <div className="flex flex-col w-full max-w-xs leading-1.5 p-3 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl">
              <div className="flex items-center space-x-1 justify-center">
                <span className="h-2 w-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-indigo-300 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isAwaitingBusinessType ? "Digite seu ramo de atividade..." : "Pergunte algo..."}
            disabled={isLoading}
            className="flex-grow p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || input.trim() === ''}
            className="px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;