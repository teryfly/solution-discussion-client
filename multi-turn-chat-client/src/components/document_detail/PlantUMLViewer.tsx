import React, { useState, useEffect } from 'react';
import { UML_URL} from '../../config';

interface PlantUMLViewerProps {
  content: string;
  codeFontFamily: string;
}

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

// PlantUML 官方 base64-like 编码（与其期望一致）
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

/**
 * 编码 PlantUML 文本为 URL 片段
 * 1) 优先使用原生 Raw DEFLATE（raw=true）
 * 2) 如果目标服务/提示要求 HUFFMAN/带 header "~1"，则前置 "-1"（等价 "~1" 的安全 URL 形式）
 *
 * 注：部分插件/服务器会要求在数据前加上 "-1"（或 "~1"），表示 Huffman encoding prefix。
 */
function encodePlantUMLToUrlSegment(source: string, pako: any, withPrefixHeader: boolean): string {
  const utf8 = new TextEncoder().encode(source);
  // raw deflate（不含 zlib 头/尾）
  const deflated: Uint8Array = pako.deflateRaw(utf8, { level: 9 });

  // PlantUML 期望的 base64-like 编码
  const encoded = encode64(deflated);

  // 如果需要兼容 HUFFMAN 前缀提示，添加 "-1" 前缀（等价 "~1"）
  // 参考：PlantUML 团队的提示：需在数据前添加 header ~1（URL中常用 -1）
  return withPrefixHeader ? `-1${encoded}` : encoded;
}

const PlantUMLViewer: React.FC<PlantUMLViewerProps> = ({ content, codeFontFamily }) => {
  const [pakoLib, setPakoLib] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [usePrefixHeader, setUsePrefixHeader] = useState<boolean>(false); // 动态尝试是否需要前缀

  const plantumlServer = UML_URL;
  const uml = (content || '').trim();

  useEffect(() => {
    loadPakoLibrary()
      .then((pako) => {
        setPakoLib(pako);
        setLoading(false);
      })
      .catch((err) => {
        setErrMsg(err?.message || String(err));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <div
          style={{
            background: '#e3f2fd',
            border: '1px solid #90caf9',
            borderRadius: 6,
            padding: 12,
            color: '#1976d2',
            marginBottom: 12,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          正在加载PlantUML渲染库...
        </div>
      </div>
    );
  }

  if (!pakoLib) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <div
          style={{
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: 6,
            padding: 12,
            color: '#d32f2f',
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          PlantUML渲染库加载失败：{errMsg || '未知错误'}
          <br />
          当前显示源码预览。
        </div>
        <pre
          style={{
            margin: 0,
            background: 'transparent',
            border: 'none',
            padding: 0,
            whiteSpace: 'pre',
            fontFamily: codeFontFamily,
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <code style={{ fontFamily: codeFontFamily }}>{content}</code>
        </pre>
      </div>
    );
  }

  const encoded = encodePlantUMLToUrlSegment(uml, pakoLib, usePrefixHeader);
  const url = `${plantumlServer}/${encoded}`;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
      <div style={{ width: '100%', overflow: 'auto' }}>
        <img
          src={url}
          alt="PlantUML Diagram"
          style={{
            maxWidth: '100%',
            height: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 4,
            background: '#fff',
            display: 'block',
            margin: '0 auto'
          }}
          onError={(e) => {
            // 如果未加前缀失败，自动尝试加前缀 "-1" 再渲染一次
            if (!usePrefixHeader) {
              setUsePrefixHeader(true);
              // 触发重新渲染（切换 state）
              return;
            }
            // 第二次（已带前缀）仍失败，给出错误提示
            (e.target as HTMLImageElement).style.display = 'none';
            setErrMsg('PlantUML图表渲染失败，请检查语法或网络。');
          }}
          onLoad={() => {
            // 成功则清空错误
            if (errMsg) setErrMsg(null);
          }}
        />
        {errMsg && (
          <div
            style={{
              background: '#fff8e1',
              border: '1px solid #ffe0b2',
              borderRadius: 6,
              padding: 12,
              color: '#8d6e63',
              marginTop: 12,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {errMsg}
          </div>
        )}
      </div>
      {!errMsg && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#666',
            textAlign: 'center'
          }}
          title={`当前编码模式：${usePrefixHeader ? 'HUFFMAN 前缀 (-1) + Raw DEFLATE' : 'Raw DEFLATE'}`}
        >
          编码模式：{usePrefixHeader ? '兼容模式（-1 前缀）' : '标准模式'}
        </div>
      )}
    </div>
  );
};

export default PlantUMLViewer;