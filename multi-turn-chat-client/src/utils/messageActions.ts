import { Message } from '../types';
import { BASE_URL, API_KEY } from '../config';

export async function deleteMessagesApi(messageIds: number[]): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/messages/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ message_ids: messageIds }),
  });
  if (!res.ok) {
    let err;
    try {
      err = await res.json();
    } catch {
      err = {};
    }
    throw new Error(err?.message || '删除消息失败');
  }
}

/**
 * 获取指定index及其之后的所有消息的id
 */
export function collectIdsFrom(messages: Message[], fromIndex: number): number[] {
  return messages
    .slice(fromIndex)
    .map((msg) => typeof msg.id === 'number' ? msg.id : null)
    .filter((id): id is number => id !== null);
}

/**
 * 移除指定的id的消息
 */
export function removeMessagesByIds(messages: Message[], removeIds: number[]): Message[] {
  const removeSet = new Set(removeIds);
  return messages.filter(msg => !removeSet.has(msg.id as number));
}