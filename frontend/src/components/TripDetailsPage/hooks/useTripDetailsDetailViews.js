import { useCallback } from 'react';
import {
  enrichFoodDetails,
  hasStayBookingData,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsDetailViews({
  cityQuery,
  discoveryData,
  filteredPlaces,
  routeIdeas,
  setAddPlacesOpen,
  setAddFoodOpen,
  setAddStaysOpen,
  setPlaceDetailsView,
  setPlaceDetailsTab,
  setFoodDetailsView,
  setFoodDetailsTab,
  setStayDetailsView,
  setStayDetailsTab,
  setItineraryDetailsView,
  setSelectedPlaceMarkerId,
  setEditPlaceItem,
}) {
  const openInternalItemOverview = useCallback((item) => {
    if (!item) return;
    const raw = String(item.categoryId || item.category || '').toLowerCase();

    setAddPlacesOpen(false);
    setAddFoodOpen(false);
    setAddStaysOpen(false);
    setPlaceDetailsView(null);
    setFoodDetailsView(null);
    setStayDetailsView(null);

    if (raw === 'food' || raw === 'food & beverage') {
      setFoodDetailsTab('overview');
      setFoodDetailsView(enrichFoodDetails(item, cityQuery));
      setAddFoodOpen(true);
      setEditPlaceItem(null);
      return;
    }

    if (raw === 'stays' || raw === 'stay') {
      if (hasStayBookingData(item)) {
        setEditPlaceItem(item);
        return;
      }
      setStayDetailsTab('overview');
      setStayDetailsView(item);
      setAddStaysOpen(true);
      setEditPlaceItem(null);
      return;
    }

    const normalizeText = (value) => String(value || '').trim().toLowerCase();
    const sourcePlaces = Array.isArray(discoveryData?.places) ? discoveryData.places : [];
    const byId = sourcePlaces.find((p) => String(p?.id || '') === String(item?.sourcePlaceId || item?.id || ''))
      || filteredPlaces.find((p) => String(p?.id || '') === String(item?.sourcePlaceId || item?.id || ''));

    const byNameAndAddress = !byId
      ? (sourcePlaces.find((p) => (
        normalizeText(p?.name) === normalizeText(item?.name)
        && normalizeText(p?.address || '').includes(normalizeText(item?.detail || item?.address || ''))
      )) || filteredPlaces.find((p) => (
        normalizeText(p?.name) === normalizeText(item?.name)
        && normalizeText(p?.address || '').includes(normalizeText(item?.detail || item?.address || ''))
      )))
      : null;

    const byCoords = (!byId && !byNameAndAddress && item?.lat != null && item?.lng != null)
      ? (sourcePlaces.find((p) => Number(p?.lat).toFixed(4) === Number(item.lat).toFixed(4) && Number(p?.lng).toFixed(4) === Number(item.lng).toFixed(4))
        || filteredPlaces.find((p) => Number(p?.lat).toFixed(4) === Number(item.lat).toFixed(4) && Number(p?.lng).toFixed(4) === Number(item.lng).toFixed(4)))
      : null;

    const canonical = byId || byNameAndAddress || byCoords || null;
    const detailItem = canonical
      ? {
        ...item,
        ...canonical,
        id: canonical.id || item.id,
        name: canonical.name || item.name,
        image: canonical.image || item.image || item.placeImageUrl,
        images: Array.isArray(canonical.images) && canonical.images.length > 0
          ? canonical.images
          : (item.image || item.placeImageUrl ? [item.image || item.placeImageUrl] : []),
        address: canonical.address || item.address || item.detail,
        website: canonical.website || item.website || item.externalLink || '',
        lat: canonical.lat ?? item.lat,
        lng: canonical.lng ?? item.lng,
      }
      : {
        ...item,
        image: item.image || item.placeImageUrl,
        images: item.image || item.placeImageUrl ? [item.image || item.placeImageUrl] : [],
        address: item.address || item.detail,
      };

    setPlaceDetailsTab('overview');
    setSelectedPlaceMarkerId(detailItem.id || null);
    setPlaceDetailsView(detailItem);
    setAddPlacesOpen(true);
    setEditPlaceItem(null);
  }, [
    cityQuery,
    discoveryData,
    filteredPlaces,
    setAddPlacesOpen,
    setAddFoodOpen,
    setAddStaysOpen,
    setPlaceDetailsView,
    setFoodDetailsView,
    setStayDetailsView,
    setFoodDetailsTab,
    setStayDetailsTab,
    setPlaceDetailsTab,
    setSelectedPlaceMarkerId,
    setEditPlaceItem,
  ]);

  const openAddPlacesDetailsFromMapMarker = useCallback((marker) => {
    if (!marker) return;

    const markerId = String(marker.sourceId || marker.id || '');
    const sourcePlaces = Array.isArray(discoveryData?.places) ? discoveryData.places : [];
    const selectedFromSource = sourcePlaces.find((place) => String(place.id) === markerId);
    const selectedFromFiltered = filteredPlaces.find((place) => String(place.id) === markerId);
    const selected = selectedFromSource || selectedFromFiltered || {
      id: marker.sourceId || marker.id || `place-${Date.now()}`,
      name: marker.name || 'Place',
      lat: marker.lat,
      lng: marker.lng,
      image: marker.image,
      address: marker.address || cityQuery,
      rating: marker.rating,
      reviewCount: marker.reviewCount,
      website: marker.website || '',
      overview: marker.overview || '',
      tags: marker.tags || [],
    };

    setAddFoodOpen(false);
    setFoodDetailsView(null);
    setItineraryDetailsView(null);
    setPlaceDetailsTab('overview');
    setSelectedPlaceMarkerId(selected.id);
    setPlaceDetailsView(selected);
    setAddPlacesOpen(true);
  }, [
    cityQuery,
    discoveryData,
    filteredPlaces,
    setAddFoodOpen,
    setFoodDetailsView,
    setItineraryDetailsView,
    setPlaceDetailsTab,
    setSelectedPlaceMarkerId,
    setPlaceDetailsView,
    setAddPlacesOpen,
  ]);

  const openRouteIdeaDetails = useCallback((itinerary) => {
    if (!itinerary) return;
    const firstPlace = Array.isArray(itinerary.places) ? itinerary.places.find((place) => place?.id) : null;
    setPlaceDetailsView(null);
    setPlaceDetailsTab('overview');
    setItineraryDetailsView(itinerary);
    setSelectedPlaceMarkerId(firstPlace?.id || null);
  }, [
    setPlaceDetailsView,
    setPlaceDetailsTab,
    setItineraryDetailsView,
    setSelectedPlaceMarkerId,
  ]);

  const openRouteIdeasBrowseAll = useCallback(() => {
    setAddFoodOpen(false);
    setPlaceDetailsView(null);
    setFoodDetailsView(null);
    setPlaceDetailsTab('overview');
    const firstItinerary = Array.isArray(routeIdeas) ? routeIdeas[0] : null;
    if (firstItinerary) {
      openRouteIdeaDetails(firstItinerary);
    } else {
      setItineraryDetailsView(null);
      setSelectedPlaceMarkerId(null);
    }
    setAddPlacesOpen(true);
  }, [
    routeIdeas,
    openRouteIdeaDetails,
    setAddFoodOpen,
    setPlaceDetailsView,
    setFoodDetailsView,
    setPlaceDetailsTab,
    setItineraryDetailsView,
    setSelectedPlaceMarkerId,
    setAddPlacesOpen,
  ]);

  const openItineraryPlaceDetails = useCallback((itineraryPlace) => {
    if (!itineraryPlace) return;
    const nextPlace = {
      ...itineraryPlace,
      id: itineraryPlace.id || `itinerary-place-${Date.now()}`,
      tags: Array.isArray(itineraryPlace.tags) ? itineraryPlace.tags : [],
    };
    setAddFoodOpen(false);
    setAddPlacesOpen(true);
    setItineraryDetailsView(null);
    setPlaceDetailsTab('overview');
    setSelectedPlaceMarkerId(nextPlace.id);
    setPlaceDetailsView(nextPlace);
  }, [
    setAddFoodOpen,
    setAddPlacesOpen,
    setItineraryDetailsView,
    setPlaceDetailsTab,
    setSelectedPlaceMarkerId,
    setPlaceDetailsView,
  ]);

  const onCloseAddPlacesBackdrop = useCallback(() => {
    setAddPlacesOpen(false);
    setPlaceDetailsView(null);
    setItineraryDetailsView(null);
    setSelectedPlaceMarkerId(null);
  }, [setAddPlacesOpen, setPlaceDetailsView, setItineraryDetailsView, setSelectedPlaceMarkerId]);

  const onCloseAddPlacesItineraryHeader = useCallback(() => {
    setAddPlacesOpen(false);
    setItineraryDetailsView(null);
    setSelectedPlaceMarkerId(null);
  }, [setAddPlacesOpen, setItineraryDetailsView, setSelectedPlaceMarkerId]);

  const onCloseAddPlacesListHeader = useCallback(() => {
    setAddPlacesOpen(false);
    setSelectedPlaceMarkerId(null);
  }, [setAddPlacesOpen, setSelectedPlaceMarkerId]);

  const onCloseAddPlacesPlaceDetailHeader = useCallback(() => {
    setAddPlacesOpen(false);
    setPlaceDetailsView(null);
    setSelectedPlaceMarkerId(null);
  }, [setAddPlacesOpen, setPlaceDetailsView, setSelectedPlaceMarkerId]);

  const onCloseFoodBackdrop = useCallback(() => {
    setAddFoodOpen(false);
    setFoodDetailsView(null);
  }, [setAddFoodOpen, setFoodDetailsView]);

  const onCloseFoodListHeader = useCallback(() => {
    setAddFoodOpen(false);
  }, [setAddFoodOpen]);

  const onBackFoodDetail = useCallback(() => {
    setFoodDetailsView(null);
    setFoodDetailsTab('overview');
  }, [setFoodDetailsView, setFoodDetailsTab]);

  const onCloseStayBackdrop = useCallback(() => {
    setAddStaysOpen(false);
    setStayDetailsView(null);
  }, [setAddStaysOpen, setStayDetailsView]);

  const onCloseStayListHeader = useCallback(() => {
    setAddStaysOpen(false);
  }, [setAddStaysOpen]);

  const onBackStayDetail = useCallback(() => {
    setStayDetailsView(null);
    setStayDetailsTab('overview');
  }, [setStayDetailsView, setStayDetailsTab]);

  return {
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
  };
}
