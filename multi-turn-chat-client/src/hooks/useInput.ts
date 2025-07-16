// useInput.ts
import { useState } from 'react';

export default function useInput() {
  const [input, setInput] = useState('');
  return { input, setInput };
}