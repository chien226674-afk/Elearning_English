/**
 * TTS Service - ElevenLabs cho cả tiếng Anh và tiếng Việt
 */
export class TTSService {
  static ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

  /**
   * Gọi ElevenLabs API để tạo audio
   * @returns {Buffer} audio buffer (mp3)
   */
  static async generateSpeech(text, voiceId, options = {}) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    // Nếu không có API key, dùng fallback ngay lập tức (không throw để app vẫn chạy)
    if (!apiKey) {
      console.warn('[ElevenLabs] Không có API Key - Chuyển sang Fallback TTS');
      return this.fetchFallbackTTS(text, options.lang || 'en');
    }
    
    if (!voiceId) {
      throw new Error('Thiếu Voice ID');
    }

    try {
      const response = await fetch(`${this.ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: options.modelId || 'eleven_flash_v2_5',
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75,
            speed: options.speed || 1.0,
          },
        }),
      });

      if (!response.ok) {
        let errorData = {};
        const errorText = await response.text();
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('[ElevenLabs] Could not parse error JSON:', errorText);
        }

        console.error('[ElevenLabs] Error:', response.status, errorText);
        
        // Kiểm tra lỗi cụ thể "unusual activity"
        if (response.status === 401 && errorData.detail?.status === 'detected_unusual_activity') {
          console.warn('[ElevenLabs] Unusual activity detected. Switching to Fallback TTS.');
          return this.fetchFallbackTTS(text, options.lang || 'en');
        }

        // Xử lý các mã lỗi khác, nếu là 401/402/429 thì dùng fallback
        if ([401, 402, 429].includes(response.status)) {
          console.warn(`[ElevenLabs] API Error ${response.status}. Switching to Fallback TTS.`);
          return this.fetchFallbackTTS(text, options.lang || 'en');
        }

        // Các lỗi khác vẫn throw
        if (response.status === 500) {
          throw new Error('Lỗi server ElevenLabs');
        } else {
          throw new Error(`ElevenLabs API Error: ${response.status}`);
        }
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      // Nếu lỗi mạng hoặc lỗi không xác định, cố gắng fallback một lần nữa
      if (!error.message.includes('ElevenLabs')) {
        console.warn('[ElevenLabs] Network error or unexpected exit. Trying Fallback TTS...');
        return this.fetchFallbackTTS(text, options.lang || 'en');
      }
      console.error('[ElevenLabs] Lỗi khi gọi API:', error.message);
      throw error;
    }
  }

  /**
   * Fallback TTS using Google Translate (Free)
   */
  static async fetchFallbackTTS(text, lang = 'en') {
    try {
      console.log(`[TTS Fallback] Đang tạo audio bằng Google Translate (${lang})...`);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Fallback TTS also failed');
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('[TTS Fallback] Lỗi:', error.message);
      throw new Error('Không thể tạo âm thanh (Cả ElevenLabs và Fallback đều lỗi)');
    }
  }

  /**
   * TTS tiếng Anh
   */
  static async speakEnglish(text, speed = 1.0) {
    const voiceId = process.env.ELEVENLABS_VOICE_ID_EN || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    return this.generateSpeech(text, voiceId, { speed, lang: 'en' });
  }

  /**
   * TTS tiếng Việt
   */
  static async speakVietnamese(text) {
    // Falls back to ELEVENLABS_VOICE_ID if ELEVENLABS_VOICE_ID_VI is not set
    const voiceId = process.env.ELEVENLABS_VOICE_ID_VI || process.env.ELEVENLABS_VOICE_ID;
    if (!voiceId) {
      throw new Error('Thiếu ELEVENLABS_VOICE_ID - cần cấu hình Voice ID trong .env');
    }
    return this.generateSpeech(text, voiceId, { lang: 'vi' });
  }
}
