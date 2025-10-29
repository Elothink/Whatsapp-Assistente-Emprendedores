
import React, { useMemo } from 'react';
import type { HistoryItem } from '../types';

interface ReportsProps {
  history: HistoryItem[];
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-indigo-600">{value}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
);


const Reports: React.FC<ReportsProps> = ({ history }) => {
    
  const stats = useMemo(() => {
    const totalMessages = history.length;
    const responseRate = totalMessages > 0 ? '100%' : '0%'; // Simplified for this mock
    const avgResponseTime = '15min'; // Mock data
    
    return { totalMessages, responseRate, avgResponseTime };
  }, [history]);
  
  return (
    <div className="p-4 h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Relatório e Feedback</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Indicadores de Uso</h3>
        <div className="grid grid-cols-3 gap-3">
            <StatCard title="Total de Mensagens" value={stats.totalMessages.toString()} />
            <StatCard title="Taxa de Resposta" value={stats.responseRate} />
            <StatCard title="Tempo Médio" value={stats.avgResponseTime.split('min')[0]} subtext="min" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Histórico de Mensagens</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {history.length === 0 ? (
                 <p className="text-center text-gray-500 py-4">Nenhuma mensagem respondida ainda.</p>
            ) : (
                history.map(item => (
                    <div key={item.id} className="bg-white border p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-gray-500 italic w-3/4">"{item.originalMessage}"</p>
                            <span className="text-xs font-medium text-gray-400">{item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <p className="text-sm text-gray-800 w-3/4">{item.response}</p>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 capitalize">{item.status}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
