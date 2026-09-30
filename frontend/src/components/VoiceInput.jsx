import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export default function VoiceInput({ onTranscript, isListening, setIsListening }) {
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechSupport(true);
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-IN'; // Optimized for Indian English & restaurant terms

      recog.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (text && onTranscript) {
          onTranscript(text);
        }
        setIsListening(false);
      };

      recog.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, []);

  const toggleListening = () => {
    if (!hasSpeechSupport) {
      alert('Voice dictation is supported in Chrome, Safari, and Edge. Please type your query.');
      return;
    }

    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      try {
        recognition?.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? 'Listening... Tap to stop' : 'Tap to speak (Voice Input)'}
      className={`relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
        isListening
          ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
          : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700'
      }`}
    >
      {isListening ? (
        <>
          <Mic className="w-4 h-4 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
