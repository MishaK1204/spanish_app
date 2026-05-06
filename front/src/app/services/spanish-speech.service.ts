import { Injectable } from '@angular/core';

/** Uses the browser {@link SpeechSynthesis} API with a Spanish voice when available. */
@Injectable({ providedIn: 'root' })
export class SpanishSpeechService {
  cancel(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }

  speakSpanish(text: string): void {
    const phrase = text.trim();
    if (!phrase || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const buildAndSpeak = (): void => {
      const u = new SpeechSynthesisUtterance(phrase);
      u.lang = 'es-ES';
      const voices = synth.getVoices();
      const spanish =
        voices.find((v) => v.lang.toLowerCase().startsWith('es')) ??
        voices.find((v) => /spanish/i.test(v.name));
      if (spanish) {
        u.voice = spanish;
      }
      u.rate = 0.9;
      synth.speak(u);
    };

    if (synth.getVoices().length > 0) {
      buildAndSpeak();
      return;
    }

    const onVoices = (): void => {
      synth.removeEventListener('voiceschanged', onVoices);
      buildAndSpeak();
    };
    synth.addEventListener('voiceschanged', onVoices);
    window.setTimeout(() => {
      synth.removeEventListener('voiceschanged', onVoices);
      buildAndSpeak();
    }, 400);
  }
}
