// src/hooks/useDeleteMessages.ts
import { useState } from 'react';

export async function deleteMessagesApi(messageIds: number[]): Promise<void> {
  const res = await fetch('/v1/chat/messages/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export default function useDeleteMessages() {
  const [deleting, setDeleting] = useState(false);

  const deleteMessages = async (
    messageIds: number[],
    onSuccess?: () => void,
    onError?: (err: any) => void
  ) => {
    setDeleting(true);
    try {
      await deleteMessagesApi(messageIds);
      onSuccess?.();
    } catch (err) {
      onError?.(err);
    } finally {
      setDeleting(false);
    }
  };

  return { deleting, deleteMessages };
}