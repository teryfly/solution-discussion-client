// ModelSelector.tsx
import React from 'react';

interface ModelSelectorProps {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ value, options, onChange }) => {
  return (
    <div className="chat-toolbar">
      <label>模型：</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;