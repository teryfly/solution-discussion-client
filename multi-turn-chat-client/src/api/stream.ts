import { BASE_URL, API_KEY, WRITE_SOURCE_CODE_CONFIG } from '../config';

export async function sendMessageStream(
  conversationId: string,
  content: string,
  model: string,
  documentIds: number[] = [],
  knowledgeContent: string = '',
  onChunk: (text: string, metadata?: { user_message_id?: number; assistant_message_id?: number; conversation_id?: string; session_id?: string }) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  try {
    const requestBody: any = {
      role: 'user',
      content,
      model,
      stream: true,
    };
    if (documentIds.length > 0) requestBody.documents = documentIds;
    if (knowledgeContent.trim()) requestBody.system_prompt_append = knowledgeContent;

    onChunk('');

    const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });
    if (!res.body || !res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let isFirstMessage = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      for (const part of parts) {
        if (!part.startsWith('data:')) continue;
        const json = part.slice(5).trim();
        if (json === '[DONE]') { onDone(); return; }
        try {
          const payload = JSON.parse(json);
          if (isFirstMessage && (payload.user_message_id || payload.assistant_message_id)) {
            isFirstMessage = false;
            onChunk('', {
              user_message_id: payload.user_message_id,
              assistant_message_id: payload.assistant_message_id,
              conversation_id: payload.conversation_id,
              session_id: payload.session_id,
            });
          }
          if (payload.content) onChunk(payload.content);
        } catch (err) {
          console.warn('解析 SSE 错误:', err, json);
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}

export async function writeSourceCode(
  rootDir: string,
  filesContent: string,
  onChunk: (data: { message: string; type: string; timestamp: string; data?: any }) => void,
  onDone: () => void,
  onError: (err: any) => void
): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/write-source-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        root_dir: rootDir,
        files_content: filesContent,
        log_level: WRITE_SOURCE_CODE_CONFIG.log_level,
        backup_enabled: WRITE_SOURCE_CODE_CONFIG.backup_enabled,
      }),
    });
    if (!res.body || !res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { onDone(); return; }
          try { onChunk(JSON.parse(jsonStr)); }
          catch (err) { console.warn('解析写入源码API响应错误:', err, jsonStr); }
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}