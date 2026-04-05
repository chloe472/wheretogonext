import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  Trash2,
  Info,
  Camera,
  UtensilsCrossed,
  Car,
  Ticket,
  Users,
  Check,
  Plane,
  Train,
  Bus,
  Shield,
  Tag,
  Headphones,
  Minus,
  Ship,
  Route,
  ExternalLink,
} from 'lucide-react';
import {
  duplicateItinerary,
  fetchItineraryById,
  updateItinerary,
  shareItineraryWithFriends,
} from '../../api/itinerariesApi';
import PublishItineraryModal from '../PublishItineraryModal/PublishItineraryModal';
import SetCoverImageModal from '../Dashboard/components/SetCoverImageModal';
import { resolveImageUrl, applyImageFallback } from '../../lib/imageFallback';
import { useSocialImport } from '../SocialImportModal/useSocialImport';
import { fetchMyProfile, lookupUserByEmail, searchUsers } from '../../api/profileApi';
import TripShareModal from './components/TripShareModal';
import {
  TripDetailsPageLayout,
  TripDetailsModalStack,
  TripDetailsLoadingView,
  TripDetailsMissingTripView,
} from './components';
import {
  useTripDetailsMapPanelProps,
  useTripDetailsItineraryLoad,
  useTripDetailsExchangeRates,
  useTripDetailsLocalTrip,
  useTripDetailsTripCurrency,
  useTripDetailsFriendlyDialog,
  useTripDetailsTitleChrome,
  useTripDetailsDiscovery,
  useTripDetailsDiscoveryFilters,
  useTripDetailsDatePersist,
  useTripDetailsDerivedState,
  useTripDetailsExpensePersist,
  useTripDetailsHeaderActions,
  useTripDetailsHydration,
  useTripDetailsInAppNotice,
  useTripDetailsRouteIdeas,
  useTripDetailsCalendarInteractions,
  useTripDetailsDayColumnResize,
  useTripDetailsWhereCityRanges,
  useTripDetailsWhereApply,
  useTripDetailsWhereSuggestions,
  useTripDetailsDayMenuOutsideClose,
  useTripDetailsBookingModals,
  useTripDetailsBulkItineraryAdd,
  useTripDetailsAddSheet,
  useTripDetailsCustomItems,
  useTripDetailsDetailViews,
  useTripDetailsMapData,
  useTripDetailsNotes,
  useTripDetailsTransport,
} from './hooks';
import { useTripDetailsAddToTrip } from './hooks/useTripDetailsAddToTrip';
import {
  AIRPORTS_AND_CITIES,
  AIRLINES,
  searchLocationsForSurfaceTransport,
} from './lib/tripDetailsTransportData';
import './TripDetailsPage.css';


import {
  ADD_PLACES_PAGE_SIZE,
  CATEGORY_CARD_STYLES,
  DAY_LABELS,
  DAY_NAMES,
  EXPENSE_CATEGORIES,
  PLACE_SORT_OPTIONS,
  ROUTE_MATRIX_TRAVEL_MODE,
  ZERO_DECIMAL_CURRENCIES,
  appendDestinationLabelToTripDoc,
  buildStayBookingDeepLink,
  currencyRate,
  estimateSmartStopDurationMinutes,
  extractPrimaryDestination,
  findTimeOverlapItem,
  formatCurrencyAmount,
  formatDayDate,
  getDestinationList,
  getEndTime,
  getItemViewDetailsUrl,
  getTravelBetweenFallback,
  getTravelBetweenGoogleMaps,
  hasValidLatLng,
  isEditableItineraryItem,
  isFlightItem,
  isStayActiveOnDay,
  isStayItem,
  itemSpillsIntoNextDay,
  itineraryDocToTrip,
  parseDurationTextToMinutes,
  parseFoodHours,
  rangesOverlap,
  toHHmmLocal,
} from './lib/tripDetailsPageHelpers';


