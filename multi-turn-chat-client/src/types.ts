export type Message = {
  role: string;
  content: string;
  collapsed?: boolean;
};

export type ConversationMeta = {
  id: string;
  model: string;
  createdAt: string;
};
