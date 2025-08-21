import React, { useState, useRef } from 'react';
import { Message } from './types';
import './App.css';
import ContextMenu, { MenuItem } from './ContextMenu';
import usePlanCategories from './hooks/usePlanCategories';
import WriteSourceCodeModal from './components/WriteSourceCodeModal';
import { COLLAPSE_LENGTH, ROLE_CONFIGS } from './config';
import ResendConfirmModal from './components/ResendConfirmModal';
import {
  deleteMessagesApi,
  removeMessagesByIds,
} from './utils/messageActions';
import ChatBubbleGroup, { groupMessages } from './components/ChatBubbleGroup';
function getFullContent(msg: Message): string {
  if (typeof msg.content === 'string') {
    // 不要简单地移除所有HTML标签，而是要保留原始内容
    // 只移除特定的等待动画标签
    let content = msg.content;
    // 移除等待动画标签
    content = content.replace(/<span class="waiting-typing">.*?<\/span>/g, '');
    // 移除其他可能的系统标签，但保留代码块等用户内容
    content = content.replace(/<span[^>]*class="[^"]*system[^"]*"[^>]*>.*?<\/span>/g, '');
    return content;
  }
  return String(msg.content);
}
function trimEndLines(text: string): string {
  const lines = text.split('\n');
  let end = lines.length - 1;
  while (end >= 0 && (lines[end].trim() === '' || lines[end].trim() === '------')) {
    end--;
  }
  return lines.slice(0, end + 1).join('\n');
}
// 计算文本字数（中文按1字符，英文按0.5字符计算）
function getTextCharCount(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.replace(/[\u4e00-\u9fff]/g, '').length;
  return Math.ceil(chineseChars + otherChars * 0.5);
}
interface ChatBoxProps {
  messages: Message[];
  onToggle: (index: number) => void;
  onCopy: (text: string) => void;
  onSave: (text: string) => void;
  conversationMeta?: {
    projectId?: number;
    name?: string;
  };
  onRelayRole?: (role: string, content: string) => void;
  onInputValueChange?: (content: string) => void;
  setMessages?: (messages: Message[]) => void; // 新增：用于本地消息更新
}
const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onToggle,
  onCopy,
  onSave,
  conversationMeta,
  onRelayRole,
  onInputValueChange,
  setMessages, // 新增：用于本地消息更新
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);
  const [localDeletingIds, setLocalDeletingIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [resendModal, setResendModal] = useState<{ visible: boolean; targetIdx: number | null }>({
    visible: false,
    targetIdx: null,
  });
  const [resendLoading, setResendLoading] = useState(false);
  const [writeSourceModal, setWriteSourceModal] = useState<{
    visible: boolean;
    rootDir: string;
    filesContent: string;
  }>({
    visible: false,
    rootDir: '',
    filesContent: '',
  });
  const plan = usePlanCategories();
  const bubbleRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  // 删除单条消息
  const handleDeleteSingle = async (index: number) => {
    const msg = messages[index];
    if (!msg || typeof msg.id !== 'number') return;
    if (!window.confirm('确定要删除此条消息吗？')) return;
    setDeleting(true);
    const msgId = msg.id as number;
    setLocalDeletingIds(new Set([msgId]));
    try {
      // 先调用后端删除API
      await deleteMessagesApi([msgId]);
      // 删除成功后立即更新前端状态
      if (setMessages) {
        setMessages(messages.filter((m, idx) => idx !== index));
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      alert('删除消息失败，请重试');
      // 删除失败时恢复状态
      setLocalDeletingIds(new Set());
    } finally {
      setDeleting(false);
    }
  };
  // 删除消息组
  const handleDeleteGroup = async (indices: number[]) => {
    const ids = indices
      .map(i => messages[i])
      .filter(m => m && typeof m.id === 'number')
      .map(m => m.id as number);
    if (ids.length === 0) return;
    if (!window.confirm(`确定要删除这${ids.length}条消息吗？`)) return;
    setDeleting(true);
    setLocalDeletingIds(new Set(ids));
    try {
      // 先调用后端删除API
      await deleteMessagesApi(ids);
      // 删除成功后立即更新前端状态
      if (setMessages) {
        const removeSet = new Set(ids);
        setMessages(messages.filter((msg) => !removeSet.has(msg.id as number)));
      }
    } catch (error) {
      console.error('删除消息组失败:', error);
      alert('删除消息组失败，请重试');
      // 删除失败时恢复状态
      setLocalDeletingIds(new Set());
    } finally {
      setDeleting(false);
    }
  };
  // 重发弹窗触发
  const handleResendSingle = (index: number) => setResendModal({ visible: true, targetIdx: index });
  // 重发确认：收集 index 及其之后所有消息的 id
  const handleResendConfirm = async () => {
    if (resendModal.targetIdx == null) return;
    const idx = resendModal.targetIdx;
    const targetMsg = messages[idx];
    // 收集idx及其之后所有消息id
    const idsToDelete: number[] = [];
    for (let i = idx; i < messages.length; i++) {
      const id = messages[i]?.id;
      if (typeof id === 'number') idsToDelete.push(id);
    }
    setResendLoading(true);
    setLocalDeletingIds(new Set(idsToDelete));
    try {
      // 先调用后端删除API
      if (idsToDelete.length > 0) {
        await deleteMessagesApi(idsToDelete);
      }
      // 删除成功后立即更新前端状态
      if (setMessages) {
        const newMsgs = messages.filter((msg, i) => i < idx);
        setMessages(newMsgs);
      }
      // 自动填入输入框
      if (onInputValueChange) {
        onInputValueChange(getFullContent(targetMsg));
      }
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.focus();
      }, 80);
    } catch (error) {
      console.error('重发失败:', error);
      alert('重发失败，请重试');
      // 失败时恢复状态
      setLocalDeletingIds(new Set());
    } finally {
      setResendLoading(false);
      setResendModal({ visible: false, targetIdx: null });
    }
  };
  const handleSendTo = async (category_id: number, categoryName: string, content: string) => {
    if (!conversationMeta?.projectId) {
      alert('会话未关联项目，无法发送');
      return;
    }
    try {
      const { createPlanDocument } = await import('./api');
      await createPlanDocument({
        project_id: conversationMeta.projectId,
        filename: conversationMeta.name || '未命名会话',
        category_id,
        content,
        version: 1,
        source: 'chat',
      });
      alert(`文档已发送到《${categoryName}》！`);
    } catch (e: any) {
      alert('发送失败: ' + (e?.message || e));
    }
  };
  // 写入项目源码
  const handleWriteSourceCode = async (content: string) => {
    if (!conversationMeta?.projectId) {
      alert('会话未关联项目，无法写入源码');
      return;
    }
    try {
      // 获取项目详情，获取AI工作目录
      const { getProjectDetail } = await import('./api');
      const project = await getProjectDetail(conversationMeta.projectId);
      const aiWorkDir = project.ai_work_dir || project.aiWorkDir;
      if (!aiWorkDir) {
        alert('项目未配置AI工作目录，无法写入源码');
        return;
      }
      // 打开写入源码弹窗
      setWriteSourceModal({
        visible: true,
        rootDir: aiWorkDir,
        filesContent: content,
      });
    } catch (e: any) {
      alert('获取项目信息失败: ' + (e?.message || e));
    }
  };
  const handleRightClick = (
    e: React.MouseEvent,
    groupIdx: number,
    msgIdx: number | null,
    group: { role: string; msgs: Message[]; indices: number[]; ids: (number | undefined)[] }
  ) => {
    e.preventDefault();
    const relayMenu: MenuItem = {
      label: '转交角色...',
      submenu: Object.keys(ROLE_CONFIGS).map(role => ({
        label: role,
        onClick: () => {
          let relayContent = '';
          if (msgIdx !== null && group.msgs[msgIdx]) {
            relayContent = getFullContent(group.msgs[msgIdx]);
          } else {
            relayContent = group.msgs
              .map((msg) => trimEndLines(getFullContent(msg)))
              .join('\n------\n');
          }
          onRelayRole?.(role, relayContent);
        }
      }))
    };
    if (msgIdx !== null && group.msgs[msgIdx]) {
      const idx = group.indices[msgIdx];
      const msg = group.msgs[msgIdx];
      const content = getFullContent(msg);
      const charCount = getTextCharCount(content);
      const dynamicAction: MenuItem = msg.collapsed
        ? { label: '展开', onClick: () => onToggle(idx) }
        : { label: '折叠', onClick: () => onToggle(idx) };
      const sendToMenu: MenuItem = {
        label: `发送${charCount}字到...`,
        submenu: (plan.categories || []).map((cat) => ({
          label: cat.name,
          onClick:() => handleSendTo(cat.id, cat.name, content),
        })),
      };
      const resendMenu: MenuItem = {
        label: '编辑重发',
        onClick: () => handleResendSingle(idx),
      };
      const deleteMenu: MenuItem = {
        label: '删除',
        onClick: () => handleDeleteSingle(idx),
      };
      const writeSourceMenu: MenuItem = {
        label: '写入项目源码',
        onClick: () => handleWriteSourceCode(content),
      };
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          relayMenu,
          { label: '复制', onClick: () => onCopy(content) },
          { label: '保存', onClick: () => onSave(content) },
          sendToMenu,
          writeSourceMenu,
          dynamicAction,
          resendMenu,
          deleteMenu,
        ],
      });
    } else {
      const allContent = group.msgs
        .map((msg) => trimEndLines(getFullContent(msg)))
        .join('\n------\n');
      const charCount = getTextCharCount(allContent);
      const deleteMenu: MenuItem = {
        label: '删除组',
        onClick: () => handleDeleteGroup(group.indices),
      };
      const sendToMenu: MenuItem = {
        label: `发送${charCount}字到...`,
        submenu: (plan.categories || []).map((cat) => ({
          label: cat.name,
          onClick: () => handleSendTo(cat.id, cat.name, allContent),
        })),
      };
      const writeSourceMenu: MenuItem = {
        label: '写入项目源码',
        onClick: () => handleWriteSourceCode(allContent),
      };
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          relayMenu,
          { label: '复制', onClick: () => onCopy(allContent) },
          { label: '保存', onClick: () => onSave(allContent) },
          sendToMenu,
          writeSourceMenu,
          deleteMenu,
        ],
      });
    }
  };
  // 过滤掉本地标记删除的气泡，用于UI显示
  const filteredMessages = messages.filter(
    msg => !localDeletingIds.has(msg.id as number)
  );
  const groups = groupMessages(filteredMessages);
  return (
    <div>
      <ChatBubbleGroup
        groups={groups}
        bubbleRefs={bubbleRefs}
        onRightClick={handleRightClick}
        onToggle={onToggle}
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
      <ResendConfirmModal
        visible={resendModal.visible}
        loading={resendLoading}
        onConfirm={handleResendConfirm}
        onCancel={() => setResendModal({ visible: false, targetIdx: null })}
      />
      <WriteSourceCodeModal
        visible={writeSourceModal.visible}
        onClose={() => setWriteSourceModal({ visible: false, rootDir: '', filesContent: '' })}
        rootDir={writeSourceModal.rootDir}
        filesContent={writeSourceModal.filesContent}
      />
    </div>
  );
};
export default ChatBox;