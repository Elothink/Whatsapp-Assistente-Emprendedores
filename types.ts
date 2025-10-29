
export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
}

export interface QuickResponse {
  id: string;
  text: string;
}

export interface HistoryItem {
    id: string;
    originalMessage: string;
    response: string;
    timestamp: Date;
    status: 'responded' | 'pending';
}

export interface CalendarSlot {
    id: string;
    startTime: Date;
    endTime: Date;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface TranscriptEntry {
  speaker: 'user' | 'model';
  text: string;
  isFinal: boolean;
}


export type View = 'suggestions' | 'config' | 'calendar' | 'reports' | 'chat' | 'live';