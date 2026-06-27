// useDictation — dictée vocale via la Web Speech API (reconnaissance vocale du
// navigateur, 100 % local). L'auditeur dicte observations/recommandations.

import { useCallback, useEffect, useRef, useState } from "react";

interface UseDictationOptions {
  lang?: string;
  onResult?: (texte: string) => void;
}

const getRecognition = (): any => {
  if (typeof window === "undefined") return null;
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
};

export function useDictation({ lang = "fr-FR", onResult }: UseDictationOptions = {}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() =>
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  const recRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          const txt = (res[0]?.transcript || "").trim();
          if (txt) onResultRef.current?.(txt);
        }
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }, [supported, listening, lang]);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, stop, start]);

  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* ignore */ } }, []);

  return { supported, listening, start, stop, toggle };
}
