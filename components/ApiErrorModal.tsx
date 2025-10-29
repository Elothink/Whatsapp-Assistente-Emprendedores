import React from 'react';

interface ApiErrorModalProps {
  message: string;
  onClose: () => void;
}

const ApiErrorModal: React.FC<ApiErrorModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="error-title" aria-describedby="error-description">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
        <h2 id="error-title" className="text-xl font-bold text-red-600 mb-3">Erro de Cota da API</h2>
        <div id="error-description">
            <p className="text-gray-700 mb-4">{message}</p>
            <p className="text-gray-600 text-sm mb-4">
            Isso geralmente acontece no plano gratuito, que tem um limite de solicitações por minuto. Para remover essa limitação, você pode configurar o faturamento em seu projeto do Google Cloud.
            </p>
        </div>
        <a
          href="https://ai.google.dev/gemini-api/docs/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-600 transition-colors mb-2"
        >
          Configurar Faturamento
        </a>
        <button
          onClick={onClose}
          className="w-full text-center bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          aria-label="Fechar modal de erro"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default ApiErrorModal;
