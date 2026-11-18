import { useEffect, useRef, useState, type FormEvent } from "react";
import { socket } from "../lib/socket.ts";
import { MAX_MESSAGE_LENGTH, type ChatMessage } from "../../../shared/types.ts";
import styles from "./Chat.module.css";

type Props = {
  playerId: string; // you
  open: boolean; // shown as a dialog: only when there's no room to show the chat inline
  onClose: () => void;
  className?: string;
};

function Chat({ playerId, open, onClose, className = "" }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  // Opens and closes the dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open === open) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Scrolls the list to newest message
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
    // Stays mounted while hidden, so no messages are lost. Escape closes it natively, firing onClose
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Chat"
      onClose={onClose}
    >
      <section className={`card ${styles.chat} ${className}`} aria-label="Chat">
        <header>
          <h3>Chat</h3>
          <button
            type="button"
            className={`button ${styles.close}`}
            aria-label="Close chat"
            title="Close chat"
            onClick={onClose}
          >
            ❌
          </button>
        </header>
        <ul ref={listRef}>
          {messages.map((message) => (
            <li key={message.id}>
              <strong
                className={
                  message.playerId === playerId ? styles.own : undefined
                }
              >
                {message.name}:
              </strong>{" "}
              {message.text}
            </li>
          ))}
        </ul>
        <form onSubmit={handleSubmit}>
          <input
            aria-label="Message"
            placeholder="Message"
            value={text}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(event) => setText(event.target.value)}
          />
          <button
            type="submit"
            className="button"
            // Stops enter from submitting, only one message at a time
            disabled={sending || !text.trim()}
          >
            Send
          </button>
        </form>
      </section>
    </dialog>
  );
}

export default Chat;
