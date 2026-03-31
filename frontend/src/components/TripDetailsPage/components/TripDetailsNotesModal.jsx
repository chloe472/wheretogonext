import {
  Bold,
  ChevronRight,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Paperclip,
  Underline,
  X,
} from 'lucide-react';
import { createAttachmentFromFile } from '../lib/tripDetailsPageHelpers';

export default function TripDetailsNotesModal({
  onClose,
  days,
  notesActiveTab,
  setNotesActiveTab,
  generalNotes,
  setGeneralNotes,
  generalAttachments,
  setGeneralAttachments,
  tripExpenseItems,
  setTripExpenseItems,
  notesSaving,
  saveGeneralNotesAndDocuments,
  saveDayNotesAndDocuments,
}) {
  return (
    <>
      <button
        type="button"
        className="trip-details__modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="trip-details__notes-modal" role="dialog" aria-labelledby="notes-modal-title" aria-modal="true">
        <div className="trip-details__notes-modal-head">
          <h2 id="notes-modal-title" className="trip-details__notes-modal-title">Notes & Documents</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="trip-details__notes-tabs">
          <button
            type="button"
            className={`trip-details__notes-tab ${notesActiveTab === 'general' ? 'trip-details__notes-tab--active' : ''}`}
            onClick={() => setNotesActiveTab('general')}
          >
            General
          </button>
          {days.map((day, idx) => (
            <button
              key={day.date}
              type="button"
              className={`trip-details__notes-tab ${notesActiveTab === `day-${idx}` ? 'trip-details__notes-tab--active' : ''}`}
              onClick={() => setNotesActiveTab(`day-${idx}`)}
            >
              Day {idx + 1}
            </button>
          ))}
          {days.length > 5 && (
            <span className="trip-details__notes-tab-arrow" aria-hidden><ChevronRight size={16} /></span>
          )}
        </div>
        <div className="trip-details__notes-content">
          {notesActiveTab === 'general' && (
            <div className="trip-details__notes-general">
              <h3 className="trip-details__notes-section-title">General notes</h3>
              <div className="trip-details__notes-toolbar">
                <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Bold" title="Bold"><Bold size={16} /></button>
                <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Italic" title="Italic"><Italic size={16} /></button>
                <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Underline" title="Underline"><Underline size={16} /></button>
                <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Link" title="Insert link"><LinkIcon size={16} /></button>
                <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Heading 1" title="Heading 1"><Heading1 size={16} /></button>
                <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Heading 2" title="Heading 2"><Heading2 size={16} /></button>
                <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Bullet list" title="Bullet list"><List size={16} /></button>
                <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Numbered list" title="Numbered list"><ListOrdered size={16} /></button>
              </div>
              <div className="trip-details__notes-general-wrap">
                <textarea
                  className="trip-details__notes-textarea"
                  placeholder="Write a note..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  rows={10}
                />
                <label className="trip-details__notes-attach-label">
                  <Paperclip size={18} aria-hidden />
                  <span>Attach files</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="trip-details__notes-attach-input"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files?.length) return;
                      const toAdd = Array.from(files).map((f) => createAttachmentFromFile(f)).slice(0, 5 - generalAttachments.length);
                      setGeneralAttachments((prev) => [...prev, ...toAdd].slice(0, 5));
                      e.target.value = '';
                    }}
                  />
                </label>
                {generalAttachments.length > 0 && (
                  <ul className="trip-details__notes-attach-list">
                    {generalAttachments.map((att, ai) => (
                      <li key={ai} className="trip-details__notes-attach-item">
                        <Paperclip size={12} aria-hidden />
                        {att.url ? (
                          <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
                        ) : (
                          att.name
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="trip-details__notes-actions">
                  <button
                    type="button"
                    className="trip-details__modal-update"
                    onClick={saveGeneralNotesAndDocuments}
                    disabled={notesSaving}
                  >
                    {notesSaving ? 'Saving...' : 'Save general notes'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {notesActiveTab.startsWith('day-') && (() => {
            const dayIdx = parseInt(notesActiveTab.replace('day-', ''), 10);
            const day = days[dayIdx];
            const dayItems = (tripExpenseItems || []).filter((it) => it.date === day?.date);
            const dayLabel = `Day ${dayIdx + 1}`;
            return (
              <div className="trip-details__notes-day">
                <h3 className="trip-details__notes-section-title">Day {dayIdx + 1} notes</h3>
                {dayItems.length === 0 ? (
                  <p className="trip-details__notes-empty">No places or activities added for this day yet. Add items from the board to attach notes here.</p>
                ) : (
                  <ul className="trip-details__notes-day-list">
                    {dayItems.map((item, i) => (
                      <li key={item.id} className="trip-details__notes-day-item">
                        <div className="trip-details__notes-day-item-header">
                          <span className="trip-details__notes-day-num" aria-hidden>{i + 1}</span>
                          <span className="trip-details__notes-day-name">{item.name}</span>
                          <label className="trip-details__notes-attach-label trip-details__notes-attach-label--inline">
                            <Paperclip size={16} aria-hidden />
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              className="trip-details__notes-attach-input"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (!files?.length) return;
                                const toAdd = Array.from(files).slice(0, 3 - (item.attachments?.length || 0)).map((f) => createAttachmentFromFile(f));
                                setTripExpenseItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, attachments: [...(it.attachments || []), ...toAdd] } : it)));
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                        <textarea
                          className="trip-details__notes-textarea trip-details__notes-textarea--item"
                          placeholder="Add notes and documents..."
                          value={item.notes ?? ''}
                          onChange={(e) => setTripExpenseItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, notes: e.target.value } : it)))}
                          rows={3}
                        />
                        {(item.attachments?.length > 0) && (
                          <ul className="trip-details__notes-attach-list">
                            {item.attachments.map((att, ai) => (
                              <li key={ai} className="trip-details__notes-attach-item">
                                <Paperclip size={12} aria-hidden />
                                {att.url ? (
                                  <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
                                ) : (
                                  att.name
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="trip-details__notes-actions">
                  <button
                    type="button"
                    className="trip-details__modal-update"
                    onClick={() => saveDayNotesAndDocuments(day?.date, dayLabel)}
                    disabled={notesSaving || !day?.date}
                  >
                    {notesSaving ? 'Saving...' : `Save ${dayLabel} notes`}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
