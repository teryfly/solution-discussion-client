import React from 'react';
import ChatInput from '../ChatInput';
import StopButton from './StopButton';
interface InputAreaProps {
  inputVisible: boolean;
  showStop: boolean;
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}
const InputArea: React.FC<InputAreaProps> = ({
  inputVisible,
  showStop,
  input,
  loading,
  onInputChange,
  onSend,
  onStop,
}) => {
  return (
    <>
      {inputVisible && (
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSend={onSend}
          loading={loading}
        />
      )}
      <StopButton visible={!inputVisible && showStop} onStop={onStop} />
    </>
  );
};
export default InputArea;