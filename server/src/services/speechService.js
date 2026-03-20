import Groq from 'groq-sdk';
import levenshtein from 'fast-levenshtein';

export class SpeechService {
  /**
   * Step 1: Groq Whisper - Nhận dạng giọng nói (Speech-to-Text) - MIỄN PHÍ
   */
  static async transcribeAudio(audioBuffer, mimeType) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    if (!process.env.GROQ_API_KEY) {
      throw new Error('Thiếu GROQ_API_KEY trong biến môi trường');
    }

    try {
      // Tạo File object từ buffer
      const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('wav') ? 'wav' : 'mp3';
      const file = new File([audioBuffer], `speech.${ext}`, { type: mimeType });

      const transcription = await groq.audio.transcriptions.create({
        model: 'whisper-large-v3-turbo',
        file: file,
        language: 'en',
      });

      // Clean transcription
      let cleanText = transcription.text?.trim() || '';
      cleanText = cleanText
        .replace(/[;:'"()-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const normalizedText = cleanText.toLowerCase();
      // Whisper sometimes hallucinate "thank you" for silence
      if (normalizedText === 'thank you' || normalizedText === 'thanks' || normalizedText === '') {
        return '';
      }
      
      return cleanText;
    } catch (error) {
      console.error('[SpeechService] Transcribe error:', error.message);
      return ''; 
    }
  }

  /**
   * Step 2: Groq + Llama 3 - Chấm điểm phát âm
   */
  static async evaluateWithGroq(spokenText, expectedText, aiMode) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Clean up spoken text - remove extra spaces and normalize
    const cleanSpokenText = spokenText?.trim().replace(/\s+/g, ' ') || '';
    const cleanExpectedText = expectedText?.trim().replace(/\s+/g, ' ') || '';

    // Prompt for scoring
    const scoringPrompt = `You are an English pronunciation coach.

Evaluate the user's spoken sentence compared with the reference sentence.

Reference sentence:
"${cleanExpectedText}"

User transcription:
"${cleanSpokenText}"

Score the speaking performance using these metrics:

1. Pronunciation
2. Fluency
3. Completion

Your task is to score the user's spoken response based on Pronunciation, Fluency, and Completion.

IMPORTANT SCORING RULES

1. General Principles
- Be fair and supportive for language learners.
- Prioritize intelligibility and communication over perfect pronunciation.
- Do not penalize minor pronunciation differences too harshly.
- If the sentence is understandable, increase the score slightly.
- Apply a small leniency adjustment (~+10%) to avoid overly strict scoring.
- However, leniency should not push scores above 95% unless the sentence is nearly perfect.
- Scores should reflect the overall speaking quality, not just individual errors.
- Always compare the spoken transcript with the target sentence.

2. Pronunciation Score
Pronunciation measures how accurately the user pronounced the spoken words.

Guidelines:
- 90–100%: Very clear pronunciation, only minor accent differences.
- 75–89%: Mostly correct pronunciation, a few mispronounced sounds but still clear.
- 60–74%: Several pronunciation mistakes, but the sentence is still understandable.
- 40–59%: Many pronunciation errors that make understanding difficult.
- 0–39%: Most words are mispronounced or difficult to recognize.

Additional rules:
- Minor accent differences should not significantly reduce the score.
- If a word is recognizable despite imperfect pronunciation, give partial credit.
- Do not penalize small stress or intonation differences heavily.

3. Fluency Score
Fluency measures the smoothness and natural flow of speech.

Guidelines:
- 90–100%: Smooth speech with natural pacing and almost no pauses.
- 75–89%: Mostly fluent with a few short pauses or hesitations.
- 60–74%: Noticeable pauses or uneven pacing but still understandable.
- 40–59%: Frequent pauses, hesitations, or fragmented speech.
- 1–39%: Very slow, broken speech with long pauses.
- 0%: The user said almost nothing or only silence.

Additional rules:
- Fluency should not be 0% unless the user said almost nothing.
- Small pauses or thinking time are normal for language learners.
- Slight hesitation should not drastically reduce the score.

4. Completion Score
Completion measures how much of the expected sentence content was spoken compared to the target sentence.

Guidelines:
- 90–100%: Almost all key words from the target sentence were spoken.
- 75–89%: Most of the sentence was spoken, but a few words are missing.
- 50–74%: About half of the sentence was spoken.
- 25–49%: Only a few words from the sentence were spoken.
- 1–24%: Very little content spoken.
- 0%: No meaningful speech detected.

Additional rules:
- Completion depends on how many key words match the target sentence.
- Missing or incorrect words should reduce the score proportionally.
- If the spoken words are completely different from the target sentence, Completion should be very low (0–20%).
- Pronunciation mistakes should not significantly reduce Completion if the intended word is recognizable.
- Completion should only be above 90% if nearly all key words match the target sentence.

5. Final Score Adjustment
After calculating individual scores:
- Apply a small leniency adjustment (~+10%) to support learners.
- Ensure the final score still reflects the actual speaking quality.
- Do not inflate scores unrealistically.
- Scores above 95% should only be given for nearly perfect responses.


Return scores from 0–100 for:
Pronunciation
Fluency
Completion

Then calculate the overall score.

Return result in JSON format:

{
 "overall_score": number,
 "pronunciation": number,
 "fluency": number,
 "completion": number
}`;

    // Prompt for feedback (Vietnamese, audio-friendly)
    const feedbackPrompt = `Bạn là AI huấn luyện phát âm tiếng Anh cho người Việt.

Người học vừa nói một câu tiếng Anh. Hãy phản hồi ngắn gọn bằng tiếng Việt để giúp họ nhận ra lỗi phát âm.

Thông tin:
Câu đúng: "${cleanExpectedText}"
Câu người học nói: "${cleanSpokenText}"

Chế độ phản hồi: ${aiMode}

YÊU CẦU QUAN TRỌNG:
- Chỉ phản hồi bằng 1 câu ngắn (tối đa 50 từ).
- Cho phép sử dụng dấu câu cơ bản như chấm, phẩy, chấm hỏi, chấm than để giọng nói tự nhiên hơn.
- Không nhắc đến điểm số.
- Phản hồi tự nhiên để đọc bằng giọng nói.
- Nếu có từ phát âm sai, hãy nhắc nhẹ và gợi ý nói lại.
- Không có từ tiếng Anh trong câu phản hồi.
- Phong cách phản hồi phụ thuộc vào chế độ:

none:
Không trả lời gì cả.

friendly:
Giọng thân thiện, khích lệ nhẹ nhàng.

playful:
Hài hước, tinh nghịch, có thể đùa nhẹ với lỗi phát âm.

strict:
Nghiêm khắc nhưng không xúc phạm, tập trung vào sửa lỗi.

Chỉ trả về câu phản hồi, không giải thích thêm.`;

    try {
      // Run both prompts in parallel
      const [scoringCompletion, feedbackCompletion] = await Promise.all([
        groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: scoringPrompt }],
          temperature: 0.3,
          max_tokens: 200,
          response_format: { type: 'json_object' },
        }),
        aiMode !== 'none' ? groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: feedbackPrompt }],
          temperature: 0.5,
          max_tokens: 100,
        }) : Promise.resolve({ choices: [{ message: { content: '' } }] })
      ]);

      // Parse scoring response
      const scoringResponse = scoringCompletion.choices[0]?.message?.content || '{}';
      console.log('[Groq] Scoring Response:', scoringResponse.substring(0, 200));
      const result = JSON.parse(scoringResponse);

      // Get feedback text and clean it up 
      let feedbackText = aiMode !== 'none' 
        ? feedbackCompletion.choices[0]?.message?.content || 'Tiếp tục cố gắng nhé'
        : '';
      
      // Clean feedback text - remove only weird extra spaces, KEEP punctuation for ElevenLabs
      feedbackText = feedbackText
        .trim()
        .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
        .trim();

      return {
        overall_score: Math.min(100, Math.max(0, result.overall_score || 0)),
        pronunciation: Math.min(100, Math.max(0, result.pronunciation || 0)),
        fluency: Math.min(100, Math.max(0, result.fluency || 0)),
        completion: Math.min(100, Math.max(0, result.completion || 0)),
        feedback: feedbackText,
      };
    } catch (error) {
      console.error('[Groq] Error:', error.message);
      return {
        overall_score: 50,
        pronunciation: 50,
        fluency: 50,
        completion: 50,
        feedback: 'Cố gắng thêm nhé',
      };
    }
  }

  /**
   * Main: Kết hợp Whisper + Groq để chấm điểm
   */
  static async evaluateSpeech(audioBuffer, mimeType, expectedText, aiMode) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Thiếu GROQ_API_KEY');
    }

    try {
      // Step 1: Whisper transcription (already cleaned in transcribeAudio)
      const spokenText = await this.transcribeAudio(audioBuffer, mimeType);

      if (!spokenText || spokenText.trim().length === 0) {
        return {
          spokenText: '',
          overall_score: 0,
          pronunciation: 0,
          fluency: 0,
          completion: 0,
          feedback: 'Không nhận diện được giọng nói. Vui lòng nói to và rõ hơn',
        };
      }

      // Step 2: Groq evaluation
      const evaluation = await this.evaluateWithGroq(spokenText, expectedText, aiMode);

      return {
        spokenText: spokenText, // Already clean from transcribeAudio
        overall_score: evaluation.overall_score,
        pronunciation: evaluation.pronunciation,
        fluency: evaluation.fluency,
        completion: evaluation.completion,
        feedback: evaluation.feedback,
      };
    } catch (error) {
      console.error('[SpeechService] Error:', error.message);
      throw error;
    }
  }

  static getPersonaInstruction(aiMode) {
    switch (aiMode) {
      case 'none': return 'Do not provide feedback, just score.';
      case 'playful': return 'Hãy nhận xét một cách tinh nghịch, hài hước, có thể trêu đùa một chút (tiếng Việt).';
      case 'strict': return 'Hãy nhận xét cực kỳ gay gắt, thẳng thắn, không khoan nhượng về lỗi sai nhưng vẫn công bằng (tiếng Việt).';
      case 'friendly':
      default: return 'Hãy nhận xét thật thân thiện, lịch sự, động viên và khích lệ người học (tiếng Việt).';
    }
  }

  /**
   * Chuẩn hoá và so sánh Levenshtein để tìm lỗi sai
   */
  static calculateWrongWords(expectedText, spokenText) {
    if (!spokenText || spokenText.trim().length === 0) return expectedText.split(' ');

    const normalize = (str) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();

    const expectedWords = normalize(expectedText).split(/\s+/);
    const spokenWords = normalize(spokenText).split(/\s+/);

    let wrongWords = [];
    for (const expWord of expectedWords) {
      let bestDistance = Infinity;
      for (const spWord of spokenWords) {
        const distance = levenshtein.get(expWord, spWord);
        if (distance < bestDistance) {
          bestDistance = distance;
        }
      }
      const threshold = expWord.length > 3 ? 1 : 0;
      if (bestDistance > threshold) {
        wrongWords.push(expWord);
      }
    }
    return wrongWords;
  }

  /**
   * Timed Speaking Practice: Generate a random speaking prompt
   */
  static async generateTimedSpeakingPrompt() {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Thiếu GROQ_API_KEY trong biến môi trường');
    }

    const prompt = `You are an English language testing system (like IELTS speaking part 2).
Generate a random, engaging, and common speaking topic for an English learner.
The topic should be suitable for a 2-minute speaking practice.
Return ONLY THE PROMPT TEXT, nothing else (no intro, no quotes around it, no "Here is a prompt").
Examples of good prompts:
- Describe your favorite travel destination and why you love it.
- Talk about a book you read recently that had a strong impact on you.
- Describe an unforgettable experience from your childhood.`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 50,
      });

      let topic = completion.choices[0]?.message?.content || 'Describe your daily routine to stay healthy.';
      return topic.trim().replace(/^"|"$/g, '');
    } catch (error) {
      console.error('[SpeechService] Error generating prompt:', error.message);
      return 'Describe a person you admire and explain why.'; // Fallback
    }
  }

  /**
   * Timed Speaking Practice: Evaluate the audio based on the given prompt
   */
  static async evaluateTimedSpeaking(audioBuffer, mimeType, prompt) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Thiếu GROQ_API_KEY');
    }

    try {
      // Step 1: Transcribe audio
      const spokenText = await this.transcribeAudio(audioBuffer, mimeType);

      if (!spokenText || spokenText.trim().length === 0) {
        return {
          spokenText: '',
          pronunciation: 0,
          fluency: 0,
          strengths: 'Chưa nhận diện được giọng nói.',
          weaknesses: 'Vui lòng thu âm lại với giọng nói to và rõ ràng hơn.',
          sampleAnswer: 'Không có dữ liệu để tạo câu trả lời mẫu cho bài làm trống.',
        };
      }

      // Step 2: Groq evaluation for Timed Speaking
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const cleanSpokenText = spokenText.trim().replace(/\s+/g, ' ');

      const evaluationPrompt = `You are an expert English speaking examiner for Vietnamese learners.
Evaluate the user's spoken response to the following prompt.

Prompt: "${prompt}"

User's Response:
"${cleanSpokenText}"

Tasks:
1. Score Pronunciation (0-10)
2. Score Fluency (0-10)
3. Identify 1 main strength of the response (in Vietnamese, friendly, concise).
4. Identify 1 main area for improvement/weakness (in Vietnamese, constructive, concise).
5. Provide a short, native-like sample answer (in English) that perfectly addresses the prompt within ~1 minute of speaking (about 100-130 words).

IMPORTANT:
- If the user's response is extremely short, completely off-topic, or just a few random words, lower the scores significantly.
- Responses should be formatted exactly as JSON.

Return result in JSON format:
{
 "pronunciation": number (out of 10),
 "fluency": number (out of 10),
 "strengths": string (in Vietnamese),
 "weaknesses": string (in Vietnamese),
 "sampleAnswer": string (in English)
}`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: evaluationPrompt }],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const responseString = completion.choices[0]?.message?.content || '{}';
      console.log('[Groq Timed Speaking] Response:', responseString.substring(0, 200));
      const result = JSON.parse(responseString);

      return {
        spokenText: cleanSpokenText,
        pronunciation: Math.min(10, Math.max(0, result.pronunciation || 0)),
        fluency: Math.min(10, Math.max(0, result.fluency || 0)),
        strengths: result.strengths || 'Nội dung trả lời ổn định.',
        weaknesses: result.weaknesses || 'Cần luyện tập thêm để nói lưu loát hơn.',
        sampleAnswer: result.sampleAnswer || 'N/A'
      };
    } catch (error) {
      console.error('[SpeechService] Error evaluating timed speaking:', error.message);
      throw error;
    }
  }

  /**
   * AI Conversation: Generate the initial greeting
   */
  static async generateConversationStart(role, scenario) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    if (!process.env.GROQ_API_KEY) throw new Error('Thiếu GROQ_API_KEY');

    const prompt = `You are playing the role of a ${role} in a ${scenario} scenario.
You are talking to an English language learner.
Initiate the conversation with a short, natural, and engaging opening statement or question.
Also, provide EXACTLY 3 short, natural English phrases (hints) the user could say in response.

Return JSON EXACTLY like this (NO quotes around the whole thing):
{
  "aiText": "Greeting text here (max 25 words)",
  "hints": ["Phrase 1", "Phrase 2", "Phrase 3"]
}`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        aiText: (response.aiText || "Hello! So glad to see you. How can I help you?").trim().replace(/^"|"$/g, ''),
        hints: response.hints || ["I'm doing well!", "How are you?", "Nice to meet you."]
      };
    } catch (error) {
       console.error('[SpeechService] Error generating conversation start:', error.message);
       return {
         aiText: `Hello! How are you doing today?`,
         hints: ["I'm doing well, thanks!", "I'm great, how about you?"]
       };
    }
  }

  /**
   * AI Conversation: Generate response and correction
   */
  static async generateConversationResponse(history, role, scenario, isInitiative = false) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    if (!process.env.GROQ_API_KEY) throw new Error('Thiếu GROQ_API_KEY');

    // history is an array of { role: 'user' | 'ai', content: '...' }
    let systemPrompt = `You are playing the role of a ${role} in a ${scenario} scenario talking to an English learner.
Respond naturally to the user's latest message based on the conversation history. Keep your response conversational, engaging, and relatively short (max 40 words).`;

    if (isInitiative) {
      systemPrompt = `You are a ${role} in a ${scenario} scenario. 
The user has been silent. You MUST re-engage the user or check if they need help.
IMPORTANT: DO NOT repeat your previous message or question. Ask a DIFFERENT follow-up question related to the topic or scenario, or offer a suggestion on what to talk about next.
Keep it under 20 words.`;
    }

    systemPrompt += `\n\nEvaluate the user's messages for grammar if possible.
Also, provide EXACTLY 3 short, natural English phrases (hints) the user could say next to keep the conversation going.

Return JSON:
{
  "aiText": "Your response here",
  "correction": "Correction or null",
  "suggestion": "Vietnamese explanation",
  "hints": ["Phrase 1", "Phrase 2", "Phrase 3"]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content }))
    ];

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        temperature: 0.6,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });

      const responseString = completion.choices[0]?.message?.content || '{}';
      const result = JSON.parse(responseString);
      return {
          aiText: result.aiText || "I understand. Let's talk more.",
          correction: result.correction || null,
          suggestion: result.suggestion || null,
          hints: result.hints || ["What do you mean?", "Could you repeat?", "Tell me more."]
      };
    } catch (error) {
       console.error('[SpeechService] Error generating conversation response:', error.message);
       return {
         aiText: "I'm sorry, I didn't quite catch that. Could you repeat?",
         correction: null,
         suggestion: "Hệ thống đang gặp gián đoạn nhỏ, bạn thử nói lại nhé.",
         hints: ["Can you repeat that?", "I didn't hear you clearly.", "What did you say?"]
       };
    }
  }

  /**
   * AI Conversation: Evaluate the entire transcript
   */
  static async evaluateConversationTranscript(history) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    if (!process.env.GROQ_API_KEY) throw new Error('Thiếu GROQ_API_KEY');

    // Filter only messages with real user content
    const userMessages = history.filter(msg => msg.role === 'user' && msg.content && msg.content.trim() !== '...' && msg.content.trim().length > 2);
    
    if (userMessages.length === 0) {
      return {
        overallScore: 0,
        strengths: 'Chưa có nội dung nói nào được ghi nhận.',
        weaknesses: 'Bạn chưa nói được gì trong cuộc trò chuyện này.',
        tips: 'Hãy thử nói vài câu đơn giản để làm quen trước.'
      };
    }

    const transcript = history.map(msg => `${msg.role === 'ai' ? 'AI' : 'User'}: ${msg.content}`).join('\n');

    const systemPrompt = `Bạn là một chuyên gia huấn luyện tiếng Anh cho người Việt.
QUAN TRỌNG: Phản hồi phải hoàn toàn bằng tiếng Việt, ngắn gọn, dễ hiểu.
QUAN TRỌNG: Bạn chỉ được trả về JSON valid. Tuyệt đối không sử dụng dấu ngoặc kép (") bên trong nội dung các chuỗi JSON. Nếu muốn nhấn mạnh từ, hãy sử dụng dấu ngoặc đơn (') hoặc viết hoa.

Định dạng JSON bắt buộc:
{
 "overallScore": số từ 0-100,
 "strengths": "chuỗi",
 "weaknesses": "chuỗi",
 "tips": "chuỗi"
}`;

    const userPrompt = `Đoạn hội thoại sau đây cần được đánh giá:\n\n${transcript}`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const responseString = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(responseString);
    } catch (error) {
      console.error('[SpeechService] Error evaluating conversation:', error.message);
      return {
        overallScore: 70,
        strengths: 'Có nỗ lực giao tiếp trong tình huống thực tế.',
        weaknesses: 'Cần chú ý hơn về phát âm và cấu trúc câu.',
        tips: 'Hãy thử nghe lại các đoạn hội thoại mẫu và thực hành lặp lại.'
      };
    }
  }
}
