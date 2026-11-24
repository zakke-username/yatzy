import { useEffect, useRef, useState, type FormEvent } from "react";
import { socket } from "../lib/socket.ts";
import { MAX_MESSAGE_LENGTH, type ChatMessage } from "../../../shared/types.ts";

type Props = {
  playerId: string; // you
  open: boolean;
  onClose: () => void;
  onMessage: () => void; // a new message has arrived
};

function Chat({ playerId, open, onClose, onMessage }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // Socket event handler
  useEffect(() => {
    const onNewMessage = (message: ChatMessage) => {
      setMessages((list) => [...list, message]);
      onMessage();
    };
    socket.on("chat:message", onNewMessage);
    return () => {
      socket.off("chat:message", onNewMessage);
    };
  }, [onMessage]);

  // Scrolls the list to newest message, also on opening: a hidden list loses its position
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

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
    <section
      aria-label="Chat"
      className={`card fixed top-16 right-4 z-50 h-[calc(100dvh-5rem)] w-[calc(100%-2rem)] flex-col gap-4 p-4 md:h-[min(32rem,100dvh-5rem)] md:w-sm md:rounded-xl drop-shadow-[0_0_1rem_rgba(0,0,0,0.33)] ${open ? "flex" : "hidden"}`}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Chat</h3>
        <button
          type="button"
          className="btn bg-white p-1 text-sm"
          aria-label="Close chat"
          title="Close chat"
          onClick={onClose}
        >
          ➖
        </button>
      </header>
      <ul
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col justify-end-safe gap-2 overflow-y-auto overscroll-contain wrap-anywhere"
      >
        {messages.length === 0 && (
          <li className="text-gray-500">No messages</li>
        )}
        {messages.map((message) => (
          <li key={message.id}>
            <strong
              className={
                message.playerId === playerId ? "text-primary" : undefined
              }
            >
              {message.name}:
            </strong>{" "}
            {message.text}
          </li>
        ))}
      </ul>
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <input
          className="flex-1 p-2"
          aria-label="Message"
          placeholder="Message"
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="submit"
          className="btn p-2"
          // Stops enter from submitting, only one message at a time
          disabled={sending || !text.trim()}
        >
          Send
        </button>
      </form>
    </section>
  );
}

export default Chat;
