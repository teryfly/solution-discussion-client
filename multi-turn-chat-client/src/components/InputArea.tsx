import React from 'react';
import ChatInput from '../ChatInput';
import StopButton from './StopButton';

interface InputAreaProps {
  inputVisible: boolean;
  showStop: boolean;
  input: string;
  loading: boolean;
  autoUpdateCode: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onAutoUpdateCodeChange: (checked: boolean) => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  inputVisible,
  showStop,
  input,
  loading,
  autoUpdateCode,
  onInputChange,
  onSend,
  onStop,
  onAutoUpdateCodeChange,
}) => {
  return (
    <>
      {inputVisible && (
        <div>
          <ChatInput
            value={input}
            onChange={onInputChange}
            onSend={onSend}
            loading={loading}
          />
          {/* 自动更新代码复选框 */}
          <div style={{
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            fontSize: '12px',
            color: '#666'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={autoUpdateCode}
                onChange={(e) => onAutoUpdateCodeChange(e.target.checked)}
                style={{ margin: 0 }}
              />
              <span>自动更新代码</span>
            </label>
          </div>
        </div>
      )}
      <StopButton visible={!inputVisible && showStop} onStop={onStop} />
    </>
  );
};

export default InputArea;