Manual Acceptance Test
1) Open any conversation (with a role present and optionally a project with knowledge references).
2) In the input box, try:
   - "#teryCMD=copy help" → Should show alert with all commands; system message appended.
   - Multi-line:
     First line: "#teryCMD=copy prompt"
     ...
     Last line: "#teryCMD"
     → Clipboard receives role prompt; alert token count; system message appended.
   - "#teryCMD=copy code" → If role prompt includes project source block, copies it; else error alert.
   - "#teryCMD=copy knowledge" → If conversation has references, copies merged content; else error.
   - "#teryCMD=copy PCK" → Copies role prompt + knowledge concat; alert with tokens.
   - "#teryCMD=copy all" → Copies full prompt+knowledge + full message history (incl system).
   - "#teryCMD=copy msg" → Copies only non-system history.
   - "#teryCMD=update prompt" → Updates conversation system prompt (role prompt + project source if available); alert success.
3) Send a normal non-command message → Should go to backend as before.

Notes:
- Token count uses approximate heuristic (CN=1, others=0.5).
- Unknown command shows "命令拼写不正确".
- Commands do not trigger backend streaming; a system info message records the execution.