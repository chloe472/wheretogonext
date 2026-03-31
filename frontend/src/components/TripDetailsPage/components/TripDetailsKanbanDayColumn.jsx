import {
  Bed,
  Camera,
  Check,
  ChevronDown,
  FileText,
  GripVertical,
  Info,
  MapPin,
  MoreVertical,
  Palette,
  Plus,
  Route,
  Trash2,
} from 'lucide-react';
import { resolveImageUrl } from '../../../lib/imageFallback';
import {
  DAY_COLOR_OPTIONS,
  TRAVEL_MODES,
  addDays,
  formatDurationMinutes,
  formatStayDateTime,
  formatTimeRange,
  formatUsdAsCurrency,
  getCategoryStyle,
  getDayStayItems,
  getDayTotalDurationMinutes,
  getSortedDayItems,
  getStayWindow,
  getTransportTimesFromDetail,
  getTravelBetween,
  isEditableItineraryItem,
  isFlightItem,
  isStayItem,
  normalizeAttachment,
  shouldShiftForInsertedDay,
  shiftDayKeyAfterInsert,
} from '../lib/tripDetailsPageHelpers';

export default function TripDetailsKanbanDayColumn({
  day,
  daysCount,
  tripExpenseItems,
  currency,
  exchangeRates,
  openDayMenuKey,
  setOpenDayMenuKey,
  dayColors,
  setDayColors,
  dayColorPickerDay,
  setDayColorPickerDay,
  dayTitles,
  setDayTitle,
  getDayColumnWidth,
  beginDayColumnResize,
  displayStart,
  displayEnd,
  setDateRange,
  setOptimizeRouteDay,
  setOptimizeRouteStartId,
  setOptimizeRouteEndId,
  setOptimizeRouteModalOpen,
  setMapDayFilterSelected,
  setMapDayFilterOpen,
  skipExpenseSaveToastUntilRef,
  setTripExpenseItems,
  setDayTitles,
  setDayColumnWidths,
  showInAppNotice,
  openInternalItemOverview,
  handleImageError,
  transportModeBySegment,
  setTransportModeBySegment,
  openTravelDropdownKey,
  setOpenTravelDropdownKey,
  travelTimeCache,
  setTravelTimeCache,
  setEditPlaceItem,
  setPublicTransportSegment,
  setPublicTransportModalOpen,
  setAddSheetFromCalendar,
  setAddSheetDay,
  setAddSheetAnchor,
}) {
  const dayStayItems = getDayStayItems(tripExpenseItems, day.date);
  const boardDayItems = getSortedDayItems(tripExpenseItems, day.date, { includeOvernightStays: true })
    .filter((item) => !isStayItem(item));
  const dayItemsCount = boardDayItems.length;
  const totalMins = getDayTotalDurationMinutes(tripExpenseItems, day.date);
  const durationStr = formatDurationMinutes(totalMins || 60);
  const isDayMenuOpen = openDayMenuKey === day.dayNum;
  const dayColor = dayColors[day.dayNum] ?? DAY_COLOR_OPTIONS[((Number(day.dayNum) - 1) % DAY_COLOR_OPTIONS.length + DAY_COLOR_OPTIONS.length) % DAY_COLOR_OPTIONS.length];

  return (
    <section
      className="trip-details__day-col"
      style={{ width: getDayColumnWidth(day.dayNum), flexBasis: getDayColumnWidth(day.dayNum) }}
    >
      <div className="trip-details__day-header">
        <div className="trip-details__day-heading">
          <GripVertical size={14} className="trip-details__grip" aria-hidden />
          <h2 className="trip-details__day-title">
            Day {day.dayNum}: {day.label}
          </h2>
        </div>
        <div className="trip-details__day-header-actions" data-day-menu>
          <button
            type="button"
            className="trip-details__day-optimize-btn"
            aria-label="Optimize route"
            title={dayItemsCount < 2 ? 'Add at least 2 places to optimize route' : 'Optimize route'}
            disabled={dayItemsCount < 2}
            onClick={() => {
              const items = getSortedDayItems(tripExpenseItems, day.date)
                .filter((item) => !isStayItem(item));
              if (items.length < 2) return;
              setOptimizeRouteDay(day);
              setOptimizeRouteStartId(items[0]?.id ?? '');
              setOptimizeRouteEndId(items[items.length - 1]?.id ?? '');
              setOptimizeRouteModalOpen(true);
            }}
          >
            <Route size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="trip-details__day-menu"
            aria-label="Day options"
            aria-expanded={isDayMenuOpen}
            aria-haspopup="menu"
            onClick={() => { setOpenDayMenuKey(isDayMenuOpen ? null : day.dayNum); setDayColorPickerDay(null); }}
          >
            <MoreVertical size={16} aria-hidden />
          </button>
          {isDayMenuOpen && (
            <div className="trip-details__day-dropdown" role="menu">
              <button
                type="button"
                className="trip-details__day-dropdown-item"
                role="menuitem"
                onClick={() => {
                  setMapDayFilterSelected([day.dayNum]);
                  setMapDayFilterOpen(true);
                  setOpenDayMenuKey(null);
                }}
              >
                <MapPin size={18} aria-hidden />
                Show in map
              </button>
              <div className="trip-details__day-dropdown-item trip-details__day-dropdown-item--sub">
                <button type="button" className="trip-details__day-dropdown-item-btn" onClick={() => setDayColorPickerDay(dayColorPickerDay === day.dayNum ? null : day.dayNum)}>
                  <Palette size={18} aria-hidden />
                  Change colour
                </button>
                {dayColorPickerDay === day.dayNum && (
                  <div className="trip-details__day-color-picker">
                    {DAY_COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="trip-details__day-color-swatch"
                        style={{ background: color }}
                        aria-label={`Color ${color}`}
                        onClick={() => { setDayColors((prev) => ({ ...prev, [day.dayNum]: color })); setDayColorPickerDay(null); }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="trip-details__day-dropdown-item"
                role="menuitem"
                onClick={() => {
                  skipExpenseSaveToastUntilRef.current = Date.now() + 4000;
                  setTripExpenseItems((prev) => prev.map((it) => {
                    const next = { ...it };
                    if (shouldShiftForInsertedDay(next.date, day.date, 'before')) next.date = addDays(next.date, 1);
                    if (shouldShiftForInsertedDay(next.checkInDate, day.date, 'before')) next.checkInDate = addDays(next.checkInDate, 1);
                    if (shouldShiftForInsertedDay(next.checkOutDate, day.date, 'before')) next.checkOutDate = addDays(next.checkOutDate, 1);
                    if (shouldShiftForInsertedDay(next.startDate, day.date, 'before')) next.startDate = addDays(next.startDate, 1);
                    if (shouldShiftForInsertedDay(next.endDate, day.date, 'before')) next.endDate = addDays(next.endDate, 1);
                    return next;
                  }));
                  setDayTitles((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      next[shiftDayKeyAfterInsert(key, day.dayNum, 'before')] = v;
                    });
                    return next;
                  });
                  setDayColors((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      next[shiftDayKeyAfterInsert(key, day.dayNum, 'before')] = v;
                    });
                    return next;
                  });
                  setDayColumnWidths((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      next[shiftDayKeyAfterInsert(key, day.dayNum, 'before')] = v;
                    });
                    return next;
                  });
                  setMapDayFilterSelected((prev) => prev.map((n) => shiftDayKeyAfterInsert(n, day.dayNum, 'before')));
                  setDateRange({ startDate: displayStart, endDate: addDays(displayEnd, 1) });
                  setOpenDayMenuKey(null);
                }}
              >
                Insert day before
              </button>
              <button
                type="button"
                className="trip-details__day-dropdown-item"
                role="menuitem"
                onClick={() => {
                  skipExpenseSaveToastUntilRef.current = Date.now() + 4000;
                  setTripExpenseItems((prev) => prev.map((it) => {
                    const next = { ...it };
                    if (shouldShiftForInsertedDay(next.date, day.date, 'after')) next.date = addDays(next.date, 1);
                    if (shouldShiftForInsertedDay(next.checkInDate, day.date, 'after')) next.checkInDate = addDays(next.checkInDate, 1);
                    if (shouldShiftForInsertedDay(next.checkOutDate, day.date, 'after')) next.checkOutDate = addDays(next.checkOutDate, 1);
                    if (shouldShiftForInsertedDay(next.startDate, day.date, 'after')) next.startDate = addDays(next.startDate, 1);
                    if (shouldShiftForInsertedDay(next.endDate, day.date, 'after')) next.endDate = addDays(next.endDate, 1);
                    return next;
                  }));
                  setDayTitles((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      next[shiftDayKeyAfterInsert(key, day.dayNum, 'after')] = v;
                    });
                    return next;
                  });
                  setDayColors((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      next[shiftDayKeyAfterInsert(key, day.dayNum, 'after')] = v;
                    });
                    return next;
                  });
                  setDayColumnWidths((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      next[shiftDayKeyAfterInsert(key, day.dayNum, 'after')] = v;
                    });
                    return next;
                  });
                  setMapDayFilterSelected((prev) => prev.map((n) => shiftDayKeyAfterInsert(n, day.dayNum, 'after')));
                  setDateRange({ startDate: displayStart, endDate: addDays(displayEnd, 1) });
                  setOpenDayMenuKey(null);
                }}
              >
                Insert day after
              </button>
              <button
                type="button"
                className="trip-details__day-dropdown-item"
                role="menuitem"
                onClick={() => {
                  setTripExpenseItems((prev) => prev.filter((it) => it.date !== day.date));
                  setOpenDayMenuKey(null);
                }}
              >
                Clear all ({dayItemsCount})
              </button>
              <button
                type="button"
                className="trip-details__day-dropdown-item trip-details__day-dropdown-item--danger"
                role="menuitem"
                onClick={() => {
                  skipExpenseSaveToastUntilRef.current = Date.now() + 4000;
                  const isFirst = day.dayNum === 1;
                  const isLast = day.dayNum === daysCount;
                  if (daysCount <= 1) { setOpenDayMenuKey(null); return; }
                  setTripExpenseItems((prev) => prev
                    .filter((it) => it.date !== day.date)
                    .map((it) => {
                      if (isFirst || isLast) return it;
                      const next = { ...it };
                      if (next.date && next.date > day.date) next.date = addDays(next.date, -1);
                      if (next.checkInDate && next.checkInDate > day.date) next.checkInDate = addDays(next.checkInDate, -1);
                      if (next.checkOutDate && next.checkOutDate > day.date) next.checkOutDate = addDays(next.checkOutDate, -1);
                      if (next.startDate && next.startDate > day.date) next.startDate = addDays(next.startDate, -1);
                      if (next.endDate && next.endDate > day.date) next.endDate = addDays(next.endDate, -1);
                      return next;
                    }));

                  setDayTitles((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      if (key === day.dayNum) return;
                      next[key > day.dayNum ? key - 1 : key] = v;
                    });
                    return next;
                  });

                  setDayColors((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      if (key === day.dayNum) return;
                      next[key > day.dayNum ? key - 1 : key] = v;
                    });
                    return next;
                  });

                  setDayColumnWidths((prev) => {
                    const next = {};
                    Object.entries(prev || {}).forEach(([k, v]) => {
                      const key = Number(k);
                      if (key === day.dayNum) return;
                      next[key > day.dayNum ? key - 1 : key] = v;
                    });
                    return next;
                  });

                  setMapDayFilterSelected((prev) => {
                    const shifted = prev
                      .filter((n) => n !== day.dayNum)
                      .map((n) => (n > day.dayNum ? n - 1 : n));
                    return Array.from(new Set(shifted)).sort((a, b) => a - b);
                  });

                  if (isFirst) setDateRange({ startDate: addDays(displayStart, 1), endDate: displayEnd });
                  else setDateRange({ startDate: displayStart, endDate: addDays(displayEnd, -1) });

                  showInAppNotice(`Deleted Day ${day.dayNum}.`, 'success');
                  setOpenDayMenuKey(null);
                }}
              >
                <Trash2 size={18} aria-hidden />
                Delete day
              </button>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="trip-details__day-resize-handle"
        aria-label={`Resize Day ${day.dayNum} column`}
        onMouseDown={(e) => beginDayColumnResize(day.dayNum, e)}
        onTouchStart={(e) => beginDayColumnResize(day.dayNum, e)}
      />
      <div className="trip-details__day-summary" style={dayColor ? { borderLeftColor: dayColor } : undefined}>
        <span className="trip-details__day-summary-text">Day {day.dayNum}: {day.label} · {durationStr}</span>
        <Info size={14} className="trip-details__day-summary-icon" aria-hidden />
      </div>
      <input
        type="text"
        className="trip-details__day-input"
        placeholder="Add day title..."
        value={dayTitles[day.dayNum] ?? ''}
        onChange={(e) => setDayTitle(day.dayNum, e.target.value)}
      />
      <div className="trip-details__day-content">
        {dayStayItems.map((stayItem) => {
          const stayWindow = getStayWindow(stayItem);
          return (
            <button
              key={`stay-info-${day.date}-${stayItem.id}`}
              type="button"
              className="trip-details__stay-banner"
              onClick={() => openInternalItemOverview(stayItem)}
            >
              <div className="trip-details__stay-banner-thumb" aria-hidden>
                {stayItem.placeImageUrl ? (
                  <img src={resolveImageUrl(stayItem.placeImageUrl, stayItem.name, 'hotel')} alt="" className="trip-details__stay-banner-img" onError={handleImageError} />
                ) : (
                  <span className="trip-details__stay-banner-icon">
                    <Bed size={20} aria-hidden />
                  </span>
                )}
              </div>
              <div className="trip-details__stay-banner-body">
                <span className="trip-details__stay-banner-label">Stay</span>
                <strong className="trip-details__stay-banner-name">{stayItem.name}</strong>
                <span className="trip-details__stay-banner-time">
                  Check-in: {formatStayDateTime(stayWindow.checkInDate, stayWindow.checkInTime)}
                </span>
                <span className="trip-details__stay-banner-time">
                  Check-out: {formatStayDateTime(stayWindow.checkOutDate, stayWindow.checkOutTime)}
                </span>
              </div>
            </button>
          );
        })}
        {boardDayItems.map((item, idx) => {
          const style = getCategoryStyle(item);
          const IconComponent = item.Icon || Camera;
          const timeRange = formatTimeRange(item);
          const isTransportItem = item.categoryId === 'transportations' || Boolean(item.transportType);
          const transportTypeLabel = item.transportType
            ? `${String(item.transportType).charAt(0).toUpperCase()}${String(item.transportType).slice(1)}`
            : 'Transport';
          const transportTitle = `Transport (${transportTypeLabel})`;
          const transportRoute = (String(item.name || '')
            .replace(/^[A-Za-z]+:\s*/, '')
            .replace(/\s*→\s*/g, ' to ')) || 'Route not available';
          const transportTimes = getTransportTimesFromDetail(item.detail);
          const transportMeta = transportTimes.dep && transportTimes.arr
            ? `Dep ${transportTimes.dep} - Arr ${transportTimes.arr}`
            : (timeRange ? `Dep ${timeRange}` : 'Time not available');
          const itemNotes = String(item.notes || '').trim();
          const itemHasCost = Number(item.total || 0) > 0;
          const itemExternalLink = String(item.externalLink || '').trim();
          const itemAttachments = Array.isArray(item.attachments) ? item.attachments : [];
          const hasMetaDetails = Boolean(itemNotes || itemHasCost || itemExternalLink || itemAttachments.length > 0);
          const segmentKey = `${day.date}-${idx}`;
          const mode = transportModeBySegment[segmentKey] || 'driving';
          const travelModeInfo = TRAVEL_MODES.find((m) => m.id === mode) || TRAVEL_MODES[2];
          const TravelSegmentIcon = travelModeInfo.Icon;
          const nextItem = boardDayItems[idx + 1];
          const hideTravelSegment = Boolean(nextItem) && (isFlightItem(item) || isFlightItem(nextItem));
          const travelToNext = nextItem && !hideTravelSegment
            ? getTravelBetween(item, nextItem, mode, travelTimeCache, setTravelTimeCache)
            : null;
          const isTravelDropdownOpen = openTravelDropdownKey === segmentKey;
          return (
            <div key={item.id} className="trip-details__itinerary-block">
              <div className="trip-details__itinerary-card">
                <div className="trip-details__itinerary-card-thumb">
                  {item.placeImageUrl ? (
                    <img src={resolveImageUrl(item.placeImageUrl, item.name, 'landmark')} alt="" className="trip-details__itinerary-card-img" onError={handleImageError} />
                  ) : (
                    <span className="trip-details__itinerary-card-icon" style={{ background: `${style.color}22`, color: style.color }}>
                      <IconComponent size={20} aria-hidden />
                    </span>
                  )}
                </div>
                <div className={`trip-details__itinerary-card-body ${isTransportItem ? 'trip-details__itinerary-card-body--transport' : ''}`}>
                  <span className="trip-details__itinerary-category" style={{ color: style.color }}>
                    {isTransportItem ? transportTitle : style.label}
                  </span>
                  <h4 className={`trip-details__itinerary-name ${isTransportItem ? 'trip-details__itinerary-name--transport' : ''}`}>{isTransportItem ? transportRoute : item.name}</h4>
                  {(isTransportItem ? transportMeta : timeRange) ? (
                    <span className={`trip-details__itinerary-time ${isTransportItem ? 'trip-details__itinerary-time--transport' : ''}`}>
                      {isTransportItem ? transportMeta : timeRange}
                    </span>
                  ) : null}
                  {hasMetaDetails ? (
                    <div className="trip-details__itinerary-meta">
                      {itemNotes ? (
                        <p className="trip-details__itinerary-meta-line">
                          <strong>Note:</strong> {itemNotes}
                        </p>
                      ) : null}
                      {itemHasCost ? (
                        <p className="trip-details__itinerary-meta-line">
                          <strong>Cost:</strong> {formatUsdAsCurrency(Number(item.total), currency, exchangeRates)}
                        </p>
                      ) : null}
                      {itemExternalLink ? (
                        <p className="trip-details__itinerary-meta-line">
                          <strong>Link:</strong>{' '}
                          <a
                            href={itemExternalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="trip-details__itinerary-meta-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {itemExternalLink.replace(/^https?:\/\//, '')}
                          </a>
                        </p>
                      ) : null}
                      {itemAttachments.length > 0 ? (
                        <p className="trip-details__itinerary-meta-line">
                          <strong>Docs:</strong>{' '}
                          {itemAttachments.map((doc, docIdx) => {
                            const attachment = normalizeAttachment(doc);
                            if (!attachment) return null;
                            return (
                              <span key={`${item.id}-doc-${docIdx}`}>
                                {docIdx > 0 ? ', ' : ''}
                                {attachment.url ? (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="trip-details__itinerary-meta-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {attachment.name}
                                  </a>
                                ) : (
                                  attachment.name
                                )}
                              </span>
                            );
                          })}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {!isTransportItem ? (
                  <button
                    type="button"
                    className="trip-details__itinerary-edit-btn"
                    aria-label="Edit"
                    onClick={(e) => { e.stopPropagation(); isEditableItineraryItem(item) && setEditPlaceItem(item); }}
                  >
                    <FileText size={16} aria-hidden />
                  </button>
                ) : null}
              </div>
              {nextItem && travelToNext && (
                <div className="trip-details__travel-segment-wrap">
                  <button
                    type="button"
                    className="trip-details__travel-segment"
                    onClick={() => setOpenTravelDropdownKey(isTravelDropdownOpen ? null : segmentKey)}
                    aria-expanded={isTravelDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <TravelSegmentIcon size={16} className="trip-details__travel-segment-icon" aria-hidden />
                    <span>{travelToNext.duration} · {travelToNext.distance}</span>
                    <ChevronDown size={14} aria-hidden />
                  </button>
                  {isTravelDropdownOpen && (
                    <>
                      <button type="button" className="trip-details__travel-dropdown-backdrop" aria-label="Close" onClick={() => setOpenTravelDropdownKey(null)} />
                      <ul className="trip-details__travel-dropdown" role="listbox">
                        {TRAVEL_MODES.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={mode === m.id}
                              className="trip-details__travel-dropdown-option"
                              onClick={() => {
                                setTransportModeBySegment((prev) => ({ ...prev, [segmentKey]: m.id }));
                                setOpenTravelDropdownKey(null);
                                if (m.id === 'public') {
                                  setPublicTransportSegment({
                                    fromName: item.name,
                                    toName: nextItem.name,
                                    fromLat: item.lat,
                                    fromLng: item.lng,
                                    toLat: nextItem.lat,
                                    toLng: nextItem.lng,
                                  });
                                  setPublicTransportModalOpen(true);
                                }
                              }}
                            >
                              <m.Icon size={18} aria-hidden />
                              <span>{m.id === 'public' ? `${m.label}` : `${m.label} · ${getTravelBetween(item, nextItem, m.id, travelTimeCache, setTravelTimeCache).duration}`}</span>
                              {mode === m.id && <Check size={18} className="trip-details__travel-check" aria-hidden />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="trip-details__add-btn"
        onClick={(e) => {
          setAddSheetFromCalendar(false);
          setAddSheetDay(day.dayNum);
          const rect = e.currentTarget.getBoundingClientRect();
          setAddSheetAnchor({ top: rect.top, left: rect.left, width: rect.width });
        }}
      >
        <Plus size={16} aria-hidden />
        Add things to do, hotels...
      </button>
    </section>
  );
}
