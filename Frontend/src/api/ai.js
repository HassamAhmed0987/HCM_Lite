import client from './client';

// Points 19, 20, 21, 22 — RAG / policy Q&A / smart leave input
// Response: { prompt, aiResponse }
export const sendAiPrompt = (prompt) => client.post('/ai/chat', { prompt }).then((r) => r.data);
