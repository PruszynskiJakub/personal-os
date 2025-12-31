export interface Message {
  uuid: string | null;
  role: "user" | "assistant" | "system";
  content: string;
}