export default function TripDetailsPage({ user, onLogout }) {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [locationUpdateKey, setLocationUpdateKey] = useState(0);
  const { serverItinerary, setServerItinerary, tripLoading, tripLoadError } =
    useTripDetailsItineraryLoad(tripId, location?.state);

  const tripData = useMemo(() => itineraryDocToTrip(serverItinerary), [serverItinerary]);
  const { trip, setLocalDestination, setLocalLocations } = useTripDetailsLocalTrip(tripData);
  const { discoveryData, discoveryLoading, discoveryError } = useTripDetailsDiscovery(trip);
  const {
    titleDropdownOpen,
    setTitleDropdownOpen,
    titleEditing,
    setTitleEditing,
    titleEditValue,
    setTitleEditValue,
    titleDisplay,
    setTitleDisplay,
    titleDropdownRef,
    titleLastClickRef,
  } = useTripDetailsTitleChrome({ trip, tripId, locationUpdateKey });

  const {
    exchangeRates,
    loadExchangeRates,
    currencyOptions,
    currencyOptionsForModal,
  } = useTripDetailsExchangeRates();
  const {
    currency,
    setCurrency,
    currencyModalOpen,
    setCurrencyModalOpen,
    modalCurrency,
    setModalCurrency,
  } = useTripDetailsTripCurrency(exchangeRates);
  const [friendlyDialog, setFriendlyDialog] = useTripDetailsFriendlyDialog();
  const [publishTarget, setPublishTarget] = useState(null);
  const [coverImageTarget, setCoverImageTarget] = useState(null);
  const [mapView, setMapView] = useState('Default');
  const [mapFilter, setMapFilter] = useState('Places');
  const [mapExpandOpen, setMapExpandOpen] = useState(false);
  const [dayTitles, setDayTitles] = useState({});
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [expenseSortBy, setExpenseSortBy] = useState('category');
  const [viewMode, setViewMode] = useState(searchParams.get('view') === 'calendar' ? 'calendar' : 'kanban');
  const [dateRange, setDateRange] = useState(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [addPlacesOpen, setAddPlacesOpen] = useState(false);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [addExperiencesOpen, setAddExperiencesOpen] = useState(false);
  const [addStaysOpen, setAddStaysOpen] = useState(false);
  const [placeDetailsView, setPlaceDetailsView] = useState(null);
  const [placeDetailsTab, setPlaceDetailsTab] = useState('overview');
  const [foodDetailsView, setFoodDetailsView] = useState(null);
  const [foodDetailsTab, setFoodDetailsTab] = useState('overview');
  const [experienceDetailsView, setExperienceDetailsView] = useState(null);
  const [experienceDetailsTab, setExperienceDetailsTab] = useState('overview');
  const [stayDetailsView, setStayDetailsView] = useState(null);
  const [stayDetailsTab, setStayDetailsTab] = useState('overview');
  const [itineraryDetailsView, setItineraryDetailsView] = useState(null);
  const [addPlacesDay, setAddPlacesDay] = useState(1);
  const [addFoodDay, setAddFoodDay] = useState(1);
  const [addExperiencesDay, setAddExperiencesDay] = useState(1);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeFilterTag, setPlaceFilterTag] = useState('');
  const [placeSortBy, setPlaceSortBy] = useState('Recommended');
  const [addPlacesPage, setAddPlacesPage] = useState(1);
  const [selectedPlaceMarkerId, setSelectedPlaceMarkerId] = useState(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodDietaryFilter, setFoodDietaryFilter] = useState('All');
  const [foodSortBy, setFoodSortBy] = useState('Recommended');
  const [staySearchQuery, setStaySearchQuery] = useState('');
  const [stayTypeFilter, setStayTypeFilter] = useState('All');
  const [stayStarFilter, setStayStarFilter] = useState('All');
  const [staySortBy, setStaySortBy] = useState('Recommended');
  const [experienceSearchQuery, setExperienceSearchQuery] = useState('');
  const [experienceTypeFilter, setExperienceTypeFilter] = useState('All');
  const [experiencePriceRange, setExperiencePriceRange] = useState('All');
  const [experienceDurationFilter, setExperienceDurationFilter] = useState('All');
  const [experienceSortBy, setExperienceSortBy] = useState('Recently added');
  const [addModalCityFilter, setAddModalCityFilter] = useState('All');
  const [tripExpenseItems, setTripExpenseItems] = useState([]);
  const [mapDayFilterOpen, setMapDayFilterOpen] = useState(false);
  const [mapDayFilterSelected, setMapDayFilterSelected] = useState([]);
  const [editPlaceItem, setEditPlaceItem] = useState(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState(null);
  const [whereModalOpen, setWhereModalOpen] = useState(false);
  const [whereQuery, setWhereQuery] = useState('');
  const [whereLocationSuggestions, setWhereLocationSuggestions] = useState([]);
  const [whereSuggestionsLoading, setWhereSuggestionsLoading] = useState(false);
  const [whereSuggestionsOpen, setWhereSuggestionsOpen] = useState(false);
  const [whereSelectedLocations, setWhereSelectedLocations] = useState([]);
  const [whereCityPlanRows, setWhereCityPlanRows] = useState([]);
  const [whereCityDayRanges, setWhereCityDayRanges] = useState({});
  const [whereCityDayDrafts, setWhereCityDayDrafts] = useState({});
  const [whereCityRangeError, setWhereCityRangeError] = useState('');
  const [calendarScrollLeft, setCalendarScrollLeft] = useState(0);
  const whereModalRef = useRef(null);
  const calendarTimelineRef = useRef(null);
  const hydratedTripItemsForIdRef = useRef(null);
  const tripDatePersistKeyRef = useRef('');
  /** Counts expense-item persists per trip; first persist is hydration — skip toast. */
  const expensePersistCountByTripRef = useRef({ tripId: null, count: 0 });
  const [transportModeBySegment, setTransportModeBySegment] = useState({});
  const [openTravelDropdownKey, setOpenTravelDropdownKey] = useState(null);
  const [publicTransportModalOpen, setPublicTransportModalOpen] = useState(false);
  const [publicTransportSegment, setPublicTransportSegment] = useState({ fromName: '', toName: '', fromLat: null, fromLng: null, toLat: null, toLng: null });
  const [travelTimeCache, setTravelTimeCache] = useState({});
  const [openDayMenuKey, setOpenDayMenuKey] = useState(null);
  const [dayColors, setDayColors] = useState({});
  const [dayColorPickerDay, setDayColorPickerDay] = useState(null);
  const [dayColumnWidths, setDayColumnWidths] = useState({});
  const [optimizeRouteModalOpen, setOptimizeRouteModalOpen] = useState(false);
  const [optimizeRouteDay, setOptimizeRouteDay] = useState(null);
  const [optimizeRouteStartId, setOptimizeRouteStartId] = useState('');
  const [optimizeRouteEndId, setOptimizeRouteEndId] = useState('');
  const skipExpenseSaveToastUntilRef = useRef(0);

  const whereModalDisplayStart = dateRange?.startDate ?? trip?.startDate;
  const whereModalDisplayEnd = dateRange?.endDate ?? trip?.endDate;
  const {
    whereTotalTripDays,
    whereDefaultCityDayRanges,
    getWhereCityDraftKey,
    handleWhereCityRangeInputChange,
    commitWhereCityRangeInput,
    addWhereCityPlanRow,
    removeWhereCityPlanRow,
    updateWhereCityPlanRowLocation,
  } = useTripDetailsWhereCityRanges({
    whereModalOpen,
    whereSelectedLocations,
    whereCityPlanRows,
    whereModalDisplayStart,
    whereModalDisplayEnd,
    whereCityDayDrafts,
    setWhereCityPlanRows,
    setWhereCityDayRanges,
    setWhereCityDayDrafts,
    setWhereCityRangeError,
  });

  useTripDetailsWhereSuggestions({
    whereModalOpen,
    whereModalRef,
    whereQuery,
    setWhereSuggestionsOpen,
    setWhereLocationSuggestions,
    setWhereSuggestionsLoading,
  });

  const {
    calendarDraggingItemId,
    calendarResizingItemId,
    calendarDragOverDayNum,
    setCalendarDragOverDayNum,
    handleCalendarDragStart,
    handleCalendarDragEnd,
    handleCalendarDayDragOver,
    handleCalendarDayDrop,
    handleCalendarResizeStart,
  } = useTripDetailsCalendarInteractions({
    setTripExpenseItems,
  });

  const showInAppNotice = useTripDetailsInAppNotice();

  const {
    notesModalOpen,
    setNotesModalOpen,
    generalNotes,
    setGeneralNotes,
    generalAttachments,
    setGeneralAttachments,
    notesActiveTab,
    setNotesActiveTab,
    notesSaving,
    saveGeneralNotesAndDocuments,
    saveDayNotesAndDocuments,
  } = useTripDetailsNotes({
    tripId,
    tripExpenseItems,
    setServerItinerary,
    skipExpenseSaveToastUntilRef,
  });

  useTripDetailsDayMenuOutsideClose({
    openDayMenuKey,
    setOpenDayMenuKey,
    setDayColorPickerDay,
  });

  useTripDetailsHydration({
    tripId,
    tripData,
    setTripExpenseItems,
    setGeneralNotes,
    setGeneralAttachments,
    hydratedTripItemsForIdRef,
  });

  useTripDetailsExpensePersist({
    tripId,
    tripData,
    tripExpenseItems,
    tripLoading,
    hydratedTripItemsForIdRef,
    expensePersistCountByTripRef,
  });

  const {
    displayTrip,
    days,
    spent,
    displayStart,
    displayEnd,
    allDayNums,
    activeDayNums,
    displayDatesLabel,
  } = useTripDetailsDerivedState({
    trip,
    dateRange,
    tripExpenseItems,
    whereModalDisplayStart,
    whereModalDisplayEnd,
    mapDayFilterSelected,
  });

  const { commitTripTitle, requestDeleteTrip, openWhereFromHeader } = useTripDetailsHeaderActions({
    tripId,
    trip,
    navigate,
    setServerItinerary,
    setTitleDisplay,
    setFriendlyDialog,
    displayStart,
    displayEnd,
    days,
    setWhereQuery,
    setWhereSelectedLocations,
    setWhereCityPlanRows,
    setWhereCityDayRanges,
    setWhereCityDayDrafts,
    setWhereCityRangeError,
    setWhereModalOpen,
    setWhereSuggestionsOpen,
  });

  const openCurrencyModalFromHeader = useCallback(async () => {
    if (!currencyOptions.length) {
      await loadExchangeRates();
    }
    setModalCurrency(currency);
    setCurrencyModalOpen(true);
  }, [currencyOptions, loadExchangeRates, currency]);

  const openDateModal = () => setDateModalOpen(true);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareFriends, setShareFriends] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);

  const handleShareTrip = useCallback(async () => {
    setShareModalOpen(true);
    setShareLoading(true);
    try {
      const profilePayload = await fetchMyProfile().catch(() => null);
      setShareFriends(Array.isArray(profilePayload?.friends) ? profilePayload.friends : []);
    } finally {
      setShareLoading(false);
    }
  }, [tripId]);

  const handleShareWithFriend = useCallback(async (friend) => {
    if (!friend?.id) return;
    try {
      await shareItineraryWithFriends(tripId, [friend.id]);
      toast.success(`Shared trip with ${friend.name || 'friend'}`);
      setShareModalOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Could not share trip.');
    }
  }, [tripId]);

  const handleInviteByEmail = useCallback(async (email, role = 'viewer') => {
    try {
      const lookup = await lookupUserByEmail(email);
      const userMatch = lookup?.user || null;
      const userId = userMatch?.id ? String(userMatch.id) : '';
      if (!userId) throw new Error('No account found for that email.');
      const currentCollabs = Array.isArray(serverItinerary?.collaborators) ? serverItinerary.collaborators : [];
      const exists = currentCollabs.some((c) => String(c?.user?.id || c?.userId || '') === userId);
      if (exists) { toast('This person already has access.'); return; }
      const newCollabs = [
        ...currentCollabs.map((c) => ({ userId: String(c?.user?.id || c?.userId || ''), role: c?.role || 'viewer' })),
        { userId, email, role },
      ];
      const updated = await updateItinerary(tripId, { collaborators: newCollabs });
      setServerItinerary((prev) => ({ ...prev, ...updated }));
      await shareItineraryWithFriends(tripId, [userId]);
      toast.success('Invite sent.');
    } catch (err) {
      throw new Error(err?.message || 'Could not send invite.');
    }
  }, [tripId, serverItinerary]);

  const handleInviteByUser = useCallback(async (searchUser, role = 'viewer') => {
    const userId = String(searchUser?.id || '');
    if (!userId) throw new Error('Invalid user.');
    const currentCollabs = Array.isArray(serverItinerary?.collaborators) ? serverItinerary.collaborators : [];
    const exists = currentCollabs.some((c) => String(c?.user?.id || c?.userId || '') === userId);
    if (exists) { toast('This person already has access.'); return; }
    const newCollabs = [
      ...currentCollabs.map((c) => ({ userId: String(c?.user?.id || c?.userId || ''), role: c?.role || 'viewer' })),
      { userId, role },
    ];
    const updated = await updateItinerary(tripId, { collaborators: newCollabs });
    setServerItinerary((prev) => ({ ...prev, ...updated }));
    await shareItineraryWithFriends(tripId, [userId]);
    toast.success('Invite sent.');
  }, [tripId, serverItinerary]);

  const handleShareCopyLink = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link.');
    }
  }, []);

  const handlePublishTrip = useCallback(async () => {
    if (!serverItinerary?._id) return;
    if (serverItinerary?.published && serverItinerary?.visibility === 'public') {
      try {
        const updated = await updateItinerary(String(serverItinerary._id), {
          published: false,
          visibility: 'private',
          publishedAt: null,
        });
        setServerItinerary(updated);
        toast.success('Trip moved to private');
      } catch (error) {
        toast.error(error?.message || 'Could not make this trip private.');
      }
      return;
    }

    setPublishTarget({
      itinerary: serverItinerary,
      initialStep: 1,
      mode: 'publish',
    });
  }, [serverItinerary, setServerItinerary]);

  const handleEditPublishedContent = useCallback(() => {
    if (!serverItinerary?._id) return;
    setPublishTarget({
      itinerary: serverItinerary,
      initialStep: 1,
      mode: 'edit',
    });
  }, [serverItinerary]);

  const handleSetCoverPage = useCallback(() => {
    if (!serverItinerary?._id) return;
    setCoverImageTarget(serverItinerary);
  }, [serverItinerary]);

  const handleDuplicateTrip = useCallback(async () => {
    if (!serverItinerary?._id) return;
    try {
      const copy = await duplicateItinerary(String(serverItinerary._id));
      const newId = copy?._id ?? copy?.id;
      if (!newId) throw new Error('Copy did not return an id.');
      toast.success('Trip added to My Trips!');
      navigate(`/trip/${newId}`);
    } catch (error) {
      toast.error(error?.message || 'Could not copy itinerary. Please try again.');
    }
  }, [navigate, serverItinerary]);

  const handlePublishSaved = useCallback(async () => {
    if (!serverItinerary?._id) return;
    try {
      const updated = await fetchItineraryById(String(serverItinerary._id));
      setServerItinerary(updated);
    } catch (error) {
      toast.error(error?.message || 'Trip updated, but it could not be reloaded.');
    }
  }, [serverItinerary, setServerItinerary]);

  const handleWhereModalApply = useTripDetailsWhereApply({
    tripId,
    whereQuery,
    whereSelectedLocations,
    whereCityPlanRows,
    whereCityDayRanges,
    whereCityDayDrafts,
    getWhereCityDraftKey,
    displayStart,
    displayEnd,
    days,
    showInAppNotice,
    setWhereCityRangeError,
    setWhereModalOpen,
    setLocalDestination,
    setLocalLocations,
    setTitleDisplay,
    setServerItinerary,
    setLocationUpdateKey,
    setFriendlyDialog,
  });


  const applyDateRange = (start, end) => {
    if (start && end && start <= end) {
      setDateRange({ startDate: start, endDate: end });
    }
  };

  const [kanbanDraggingDayNum, setKanbanDraggingDayNum] = useState(null);
  const [kanbanDragOverDayNum, setKanbanDragOverDayNum] = useState(null);

  const openBudgetDetails = useCallback(() => {
    setBudgetModalOpen(true);
  }, []);

  useTripDetailsDatePersist({
    tripId,
    tripData,
    dateRange,
    tripDatePersistKeyRef,
    setServerItinerary,
    showInAppNotice,
  });

  const setDayTitle = (dayNum, value) => {
    setDayTitles((prev) => ({ ...prev, [dayNum]: value }));
  };

  const reorderKanbanDays = useCallback((sourceDayNum, targetDayNum) => {
    const fromDayNum = Number(sourceDayNum);
    const toDayNum = Number(targetDayNum);
    if (!Number.isFinite(fromDayNum) || !Number.isFinite(toDayNum) || fromDayNum === toDayNum) return;

    const sourceIndex = days.findIndex((day) => Number(day.dayNum) === fromDayNum);
    const targetIndex = days.findIndex((day) => Number(day.dayNum) === toDayNum);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const orderedDates = days.map((day) => day.date);
    const moveArrayItem = (list, fromIndex, toIndex) => {
      const next = [...list];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    };

    const reorderedSourceDates = moveArrayItem(orderedDates, sourceIndex, targetIndex);
    const dateMap = new Map(reorderedSourceDates.map((oldDate, index) => [oldDate, orderedDates[index]]));
    const remapDate = (value) => (value && dateMap.has(value) ? dateMap.get(value) : value);

    const remapDayKeyState = (setter) => {
      setter((prev) => {
        const orderedValues = days.map((day) => prev?.[day.dayNum]);
        const movedValues = moveArrayItem(orderedValues, sourceIndex, targetIndex);
        const next = {};
        movedValues.forEach((value, index) => {
          if (value !== undefined && value !== null && value !== '') {
            next[index + 1] = value;
          }
        });
        return next;
      });
    };

    skipExpenseSaveToastUntilRef.current = Date.now() + 4000;
    setTripExpenseItems((prev) => prev.map((item) => ({
      ...item,
      date: remapDate(item.date),
      checkInDate: remapDate(item.checkInDate),
      checkOutDate: remapDate(item.checkOutDate),
      startDate: remapDate(item.startDate),
      endDate: remapDate(item.endDate),
    })));
    remapDayKeyState(setDayTitles);
    remapDayKeyState(setDayColors);
    remapDayKeyState(setDayColumnWidths);

    setMapDayFilterSelected((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      const orderedDayNums = days.map((day) => day.dayNum);
      const movedDayNums = moveArrayItem(orderedDayNums, sourceIndex, targetIndex);
      const dayNumMap = new Map(movedDayNums.map((oldDayNum, index) => [oldDayNum, index + 1]));
      return Array.from(new Set(prev.map((dayNum) => dayNumMap.get(dayNum) || dayNum))).sort((a, b) => a - b);
    });

    showInAppNotice(`Moved Day ${fromDayNum} to position ${toDayNum}.`, 'success');
  }, [days, setDayTitles, setDayColors, setDayColumnWidths, setMapDayFilterSelected, setTripExpenseItems, showInAppNotice]);

  const handleKanbanDayDragStart = useCallback((dayNum) => {
    setKanbanDraggingDayNum(dayNum);
    setKanbanDragOverDayNum(dayNum);
  }, []);

  const handleKanbanDayDragEnd = useCallback(() => {
    setKanbanDraggingDayNum(null);
    setKanbanDragOverDayNum(null);
  }, []);

  const handleKanbanDayDragEnter = useCallback((dayNum) => {
    setKanbanDragOverDayNum(dayNum);
  }, []);

  const handleKanbanDayDrop = useCallback((targetDayNum) => {
    if (kanbanDraggingDayNum == null) return;
    reorderKanbanDays(kanbanDraggingDayNum, targetDayNum);
    setKanbanDraggingDayNum(null);
    setKanbanDragOverDayNum(null);
  }, [kanbanDraggingDayNum, reorderKanbanDays]);

  const visibleDays = useMemo(() => {
    if (!days || days.length === 0) return [];
    return days;
  }, [days]);

  const resetMapDays = () => {
    setMapDayFilterSelected(allDayNums);
  };

  const { getDayColumnWidth, beginDayColumnResize } = useTripDetailsDayColumnResize({
    dayColumnWidths,
    setDayColumnWidths,
  });

  const selectedDestinations = useMemo(
    () => getDestinationList(trip?.destination, trip?.locations),
    [trip?.destination, trip?.locations],
  );

  const cityQuery = useMemo(
    () => selectedDestinations[0] || '',
    [selectedDestinations],
  );

  const {
    addToTripModalOpen,
    setAddToTripModalOpen,
    addToTripItem,
    setAddToTripItem,
    addToTripDate,
    setAddToTripDate,
    addToTripStartTime,
    setAddToTripStartTime,
    addToTripDurationHrs,
    setAddToTripDurationHrs,
    addToTripDurationMins,
    setAddToTripDurationMins,
    addToTripCheckInDate,
    setAddToTripCheckInDate,
    addToTripCheckInTime,
    setAddToTripCheckInTime,
    addToTripCheckOutDate,
    setAddToTripCheckOutDate,
    addToTripCheckOutTime,
    setAddToTripCheckOutTime,
    addToTripNotes,
    setAddToTripNotes,
    addToTripCost,
    setAddToTripCost,
    addToTripExternalLink,
    setAddToTripExternalLink,
    addToTripTravelDocs,
    setAddToTripTravelDocs,
    appendItemToTrip,
    openAddToTripFromMapMarker,
    openAddToTripFromAiPlace,
    openAddStayToTrip,
    onCloseAddToTrip,
    handleAddToTripSubmit,
  } = useTripDetailsAddToTrip({
    days,
    cityQuery,
    currency,
    exchangeRates,
    tripExpenseItems,
    setTripExpenseItems,
    addPlacesDay,
    addFoodDay,
    addExperiencesDay,
    showInAppNotice,
    setFriendlyDialog,
    setPlaceDetailsView,
    setFoodDetailsView,
    setStayDetailsView,
    setExperienceDetailsView,
    setAddPlacesOpen,
    setAddFoodOpen,
    setAddStaysOpen,
    setAddExperiencesOpen,
  });

  useEffect(() => {
    const place = location.state?.aiPlace || location.state?.aiPlaces?.[0];
    if (!place || !trip) return;

    openAddToTripFromAiPlace(place);

    navigate(location.pathname, { replace: true });
  }, [location.state, location.pathname, trip, openAddToTripFromAiPlace, navigate]);

  const {
    filteredPlaces,
    filteredFoods,
    filteredExperiences,
    filteredStays,
    stayTypeOptions,
  } = useTripDetailsDiscoveryFilters({
    discoveryData,
    cityQuery,
    cityFilter: addModalCityFilter,
    placeSearchQuery,
    placeSortBy,
    foodSearchQuery,
    foodDietaryFilter,
    foodSortBy,
    experienceSearchQuery,
    experienceTypeFilter,
    experiencePriceRange,
    experienceDurationFilter,
    experienceSortBy,
    staySearchQuery,
    stayTypeFilter,
    stayStarFilter,
    staySortBy,
  });

  const destinationLabel = useMemo(
    () => (selectedDestinations.length > 0 ? selectedDestinations.join(', ') : cityQuery),
    [selectedDestinations, cityQuery],
  );

  const addModalCityOptions = useMemo(() => {
    const seen = new Set();
    const cities = [];
    selectedDestinations.forEach((destination) => {
      const city = String(destination || '').split(',')[0].trim();
      if (!city) return;
      const key = city.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      cities.push(city);
    });
    return ['All', ...cities];
  }, [selectedDestinations]);

  useEffect(() => {
    if (!addModalCityOptions.includes(addModalCityFilter)) {
      setAddModalCityFilter('All');
    }
  }, [addModalCityFilter, addModalCityOptions]);

  const destinationCountry = useMemo(() => {
    const byCity = AIRPORTS_AND_CITIES.find(
      (item) => String(item.city || '').toLowerCase() === String(cityQuery || '').toLowerCase() && item.country,
    );
    if (byCity?.country) return byCity.country;

    const byName = AIRPORTS_AND_CITIES.find(
      (item) => String(item.name || '').toLowerCase().includes(String(cityQuery || '').toLowerCase()) && item.country,
    );
    if (byName?.country) return byName.country;

    return '';
  }, [cityQuery]);

  const availableTransportCountries = useMemo(() => (
    [...new Set(AIRPORTS_AND_CITIES.map((a) => a.country).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  ), []);

  const routeIdeas = useTripDetailsRouteIdeas({
    discoveryData,
    filteredPlaces,
    filteredFoods,
    cityQuery,
    destinationLabel,
    selectedDestinations,
    days,
    trip,
  });

  const {
    openInternalItemOverview,
    openAddPlacesDetailsFromMapMarker,
    openRouteIdeasBrowseAll,
    openRouteIdeaDetails,
    openItineraryPlaceDetails,
    onCloseAddPlacesBackdrop,
    onCloseAddPlacesItineraryHeader,
    onCloseAddPlacesListHeader,
    onCloseAddPlacesPlaceDetailHeader,
    onCloseFoodBackdrop,
    onCloseFoodListHeader,
    onBackFoodDetail,
    onCloseStayBackdrop,
    onCloseStayListHeader,
    onBackStayDetail,
    onCloseExperienceModal,
    onBackExperienceDetail,
  } = useTripDetailsDetailViews({
    cityQuery,
    discoveryData,
    filteredPlaces,
    routeIdeas,
    setAddPlacesOpen,
    setAddFoodOpen,
    setAddStaysOpen,
    setAddExperiencesOpen,
    setPlaceDetailsView,
    setPlaceDetailsTab,
    setFoodDetailsView,
    setFoodDetailsTab,
    setStayDetailsView,
    setStayDetailsTab,
    setExperienceDetailsView,
    setExperienceDetailsTab,
    setItineraryDetailsView,
    setSelectedPlaceMarkerId,
    setEditPlaceItem,
  });

  const handleImageError = (event) => {
    applyImageFallback(event);
  };

  const addPlacesTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredPlaces.length / ADD_PLACES_PAGE_SIZE)),
    [filteredPlaces.length],
  );

  const pagedPlaces = useMemo(() => {
    const start = (addPlacesPage - 1) * ADD_PLACES_PAGE_SIZE;
    return filteredPlaces.slice(start, start + ADD_PLACES_PAGE_SIZE);
  }, [filteredPlaces, addPlacesPage]);

  useEffect(() => {
    setAddPlacesPage(1);
  }, [placeSearchQuery, placeSortBy]);

  useEffect(() => {
    if (addPlacesPage > addPlacesTotalPages) {
      setAddPlacesPage(addPlacesTotalPages);
    }
  }, [addPlacesPage, addPlacesTotalPages]);

  const { mapCenter, mapMarkers } = useTripDetailsMapData({
    discoveryData,
    discoveryLoading,
    tripExpenseItems,
    trip,
    days,
    locationUpdateKey,
    mapFilter,
    cityQuery,
    dayColors,
    selectedDestinations,
  });

  const {
    addCustomPlaceOpen,
    setAddCustomPlaceOpen,
    addCustomFoodOpen,
    setAddCustomFoodOpen,
    addCustomExperienceOpen,
    setAddCustomExperienceOpen,
    customPlaceName,
    setCustomPlaceName,
    customPlaceAddress,
    setCustomPlaceAddress,
    customPlaceAddressSelection,
    setCustomPlaceAddressSelection,
    customPlaceAddressSuggestionsOpen,
    setCustomPlaceAddressSuggestionsOpen,
    customFoodName,
    setCustomFoodName,
    customFoodAddress,
    setCustomFoodAddress,
    customFoodAddressSelection,
    setCustomFoodAddressSelection,
    customFoodAddressSuggestionsOpen,
    setCustomFoodAddressSuggestionsOpen,
    customPlaceDateKey,
    setCustomPlaceDateKey,
    customFoodDateKey,
    setCustomFoodDateKey,
    customPlaceStartTime,
    setCustomPlaceStartTime,
    customFoodStartTime,
    setCustomFoodStartTime,
    customPlaceDurationHrs,
    setCustomPlaceDurationHrs,
    customFoodDurationHrs,
    setCustomFoodDurationHrs,
    customPlaceDurationMins,
    setCustomPlaceDurationMins,
    customFoodDurationMins,
    setCustomFoodDurationMins,
    customPlaceNote,
    setCustomPlaceNote,
    customFoodNote,
    setCustomFoodNote,
    customExperienceName,
    setCustomExperienceName,
    customExperienceType,
    setCustomExperienceType,
    customExperienceAddress,
    setCustomExperienceAddress,
    customExperienceDateKey,
    setCustomExperienceDateKey,
    customExperienceStartTime,
    setCustomExperienceStartTime,
    customExperienceDurationHrs,
    setCustomExperienceDurationHrs,
    customExperienceDurationMins,
    setCustomExperienceDurationMins,
    customExperienceNote,
    setCustomExperienceNote,
    customExperienceCost,
    setCustomExperienceCost,
    customExperienceExternalLink,
    setCustomExperienceExternalLink,
    customExperienceTravelDocs,
    setCustomExperienceTravelDocs,
    customPlaceCost,
    setCustomPlaceCost,
    customFoodCost,
    setCustomFoodCost,
    customPlaceImage,
    setCustomPlaceImage,
    customFoodImage,
    setCustomFoodImage,
    customPlaceTravelDocs,
    setCustomPlaceTravelDocs,
    customFoodTravelDocs,
    setCustomFoodTravelDocs,
    onCloseAddCustomExperience,
    handleAddCustomExperienceSubmit,
    onCloseAddCustomPlace,
    handleAddCustomPlaceSubmit,
    onCloseAddCustomFood,
    handleAddCustomFoodSubmit,
  } = useTripDetailsCustomItems({
    mapCenter,
    trip,
    tripExpenseItems,
    setTripExpenseItems,
    currency,
    exchangeRates,
    showInAppNotice,
  });

  const {
    experienceBookingModalOpen,
    setExperienceBookingModalOpen,
    bookingExperience,
    setBookingExperience,
    bookingOption,
    setBookingOption,
    bookingDate,
    setBookingDate,
    bookingStartTime,
    setBookingStartTime,
    bookingTravellers,
    setBookingTravellers,
    bookingNotes,
    setBookingNotes,
    onCloseExperienceBooking,
    handleExperienceBookingSubmit,
    stayBookingModalOpen,
    setStayBookingModalOpen,
    stayBookingTarget,
    setStayBookingTarget,
    stayBookingCheckInDate,
    setStayBookingCheckInDate,
    stayBookingCheckOutDate,
    setStayBookingCheckOutDate,
    stayBookingAdults,
    setStayBookingAdults,
    stayBookingChildren,
    setStayBookingChildren,
    stayBookingRooms,
    setStayBookingRooms,
    openStayBookingModal,
    onCloseStayBooking,
    handleStayBookingSubmit,
  } = useTripDetailsBookingModals({
    days,
    cityQuery,
    currency,
    tripExpenseItems,
    setTripExpenseItems,
    showInAppNotice,
    setExperienceDetailsView,
    setAddExperiencesOpen,
  });

  const {
    addTransportOpen,
    setAddTransportOpen,
    addTransportDay,
    setAddTransportDay,
    addCustomTransportOpen,
    setAddCustomTransportOpen,
    customTransportVehicle,
    setCustomTransportVehicle,
    appendTransportTripItem,
  } = useTripDetailsTransport({
    currency,
    exchangeRates,
    days,
    setTripExpenseItems,
    showInAppNotice,
  });

  const addEntireItineraryToTrip = useTripDetailsBulkItineraryAdd({
    days,
    cityQuery,
    tripExpenseItems,
    setTripExpenseItems,
    showInAppNotice,
  });

  const { openSocialImportForDay, socialImportModalProps } = useSocialImport({
    appendItemToTrip,
    days,
    cityQuery,
    tripDestinations: selectedDestinations,
    tripExpenseItems,
  });

  const {
    addSheetDay,
    setAddSheetDay,
    addSheetFromCalendar,
    setAddSheetFromCalendar,
    addSheetAnchor,
    setAddSheetAnchor,
    onCloseAddSheet,
    handleAddSheetOptionSelect,
  } = useTripDetailsAddSheet({
    days,
    openSocialImportForDay,
    setAddPlacesDay,
    setAddPlacesOpen,
    setAddFoodDay,
    setFoodSearchQuery,
    setFoodDietaryFilter,
    setFoodSortBy,
    setCustomFoodDateKey,
    setAddFoodOpen,
    setStaySearchQuery,
    setStayTypeFilter,
    setStayStarFilter,
    setStaySortBy,
    setAddStaysOpen,
    setAddExperiencesDay,
    setExperienceSearchQuery,
    setExperienceTypeFilter,
    setExperiencePriceRange,
    setExperienceDurationFilter,
    setExperienceSortBy,
    setAddExperiencesOpen,
    setAddTransportDay,
    setAddTransportOpen,
  });

  const handleAddDetectedDestinationFromSocial = useCallback(async (label) => {
    const raw = String(label || '').trim();
    if (!raw || !tripId) return;
    const merged = appendDestinationLabelToTripDoc(trip, label);
    if (!merged.ok) {
      if (merged.reason === 'duplicate') toast(merged.message || 'That destination is already on your trip.');
      return;
    }
    setLocalDestination(merged.destination);
    setLocalLocations(merged.locations);
    try {
      const updated = await updateItinerary(tripId, {
        destination: merged.destination,
        locations: merged.locations,
      });
      if (updated) setServerItinerary(updated);
      setLocationUpdateKey((k) => k + 1);
      toast.success(`Added ${raw.split(',')[0].trim()} to your destinations`);
    } catch (e) {
      toast.error(e?.message || 'Could not update trip');
    }
  }, [tripId, trip]);

  const canOpenInternalItemOverview = (item) => {
    const raw = String(item?.categoryId || item?.category || '').toLowerCase();
    return raw === 'places'
      || raw === 'place'
      || raw === 'food'
      || raw === 'food & beverage'
      || raw === 'stays'
      || raw === 'stay'
      || raw === 'experiences'
      || raw === 'experience';
  };

  const tripDetailsMapPanelProps = useTripDetailsMapPanelProps({
    mapView,
    mapExpandOpen,
    setMapExpandOpen,
    setMapView,
    mapFilter,
    setMapFilter,
    resetMapDays,
    setMapDayFilterOpen,
    mapCenter,
    mapMarkers,
    activeDayNums,
    openAddToTripFromMapMarker,
    openAddPlacesDetailsFromMapMarker,
  });

  if (tripLoading) {
    return <TripDetailsLoadingView />;
  }

  if (!trip) {
    return (
      <TripDetailsMissingTripView
        message={tripLoadError || 'Trip not found.'}
      />
    );
  }

  const userId = String(user?.id || user?._id || '').trim();
  const creatorId = String(
    serverItinerary?.creator?._id ||
    serverItinerary?.creator?.id ||
    serverItinerary?.creator ||
    ''
  ).trim();
  if (userId && creatorId && userId !== creatorId) {
    navigate(`/itineraries/${tripId}`, { replace: true });
    return null;
  }

  return (
    <div className="trip-details">
      <TripDetailsPageLayout
        trip={trip}
        tripId={tripId}
        daysLength={days.length}
        titleDropdownRef={titleDropdownRef}
        titleLastClickRef={titleLastClickRef}
        titleEditing={titleEditing}
        setTitleEditing={setTitleEditing}
        titleEditValue={titleEditValue}
        setTitleEditValue={setTitleEditValue}
        titleDisplay={titleDisplay}
        titleDropdownOpen={titleDropdownOpen}
        setTitleDropdownOpen={setTitleDropdownOpen}
        onCommitTripTitle={commitTripTitle}
        onShareTrip={handleShareTrip}
        onPublishTrip={handlePublishTrip}
        onEditPublishedContent={handleEditPublishedContent}
        onSetCoverPage={handleSetCoverPage}
        onDuplicateTrip={handleDuplicateTrip}
        onRequestDeleteTrip={requestDeleteTrip}
        spent={spent}
        currency={currency}
        exchangeRates={exchangeRates}
        onBudgetDetailsClick={openBudgetDetails}
        onOpenWhereModal={openWhereFromHeader}
        displayDatesLabel={displayDatesLabel}
        onOpenDateModal={openDateModal}
        currencyOptions={currencyOptions}
        loadExchangeRates={loadExchangeRates}
        onOpenCurrencyModal={openCurrencyModalFromHeader}
        setNotesModalOpen={setNotesModalOpen}
        onOpenRouteIdeas={openRouteIdeasBrowseAll}
        viewMode={viewMode}
        setViewMode={setViewMode}
        visibleDays={visibleDays}
        days={days}
        tripDestination={trip.destination}
        tripExpenseItems={tripExpenseItems}
        openDayMenuKey={openDayMenuKey}
        setOpenDayMenuKey={setOpenDayMenuKey}
        dayColors={dayColors}
        setDayColors={setDayColors}
        dayColorPickerDay={dayColorPickerDay}
        setDayColorPickerDay={setDayColorPickerDay}
        dayTitles={dayTitles}
        setDayTitle={setDayTitle}
        getDayColumnWidth={getDayColumnWidth}
        beginDayColumnResize={beginDayColumnResize}
        displayStart={displayStart}
        displayEnd={displayEnd}
        setDateRange={setDateRange}
        setOptimizeRouteDay={setOptimizeRouteDay}
        setOptimizeRouteStartId={setOptimizeRouteStartId}
        setOptimizeRouteEndId={setOptimizeRouteEndId}
        setOptimizeRouteModalOpen={setOptimizeRouteModalOpen}
        setMapDayFilterSelected={setMapDayFilterSelected}
        setMapDayFilterOpen={setMapDayFilterOpen}
        skipExpenseSaveToastUntilRef={skipExpenseSaveToastUntilRef}
        setTripExpenseItems={setTripExpenseItems}
        setDayTitles={setDayTitles}
        setDayColumnWidths={setDayColumnWidths}
        showInAppNotice={showInAppNotice}
        openInternalItemOverview={openInternalItemOverview}
        handleImageError={handleImageError}
        transportModeBySegment={transportModeBySegment}
        setTransportModeBySegment={setTransportModeBySegment}
        openTravelDropdownKey={openTravelDropdownKey}
        setOpenTravelDropdownKey={setOpenTravelDropdownKey}
        travelTimeCache={travelTimeCache}
        setTravelTimeCache={setTravelTimeCache}
        setEditPlaceItem={setEditPlaceItem}
        setPublicTransportSegment={setPublicTransportSegment}
        setPublicTransportModalOpen={setPublicTransportModalOpen}
        setAddSheetFromCalendar={setAddSheetFromCalendar}
        setAddSheetDay={setAddSheetDay}
        setAddSheetAnchor={setAddSheetAnchor}
        tripDetailsMapPanelProps={tripDetailsMapPanelProps}
        calendarScrollLeft={calendarScrollLeft}
        setCalendarScrollLeft={setCalendarScrollLeft}
        calendarTimelineRef={calendarTimelineRef}
        calendarDragOverDayNum={calendarDragOverDayNum}
        setCalendarDragOverDayNum={setCalendarDragOverDayNum}
        handleCalendarDayDragOver={handleCalendarDayDragOver}
        handleCalendarDayDrop={handleCalendarDayDrop}
        calendarDraggingItemId={calendarDraggingItemId}
        calendarResizingItemId={calendarResizingItemId}
        handleCalendarDragStart={handleCalendarDragStart}
        handleCalendarDragEnd={handleCalendarDragEnd}
        handleCalendarResizeStart={handleCalendarResizeStart}
        kanbanDraggingDayNum={kanbanDraggingDayNum}
        kanbanDragOverDayNum={kanbanDragOverDayNum}
        handleKanbanDayDragStart={handleKanbanDayDragStart}
        handleKanbanDayDragEnter={handleKanbanDayDragEnter}
        handleKanbanDayDragEnd={handleKanbanDayDragEnd}
        handleKanbanDayDrop={handleKanbanDayDrop}
        dateModalOpen={dateModalOpen}
        applyDateRange={applyDateRange}
        setDateModalOpen={setDateModalOpen}
      />

      <TripShareModal
        open={shareModalOpen}
        loading={shareLoading}
        friends={shareFriends}
        onClose={() => setShareModalOpen(false)}
        onShareWithFriend={handleShareWithFriend}
        onInviteByEmail={handleInviteByEmail}
        onInviteByUser={handleInviteByUser}
        onSearchUsers={searchUsers}
        onCopy={handleShareCopyLink}
      />

      <PublishItineraryModal
        open={Boolean(publishTarget)}
        onClose={() => setPublishTarget(null)}
        itinerary={publishTarget?.itinerary || null}
        initialStep={publishTarget?.initialStep || 1}
        mode={publishTarget?.mode || 'publish'}
        onPublished={handlePublishSaved}
      />
      <SetCoverImageModal
        open={Boolean(coverImageTarget)}
        itinerary={coverImageTarget}
        onClose={() => setCoverImageTarget(null)}
        onSaved={(updated) => {
          setServerItinerary(updated);
        }}
      />

      <TripDetailsModalStack
        addCustomExperienceOpen={addCustomExperienceOpen}
        addCustomFoodOpen={addCustomFoodOpen}
        addCustomPlaceOpen={addCustomPlaceOpen}
        addCustomTransportOpen={addCustomTransportOpen}
        addEntireItineraryToTrip={addEntireItineraryToTrip}
        addExperiencesDay={addExperiencesDay}
        addExperiencesOpen={addExperiencesOpen}
        addFoodDay={addFoodDay}
        addFoodOpen={addFoodOpen}
        addPlacesDay={addPlacesDay}
        addPlacesOpen={addPlacesOpen}
        addPlacesPage={addPlacesPage}
        addPlacesTotalPages={addPlacesTotalPages}
        addSheetAnchor={addSheetAnchor}
        addSheetDay={addSheetDay}
        addSheetFromCalendar={addSheetFromCalendar}
        addStaysOpen={addStaysOpen}
        addToTripCheckInDate={addToTripCheckInDate}
        addToTripCheckInTime={addToTripCheckInTime}
        addToTripCheckOutDate={addToTripCheckOutDate}
        addToTripCheckOutTime={addToTripCheckOutTime}
        addToTripCost={addToTripCost}
        addToTripDate={addToTripDate}
        addToTripDurationHrs={addToTripDurationHrs}
        addToTripDurationMins={addToTripDurationMins}
        addToTripExternalLink={addToTripExternalLink}
        addToTripItem={addToTripItem}
        addToTripModalOpen={addToTripModalOpen}
        addToTripNotes={addToTripNotes}
        addToTripStartTime={addToTripStartTime}
        addToTripTravelDocs={addToTripTravelDocs}
        addTransportDay={addTransportDay}
        addTransportOpen={addTransportOpen}
        allDayNums={allDayNums}
        appendTransportTripItem={appendTransportTripItem}
        availableTransportCountries={availableTransportCountries}
        bookingDate={bookingDate}
        bookingExperience={bookingExperience}
        bookingNotes={bookingNotes}
        bookingOption={bookingOption}
        bookingStartTime={bookingStartTime}
        bookingTravellers={bookingTravellers}
        budgetModalOpen={budgetModalOpen}
        canOpenInternalItemOverview={canOpenInternalItemOverview}
        cityQuery={cityQuery}
        commitWhereCityRangeInput={commitWhereCityRangeInput}
        currency={currency}
        currencyModalOpen={currencyModalOpen}
        currencyOptions={currencyOptions}
        currencyOptionsForModal={currencyOptionsForModal}
        customExperienceAddress={customExperienceAddress}
        customExperienceCost={customExperienceCost}
        customExperienceDateKey={customExperienceDateKey}
        customExperienceDurationHrs={customExperienceDurationHrs}
        customExperienceDurationMins={customExperienceDurationMins}
        customExperienceExternalLink={customExperienceExternalLink}
        customExperienceName={customExperienceName}
        customExperienceNote={customExperienceNote}
        customExperienceStartTime={customExperienceStartTime}
        customExperienceTravelDocs={customExperienceTravelDocs}
        customExperienceType={customExperienceType}
        customFoodAddress={customFoodAddress}
        customFoodAddressSuggestionsOpen={customFoodAddressSuggestionsOpen}
        customFoodCost={customFoodCost}
        customFoodDateKey={customFoodDateKey}
        customFoodDurationHrs={customFoodDurationHrs}
        customFoodDurationMins={customFoodDurationMins}
        customFoodImage={customFoodImage}
        customFoodName={customFoodName}
        customFoodNote={customFoodNote}
        customFoodStartTime={customFoodStartTime}
        customFoodTravelDocs={customFoodTravelDocs}
        customPlaceAddress={customPlaceAddress}
        customPlaceAddressSuggestionsOpen={customPlaceAddressSuggestionsOpen}
        customPlaceCost={customPlaceCost}
        customPlaceDateKey={customPlaceDateKey}
        customPlaceDurationHrs={customPlaceDurationHrs}
        customPlaceDurationMins={customPlaceDurationMins}
        customPlaceImage={customPlaceImage}
        customPlaceName={customPlaceName}
        customPlaceNote={customPlaceNote}
        customPlaceStartTime={customPlaceStartTime}
        customPlaceTravelDocs={customPlaceTravelDocs}
        customTransportVehicle={customTransportVehicle}
        days={days}
        destinationCountry={destinationCountry}
        destinationLabel={destinationLabel}
        discoveryData={discoveryData}
        discoveryError={discoveryError}
        discoveryLoading={discoveryLoading}
        editPlaceItem={editPlaceItem}
        exchangeRates={exchangeRates}
        expenseSortBy={expenseSortBy}
        experienceBookingModalOpen={experienceBookingModalOpen}
        experienceDetailsTab={experienceDetailsTab}
        experienceDetailsView={experienceDetailsView}
        experienceDurationFilter={experienceDurationFilter}
        experiencePriceRange={experiencePriceRange}
        experienceSearchQuery={experienceSearchQuery}
        experienceSortBy={experienceSortBy}
        experienceTypeFilter={experienceTypeFilter}
        addModalCityFilter={addModalCityFilter}
        addModalCityOptions={addModalCityOptions}
        filteredExperiences={filteredExperiences}
        filteredFoods={filteredFoods}
        filteredPlaces={filteredPlaces}
        filteredStays={filteredStays}
        foodDetailsTab={foodDetailsTab}
        foodDetailsView={foodDetailsView}
        foodDietaryFilter={foodDietaryFilter}
        foodSearchQuery={foodSearchQuery}
        foodSortBy={foodSortBy}
        friendlyDialog={friendlyDialog}
        generalAttachments={generalAttachments}
        generalNotes={generalNotes}
        handleAddCustomExperienceSubmit={handleAddCustomExperienceSubmit}
        handleAddCustomFoodSubmit={handleAddCustomFoodSubmit}
        handleAddCustomPlaceSubmit={handleAddCustomPlaceSubmit}
        handleAddSheetOptionSelect={handleAddSheetOptionSelect}
        handleAddToTripSubmit={handleAddToTripSubmit}
        handleExperienceBookingSubmit={handleExperienceBookingSubmit}
        handleImageError={handleImageError}
        handleStayBookingSubmit={handleStayBookingSubmit}
        handleWhereCityRangeInputChange={handleWhereCityRangeInputChange}
        handleWhereModalApply={handleWhereModalApply}
        itineraryDetailsView={itineraryDetailsView}
        mapCenter={mapCenter}
        mapDayFilterOpen={mapDayFilterOpen}
        mapDayFilterSelected={mapDayFilterSelected}
        modalCurrency={modalCurrency}
        notesActiveTab={notesActiveTab}
        notesModalOpen={notesModalOpen}
        notesSaving={notesSaving}
        onAddDetectedDestinationFromSocial={handleAddDetectedDestinationFromSocial}
        onBackExperienceDetail={onBackExperienceDetail}
        onBackFoodDetail={onBackFoodDetail}
        onBackStayDetail={onBackStayDetail}
        onCloseAddCustomExperience={onCloseAddCustomExperience}
        onCloseAddCustomFood={onCloseAddCustomFood}
        onCloseAddCustomPlace={onCloseAddCustomPlace}
        onCloseAddPlacesBackdrop={onCloseAddPlacesBackdrop}
        onCloseAddPlacesItineraryHeader={onCloseAddPlacesItineraryHeader}
        onCloseAddPlacesListHeader={onCloseAddPlacesListHeader}
        onCloseAddPlacesPlaceDetailHeader={onCloseAddPlacesPlaceDetailHeader}
        onCloseAddSheet={onCloseAddSheet}
        onCloseAddToTrip={onCloseAddToTrip}
        onCloseExperienceBooking={onCloseExperienceBooking}
        onCloseExperienceModal={onCloseExperienceModal}
        onCloseFoodBackdrop={onCloseFoodBackdrop}
        onCloseFoodListHeader={onCloseFoodListHeader}
        onCloseStayBackdrop={onCloseStayBackdrop}
        onCloseStayBooking={onCloseStayBooking}
        onCloseStayListHeader={onCloseStayListHeader}
        onImageError={handleImageError}
        openAddPlacesDetailsFromMapMarker={openAddPlacesDetailsFromMapMarker}
        openAddStayToTrip={openAddStayToTrip}
        openAddToTripFromMapMarker={openAddToTripFromMapMarker}
        openInternalItemOverview={openInternalItemOverview}
        openItineraryPlaceDetails={openItineraryPlaceDetails}
        openStayBookingModal={openStayBookingModal}
        optimizeRouteDay={optimizeRouteDay}
        optimizeRouteEndId={optimizeRouteEndId}
        optimizeRouteModalOpen={optimizeRouteModalOpen}
        optimizeRouteStartId={optimizeRouteStartId}
        pagedPlaces={pagedPlaces}
        pendingDeleteItemId={pendingDeleteItemId}
        placeDetailsTab={placeDetailsTab}
        placeDetailsView={placeDetailsView}
        placeSearchQuery={placeSearchQuery}
        placeSortBy={placeSortBy}
        publicTransportModalOpen={publicTransportModalOpen}
        publicTransportSegment={publicTransportSegment}
        resetMapDays={resetMapDays}
        resolveImageUrl={resolveImageUrl}
        saveDayNotesAndDocuments={saveDayNotesAndDocuments}
        saveGeneralNotesAndDocuments={saveGeneralNotesAndDocuments}
        selectedPlaceMarkerId={selectedPlaceMarkerId}
        setAddCustomExperienceOpen={setAddCustomExperienceOpen}
        setAddCustomFoodOpen={setAddCustomFoodOpen}
        setAddCustomPlaceOpen={setAddCustomPlaceOpen}
        setAddCustomTransportOpen={setAddCustomTransportOpen}
        setAddPlacesPage={setAddPlacesPage}
        setAddToTripCheckInDate={setAddToTripCheckInDate}
        setAddToTripCheckInTime={setAddToTripCheckInTime}
        setAddToTripCheckOutDate={setAddToTripCheckOutDate}
        setAddToTripCheckOutTime={setAddToTripCheckOutTime}
        setAddToTripCost={setAddToTripCost}
        setAddToTripDate={setAddToTripDate}
        setAddToTripDurationHrs={setAddToTripDurationHrs}
        setAddToTripDurationMins={setAddToTripDurationMins}
        setAddToTripExternalLink={setAddToTripExternalLink}
        setAddToTripItem={setAddToTripItem}
        setAddToTripModalOpen={setAddToTripModalOpen}
        setAddToTripNotes={setAddToTripNotes}
        setAddToTripStartTime={setAddToTripStartTime}
        setAddToTripTravelDocs={setAddToTripTravelDocs}
        setAddModalCityFilter={setAddModalCityFilter}
        setAddTransportOpen={setAddTransportOpen}
        setBookingDate={setBookingDate}
        setBookingExperience={setBookingExperience}
        setBookingNotes={setBookingNotes}
        setBookingOption={setBookingOption}
        setBookingStartTime={setBookingStartTime}
        setBookingTravellers={setBookingTravellers}
        setBudgetModalOpen={setBudgetModalOpen}
        setCurrency={setCurrency}
        setCurrencyModalOpen={setCurrencyModalOpen}
        setCustomExperienceAddress={setCustomExperienceAddress}
        setCustomExperienceCost={setCustomExperienceCost}
        setCustomExperienceDateKey={setCustomExperienceDateKey}
        setCustomExperienceDurationHrs={setCustomExperienceDurationHrs}
        setCustomExperienceDurationMins={setCustomExperienceDurationMins}
        setCustomExperienceExternalLink={setCustomExperienceExternalLink}
        setCustomExperienceName={setCustomExperienceName}
        setCustomExperienceNote={setCustomExperienceNote}
        setCustomExperienceStartTime={setCustomExperienceStartTime}
        setCustomExperienceTravelDocs={setCustomExperienceTravelDocs}
        setCustomExperienceType={setCustomExperienceType}
        setCustomFoodAddress={setCustomFoodAddress}
        setCustomFoodAddressSelection={setCustomFoodAddressSelection}
        setCustomFoodAddressSuggestionsOpen={setCustomFoodAddressSuggestionsOpen}
        setCustomFoodCost={setCustomFoodCost}
        setCustomFoodDateKey={setCustomFoodDateKey}
        setCustomFoodDurationHrs={setCustomFoodDurationHrs}
        setCustomFoodDurationMins={setCustomFoodDurationMins}
        setCustomFoodImage={setCustomFoodImage}
        setCustomFoodName={setCustomFoodName}
        setCustomFoodNote={setCustomFoodNote}
        setCustomFoodStartTime={setCustomFoodStartTime}
        setCustomFoodTravelDocs={setCustomFoodTravelDocs}
        setCustomPlaceAddress={setCustomPlaceAddress}
        setCustomPlaceAddressSelection={setCustomPlaceAddressSelection}
        setCustomPlaceAddressSuggestionsOpen={setCustomPlaceAddressSuggestionsOpen}
        setCustomPlaceCost={setCustomPlaceCost}
        setCustomPlaceDateKey={setCustomPlaceDateKey}
        setCustomPlaceDurationHrs={setCustomPlaceDurationHrs}
        setCustomPlaceDurationMins={setCustomPlaceDurationMins}
        setCustomPlaceImage={setCustomPlaceImage}
        setCustomPlaceName={setCustomPlaceName}
        setCustomPlaceNote={setCustomPlaceNote}
        setCustomPlaceStartTime={setCustomPlaceStartTime}
        setCustomPlaceTravelDocs={setCustomPlaceTravelDocs}
        setCustomTransportVehicle={setCustomTransportVehicle}
        setEditPlaceItem={setEditPlaceItem}
        setExpenseSortBy={setExpenseSortBy}
        setExperienceBookingModalOpen={setExperienceBookingModalOpen}
        setExperienceDetailsTab={setExperienceDetailsTab}
        setExperienceDetailsView={setExperienceDetailsView}
        setExperienceDurationFilter={setExperienceDurationFilter}
        setExperiencePriceRange={setExperiencePriceRange}
        setExperienceSearchQuery={setExperienceSearchQuery}
        setExperienceSortBy={setExperienceSortBy}
        setExperienceTypeFilter={setExperienceTypeFilter}
        setFoodDetailsTab={setFoodDetailsTab}
        setFoodDetailsView={setFoodDetailsView}
        setFoodDietaryFilter={setFoodDietaryFilter}
        setFoodSearchQuery={setFoodSearchQuery}
        setFoodSortBy={setFoodSortBy}
        setFriendlyDialog={setFriendlyDialog}
        setGeneralAttachments={setGeneralAttachments}
        setGeneralNotes={setGeneralNotes}
        setMapDayFilterOpen={setMapDayFilterOpen}
        setMapDayFilterSelected={setMapDayFilterSelected}
        setModalCurrency={setModalCurrency}
        setNotesActiveTab={setNotesActiveTab}
        setNotesModalOpen={setNotesModalOpen}
        setOptimizeRouteEndId={setOptimizeRouteEndId}
        setOptimizeRouteModalOpen={setOptimizeRouteModalOpen}
        setOptimizeRouteStartId={setOptimizeRouteStartId}
        setPendingDeleteItemId={setPendingDeleteItemId}
        setPlaceDetailsTab={setPlaceDetailsTab}
        setPlaceDetailsView={setPlaceDetailsView}
        setPlaceSearchQuery={setPlaceSearchQuery}
        setPlaceSortBy={setPlaceSortBy}
        setPublicTransportModalOpen={setPublicTransportModalOpen}
        setSelectedPlaceMarkerId={setSelectedPlaceMarkerId}
        setStayBookingAdults={setStayBookingAdults}
        setStayBookingCheckInDate={setStayBookingCheckInDate}
        setStayBookingCheckOutDate={setStayBookingCheckOutDate}
        setStayBookingChildren={setStayBookingChildren}
        setStayBookingRooms={setStayBookingRooms}
        setStayDetailsTab={setStayDetailsTab}
        setStayDetailsView={setStayDetailsView}
        setStaySearchQuery={setStaySearchQuery}
        setStaySortBy={setStaySortBy}
        setStayStarFilter={setStayStarFilter}
        setStayTypeFilter={setStayTypeFilter}
        setTripExpenseItems={setTripExpenseItems}
        setWhereCityRangeError={setWhereCityRangeError}
        setWhereModalOpen={setWhereModalOpen}
        setWhereQuery={setWhereQuery}
        setWhereSelectedLocations={setWhereSelectedLocations}
        setWhereSuggestionsOpen={setWhereSuggestionsOpen}
        showInAppNotice={showInAppNotice}
        socialImportModalProps={socialImportModalProps}
        stayBookingAdults={stayBookingAdults}
        stayBookingCheckInDate={stayBookingCheckInDate}
        stayBookingCheckOutDate={stayBookingCheckOutDate}
        stayBookingChildren={stayBookingChildren}
        stayBookingModalOpen={stayBookingModalOpen}
        stayBookingRooms={stayBookingRooms}
        stayBookingTarget={stayBookingTarget}
        stayDetailsTab={stayDetailsTab}
        stayDetailsView={stayDetailsView}
        staySearchQuery={staySearchQuery}
        staySortBy={staySortBy}
        stayStarFilter={stayStarFilter}
        stayTypeFilter={stayTypeFilter}
        stayTypeOptions={stayTypeOptions}
        trip={trip}
        tripExpenseItems={tripExpenseItems}
        userCountry={user?.country}
        whereCityDayDrafts={whereCityDayDrafts}
        whereCityPlanRows={whereCityPlanRows}
        whereCityDayRanges={whereCityDayRanges}
        whereCityRangeError={whereCityRangeError}
        whereDefaultCityDayRanges={whereDefaultCityDayRanges}
        addWhereCityPlanRow={addWhereCityPlanRow}
        removeWhereCityPlanRow={removeWhereCityPlanRow}
        updateWhereCityPlanRowLocation={updateWhereCityPlanRowLocation}
        whereLocationSuggestions={whereLocationSuggestions}
        whereModalOpen={whereModalOpen}
        whereModalRef={whereModalRef}
        whereQuery={whereQuery}
        whereSelectedLocations={whereSelectedLocations}
        whereSuggestionsLoading={whereSuggestionsLoading}
        whereSuggestionsOpen={whereSuggestionsOpen}
        whereTotalTripDays={whereTotalTripDays}
      />
    </div>
  );
}
