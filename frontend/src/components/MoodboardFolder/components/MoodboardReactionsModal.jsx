import { useEffect, useMemo, useState } from 'react';
import '../styles/moodboard-reactions-modal.css';

const EMOJIS = ['❤️', '😍', '🔥'];

function normalizeUsersByEmoji(reactions) {
  const safe = reactions && typeof reactions === 'object' ? reactions : {};
  return EMOJIS.reduce((acc, emoji) => {
    acc[emoji] = Array.isArray(safe[emoji]) ? safe[emoji] : [];
    return acc;
  }, {});
}

export default function MoodboardReactionsModal({
  show,
  image,
  pinId,
  reactions,
  currentUserName,
  onClose,
  onToggleEmoji,
}) {
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!show) return;
    setActiveTab('all');
  }, [show, pinId]);

  const usersByEmoji = useMemo(() => normalizeUsersByEmoji(reactions), [reactions]);
  const activeEmojis = useMemo(
    () => EMOJIS.filter((emoji) => usersByEmoji[emoji].length > 0),
    [usersByEmoji],
  );
  const allRows = useMemo(() => {
    return activeEmojis.flatMap((emoji) => usersByEmoji[emoji].map((name) => ({ emoji, name })));
  }, [activeEmojis, usersByEmoji]);

  useEffect(() => {
    if (activeTab !== 'all' && !activeEmojis.includes(activeTab)) {
      setActiveTab('all');
    }
  }, [activeTab, activeEmojis]);

  const selectedRows = useMemo(() => {
    if (activeTab === 'all') return allRows;
    return usersByEmoji[activeTab].map((name) => ({ emoji: activeTab, name }));
  }, [activeTab, allRows, usersByEmoji]);

  if (!show || !image) return null;

  return (
    <div className="moodboard-reactions-modal" role="dialog" aria-modal="true" aria-labelledby="moodboard-reactions-title">
      <button
        type="button"
        className="moodboard-reactions-modal__backdrop"
        aria-label="Close reactions"
        onClick={onClose}
      />
      <div className="moodboard-reactions-modal__panel">
        <div className="moodboard-reactions-modal__header">
          <h3 id="moodboard-reactions-title">Reactions</h3>
          <button type="button" className="moodboard-reactions-modal__close" onClick={onClose}>Close</button>
        </div>

        <div className="moodboard-reactions-modal__content">
          <img src={image.url} alt="Selected moodboard" className="moodboard-reactions-modal__image" />

          <div className="moodboard-reactions-modal__toggle-row" aria-label="Add or remove reaction">
            {activeEmojis.map((emoji) => {
              const users = usersByEmoji[emoji];
              const mine = users.includes(currentUserName);
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`moodboard-reactions-modal__emoji-toggle ${mine ? 'is-active' : ''}`}
                  onClick={() => onToggleEmoji(emoji)}
                  aria-pressed={mine}
                  title={mine ? 'Remove your reaction' : 'Add your reaction'}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              );
            })}
          </div>

          <div className="moodboard-reactions-modal__tabs" role="tablist" aria-label="Filter reactions">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`moodboard-reactions-modal__tab ${activeTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({allRows.length})
            </button>
            {activeEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="tab"
                aria-selected={activeTab === emoji}
                className={`moodboard-reactions-modal__tab ${activeTab === emoji ? 'is-active' : ''}`}
                onClick={() => setActiveTab(emoji)}
              >
                {emoji} ({usersByEmoji[emoji].length})
              </button>
            ))}
          </div>

          <ul className="moodboard-reactions-modal__list">
            {selectedRows.length === 0 ? (
              <li className="moodboard-reactions-modal__empty">No reactions yet.</li>
            ) : (
              selectedRows.map((row, idx) => (
                <li key={`${row.emoji}-${row.name}-${idx}`} className="moodboard-reactions-modal__item">
                  <span className="moodboard-reactions-modal__item-emoji">{row.emoji}</span>
                  <span className="moodboard-reactions-modal__item-name">{row.name}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
