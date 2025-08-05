from config import Config

def is_ignored_user_message(role: str, content: str) -> bool:
    """
    判断用户消息是否在忽略列表。先对 content 做 strip，再完全匹配。
    """
    if role.lower() == "user":
        trimmed = content.strip()
        return trimmed in [msg.strip() for msg in Config.ignoredUserMessages]
    return False

def merge_assistant_messages_with_user_history(messages, user_role=None, user_content=None, ignore_user=False):
    """
    使消息序列始终成 user/assistant/user/assistant... 结构，合并连续 assistant 消息
    若 ignore_user=True，则 user_role 和 user_content 为当前未入库但要发送的 user 消息
    """
    result = []
    temp_assistant = []

    # 补充当前用户消息
    if ignore_user and user_role and user_content:
        in_msgs = messages + [{"role": user_role, "content": user_content}]
    else:
        in_msgs = messages

    for msg in in_msgs:
        role = msg["role"]
        content = msg["content"]
        if role == "assistant":
            temp_assistant.append(content)
        else:
            # 遇到 user，若有累计的 assistant，则合并加入
            if temp_assistant:
                merged = "\n---\n".join(temp_assistant)
                result.append({"role": "assistant", "content": merged})
                temp_assistant = []
            result.append({"role": role, "content": content})
    # 最后如果结尾还有 assistant 也要合并
    if temp_assistant:
        merged = "\n---\n".join(temp_assistant)
        result.append({"role": "assistant", "content": merged})
    return result