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
    
    if (!apiKey) {
      console.warn('[ElevenLabs] Không có API Key - ElevenLabs TTS không khả dụng');
      throw new Error('ELEVENLABS_API_KEY chưa được cấu hình');
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
          model_id: options.modelId || 'eleven_flash_v2_5', // Changed to flash v2.5 as requested
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75,
            speed: options.speed || 1.0,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ElevenLabs] Error:', response.status, errorText);
        
      // Xử lý các mã lỗi cụ thể
        if (response.status === 401) {
          throw new Error('ElevenLabs API Key không hợp lệ');
        } else if (response.status === 402) {
          throw new Error('ElevenLabs hết credit - vui lòng nâng cấp tài khoản');
        } else if (response.status === 429) {
          throw new Error('ElevenLabs đã hết quota - vui lòng thử lại sau');
        } else if (response.status === 500) {
          throw new Error('Lỗi server ElevenLabs');
        } else {
          throw new Error(`ElevenLabs API Error: ${response.status}`);
        }
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('[ElevenLabs] Lỗi khi gọi API:', error.message);
      throw error;
    }
  }

  /**
   * TTS tiếng Anh
   */
  static async speakEnglish(text, speed = 1.0) {
    const voiceId = process.env.ELEVENLABS_VOICE_ID_EN || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    return this.generateSpeech(text, voiceId, { speed });
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
    return this.generateSpeech(text, voiceId);
  }
}
