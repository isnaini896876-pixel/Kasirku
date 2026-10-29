import { terbilangRupiah } from './formatters';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play pleasant dual-chime POS notification bell
export function playChimeSound(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: B5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);

      setTimeout(resolve, 550);
    } catch (e) {
      console.warn('Audio Context error:', e);
      resolve();
    }
  });
}

// Speak Indonesian text using Web Speech API
export function speakIndonesian(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      // Try finding Indonesian voice
      const voices = window.speechSynthesis.getVoices();
      const indoVoice = voices.find((v) => v.lang === 'id-ID' || v.lang.startsWith('id'));
      if (indoVoice) {
        utterance.voice = indoVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      resolve();
    }
  });
}

// Announce transaction like authentic Indonesian Soundbox (e.g., QRIS Soundbox)
export async function announceTransaction(amount: number, category: string, storeName: string = 'Toko'): Promise<void> {
  await playChimeSound();

  const terbilangStr = terbilangRupiah(amount);
  let message = '';

  switch (category) {
    case 'token':
      message = `Pembayaran token listrik berhasil diterima, sejumlah ${terbilangStr}.`;
      break;
    case 'transfer':
      message = `Transfer berhasil diproses, total ${terbilangStr}.`;
      break;
    case 'qris':
      message = `Pembayaran QRIS ${storeName} berhasil diterima, sebesar ${terbilangStr}.`;
      break;
    case 'toko':
    default:
      message = `Pembayaran kasir berhasil diterima, sebesar ${terbilangStr}.`;
      break;
  }

  await speakIndonesian(message);
}
