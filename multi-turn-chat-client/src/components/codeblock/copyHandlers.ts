import { SaveOption } from './types';

// 复制代码内容
export const handleCopyCode = (code: string, setCopied: (value: boolean) => void) => {
  navigator.clipboard.writeText(code).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  });
};

// 点击文件块：复制代码 -> 复制文件名
export const handleFileBlockCopy = async (
  code: string,
  fileName: string | undefined,
  setCopied: (value: boolean) => void,
  setFileCopied: (value: boolean) => void,
  setDirCopied: (value: boolean) => void
) => {
  if (!fileName) return;

  // 重置所有状态
  setCopied(false);
  setFileCopied(false);
  setDirCopied(false);

  try {
    // 1. 复制全部代码，右区按钮变绿
    await navigator.clipboard.writeText(code);
    setCopied(true);

    // 2. 延迟后复制文件名，文件块变绿，右区按钮恢复
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(fileName);
        setCopied(false);
        setFileCopied(true);
        
        // 文件块绿色持续900ms后恢复
        setTimeout(() => {
          setFileCopied(false);
        }, 900);
      } catch (err) {
        console.error('复制文件名失败:', err);
      }
    }, 300);
  } catch (err) {
    console.error('复制代码失败:', err);
  }
};

// 点击路径块：复制代码 -> 复制文件名 -> 复制路径
export const handleDirBlockCopy = async (
  code: string,
  dirPath: string | undefined,
  fileName: string | undefined,
  setCopied: (value: boolean) => void,
  setFileCopied: (value: boolean) => void,
  setDirCopied: (value: boolean) => void
) => {
  if (!dirPath || !fileName) return;

  // 重置所有状态
  setCopied(false);
  setFileCopied(false);
  setDirCopied(false);

  try {
    // 1. 复制全部代码，右区按钮变绿
    await navigator.clipboard.writeText(code);
    setCopied(true);

    // 2. 延迟后复制文件名，文件块变绿，右区按钮恢复
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(fileName);
        setCopied(false);
        setFileCopied(true);

        // 3. 再延迟后复制路径，路径块变绿，文件块恢复
        setTimeout(async () => {
          try {
            await navigator.clipboard.writeText(dirPath);
            setFileCopied(false);
            setDirCopied(true);
            
            // 路径块绿色持续900ms后恢复
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
  // 预留接口实现
};