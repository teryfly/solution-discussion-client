export interface CodeBlockProps {
  language?: string;
  code: string;
  fullContent?: string;
}

export interface FilePathInfo {
  filePath?: string;
  dirPath?: string;
  fileName?: string;
}

export interface CodeBlockState {
  copied: boolean;
  fileCopied: boolean;
  dirCopied: boolean;
  isComplete: boolean;
}

// 新增：代码显示模式
export type CodeDisplayMode = 'expanded' | 'collapsed';

// 新增：保存选项
export type SaveOption = 'github' | 'gitlab';

// 新增：代码块尺寸信息
export interface CodeBlockDimensions {
  isOverflow: boolean;
  contentHeight: number;
  maxHeight: number;
}