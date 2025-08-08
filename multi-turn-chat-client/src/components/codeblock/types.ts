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