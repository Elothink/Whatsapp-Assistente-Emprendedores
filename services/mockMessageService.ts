
import type { Message } from '../types';

const mockMessages: Omit<Message, 'id' | 'timestamp'>[] = [
  { sender: 'Ana Silva', text: 'Olá, qual o horário de funcionamento de vocês?' },
  { sender: 'Carlos Souza', text: 'Gostaria de agendar um corte de cabelo para amanhã.' },
  { sender: 'Mariana Lima', text: 'Vocês aceitam cartão de crédito?' },
  { sender: 'Pedro Costa', text: 'Qual o endereço?' },
  { sender: 'Juliana Alves', text: 'Oi, tudo bem? Tem horário disponível para sábado de manhã?' },
  { sender: 'Rafael Martins', text: 'Quanto custa o serviço de manicure?' },
];

let intervalId: number | null = null;

export const mockMessageService = {
  subscribe: (callback: (message: Message) => void) => {
    let messageIndex = 0;
    
    // Send first message immediately
    setTimeout(() => {
        const newMessage = {
            ...mockMessages[messageIndex % mockMessages.length],
            id: Date.now().toString() + Math.random(),
            timestamp: new Date(),
        };
        callback(newMessage);
        messageIndex++;
    }, 1000);

    intervalId = window.setInterval(() => {
      if (messageIndex < mockMessages.length) {
          const newMessage = {
            ...mockMessages[messageIndex % mockMessages.length],
            id: Date.now().toString() + Math.random(),
            timestamp: new Date(),
          };
          callback(newMessage);
          messageIndex++;
      } else {
        if (intervalId) clearInterval(intervalId);
      }
    }, 10000); // New message every 10 seconds

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  },
};
