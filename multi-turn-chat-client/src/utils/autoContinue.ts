import { MAX_AUTO_CONTINUE_ROUNDS } from '../config';
/**
 * 检查是否需要自动继续
 * - 包含 [to be continue] 结尾（不区分大小写）
 * - 或者：存在某个 Step [X/Y] 且 X < Y，并且该 Y 没有对应的 Step [Y/Y]（即流程未真正完成）
 */
export function shouldAutoContinue(text: string, rounds: number): { shouldContinue: boolean; continueMessage: string } {
  if (rounds >= MAX_AUTO_CONTINUE_ROUNDS) {
    return { shouldContinue: false, continueMessage: '' };
  }
  // 如果明确以 [to be continue] 结尾，使用简单的 "go on"
  if (/\[to be continue\]\s*$/i.test(text)) {
    return { shouldContinue: true, continueMessage: 'go on' };
  }
  // 解析所有 Step [X/Y]
  const stepMatches = [...text.matchAll(/Step\s*\[\s*(\d+)\s*\/\s*(\d+)\s*\]/gi)];
  if (stepMatches.length === 0) {
    return { shouldContinue: false, continueMessage: '' };
  }
  // 统计每个 Y 是否有 X<Y （未完成）以及是否有 X==Y（完成终步）
  type StepInfo = { hasIncomplete: boolean; hasFinal: boolean };
  const map = new Map<number, StepInfo>();
  for (const match of stepMatches) {
    const x = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    if (!map.has(y)) {
      map.set(y, { hasIncomplete: false, hasFinal: false });
    }
    const info = map.get(y)!;
    if (x < y) {
      info.hasIncomplete = true;
    } else if (x === y) {
      info.hasFinal = true;
    }
    // ignore x > y as malformed
  }
  // 如果存在某个 total Y，之前有未完成的 step 且没有 final 完成标记，就继续
  for (const [, info] of map) {
    if (info.hasIncomplete && !info.hasFinal) {
      return { 
        shouldContinue: true, 
        continueMessage: 'Go on. If the code from any step in the previous round of dialogue was not output completely, then starting from the step where the code is incomplete, strictly follow the output format requirements to re-output that step and all subsequent steps.'
      };
    }
  }
  return { shouldContinue: false, continueMessage: '' };
}