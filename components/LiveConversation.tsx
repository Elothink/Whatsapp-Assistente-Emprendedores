import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import type { TranscriptEntry } from '../types';
import { decode, decodeAudioData, createBlob } from '../utils/audioUtils';
import { MicrophoneIcon, BotIcon } from './icons/Icons';

interface LiveConversationProps {
    setApiError: (error: string | null) => void;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ setApiError }) => {
    const [statusMessage, setStatusMessage] = useState('Clique no microfone para começar');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [isSessionActive, setIsSessionActive] = useState(false);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    const transcriptRef = useRef(transcript);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    const handleStopSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        if(mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }

        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
             outputAudioContextRef.current = null;
        }

        outputSourcesRef.current.forEach(source => source.stop());
        outputSourcesRef.current.clear();
        
        setIsSessionActive(false);
        setStatusMessage('Clique no microfone para começar');
    }, []);

    const handleStartSession = async () => {
        if (isSessionActive) {
            handleStopSession();
            return;
        }
        
        setTranscript([]);
        setStatusMessage('Solicitando permissão do microfone...');
        
        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            console.error("Error getting user media:", error);
            setStatusMessage('Permissão do microfone negada.');
            return;
        }

        setStatusMessage('Conectando ao assistente...');
        setIsSessionActive(true);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // FIX: Cast window to any to handle webkitAudioContext for Safari compatibility
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        // FIX: Cast window to any to handle webkitAudioContext for Safari compatibility
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setStatusMessage('Conectado. Pode falar!');
                    const inputAudioContext = inputAudioContextRef.current;
                    if (!inputAudioContext || !mediaStreamRef.current) return;

                    mediaStreamSourceRef.current = inputAudioContext.createMediaStreamSource(mediaStreamRef.current);
                    scriptProcessorRef.current = inputAudioContext.createScriptProcessor(4096, 1, 1);

                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContext.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        if (!currentOutputTranscription) { // Start of new model turn
                             setTranscript(prev => [...prev, { speaker: 'model', text: '', isFinal: false }]);
                        }
                        currentOutputTranscription += text;
                        setTranscript(prev => {
                            const newTranscript = [...prev];
                            const lastEntry = newTranscript[newTranscript.length - 1];
                            if(lastEntry && lastEntry.speaker === 'model') {
                                lastEntry.text = currentOutputTranscription;
                            }
                            return newTranscript;
                        });

                    } else if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        if (!currentInputTranscription) { // Start of new user turn
                             setTranscript(prev => [...prev, { speaker: 'user', text: '', isFinal: false }]);
                        }
                        currentInputTranscription += text;
                        setTranscript(prev => {
                            const newTranscript = [...prev];
                            const lastEntry = newTranscript[newTranscript.length - 1];
                            if(lastEntry && lastEntry.speaker === 'user') {
                                lastEntry.text = currentInputTranscription;
                            }
                            return newTranscript;
                        });
                    }

                    if (message.serverContent?.turnComplete) {
                        setTranscript(prev => prev.map(entry => ({...entry, isFinal: true})));
                        currentInputTranscription = '';
                        currentOutputTranscription = '';
                    }

                    const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    const outputAudioContext = outputAudioContextRef.current;
                    if (base64EncodedAudioString && outputAudioContext) {
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                        
                        const audioBuffer = await decodeAudioData(
                            decode(base64EncodedAudioString),
                            outputAudioContext,
                            24000,
                            1
                        );
                        
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.destination);
                        
                        source.addEventListener('ended', () => {
                            outputSourcesRef.current.delete(source);
                        });

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        outputSourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    const errorMessage = e.message || '';
                    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                        setApiError("Você excedeu sua cota de API para conversas em tempo real. Por favor, configure o faturamento.");
                    } else {
                        setStatusMessage(`Erro: ${e.message}. Tente novamente.`);
                    }
                    handleStopSession();
                },
                onclose: (e: CloseEvent) => {
                    console.log('Session closed');
                    handleStopSession();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: 'Você é um assistente prestativo para pequenos empreendedores no Brasil. Responda de forma amigável, clara e concisa.',
            },
        });
    };

    const TranscriptViewer: React.FC<{ transcript: TranscriptEntry[] }> = ({ transcript }) => (
        <div className="flex-grow p-4 overflow-y-auto">
            {transcript.map((entry, index) => (
                <div key={index} className={`flex items-start my-2 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {entry.speaker === 'model' && <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white mr-2"><BotIcon /></div>}
                    <div className={`max-w-xs p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'} ${entry.isFinal ? '' : 'opacity-70'}`}>
                        <p>{entry.text}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800 text-center">Conversa por Voz</h2>
            </div>
            <TranscriptViewer transcript={transcript} />
            <div className="p-4 border-t bg-gray-50 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-600 mb-4 h-5 text-center">{statusMessage}</p>
                <button 
                    onClick={handleStartSession}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSessionActive ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' : 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500'}`}
                    aria-label={isSessionActive ? 'Parar conversa' : 'Iniciar conversa'}
                >
                    <MicrophoneIcon />
                </button>
            </div>
        </div>
    );
};

export default LiveConversation;