# Command Messages Feature - Implementation Plan

1. Create command detection and parsing utility
   - Purpose: Detect whether an input message is a command and parse its name and payload using the specified markers.
   - Expected Output: utils/commandParser.ts providing:
     - isCommandMessage(input: string): boolean
     - parseCommand(input: string): { name: string; args: string } | null
     - normalizeName(name: string): Standardized command key

2. Create command executor module with extensible registry
   - Purpose: Provide an extensible registry pattern to map command names → handler functions, encapsulating each command’s logic.
   - Expected Output: utils/commandExecutor/index.ts exporting:
     - executeCommand(ctx, command): Promise<CommandResult>
     - register default handlers for:
       - copy prompt
       - copy code
       - copy knowledge
       - copy PCK
       - copy all
       - copy msg
       - update prompt
       - copy help
     - Types for Command, CommandContext, CommandResult

3. Implement handlers: copy prompt, copy code
   - Purpose: Implement logic to read role prompt (config.ts ROLE_CONFIGS), and extract project source code segment.
   - Expected Output: utils/commandExecutor/handlers/copyPrompt.ts and copyCode.ts

4. Implement handlers: copy knowledge, copy PCK
   - Purpose:
     - copy knowledge: call getReferencedDocumentsContent(conversationId)
     - copy PCK: build full system prompt including role prompt + appended project source (if present) + knowledge content
   - Expected Output: utils/commandExecutor/handlers/copyKnowledge.ts and copyPCK.ts

5. Implement handlers: copy all, copy msg, copy help
   - Purpose:
     - copy all: getMessages(conversationId) then concatenate: full system prompt + all messages (including system)
     - copy msg: getMessages(conversationId) then concatenate: only non-system messages
     - copy help: list available command names
   - Expected Output: utils/commandExecutor/handlers/copyAll.ts, copyMsg.ts, copyHelp.ts

6. Implement handler: update prompt
   - Purpose: Update current conversation’s system prompt to role prompt + appended project source snippet (same as NewConversationModal learnSourceCode flow).
   - Expected Output:
     - utils/commandExecutor/handlers/updatePrompt.ts: fetch project source via existing API getCompleteSourceCode(projectId) and call backend API to set conversation system prompt (new API wrapper).
     - api/chat.ts: add updateConversationSystemPrompt(conversationId, system_prompt)

7. Integrate command pipeline into sending flow
   - Purpose: Intercept send action; if command, execute locally and do not call backend streaming.
   - Expected Output:
     - hooks/useConversationLayout.ts: modify handleSendMessage to detect commands using parser; if command, run executor with context (conversationId, currentMeta, role, projectId, model) and show results:
       - On success: show a transient system info message and trigger clipboard copy feedback (alerts).
       - On error: show system error message.
     - Ensure knowledge content building is reused from API helper.