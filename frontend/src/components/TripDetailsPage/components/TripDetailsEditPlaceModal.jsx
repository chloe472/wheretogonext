import { Clock, Paperclip, Trash2, X } from 'lucide-react';
import { resolveImageUrl } from '../../../lib/imageFallback';
import {
  createAttachmentFromFile,
  durationMinutesToParts,
  findTimeOverlapItem,
  formatDayDate,
  getStayWindow,
  isStayItem,
  parseDateTimeLocal,
} from '../lib/tripDetailsPageHelpers';

export default function TripDetailsEditPlaceModal({
  editPlaceItem,
  onClose,
  tripExpenseItems,
  setTripExpenseItems,
  days,
  currency,
  showInAppNotice,
  canOpenInternalItemOverview,
  openInternalItemOverview,
  handleImageError,
  setPendingDeleteItemId,
}) {
  const item = tripExpenseItems.find((i) => i.id === editPlaceItem.id) ?? editPlaceItem;
  const isStayEditing = isStayItem(item);
  const stayWindow = isStayEditing ? getStayWindow(item) : null;
  const update = (updates) => setTripExpenseItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...updates } : it)));
  const updateWithOverlapValidation = (updates) => {
    const candidate = {
      ...item,
      ...updates,
    };
    const overlapping = findTimeOverlapItem(tripExpenseItems, {
      date: candidate.date,
      startTime: candidate.startTime,
      durationHrs: candidate.durationHrs,
      durationMins: candidate.durationMins,
      categoryId: candidate.categoryId,
      excludeId: item.id,
    });
    if (overlapping) {
      showInAppNotice('This time overlaps with another item in your itinerary.', 'warning');
      return;
    }
    update(updates);
  };
  const updateStayWindow = (updates) => {
    const nextCheckInDate = updates.checkInDate ?? (stayWindow?.checkInDate || item.date || '');
    const nextCheckInTime = updates.checkInTime ?? (stayWindow?.checkInTime || item.startTime || '15:00');
    const nextCheckOutDate = updates.checkOutDate ?? (stayWindow?.checkOutDate || nextCheckInDate);
    const nextCheckOutTime = updates.checkOutTime ?? (stayWindow?.checkOutTime || nextCheckInTime);

    const checkIn = parseDateTimeLocal(nextCheckInDate, nextCheckInTime);
    const checkOut = parseDateTimeLocal(nextCheckOutDate, nextCheckOutTime);
    const durationUpdates = {};
    if (checkIn && checkOut && checkOut > checkIn) {
      const durationMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)));
      const durationParts = durationMinutesToParts(durationMinutes);
      durationUpdates.durationHrs = durationParts.durationHrs;
      durationUpdates.durationMins = durationParts.durationMins;
    }

    update({
      ...updates,
      date: nextCheckInDate,
      startTime: nextCheckInTime,
      ...durationUpdates,
    });
  };

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-details__edit-place-modal" role="dialog" aria-labelledby="edit-place-title" aria-modal="true">
        <div className="trip-details__edit-place-head">
          <h2 id="edit-place-title" className="trip-details__edit-place-title">{isStayEditing ? 'Edit Stay' : 'Edit Place'}</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="trip-details__edit-place-body">
          <div className="trip-details__edit-place-overview">
            {item.placeImageUrl && (
              <img src={resolveImageUrl(item.placeImageUrl, item.name, isStayEditing ? 'hotel' : 'landmark')} alt="" className="trip-details__edit-place-thumb" onError={handleImageError} />
            )}
            <div className="trip-details__edit-place-meta">
              <span className="trip-details__edit-place-type">{isStayEditing ? 'Stay' : 'Place'}</span>
              <h3 className="trip-details__edit-place-name">{item.name}</h3>
              {(item.rating != null || item.reviewCount != null) && (
                <p className="trip-details__edit-place-rating">
                  {[item.rating != null && item.rating, item.reviewCount != null && `${item.reviewCount.toLocaleString()} reviews`].filter(Boolean).join(' • ')}
                </p>
              )}
              <p className="trip-details__edit-place-address">{item.detail || '—'}</p>
              {canOpenInternalItemOverview(item) ? (
                <button
                  type="button"
                  className="trip-details__edit-place-view-details trip-details__edit-place-view-details--button"
                  onClick={() => openInternalItemOverview(item)}
                >
                  View details
                </button>
              ) : (
                <span className="trip-details__edit-place-view-details trip-details__edit-place-view-details--muted">View details</span>
              )}
            </div>
          </div>
          <div className="trip-details__edit-place-fields">
            {isStayEditing ? (
              <>
                <label className="trip-details__edit-place-label">
                  <span className="trip-details__edit-place-label-text">Check-in date <span className="trip-details__edit-place-required">*</span></span>
                  <input
                    type="date"
                    className="trip-details__edit-place-input"
                    value={stayWindow?.checkInDate || ''}
                    onChange={(e) => updateStayWindow({ checkInDate: e.target.value })}
                    required
                  />
                </label>
                <label className="trip-details__edit-place-label">
                  <span className="trip-details__edit-place-label-text">Check-in time <span className="trip-details__edit-place-required">*</span></span>
                  <span className="trip-details__edit-place-input-wrap">
                    <Clock size={18} className="trip-details__edit-place-input-icon" aria-hidden />
                    <input
                      type="time"
                      className="trip-details__edit-place-input"
                      value={stayWindow?.checkInTime || '15:00'}
                      onChange={(e) => updateStayWindow({ checkInTime: e.target.value })}
                    />
                  </span>
                </label>
                <label className="trip-details__edit-place-label">
                  <span className="trip-details__edit-place-label-text">Check-out date <span className="trip-details__edit-place-required">*</span></span>
                  <input
                    type="date"
                    className="trip-details__edit-place-input"
                    value={stayWindow?.checkOutDate || ''}
                    onChange={(e) => updateStayWindow({ checkOutDate: e.target.value })}
                    required
                  />
                </label>
                <label className="trip-details__edit-place-label">
                  <span className="trip-details__edit-place-label-text">Check-out time <span className="trip-details__edit-place-required">*</span></span>
                  <span className="trip-details__edit-place-input-wrap">
                    <Clock size={18} className="trip-details__edit-place-input-icon" aria-hidden />
                    <input
                      type="time"
                      className="trip-details__edit-place-input"
                      value={stayWindow?.checkOutTime || '11:00'}
                      onChange={(e) => updateStayWindow({ checkOutTime: e.target.value })}
                    />
                  </span>
                </label>
              </>
            ) : (
              <>
                <label className="trip-details__edit-place-label">
                  <span className="trip-details__edit-place-label-text">Date <span className="trip-details__edit-place-required">*</span></span>
                  <select
                    className="trip-details__edit-place-select"
                    value={item.date || ''}
                    onChange={(e) => updateWithOverlapValidation({ date: e.target.value })}
                    required
                  >
                    {days.map((d) => (
                      <option key={d.date} value={d.date}>Day {d.dayNum}: {formatDayDate(d.date)}</option>
                    ))}
                  </select>
                </label>
                <label className="trip-details__edit-place-label">
                  <span className="trip-details__edit-place-label-text">Start time <span className="trip-details__edit-place-required">*</span></span>
                  <span className="trip-details__edit-place-input-wrap">
                    <Clock size={18} className="trip-details__edit-place-input-icon" aria-hidden />
                    <input
                      type="time"
                      className="trip-details__edit-place-input"
                      value={item.startTime || '07:00'}
                      onChange={(e) => updateWithOverlapValidation({ startTime: e.target.value })}
                    />
                  </span>
                </label>
                <label className="trip-details__edit-place-label">
                  <span className="trip-details__edit-place-label-text">Duration <span className="trip-details__edit-place-required">*</span></span>
                  <div className="trip-details__edit-place-duration">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      className="trip-details__edit-place-duration-input"
                      value={item.durationHrs ?? 1}
                      onChange={(e) => updateWithOverlapValidation({ durationHrs: Number(e.target.value) || 0 })}
                      aria-label="Hours"
                    />
                    <span className="trip-details__edit-place-duration-sep">hrs</span>
                    <span className="trip-details__edit-place-duration-colon">:</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      className="trip-details__edit-place-duration-input"
                      value={item.durationMins ?? 0}
                      onChange={(e) => updateWithOverlapValidation({ durationMins: Number(e.target.value) || 0 })}
                      aria-label="Minutes"
                    />
                    <span className="trip-details__edit-place-duration-sep">mins</span>
                  </div>
                </label>
              </>
            )}
            <label className="trip-details__edit-place-label">
              Note (Optional)
              <textarea
                className="trip-details__edit-place-textarea"
                placeholder="Add a note..."
                value={item.notes ?? ''}
                onChange={(e) => update({ notes: e.target.value })}
                rows={3}
              />
            </label>
            <label className="trip-details__edit-place-label">
              Cost (Optional)
              <span className="trip-details__edit-place-cost-wrap">
                <span className="trip-details__edit-place-cost-prefix">{currency} $</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="trip-details__edit-place-input"
                  value={item.total ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    update({ total: v === '' ? null : Number(v) });
                  }}
                />
              </span>
            </label>
            <label className="trip-details__edit-place-label">
              External link (optional)
              <span className="trip-details__edit-place-input-wrap trip-details__edit-place-input-wrap--prefix">
                <span className="trip-details__edit-place-prefix">https://</span>
                <input
                  type="text"
                  className="trip-details__edit-place-input"
                  placeholder="Type or paste the activity link"
                  value={(item.externalLink || '').replace(/^https?:\/\//i, '')}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    update({ externalLink: v ? `https://${v.replace(/^https?:\/\//i, '')}` : '' });
                  }}
                />
              </span>
            </label>
            <div className="trip-details__edit-place-docs">
              <h4 className="trip-details__edit-place-docs-title">Travel Documents</h4>
              <p className="trip-details__edit-place-docs-hint">Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.</p>
              <label className="trip-details__edit-place-attach-label">
                <Paperclip size={18} aria-hidden />
                Attach files
                <input
                  type="file"
                  multiple
                  accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp"
                  className="trip-details__notes-attach-input"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files?.length) return;
                    const toAdd = Array.from(files).slice(0, 3 - (item.attachments?.length || 0)).map((f) => createAttachmentFromFile(f));
                    update({ attachments: [...(item.attachments || []), ...toAdd].slice(0, 3) });
                    e.target.value = '';
                  }}
                />
              </label>
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
            </div>
          </div>
        </div>
        <div className="trip-details__edit-place-actions">
          <button
            type="button"
            className="trip-details__edit-place-delete"
            onClick={() => {
              setPendingDeleteItemId(item.id);
            }}
          >
            <Trash2 size={18} aria-hidden />
            Delete
          </button>
          <div className="trip-details__edit-place-actions-right">
            <button type="button" className="trip-details__modal-cancel" onClick={onClose}>Cancel</button>
            <button type="button" className="trip-details__edit-place-save" onClick={onClose}>Save</button>
          </div>
        </div>
      </div>
    </>
  );
}
