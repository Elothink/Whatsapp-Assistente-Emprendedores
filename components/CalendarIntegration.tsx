
import React, { useState, useEffect } from 'react';
import type { CalendarSlot, HistoryItem, View } from '../types';
import { mockCalendarService } from '../services/mockCalendarService';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { CheckIcon, CopyIcon } from './icons/Icons';

interface CalendarIntegrationProps {
  addToHistory: (item: HistoryItem) => void;
  setView: (view: View) => void;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ addToHistory, setView }) => {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copyStatus, copy] = useCopyToClipboard();

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      const availableSlots = await mockCalendarService.getAvailableSlots();
      setSlots(availableSlots);
      setIsLoading(false);
    };
    fetchSlots();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const suggestTime = (slot: CalendarSlot) => {
    const suggestedText = `Olá! Tenho um horário disponível para você às ${formatTime(slot.startTime)}. Podemos confirmar?`;
    copy(suggestedText);
    addToHistory({
        id: Date.now().toString(),
        originalMessage: "Pedido de agendamento",
        response: suggestedText,
        timestamp: new Date(),
        status: 'responded'
    });
    setTimeout(() => setView('suggestions'), 1500);
  };
  
  return (
    <div className="p-4 h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Próximos Horários Livres</h2>
      
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
            ))}
        </div>
      ) : slots.length > 0 ? (
        <div className="space-y-3">
          {slots.map(slot => (
            <div key={slot.id} className="bg-teal-50 border border-teal-200 p-3 rounded-lg flex items-center justify-between">
              <p className="font-semibold text-teal-800">
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
              </p>
              <button onClick={() => suggestTime(slot)} className="px-3 py-1.5 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors duration-200">
                {copyStatus === 'copied' ? <CheckIcon /> : 'Sugerir'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
            <p className="text-gray-500">Nenhum horário livre encontrado para hoje.</p>
        </div>
      )}
      {copyStatus === 'copied' && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2">
            <CopyIcon />
            <span>Horário copiado para a área de transferência!</span>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegration;
