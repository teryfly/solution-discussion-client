import React, { useState, useEffect } from 'react';
import { parseTextWithPlantUML, PlantUMLSegment } from '../utils/plantUMLUtils';
import UMLSaveDropdown from './UMLSaveDropdown';
import { useProject } from '../context/ProjectContext';

// 动态加载 pako 库
function loadPakoLibrary(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.pako) return resolve(w.pako);
    if (w.__pakoLoading__) {
      const t = setInterval(() => {
        if (w.pako) {
          clearInterval(t);
          resolve(w.pako);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(t);
        reject(new Error('Pako library loading timeout'));
      }, 10000);
      return;
    }
    w.__pakoLoading__ = true;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js';
    script.async = true;
    script.onload = () => {
      w.__pakoLoading__ = false;
      if (w.pako) resolve(w.pako);
      else reject(new Error('Pako library failed to load'));
    };
    script.onerror = () => {
      w.__pakoLoading__ = false;
      reject(new Error('Failed to load pako library from CDN'));
    };
    document.head.appendChild(script);
  });
}

// PlantUML 官方 base64-like 编码
const B64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
function encode6bit(b: number): string {
  if (b < 0) return B64[0];
  if (b < 64) return B64[b];
  return '?';
}
function append3bytes(b1: number, b2: number, b3: number): string {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return (
    encode6bit(c1 & 0x3F) +
    encode6bit(c2 & 0x3F) +
    encode6bit(c3 & 0x3F) +
    encode6bit(c4 & 0x3F)
  );
}
function encode64(data: Uint8Array): string {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data[i], data[i + 1], 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data[i], 0, 0);
    } else {
      r += append3bytes(data[i], data[i + 1], data[i + 2]);
    }
  }
  return r;
}

function encodePlantUMLToUrlSegment(source: string, pako: any, withPrefixHeader: boolean): string {
  const utf8 = new TextEncoder().encode(source);
  const deflated: Uint8Array = pako.deflateRaw(utf8, { level: 9 });
  const encoded = encode64(deflated);
  return withPrefixHeader ? `-1${encoded}` : encoded;
}

// 复制文本到剪贴板
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// 复制图片到剪贴板的优化函数
async function copyImageToClipboard(imageUrl: string): Promise<void> {
  try {
    // 创建一个新的图片元素，确保跨域设置
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // 等待图片加载完成
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = imageUrl;
    });
    
    // 创建canvas并绘制图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建canvas上下文');
    }
    
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0);
    
    // 转换为blob并复制
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('无法创建图片数据'));
          return;
        }
        
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            resolve();
          } else {
            reject(new Error('剪贴板API不可用'));
          }
        } catch (error) {
          reject(error);
        }
      }, 'image/png');
    });
    
  } catch (error) {
    // 如果上述方法失败，尝试直接fetch图片
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } else {
        throw new Error('剪贴板API不可用');
      }
    } catch (fetchError) {
      throw new Error('无法复制图片，请尝试右键复制图片');
    }
  }
}

// 从PlantUML代码中提取title
function extractPlantUMLTitle(umlCode: string): string {
  const lines = umlCode.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('title ')) {
      return trimmed.substring(6).trim();
    }
  }
  return 'PlantUML图表';
}

// 图标组件
const RefreshIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ImageIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21,15 16,10 5,21" />
  </svg>
);

const MaximizeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

interface PlantUMLImageProps {
  umlCode: string;
  onError?: (error: string) => void;
}

