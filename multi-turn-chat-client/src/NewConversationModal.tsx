// ✅ 文件：NewConversationModal.tsx（新建会话弹窗）
import React, { useState } from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (options: {
    name?: string;
    model: string;
    system?: string;
  }) => void;
  modelOptions: string[];
}

const NewConversationModal: React.FC<Props> = ({ visible, onClose, onCreate, modelOptions }) => {
  const [name, setName] = useState('');
  const [model, setModel] = useState(modelOptions[0] || '');
  const [system, setSystem] = useState('');

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>新建会话</h3>

        <label>会话名（可选）：</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>模型：</label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {modelOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <label>System Prompt（可选）：</label>
        <textarea
          rows={3}
          value={system}
          onChange={(e) => setSystem(e.target.value)}
        />

        <div className="modal-actions">
          <button onClick={() => {
            onCreate({ name, model, system });
            onClose();
          }}>创建</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
