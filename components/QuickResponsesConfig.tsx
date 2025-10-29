import React, { useState } from 'react';
import type { QuickResponse } from '../types';
import { PlusIcon, TrashIcon, EditIcon, SaveIcon, XIcon } from './icons/Icons';

interface QuickResponsesConfigProps {
  quickResponses: QuickResponse[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const QuickResponsesConfig: React.FC<QuickResponsesConfigProps> = ({ quickResponses, onAdd, onUpdate, onDelete }) => {
  const [newResponse, setNewResponse] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAdd = () => {
    if (newResponse.trim()) {
      onAdd(newResponse.trim());
      setNewResponse('');
    }
  };

  const handleEditStart = (qr: QuickResponse) => {
    setEditingId(qr.id);
    setEditingText(qr.text);
  };

  const handleEditSave = () => {
    if (editingId && editingText.trim()) {
      onUpdate(editingId, editingText.trim());
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleEditSave();
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="p-4 h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Respostas Rápidas</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Adicionar Nova</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder="Digite sua resposta..."
            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors flex items-center justify-center"
            aria-label="Adicionar resposta"
          >
            <PlusIcon />
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Lista de Respostas</h3>
        <div className="space-y-3">
          {quickResponses.map((qr) => (
            <div key={qr.id} className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
              {editingId === qr.id ? (
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-grow p-1 border-b-2 border-indigo-500 bg-transparent focus:outline-none"
                  autoFocus
                />
              ) : (
                <p className="text-gray-800 text-sm flex-grow mr-2">{qr.text}</p>
              )}
              
              <div className="flex space-x-1 flex-shrink-0">
                {editingId === qr.id ? (
                  <>
                    <button onClick={handleEditSave} className="p-2 text-green-500 hover:bg-green-100 rounded-full" aria-label="Salvar alteração">
                      <SaveIcon />
                    </button>
                    <button onClick={handleCancelEdit} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" aria-label="Cancelar edição">
                      <XIcon />
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleEditStart(qr)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" aria-label="Editar resposta">
                    <EditIcon />
                  </button>
                )}
                <button onClick={() => onDelete(qr.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" aria-label="Excluir resposta">
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
          {quickResponses.length === 0 && (
             <p className="text-center text-gray-500 py-4">Nenhuma resposta cadastrada.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickResponsesConfig;