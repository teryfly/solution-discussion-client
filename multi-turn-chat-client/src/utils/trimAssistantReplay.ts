// utils/trimAssistantReplay.ts

/**
 * 对 LLM assistant 回复文本做统一规整处理
 * 1. 删除开头所有“思索、推理、反思”类标签/片段
 * 2. 删除结尾 [to be continued]
 * @param content
 */
export function trimAssistantReplay(content: string): string {
  if (!content) return content;

  // 1. 删除开头思索/推理标签或片段
  const thinkStartRegex = new RegExp(
    [
      // <think> ... </think>
      '^\\s*<think>[\\s\\S]*?<\\/think>\\s*',
      // *Thinking...*
      '^\\s*\\*Thinking.*?\\*\\s*',
      // - Thinking:、- Reflection:、- 推理：
      '^\\s*[-*•]?\\s*(Thinking|Reflection|Reasoning|思考|推理|反思)[:：].*?\\n+',
      // “让我们思考一下：”等引导语
      '^\\s*(让我们思考一下|以下是我的推理|推理如下|思考如下)[：:]?\\s*\\n+',
      // > 引用行（如 LLM 解释流程）
      '^\\s*>[^\n]*\\n+',
    ].join('|'),
    'i'
  );

  let result = content;
  // 多次剥离，直到头部没匹配为止
  while (true) {
    const prev = result;
    result = result.replace(thinkStartRegex, '');
    if (result === prev) break;
  }

  // 2. 删除结尾 [to be continued]
  result = result.replace(/\s*\[to be continue\]\s*$/i, '');

  return result.trim();
}