const PlantUMLImage: React.FC<PlantUMLImageProps> = ({ umlCode, onError }) => {
  const [pakoLib, setPakoLib] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usePrefixHeader, setUsePrefixHeader] = useState<boolean>(false);
  const [imageKey, setImageKey] = useState(0);
  const [copyCodeFeedback, setCopyCodeFeedback] = useState(false);
  const [copyImageFeedback, setCopyImageFeedback] = useState(false);

  const plantumlServer = 'https://www.plantuml.com/plantuml/svg';
  //const plantumlServer = 'http://192.168.120.221:30008/svg';
  const { getCurrentProject } = useProject();
  const currentProject = getCurrentProject();

  useEffect(() => {
    loadPakoLibrary()
      .then((pako) => {
        setPakoLib(pako);
        setLoading(false);
      })
      .catch((err) => {
        const errorMsg = err?.message || String(err);
        setError(errorMsg);
        setLoading(false);
        onError?.(errorMsg);
      });
  }, [onError]);

  // 获取当前图片URL
  const getCurrentImageUrl = () => {
    if (!pakoLib) return '';
    const encoded = encodePlantUMLToUrlSegment(umlCode, pakoLib, usePrefixHeader);
    return `${plantumlServer}/${encoded}`;
  };

  // 刷新图片
  const handleRefresh = () => {
    setError(null);
    setImageKey(prev => prev + 1);
    setUsePrefixHeader(false);
  };

  // 复制PlantUML代码
  const handleCopyCode = async () => {
    try {
      await copyToClipboard(umlCode);
      setCopyCodeFeedback(true);
      setTimeout(() => setCopyCodeFeedback(false), 1000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 复制图片
  const handleCopyImage = async () => {
    if (!pakoLib) return;
    
    try {
      const imageUrl = getCurrentImageUrl();
      await copyImageToClipboard(imageUrl);
      setCopyImageFeedback(true);
      setTimeout(() => setCopyImageFeedback(false), 1000);
    } catch (err) {
      console.error('复制图片失败:', err);
      alert('复制图片失败，请尝试右键复制图片');
    }
  };

  // 新窗口最大化显示
  const handleMaximize = () => {
    if (!pakoLib) return;
    
    const imageUrl = getCurrentImageUrl();
    const title = extractPlantUMLTitle(umlCode);
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
                font-family: system-ui, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
              }
              .header {
                background: #1a73e8;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
              }
              .header h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 500;
                flex: 1;
              }
              .header-buttons {
                display: flex;
                gap: 8px;
              }
              .header-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s ease;
              }
              .header-btn:hover {
                background: rgba(255, 255, 255, 0.3);
              }
              .header-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }
              .image-container {
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                max-width: 95vw;
                max-height: 80vh;
                overflow: auto;
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }
              .code-section {
                margin-top: 20px;
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                max-width: 95vw;
              }
              .code-header {
                font-weight: 600;
                margin-bottom: 12px;
                color: #333;
              }
              pre {
                background: #f8f9fa;
                padding: 16px;
                border-radius: 8px;
                overflow: auto;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <div class="header-buttons">
                <button class="header-btn" id="copyImageBtn" onclick="copyImage()">复制图片</button>
                <button class="header-btn" onclick="copyCode()">复制代码</button>
                <button class="header-btn" onclick="window.close()">关闭窗口</button>
              </div>
            </div>
            <div class="image-container">
              <img id="plantUMLImg" src="${imageUrl}" alt="PlantUML Diagram" crossorigin="anonymous" />
            </div>
            <div class="code-section">
              <div class="code-header">PlantUML源码：</div>
              <pre id="plantUMLCode">${umlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>
            
            <script>
              async function copyToClipboard(text) {
                if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(text);
                } else {
                  const textarea = document.createElement('textarea');
                  textarea.value = text;
                  textarea.style.position = 'fixed';
                  textarea.style.opacity = '0';
                  document.body.appendChild(textarea);
                  textarea.focus();
                  textarea.select();
                  try {
                    document.execCommand('copy');
                  } finally {
                    document.body.removeChild(textarea);
                  }
                }
              }
              
              async function copyImageToClipboard(imageUrl) {
                try {
                  // 方法1：创建图片元素并用canvas转换
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  
                  await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageUrl;
                  });
                  
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('无法创建canvas上下文');
                  
                  canvas.width = img.naturalWidth || img.width;
                  canvas.height = img.naturalHeight || img.height;
                  ctx.drawImage(img, 0, 0);
                  
                  return new Promise((resolve, reject) => {
                    canvas.toBlob(async (blob) => {
                      if (!blob) {
                        reject(new Error('无法创建图片数据'));
                        return;
                      }
                      
                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                          ]);
                          resolve();
                        } else {
                          reject(new Error('剪贴板API不可用'));
                        }
                      } catch (error) {
                        reject(error);
                      }
                    }, 'image/png');
                  });
                  
                } catch (error) {
                  // 方法2：直接fetch图片
                  try {
                    const response = await fetch(imageUrl, {
                      mode: 'cors',
                      credentials: 'omit'
                    });
                    
                    if (!response.ok) {
                      throw new Error('HTTP ' + response.status);
                    }
                    
                    const blob = await response.blob();
                    
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                      ]);
                    } else {
                      throw new Error('剪贴板API不可用');
                    }
                  } catch (fetchError) {
                    throw new Error('无法复制图片，请尝试右键复制图片');
                  }
                }
              }
              
              async function copyImage() {
                const btn = document.getElementById('copyImageBtn');
                const originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = '复制中...';
                
                try {
                  const img = document.getElementById('plantUMLImg');
                  await copyImageToClipboard(img.src);
                  btn.textContent = '已复制';
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                  }, 1000);
                } catch (err) {
                  console.error('复制图片失败:', err);
                  alert(err.message || '复制图片失败，请尝试右键复制图片');
                  btn.textContent = originalText;
                  btn.disabled = false;
                }
              }
              
              async function copyCode() {
                try {
                  const code = document.getElementById('plantUMLCode').textContent;
                  await copyToClipboard(code);
                  alert('代码已复制到剪贴板');
                } catch (err) {
                  console.error('复制代码失败:', err);
                  alert('复制代码失败');
                }
              }
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div style={{ 
      margin: '12px 0', 
      position: 'relative'
    }}>
      {/* 外部操作按钮区域 */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '8px',
        gap: '4px'
      }}>
        <button
          onClick={handleRefresh}
          style={{
            background: '#f5f5f5',
            border: '1px solid #ddd',
            padding: '6px 8px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#666',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          title="刷新图片"
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = '#e8f0fe';
            (e.target as HTMLElement).style.borderColor = '#1a73e8';
            (e.target as HTMLElement).style.color = '#1a73e8';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = '#f5f5f5';
            (e.target as HTMLElement).style.borderColor = '#ddd';
            (e.target as HTMLElement).style.color = '#666';
          }}
        >
          <RefreshIcon />
          刷新
        </button>
        
        <button
          onClick={handleCopyCode}
          style={{
            background: copyCodeFeedback ? '#4caf50' : '#f5f5f5',
            border: `1px solid ${copyCodeFeedback ? '#4caf50' : '#ddd'}`,
            padding: '6px 8px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: copyCodeFeedback ? '#fff' : '#666',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          title="复制PlantUML代码"
          onMouseEnter={(e) => {
            if (!copyCodeFeedback) {
              (e.target as HTMLElement).style.background = '#e8f0fe';
              (e.target as HTMLElement).style.borderColor = '#1a73e8';
              (e.target as HTMLElement).style.color = '#1a73e8';
            }
          }}
          onMouseLeave={(e) => {
            if (!copyCodeFeedback) {
              (e.target as HTMLElement).style.background = '#f5f5f5';
              (e.target as HTMLElement).style.borderColor = '#ddd';
              (e.target as HTMLElement).style.color = '#666';
            }
          }}
        >
          <CopyIcon />
          {copyCodeFeedback ? '已复制' : '复制代码'}
        </button>

        <button
          onClick={handleCopyImage}
          disabled={!pakoLib || loading || !!error}
          style={{
            background: copyImageFeedback ? '#4caf50' : '#f5f5f5',
            border: `1px solid ${copyImageFeedback ? '#4caf50' : '#ddd'}`,
            padding: '6px 8px',
            cursor: (!pakoLib || loading || !!error) ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: copyImageFeedback ? '#fff' : '#666',
            fontSize: '12px',
            opacity: (!pakoLib || loading || !!error) ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
          title="复制图片"
          onMouseEnter={(e) => {
            if (!copyImageFeedback && pakoLib && !loading && !error) {
              (e.target as HTMLElement).style.background = '#e8f0fe';
              (e.target as HTMLElement).style.borderColor = '#1a73e8';
              (e.target as HTMLElement).style.color = '#1a73e8';
            }
          }}
          onMouseLeave={(e) => {
            if (!copyImageFeedback && pakoLib && !loading && !error) {
              (e.target as HTMLElement).style.background = '#f5f5f5';
              (e.target as HTMLElement).style.borderColor = '#ddd';
              (e.target as HTMLElement).style.color = '#666';
            }
          }}
        >
          <ImageIcon />
          {copyImageFeedback ? '已复制' : '复制图片'}
        </button>
        
        <button
          onClick={handleMaximize}
          disabled={!pakoLib || loading || !!error}
          style={{
            background: '#f5f5f5',
            border: '1px solid #ddd',
            padding: '6px 8px',
            cursor: (!pakoLib || loading || !!error) ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#666',
            fontSize: '12px',
            opacity: (!pakoLib || loading || !!error) ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
          title="新窗口查看"
          onMouseEnter={(e) => {
            if (pakoLib && !loading && !error) {
              (e.target as HTMLElement).style.background = '#e8f0fe';
              (e.target as HTMLElement).style.borderColor = '#1a73e8';
              (e.target as HTMLElement).style.color = '#1a73e8';
            }
          }}
          onMouseLeave={(e) => {
            if (pakoLib && !loading && !error) {
              (e.target as HTMLElement).style.background = '#f5f5f5';
              (e.target as HTMLElement).style.borderColor = '#ddd';
              (e.target as HTMLElement).style.color = '#666';
            }
          }}
        >
          <MaximizeIcon />
          最大化
        </button>

        {/* UML另存为下拉菜单 */}
        <UMLSaveDropdown
          umlCode={umlCode}
          projectId={currentProject?.id}
          disabled={!pakoLib || loading || !!error}
        />
      </div>

      {/* 图片容器区域 */}
      <div style={{ 
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        background: '#fff',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            padding: '12px',
            background: '#e3f2fd',
            color: '#1976d2',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            正在加载PlantUML渲染库...
          </div>
        ) : !pakoLib || error ? (
          <div style={{
            padding: '12px',
            background: '#fff8e1',
            color: '#8d6e63',
            fontSize: '13px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              PlantUML渲染失败：{error || '未知错误'}
            </div>
            <pre style={{
              margin: 0,
              background: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflow: 'auto'
            }}>
              {umlCode}
            </pre>
          </div>
        ) : (
          <>
            {/* 图片区域 */}
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <img
                key={imageKey}
                src={getCurrentImageUrl()}
                alt="PlantUML Diagram"
                crossOrigin="anonymous"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto'
                }}
                onError={(e) => {
                  if (!usePrefixHeader) {
                    setUsePrefixHeader(true);
                    return;
                  }
                  const errorMsg = 'PlantUML图表渲染失败，请检查语法或网络';
                  setError(errorMsg);
                  onError?.(errorMsg);
                }}
                onLoad={() => {
                  if (error) setError(null);
                }}
              />
            </div>

            {/* 底部信息 */}
            <div style={{
              padding: '8px 16px',
              background: '#f8f9fa',
              borderTop: '1px solid #e0e0e0',
              fontSize: '11px',
              color: '#666',
              textAlign: 'center'
            }}>
              PlantUML图表 {usePrefixHeader && '(兼容模式)'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface MessagePlantUMLRendererProps {
  content: string;
}

const MessagePlantUMLRenderer: React.FC<MessagePlantUMLRendererProps> = ({ content }) => {
  const segments = parseTextWithPlantUML(content);

  // 如果没有PlantUML片段，返回原始内容
  if (segments.length === 1 && segments[0].type === 'text') {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>;
  }

  return (
    <div>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
              {segment.content}
            </span>
          );
        } else {
          return (
            <PlantUMLImage
              key={index}
              umlCode={segment.content}
              onError={(error) => {
                console.warn('PlantUML渲染错误:', error);
              }}
            />
          );
        }
      })}
    </div>
  );
};

export default MessagePlantUMLRenderer;