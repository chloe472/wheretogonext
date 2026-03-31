import { useEffect, useState } from 'react';
import { fetchDiscoveryData } from '../../../api/discoveryApi';
import { getMapCenterForDestination } from '../lib/tripDetailsLocationData';
import { getDestinationList, mergeUniqueBy } from '../lib/tripDetailsPageHelpers';

const INITIAL_DISCOVERY = {
  places: [],
  foods: [],
  stays: [],
  experiences: [],
  communityItineraries: [],
  center: null,
  warning: '',
  cached: false,
  stale: false,
};

export function useTripDetailsDiscovery(trip) {
  const [discoveryData, setDiscoveryData] = useState(INITIAL_DISCOVERY);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');

  useEffect(() => {
    const targets = getDestinationList(trip?.destination, trip?.locations);
    if (targets.length === 0) return;

    let cancelled = false;
    const run = async () => {
      setDiscoveryLoading(true);
      setDiscoveryError('');
      try {
        const responses = await Promise.all(targets.map((dest) => fetchDiscoveryData(dest, 50)));
        if (cancelled) return;

        const places = mergeUniqueBy(
          responses.flatMap((data, idx) => (
            Array.isArray(data?.places)
              ? data.places.map((item) => ({ ...item, _sourceDestination: targets[idx] }))
              : []
          )),
          (it, idx) => String(it?.googlePlaceId || it?.id || `${String(it?.name || '').toLowerCase()}|${it?.lat || ''}|${it?.lng || ''}|${idx}`),
        );
        const foods = mergeUniqueBy(
          responses.flatMap((data, idx) => (
            Array.isArray(data?.foods)
              ? data.foods.map((item) => ({ ...item, _sourceDestination: targets[idx] }))
              : []
          )),
          (it, idx) => String(it?.googlePlaceId || it?.id || `${String(it?.name || '').toLowerCase()}|${it?.lat || ''}|${it?.lng || ''}|${idx}`),
        );
        const stays = mergeUniqueBy(
          responses.flatMap((data, idx) => (
            Array.isArray(data?.stays)
              ? data.stays.map((item) => ({ ...item, _sourceDestination: targets[idx] }))
              : []
          )),
          (it, idx) => String(it?.id || `${String(it?.name || '').toLowerCase()}|${it?.lat || ''}|${it?.lng || ''}|${idx}`),
        );
        const experiences = mergeUniqueBy(
          responses.flatMap((data, idx) => (
            Array.isArray(data?.experiences)
              ? data.experiences.map((item) => ({ ...item, _sourceDestination: targets[idx] }))
              : []
          )),
          (it, idx) => String(it?.id || `${String(it?.name || '').toLowerCase()}|${it?.lat || ''}|${it?.lng || ''}|${idx}`),
        );
        const communityItineraries = mergeUniqueBy(
          responses.flatMap((data) => (Array.isArray(data?.communityItineraries) ? data.communityItineraries : [])),
          (it, idx) => String(it?.id || `${String(it?.title || '').toLowerCase()}|${idx}`),
        );

        const centers = responses
          .map((data) => (Array.isArray(data?.center) && data.center.length === 2 ? data.center : null))
          .filter(Boolean);
        const center = centers.length > 0
          ? [
            centers.reduce((sum, c) => sum + Number(c[0] || 0), 0) / centers.length,
            centers.reduce((sum, c) => sum + Number(c[1] || 0), 0) / centers.length,
          ]
          : null;

        const warnings = Array.from(new Set(responses.map((data) => String(data?.warning || '').trim()).filter(Boolean)));

        setDiscoveryData({
          places,
          foods,
          stays,
          experiences,
          communityItineraries,
          center,
          warning: warnings.join(' '),
          cached: responses.some((data) => Boolean(data?.cached)),
          stale: responses.some((data) => Boolean(data?.stale)),
        });
      } catch (err) {
        if (!cancelled) {
          setDiscoveryError(err?.message || 'Failed to load destination data');
          setDiscoveryData({
            places: [],
            stays: [],
            foods: [],
            experiences: [],
            communityItineraries: [],
            center: getMapCenterForDestination(targets[0]),
            warning: 'Could not connect to the discovery service. Please check that the backend is running and try again.',
            cached: false,
            stale: true,
          });
        }
      } finally {
        if (!cancelled) setDiscoveryLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [trip?.destination, trip?.locations]);

  return { discoveryData, discoveryLoading, discoveryError };
}
