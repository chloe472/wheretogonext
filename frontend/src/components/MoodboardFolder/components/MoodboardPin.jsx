import '../styles/moodboard-pin.css';

const EMOJIS = ['❤️', '😍', '🔥'];

export default function MoodboardPin({
  img,
  idx,
  pinId,
  reactions,
  user,
  onEmojiClick,
  onDeleteClick,
}) {
  return (
    <div className="pin" key={pinId}>
      <img src={img.url} alt={`img-${idx}`} />
      <div className="emoji-delete-row">
        <div className="emoji-popup">
          {EMOJIS.map((emoji) => (
            <span
              key={emoji}
              onClick={() => onEmojiClick(pinId, emoji, img.id)}
              title={(reactions[pinId]?.[emoji] || []).join(', ')}
              style={{
                cursor: 'pointer',
                fontWeight: (reactions[pinId]?.[emoji] || []).includes(user?.name)
                  ? 'bold'
                  : 'normal',
              }}
            >
              {emoji}
            </span>
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
        {Object.entries(reactions[pinId] || {})
          .filter(([, users]) => users.length > 0)
          .map(([emoji, users]) => (
            <span key={emoji} title={users.join(', ')}>
              {emoji} {users.length}
            </span>
          ))}
      </div>
    </div>
  );
}
