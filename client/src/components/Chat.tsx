import { useEffect, useRef, useState, type FormEvent } from "react";
import { socket } from "../lib/socket.ts";
import { MAX_MESSAGE_LENGTH, type ChatMessage } from "../../../shared/types.ts";
import "./Chat.css";

type Props = {
  playerId: string; // you
};

function Chat({ playerId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // Socket event handler
  useEffect(() => {
    const onMessage = (message: ChatMessage) =>
      setMessages((list) => [...list, message]);
    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
    };
  }, []);

  // Scrolls the list to newest message
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  // Send message
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    const response = await socket
      .emitWithAck("chat:send", { text })
      .catch(() => undefined);
    setSending(false);
    if (response?.ok) setText("");
  }

  return (
    <section className="container chat" aria-label="Chat">
      <h3>Chat</h3>
      <ul ref={listRef} className="stack chat-messages">
        {messages.map((message) => (
          <li key={message.id}>
            <strong
              className={message.playerId === playerId ? "chat-own" : undefined}
            >
              {message.name}:
            </strong>{" "}
            {message.text}
          </li>
        ))}
      </ul>
      <form className="row chat-form" onSubmit={handleSubmit}>
        <input
          className="input"
          aria-label="Message"
          placeholder="Message"
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setText(event.target.value)}
        />
        {/* Disabled, it also stops Enter from submitting, so only one message is in flight */}
        <button
          type="submit"
          className="button"
          disabled={sending || !text.trim()}
        >
          Send
        </button>
      </form>
    </section>
  );
}

export default Chat;
