import React, { useState, useEffect } from 'react';
import type { Message, QuickResponse, HistoryItem, View } from '../types';
import { geminiService, RATE_LIMIT_EXCEEDED_ERROR } from '../services/geminiService';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { CopyIcon, EditIcon, CheckIcon, SaveIcon } from './icons/Icons';

interface SuggestionState {
  suggestion: string;
  isAppointment: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SuggestionsPanelProps {
  messages: Message[];
  quickResponses: QuickResponse[];
  addToHistory: (item: HistoryItem) => void;
  setView: (view: View) => void;
  setApiError: (error: string | null) => void;
}

const SuggestionCard: React.FC<{ 
    message: Message, 
    suggestionData: SuggestionState,
    addToHistory: (item: HistoryItem) => void, 
    setView: (view: View) => void,
}> = ({ message, suggestionData, addToHistory, setView }) => {
    const { suggestion: initialSuggestion, isAppointment, isLoading, error } = suggestionData;
    
    const [currentSuggestion, setCurrentSuggestion] = useState(initialSuggestion);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(initialSuggestion);
    const [copyStatus, copy] = useCopyToClipboard();

    useEffect(() => {
        setCurrentSuggestion(initialSuggestion);
        setEditedText(initialSuggestion);
    }, [initialSuggestion]);

    const handleCopy = () => {
      const textToCopy = isEditing ? editedText : currentSuggestion;
      copy(textToCopy);
      addToHistory({
        id: Date.now().toString(),
        originalMessage: message.text,
        response: textToCopy,
        timestamp: new Date(),
        status: 'responded'
      });
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSaveEdit = () => {
        setCurrentSuggestion(editedText);
        setIsEditing(false);
    };

    if (isLoading) {
      return (
          <div className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
          </div>
      )
    }

    return (
        <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-800">{message.sender}</p>
            <p className="text-sm text-gray-500 mb-3">{message.text}</p>

            <div className="bg-indigo-50 p-3 rounded-md">
                <h3 className="text-xs font-bold text-indigo-700 mb-2">Sugestão de Resposta</h3>
                {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : isEditing ? (
                  <textarea 
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full p-2 text-sm bg-white border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-700">{currentSuggestion}</p>
                )}
            </div>

            <div className="mt-4 flex items-center space-x-2">
                <button onClick={handleCopy} disabled={!!error} className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {copyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                    <span>{copyStatus === 'copied' ? 'Copiado!' : 'Copiar'}</span>
                </button>
                {isEditing ? (
                  <button onClick={handleSaveEdit} className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <SaveIcon />
                      <span>Salvar</span>
                  </button>
                ) : (
                  <button onClick={handleEditToggle} disabled={!!error} className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed">
                      <EditIcon />
                      <span>Editar</span>
                  </button>
                )}
                {isAppointment && !error && (
                    <button onClick={() => setView('calendar')} className="flex-1 text-center px-3 py-1.5 text-sm bg-teal-100 text-teal-800 rounded-md hover:bg-teal-200 transition-colors duration-200 font-semibold">
                        Sugerir Horário
                    </button>
                )}
            </div>
        </div>
    );
};

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ messages, quickResponses, addToHistory, setView, setApiError }) => {
  const [suggestions, setSuggestions] = useState<Map<string, SuggestionState>>(new Map());

  useEffect(() => {
    const processMessages = async () => {
      const messagesToProcess = messages.filter(msg => !suggestions.has(msg.id));
      
      if (messagesToProcess.length === 0) return;

      for (const message of messagesToProcess) {
        setSuggestions(prev => new Map(prev).set(message.id, { 
            suggestion: '', 
            isAppointment: false, 
            isLoading: true, 
            error: null 
        }));

        try {
          const result = await geminiService.analyzeMessage(
            message.text,
            quickResponses.map(qr => qr.text)
          );
          setSuggestions(prev => new Map(prev).set(message.id, { 
              ...result, 
              isLoading: false, 
              error: null 
          }));
        } catch (error: any) {
            let errorMessage = "Desculpe, ocorreu um erro ao gerar a sugestão.";
            if (error.message === RATE_LIMIT_EXCEEDED_ERROR) {
                errorMessage = "Erro: Cota da API excedida.";
                setApiError("Você excedeu sua cota de API. Para continuar usando o assistente, por favor, configure o faturamento.");
            } else {
                 console.error("Error fetching suggestion:", error);
            }
            setSuggestions(prev => new Map(prev).set(message.id, { 
                suggestion: '', 
                isAppointment: false, 
                isLoading: false, 
                error: errorMessage 
            }));
            if (error.message === RATE_LIMIT_EXCEEDED_ERROR) {
                break; 
            }
        }
      }
    };
    
    processMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, quickResponses, setApiError]);

  return (
    <div className="p-4 bg-gray-50 h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Mensagens Recentes</h2>
      {messages.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">Aguardando novas mensagens...</p>
        </div>
      )}
      <div className="space-y-4">
        {messages.map(msg => {
          const suggestionData = suggestions.get(msg.id) || { isLoading: true, suggestion: '', isAppointment: false, error: null };
          return (
            <SuggestionCard 
              key={msg.id} 
              message={msg} 
              suggestionData={suggestionData}
              addToHistory={addToHistory} 
              setView={setView} 
            />
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionsPanel;