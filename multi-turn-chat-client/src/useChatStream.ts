// useChatStream.ts
import { useState } from 'react';
import { sendMessageStream } from './api';
import { Message } from './types';
import { MAX_AUTO_CONTINUE_ROUNDS } from './config';

/**
 * 检查是否需要自动继续
 * - 包含 [to be continue] 结尾（不区分大小写）
 * - 或者：存在某个 Step [X/Y] 且 X < Y，并且该 Y 没有对应的 Step [Y/Y]（即流程未真正完成）
 */
function shouldAutoContinue(text: string, rounds: number): boolean {
  if (rounds >= MAX_AUTO_CONTINUE_ROUNDS) return false;

  // 如果明确以 [to be continue] 结尾，优先继续
  if (/\[to be continue\]\s*$/i.test(text)) {
    return true;
  }

  // 解析所有 Step [X/Y]
  const stepMatches = [...text.matchAll(/Step\s*\[\s*(\d+)\s*\/\s*(\d+)\s*\]/gi)];
  if (stepMatches.length === 0) return false;

  // 统计每个 Y 是否有 X<Y （未完成）以及是否有 X==Y（完成终步）
  type StepInfo = { hasIncomplete: boolean; hasFinal: boolean };
  const map = new Map<number, StepInfo>();

  for (const match of stepMatches) {
    const x = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    if (!map.has(y)) {
      map.set(y, { hasIncomplete: false, hasFinal: false });
    }
    const info = map.get(y)!;
    if (x < y) {
      info.hasIncomplete = true;
    } else if (x === y) {
      info.hasFinal = true;
    }
    // ignore x > y as malformed
  }

  // 如果存在某个 total Y，之前有未完成的 step 且没有 final 完成标记，就继续
  for (const [, info] of map) {
    if (info.hasIncomplete && !info.hasFinal) {
      return true;
    }
  }

  return false;
}

/**
 * 通用递归流式对话工具（可用于hook和非hook场景）
 */
export function createChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void,
  setLoading?: (v: boolean) => void
) {
  // 自动递归 continue
  const send = async (input: string) => {
    if (!input.trim()) return;
    setLoading?.(true);

    let rounds = 0;
    let userMessageId: number | undefined;
    let assistantMessageId: number | undefined;

    // 内部递归: assistant流式回复
    const sendOne = async (prompt: string) => {
      let streamedReply = '';
      let isFirstChunk = true;

      // 先添加用户消息（暂时没有ID）
      appendMessage({ role: 'user', content: prompt, collapsed: false });

      // 插入等待动画
      appendMessage(
        { role: 'assistant', content: '<span class="waiting-typing">正在思考……</span>', collapsed: false }
      );

      try {
        await sendMessageStream(
          conversationId,
          prompt,
          model,
          (chunk, metadata) => {
            // 第一个chunk时处理消息ID
            if (isFirstChunk && metadata) {
              isFirstChunk = false;
              
              // 保存消息ID
              if (metadata.user_message_id) {
                userMessageId = metadata.user_message_id;
              }
              if (metadata.assistant_message_id) {
                assistantMessageId = metadata.assistant_message_id;
              }

              // 更新用户消息，添加ID（替换倒数第二条消息）
              if (userMessageId) {
                appendMessage(
                  { role: 'user', content: prompt, collapsed: false, id: userMessageId },
                  false // 先不替换，而是添加新的带ID的消息
                );
                
                // 然后移除旧的用户消息（通过重新构建消息列表的方式）
                // 这里我们依赖外部组件来处理消息去重
              }
            }

            // 处理内容chunk
            if (chunk) {
              streamedReply += chunk;
              appendMessage(
                { 
                  role: 'assistant', 
                  content: streamedReply, 
                  collapsed: false,
                  id: assistantMessageId 
                },
                true // 替换最后一条助手消息
              );
            }
          },
          async () => {
            if (shouldAutoContinue(streamedReply, rounds)) {
              rounds++;
              // 移除末尾 [to be continue]（如果有）
              streamedReply = streamedReply.replace(/\s*\[to be continue\]\s*$/i, '').trim();
              appendMessage(
                { 
                  role: 'assistant', 
                  content: streamedReply, 
                  collapsed: false,
                  id: assistantMessageId 
                },
                true
              );
              await sendOne('go on');
            } else {
              appendMessage(
                { 
                  role: 'assistant', 
                  content: streamedReply, 
                  collapsed: false,
                  id: assistantMessageId 
                },
                true
              );
              setLoading?.(false);
            }
          },
          () => {
            setLoading?.(false);
          }
        );
      } catch (e) {
        appendMessage(
          { role: 'assistant', content: '⚠️ 出现错误: ' + ((e as any)?.message || e), collapsed: false }
        );
        setLoading?.(false);
      }
    };

    await sendOne(input);
  };

  return { send };
}

/**
 * React hook 封装
 */
export default function useChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void
) {
  const [loading, setLoading] = useState(false);
  const { send } = createChatStream(conversationId, model, appendMessage, setLoading);
  return { send, loading };
}