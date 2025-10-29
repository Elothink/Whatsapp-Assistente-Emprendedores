import React, { useState, useEffect } from 'react';
import SuggestionsPanel from './components/SuggestionsPanel';
import QuickResponsesConfig from './components/QuickResponsesConfig';
import CalendarIntegration from './components/CalendarIntegration';
import Reports from './components/Reports';
import Chatbot from './components/Chatbot';
import LiveConversation from './components/LiveConversation';
import ApiErrorModal from './components/ApiErrorModal';
import type { Message, QuickResponse, HistoryItem } from './types';
import { mockMessageService } from './services/mockMessageService';
import { BotIcon, SettingsIcon, CalendarIcon, BarChartIcon, ChatIcon, MicrophoneIcon } from './components/icons/Icons';

type View = 'suggestions' | 'config' | 'calendar' | 'reports' | 'chat' | 'live';

const App: React.FC = () => {
  const [view, setView] = useState<View>('suggestions');
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([
    { id: '1', text: 'Nosso endereço é Rua Exemplo, 123, Bairro Modelo.' },
    { id: '2', text: 'Aceitamos PIX, cartão de crédito e débito.' },
    { id: '3', text: 'Olá! Agradecemos seu contato. Como podemos ajudar?' },
  ]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = mockMessageService.subscribe((newMessage) => {
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const addQuickResponse = (text: string) => {
    setQuickResponses([...quickResponses, { id: Date.now().toString(), text }]);
  };

  const updateQuickResponse = (id: string, text: string) => {
    setQuickResponses(quickResponses.map(qr => qr.id === id ? { ...qr, text } : qr));
  };

  const deleteQuickResponse = (id: string) => {
    setQuickResponses(quickResponses.filter(qr => qr.id !== id));
  };
  
  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev]);
  }

  const renderView = () => {
    switch (view) {
      case 'suggestions':
        return <SuggestionsPanel messages={messages} quickResponses={quickResponses} addToHistory={addToHistory} setView={setView} setApiError={setApiError} />;
      case 'config':
        return <QuickResponsesConfig quickResponses={quickResponses} onAdd={addQuickResponse} onUpdate={updateQuickResponse} onDelete={deleteQuickResponse} />;
      case 'calendar':
        return <CalendarIntegration addToHistory={addToHistory} setView={setView} />;
      case 'reports':
        return <Reports history={history} />;
      case 'chat':
        return <Chatbot setApiError={setApiError} />;
      case 'live':
        return <LiveConversation setApiError={setApiError} />;
      default:
        return <SuggestionsPanel messages={messages} quickResponses={quickResponses} addToHistory={addToHistory} setView={setView} setApiError={setApiError} />;
    }
  };

  const NavItem = ({ icon, label, currentView, targetView }: { icon: React.ReactNode, label: string, currentView: View, targetView: View }) => (
    <button onClick={() => setView(targetView)} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors duration-200 ${currentView === targetView ? 'text-indigo-500' : 'text-gray-500 hover:text-indigo-500'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 p-4">
      {apiError && <ApiErrorModal message={apiError} onClose={() => setApiError(null)} />}
      <div className="w-full max-w-sm h-[80vh] max-h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="flex-grow overflow-y-auto">
          {renderView()}
        </div>
        <div className="grid grid-cols-6 border-t border-gray-200 bg-gray-50">
          <NavItem icon={<BotIcon />} label="Sugestões" currentView={view} targetView="suggestions" />
          <NavItem icon={<ChatIcon />} label="Assistente" currentView={view} targetView="chat" />
          <NavItem icon={<MicrophoneIcon />} label="Conversa" currentView={view} targetView="live" />
          <NavItem icon={<CalendarIcon />} label="Agenda" currentView={view} targetView="calendar" />
          <NavItem icon={<SettingsIcon />} label="Respostas" currentView={view} targetView="config" />
          <NavItem icon={<BarChartIcon />} label="Relatório" currentView={view} targetView="reports" />
        </div>
      </div>
    </div>
  );
};

export default App;