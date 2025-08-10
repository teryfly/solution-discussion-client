import { SaveOption } from './types';
// 复制代码内容（仅右侧复制按钮）
export const handleCopyCode = (code: string, setCopied: (value: boolean) => void) => {
  navigator.clipboard.writeText(code).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  });
};
// 点击文件块：复制代码 -> 复制文件名（仅文件名块变绿，不影响“保存”按钮）
export const handleFileBlockCopy = async (
  code: string,
  fileName: string | undefined,
  setCopied: (value: boolean) => void,
  setFileNameCopied: (value: boolean) => void,
  setDirCopied: (value: boolean) => void
) => {
  if (!fileName) return;
  // 重置状态
  setCopied(false);
  setFileNameCopied(false);
  setDirCopied(false);
  try {
    // 1. 复制全部代码，右区复制按钮变绿
    await navigator.clipboard.writeText(code);
    setCopied(true);
    // 2. 延迟后复制文件名，文件名块变绿（与保存按钮无关）
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(fileName);
        setCopied(false);
        setFileNameCopied(true);
        setTimeout(() => {
          setFileNameCopied(false);
        }, 900);
      } catch (err) {
        console.error('复制文件名失败:', err);
      }
    }, 300);
  } catch (err) {
    console.error('复制代码失败:', err);
  }
};
// 点击路径块：复制代码 -> 复制文件名 -> 复制路径（保存按钮不参与）
export const handleDirBlockCopy = async (
  code: string,
  dirPath: string | undefined,
  fileName: string | undefined,
  setCopied: (value: boolean) => void,
  setFileNameCopied: (value: boolean) => void,
  setDirCopied: (value: boolean) => void
) => {
  if (!dirPath || !fileName) return;
  // 重置状态
  setCopied(false);
  setFileNameCopied(false);
  setDirCopied(false);
  try {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(fileName);
        setCopied(false);
        setFileNameCopied(true);
        setTimeout(async () => {
          try {
            await navigator.clipboard.writeText(dirPath);
            setFileNameCopied(false);
            setDirCopied(true);
            setTimeout(() => {
              setDirCopied(false);
            }, 900);
          } catch (err) {
            console.error('复制路径失败:', err);
          }
        }, 300);
      } catch (err) {
        console.error('复制文件名失败:', err);
      }
    }, 300);
  } catch (err) {
    console.error('复制代码失败:', err);
  }
};
// 保存代码到指定平台（预留接口）
export const handleSaveToService = async (
  code: string,
  fileName: string | undefined,
  service: SaveOption
): Promise<void> => {
  console.log(`Saving ${fileName} to ${service}...`);
};