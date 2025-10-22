import React, { useState, useEffect } from 'react';
import '../../styles/PlantUMLDrawer.css';

interface PlantUMLDrawerProps {
  code: string;
  title?: string;
  onClose: () => void;
}

export const PlantUMLDrawer: React.FC<PlantUMLDrawerProps> = ({
  code,
  title,
  onClose,
}) => {
  const [zoom, setZoom] = useState(100);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    // Encode PlantUML code to URL
    const encoded = encodePlantUML(code);
    setImageUrl(`https://www.plantuml.com/plantuml/svg/${encoded}`);
  }, [code]);

  const encodePlantUML = (text: string): string => {
    // Simple base64 encoding for PlantUML
    // In production, use proper PlantUML encoding library
    const compressed = btoa(unescape(encodeURIComponent(text)));
    return compressed;
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 20, 50));
  };

  const handleReset = () => {
    setZoom(100);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content plantuml-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <span className="uml-icon">📊</span>
            <span>{title || 'UML图 - 未命名'}</span>
          </div>
          <div className="drawer-actions">
            <button className="drawer-btn" onClick={handleZoomOut}>
              🔍-
            </button>
            <button className="drawer-btn" onClick={handleReset}>
              {zoom}%
            </button>
            <button className="drawer-btn" onClick={handleZoomIn}>
              🔍+
            </button>
            <button className="drawer-btn close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <div className="drawer-body">
          <div className="uml-container">
            <img
              src={imageUrl}
              alt={title || 'UML Diagram'}
              style={{ width: `${zoom}%` }}
              onError={(e) => {
                // Fallback: show code if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="uml-code-fallback" style={{ display: 'none' }}>
              <pre>{code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};