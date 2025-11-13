export function approxTokenCount(text: string): number {
  if (!text) return 0;
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const other = text.replace(/[\u4e00-\u9fff]/g, '').length;
  return Math.ceil(chinese + other * 0.5);
}