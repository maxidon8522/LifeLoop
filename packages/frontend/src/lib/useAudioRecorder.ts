import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * A simple hook to record audio and send it over WebSocket.
 * In a real hackathon phase 2, this would downsample PCM to 16kHz for Gemini.
 */
export const useAudioRecorder = (wsUrl: string) => {
    const [isRecording, setIsRecording] = useState(false);
    const [liveTranscription, setLiveTranscription] = useState<string>("");
    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = useCallback(async () => {
        try {
            // 1. Setup WebSocket
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'transcription' || data.type === 'serverContent') {
                        setLiveTranscription(prev => prev + " " + data.text);
                    }
                } catch (e) {
                    console.error("Failed to parse WS message", e);
                }
            };

            wsRef.current.onopen = async () => {
                console.log(`[WS] Connected to ${wsUrl}`);

                // 2. Setup Mic
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

                // Normally we'd use AudioContext + ScriptProcessorNode to get raw PCM here.
                // For standard MediaRecorder:
                mediaRecorderRef.current = new MediaRecorder(streamRef.current);

                mediaRecorderRef.current.ondataavailable = (e) => {
                    if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
                        // Note: Sending generic webm/mp4 chunks. 
                        // In full implementation, BFF or Frontend must transcode to 16kHz PCM.
                        wsRef.current.send(e.data);
                    }
                };

                mediaRecorderRef.current.start(250); // send chunks every 250ms
                setIsRecording(true);
            };

            wsRef.current.onerror = (err) => {
                console.error("[WS] Error", err);
            };

        } catch (err) {
            console.error("Failed to get mic", err);
        }
    }, [wsUrl]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
        setIsRecording(false);
    }, [isRecording]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return { isRecording, startRecording, stopRecording, liveTranscription };
};
