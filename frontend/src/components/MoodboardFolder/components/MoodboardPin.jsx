import '../styles/moodboard-pin.css';

const EMOJIS = ['❤️', '😍', '🔥'];

export default function MoodboardPin({
  img,
  idx,
  pinId,
  reactions,
  onEmojiClick,
  onOpenReactions,
  onDeleteClick,
}) {
  const reactionEntries = Object.entries(reactions[pinId] || {})
    .filter(([, users]) => users.length > 0);

  return (
    <div className="pin" key={pinId}>
      <img src={img.url} alt={`img-${idx}`} />
      <div className="emoji-delete-row">
        <div className="emoji-popup">
          {EMOJIS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              className="emoji-popup-btn"
              onClick={() => onEmojiClick(pinId, emoji, img.id)}
              title={(reactions[pinId]?.[emoji] || []).join(', ')}
              aria-label={`Toggle ${emoji} reaction`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <button
          className="pin-delete-btn"
          onClick={onDeleteClick}
          title="Delete image"
        >
          ✕
        </button>
      </div>
      <div className="pin-reactions">
        {reactionEntries.map(([emoji, users]) => (
          <button
            key={emoji}
            type="button"
            className="pin-reactions-badge"
            title={users.join(', ')}
            onClick={onOpenReactions}
          >
              {emoji} {users.length}
          </button>
        ))}
      </div>
    </div>
  );
}
