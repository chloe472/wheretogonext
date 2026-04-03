import { useMemo } from 'react';
import {
  distanceBetween,
  formatDurationLabelFromMinutes,
  resolveSmartDurationMinutes,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsRouteIdeas({
  discoveryData,
  filteredPlaces,
  filteredFoods,
  cityQuery,
  destinationLabel,
  selectedDestinations,
  days,
  trip,
}) {
  return useMemo(() => {
    const PRIOR_MEAN = 4.2;
    const PRIOR_WEIGHT = 120;
    const MIN_PRIMARY_REVIEWS = 120;
    const MIN_PRIMARY_CONFIDENCE = 4.1;
    const MIN_FALLBACK_REVIEWS = 60;
    const MIN_FALLBACK_CONFIDENCE = 3.95;

    const placePool = Array.isArray(filteredPlaces) && filteredPlaces.length > 0
      ? filteredPlaces
      : (Array.isArray(discoveryData?.places) ? discoveryData.places : []);
    const foodPool = Array.isArray(filteredFoods) && filteredFoods.length > 0
      ? filteredFoods
      : (Array.isArray(discoveryData?.foods) ? discoveryData.foods : []);
    const candidatePool = [
      ...placePool.map((item) => ({ ...item, _itemType: 'place' })),
      ...foodPool.map((item) => ({ ...item, _itemType: 'food' })),
    ];
    if (!Array.isArray(candidatePool) || candidatePool.length === 0) return [];

    const normalizeCityToken = (value = '') => String(value || '').split(',')[0].trim().toLowerCase();
    const matchesCityHint = (candidate, cityHint = '') => {
      const hint = normalizeCityToken(cityHint);
      if (!hint) return true;
      const sourceCity = normalizeCityToken(candidate?._sourceDestination || '');
      if (sourceCity && sourceCity === hint) return true;
      const address = String(candidate?.address || '').toLowerCase();
      return address.includes(hint);
    };

    const candidateUniqueKey = (item) => {
      const stableId = String(item?.googlePlaceId || item?.id || '').trim().toLowerCase();
      if (stableId) return stableId;
      const name = String(item?.name || '').trim().toLowerCase();
      const lat = Number(item?.lat || 0).toFixed(5);
      const lng = Number(item?.lng || 0).toFixed(5);
      return `${name}|${lat}|${lng}`;
    };

    const normalizedPlaces = candidatePool
      .filter((place) => place && place.lat != null && place.lng != null)
      .map((place, index) => {
        const rating = Number(place.rating || 0);
        const reviewCount = Math.max(0, Number(place.reviewCount || 0));
        const confidenceRating = ((reviewCount * rating) + (PRIOR_WEIGHT * PRIOR_MEAN)) / (reviewCount + PRIOR_WEIGHT);
        const recommended = Number(place.recommendedScore || 0);
        const foodBias = place._itemType === 'food' ? 10 : 0;
        const popularityScore = (recommended * 12) + (confidenceRating * 120) + (Math.log10(reviewCount + 1) * 70);
        return {
          ...place,
          _idx: index,
          _uniqueKey: candidateUniqueKey(place),
          _score: popularityScore + foodBias,
          _rating: rating,
          _confidenceRating: confidenceRating,
          _reviewCount: reviewCount,
        };
      });

    const tripDayCount = Math.max(1, Number(days?.length || 0) || 3);
    const minNeededPlaces = Math.max(tripDayCount, 3);

    const candidateTiers = [
      normalizedPlaces.filter((place) => place._reviewCount >= MIN_PRIMARY_REVIEWS && place._confidenceRating >= MIN_PRIMARY_CONFIDENCE),
      normalizedPlaces.filter((place) => place._reviewCount >= MIN_FALLBACK_REVIEWS && place._confidenceRating >= MIN_FALLBACK_CONFIDENCE),
      normalizedPlaces.filter((place) => place._reviewCount >= 20),
      normalizedPlaces,
    ];

    const candidatePlaces = candidateTiers.find((tier) => tier.length >= minNeededPlaces)
      || candidateTiers[candidateTiers.length - 1];
    if (candidatePlaces.length === 0) return [];

    const rankedPlaces = [...candidatePlaces].sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      if (b._reviewCount !== a._reviewCount) return b._reviewCount - a._reviewCount;
      return (b._rating || 0) - (a._rating || 0);
    });

    const uniqueRankedPlaces = [];
    const seenRankedKeys = new Set();
    rankedPlaces.forEach((item) => {
      const key = String(item?._uniqueKey || '');
      if (!key || seenRankedKeys.has(key)) return;
      seenRankedKeys.add(key);
      uniqueRankedPlaces.push(item);
    });

    const dayCount = tripDayCount;

    const cityHintsByDay = {};
    if (Array.isArray(trip?.citySegments) && trip.citySegments.length > 0) {
      trip.citySegments.forEach((seg, segIdx) => {
        const city = String(seg?.city || seg?.locationLabel || '').trim();
        if (!city) return;
        const startDay = Math.max(1, Math.min(dayCount, Number(seg?.startDay) || 1));
        const endDay = Math.max(startDay, Math.min(dayCount, Number(seg?.endDay) || startDay));
        for (let dayNum = startDay; dayNum <= endDay; dayNum += 1) {
          if (!Array.isArray(cityHintsByDay[dayNum])) cityHintsByDay[dayNum] = [];
          cityHintsByDay[dayNum].push({ city, startDay, endDay, segIdx });
        }
      });
    }

    const resolveDayHalfHints = (dayNum) => {
      const options = Array.isArray(cityHintsByDay[dayNum]) ? cityHintsByDay[dayNum] : [];
      if (options.length === 0) return { morning: '', afternoon: '', all: [] };

      const byStart = [...options].sort((a, b) => {
        if (a.startDay !== b.startDay) return a.startDay - b.startDay;
        if (a.endDay !== b.endDay) return a.endDay - b.endDay;
        return a.segIdx - b.segIdx;
      });
      const byLateStart = [...options].sort((a, b) => {
        if (a.startDay !== b.startDay) return b.startDay - a.startDay;
        if (a.endDay !== b.endDay) return a.endDay - b.endDay;
        return a.segIdx - b.segIdx;
      });

      const morning = String(byStart[0]?.city || '').trim();
      const afternoon = String(byLateStart[0]?.city || morning).trim() || morning;
      const all = Array.from(new Set(byStart.map((item) => String(item.city || '').trim()).filter(Boolean)));
      return { morning, afternoon, all };
    };

    const routeCityNames = (() => {
      const source = Array.isArray(trip?.citySegments) && trip.citySegments.length > 0
        ? trip.citySegments.map((seg) => seg?.city || seg?.locationLabel || '')
        : selectedDestinations;
      const unique = [];
      const seen = new Set();
      source.forEach((entry) => {
        const label = String(entry || '').trim().replace(/\s+/g, ' ');
        if (!label) return;
        const key = normalizeCityToken(label);
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(label);
      });
      return unique;
    })();

    const routeTitleLabel = (() => {
      if (routeCityNames.length === 0) return destinationLabel;
      if (routeCityNames.length === 1) return routeCityNames[0];
      if (routeCityNames.length === 2) return `${routeCityNames[0]} to ${routeCityNames[1]}`;
      return routeCityNames.join(', ');
    })();

    const takeBestMatchingPlace = (pool, cityHint = '', anchor = null) => {
      if (!Array.isArray(pool) || pool.length === 0) return null;
      const preferred = cityHint ? pool.filter((candidate) => matchesCityHint(candidate, cityHint)) : pool;
      const candidates = preferred.length > 0 ? preferred : pool;
      let bestIdx = 0;
      let bestObjective = Number.NEGATIVE_INFINITY;
      candidates.forEach((candidate, idx) => {
        const distPenalty = anchor ? distanceBetween(anchor, candidate) * 20 : 0;
        const cityBonus = cityHint && matchesCityHint(candidate, cityHint) ? 250 : 0;
        const objective = Number(candidate?._score || 0) + cityBonus - distPenalty;
        if (objective > bestObjective) {
          bestObjective = objective;
          bestIdx = idx;
        }
      });
      return candidates[bestIdx] || null;
    };

    const takeBestMatchingPlaces = (pool, cityHint = '', count = 1, anchor = null) => {
      const selected = [];
      let working = Array.isArray(pool) ? [...pool] : [];
      let currentAnchor = anchor;
      while (selected.length < count && working.length > 0) {
        const pick = takeBestMatchingPlace(working, cityHint, currentAnchor);
        if (!pick) break;
        selected.push(pick);
        working = working.filter((item) => item !== pick);
        currentAnchor = pick;
      }
      return selected;
    };

    const remaining = [...uniqueRankedPlaces];
    const orderedDayPlaces = Array.from({ length: dayCount }, (_, idx) => {
      const dayNum = idx + 1;
      const dayHints = resolveDayHalfHints(dayNum);
      return {
        dayNum,
        cityHint: dayHints.morning || '',
        morningCityHint: dayHints.morning || '',
        afternoonCityHint: dayHints.afternoon || '',
        cityHints: dayHints.all,
        ordered: [],
      };
    });
    orderedDayPlaces.forEach((bucket, bucketIdx) => {
      if (remaining.length === 0) return;

      const splitDay = bucket.morningCityHint && bucket.afternoonCityHint && bucket.morningCityHint !== bucket.afternoonCityHint;
      if (splitDay) {
        const morningPicks = takeBestMatchingPlaces(remaining, bucket.morningCityHint, 2);
        morningPicks.forEach((pick) => {
          bucket.ordered.push(pick);
          const pickIdx = remaining.indexOf(pick);
          if (pickIdx >= 0) remaining.splice(pickIdx, 1);
        });

        const afternoonAnchor = morningPicks[morningPicks.length - 1] || morningPicks[0] || null;
        const afternoonPicks = takeBestMatchingPlaces(remaining, bucket.afternoonCityHint, 2, afternoonAnchor);
        afternoonPicks.forEach((pick) => {
          bucket.ordered.push(pick);
          const pickIdx = remaining.indexOf(pick);
          if (pickIdx >= 0) remaining.splice(pickIdx, 1);
        });

        while (bucket.ordered.length < 4 && remaining.length > 0) {
          const fallbackPick = takeBestMatchingPlace(remaining, bucket.afternoonCityHint || bucket.morningCityHint, bucket.ordered[bucket.ordered.length - 1] || null);
          if (!fallbackPick) break;
          bucket.ordered.push(fallbackPick);
          const pickIdx = remaining.indexOf(fallbackPick);
          if (pickIdx >= 0) remaining.splice(pickIdx, 1);
        }
        return;
      }

      const dayCityHint = bucket.morningCityHint || bucket.cityHint || '';
      let anchor = null;
      while (bucket.ordered.length < 5 && remaining.length > 0) {
        const pick = takeBestMatchingPlace(remaining, dayCityHint, anchor);
        if (!pick) break;
        bucket.ordered.push(pick);
        anchor = pick;
        const pickIdx = remaining.indexOf(pick);
        if (pickIdx >= 0) remaining.splice(pickIdx, 1);
      }

      if (bucket.ordered.length === 0) {
        const fallback = uniqueRankedPlaces[bucketIdx % uniqueRankedPlaces.length];
        if (fallback) bucket.ordered.push(fallback);
      }
    });

    const targetStops = Math.max(3, Math.min(dayCount * 5, uniqueRankedPlaces.length || candidatePlaces.length));

    const toCandidateKey = (item) => String(item?._uniqueKey || candidateUniqueKey(item));
    const usedCandidateKeys = new Set(
      orderedDayPlaces.flatMap((bucket) => (Array.isArray(bucket.ordered) ? bucket.ordered : []).map(toCandidateKey)),
    );
    const rankedFoodCandidates = uniqueRankedPlaces.filter((item) => item?._itemType === 'food');

    const pickBestFoodForDay = (bucket) => {
      if (!Array.isArray(rankedFoodCandidates) || rankedFoodCandidates.length === 0) return null;
      const anchor = bucket?.ordered?.[Math.min(1, Math.max(0, (bucket?.ordered?.length || 1) - 1))] || bucket?.ordered?.[0] || null;
      let best = null;
      let bestScore = Number.NEGATIVE_INFINITY;

      rankedFoodCandidates.forEach((candidate) => {
        const key = toCandidateKey(candidate);
        if (usedCandidateKeys.has(key)) return;
        const distPenalty = anchor ? distanceBetween(anchor, candidate) * 14 : 0;
        const objective = Number(candidate?._score || 0) - distPenalty;
        if (objective > bestScore) {
          bestScore = objective;
          best = candidate;
        }
      });

      return best;
    };

    orderedDayPlaces.forEach((bucket) => {
      const hasFood = (Array.isArray(bucket?.ordered) ? bucket.ordered : []).some((item) => item?._itemType === 'food');
      if (hasFood) return;

      const selectedFood = pickBestFoodForDay(bucket);
      if (!selectedFood) return;

      if (bucket.ordered.length < 5) {
        bucket.ordered.push(selectedFood);
      } else {
        let replaceIdx = -1;
        let weakestScore = Number.POSITIVE_INFINITY;
        bucket.ordered.forEach((item, idx) => {
          if (item?._itemType === 'food') return;
          const score = Number(item?._score || 0);
          if (score < weakestScore) {
            weakestScore = score;
            replaceIdx = idx;
          }
        });
        if (replaceIdx >= 0) {
          bucket.ordered[replaceIdx] = selectedFood;
        }
      }

      usedCandidateKeys.add(toCandidateKey(selectedFood));
    });

    orderedDayPlaces.forEach((bucket, bucketIdx) => {
      const splitDay = bucket.morningCityHint && bucket.afternoonCityHint && bucket.morningCityHint !== bucket.afternoonCityHint;
      if (splitDay) {
        bucket.ordered = bucket.ordered.slice(0, 4);
        return;
      }
      if (bucket.ordered.length >= 5) return;
      const primaryHint = bucket.morningCityHint || bucket.cityHint;
      const cityPool = primaryHint
        ? uniqueRankedPlaces.filter((candidate) => matchesCityHint(candidate, primaryHint))
        : uniqueRankedPlaces;
      const pool = cityPool.length > 0 ? cityPool : uniqueRankedPlaces;
      if (pool.length === 0) return;

      let cursor = bucketIdx;
      while (bucket.ordered.length < 5) {
        const base = pool[cursor % pool.length];
        if (!base) break;
        const baseKey = toCandidateKey(base);
        if (!usedCandidateKeys.has(baseKey)) {
          bucket.ordered.push(base);
          usedCandidateKeys.add(baseKey);
        }
        if (usedCandidateKeys.size >= uniqueRankedPlaces.length) break;
        cursor += 1;
      }
    });

    const emittedKeys = new Set();
    const itineraryPlaces = orderedDayPlaces
      .flatMap((bucket) => bucket.ordered.slice(0, 4).map((source, index) => {
        const emitKey = toCandidateKey(source);
        if (!emitKey || emittedKeys.has(emitKey)) return null;
        emittedKeys.add(emitKey);
        const resolvedDurationMinutes = resolveSmartDurationMinutes(source);
        const cityHint = bucket.cityHint || '';
        const halfThreshold = bucket.morningCityHint && bucket.afternoonCityHint && bucket.morningCityHint !== bucket.afternoonCityHint ? 2 : 3;
        const slotCityHint = index < halfThreshold
          ? (bucket.morningCityHint || cityHint)
          : (bucket.afternoonCityHint || bucket.morningCityHint || cityHint);
        const dayTitle = bucket.morningCityHint && bucket.afternoonCityHint && bucket.morningCityHint !== bucket.afternoonCityHint
          ? `Day ${bucket.dayNum} - ${bucket.morningCityHint} to ${bucket.afternoonCityHint}`
          : (cityHint ? `Day ${bucket.dayNum} - ${cityHint}` : `Day ${bucket.dayNum}`);
        return {
          id: `smart-itinerary-${bucket.dayNum}-${index}-${source.id || source._idx || 'place'}`,
          name: source.name || `Stop ${index + 1}`,
          lat: source.lat,
          lng: source.lng,
          image: source.image,
          address: source.address || cityQuery,
          rating: source._rating || 4.2,
          reviewCount: source._reviewCount || 0,
          overview: source.overview || source.description || `${source.name || 'This stop'} is selected from high-popularity places and ordered for smoother routing.`,
          website: source.website || '',
          tags: Array.isArray(source.tags) && source.tags.length > 0 ? source.tags : ['Smart-picked'],
          itemType: source._itemType === 'food' ? 'food' : 'place',
          category: source._itemType === 'food' ? 'Food & Beverage' : 'Place',
          dayNum: bucket.dayNum,
          dayTitle,
          cityHint: slotCityHint,
          durationMinutes: resolvedDurationMinutes,
          durationLabel: source.estimatedDuration || formatDurationLabelFromMinutes(resolvedDurationMinutes),
        };
      }))
      .filter(Boolean)
      .slice(0, targetStops);

    if (itineraryPlaces.length === 0) return [];

    return [{
      id: 'smart-itinerary-generator',
      title: `${routeTitleLabel}: Smart Itinerary Generator`,
      destination: routeTitleLabel,
      duration: `${dayCount} days`,
      type: 'Smart-generated',
      creator: 'Smart Itinerary Generator',
      author: {
        name: 'AI Route Planner',
        travelStyle: 'Popularity-ranked, cluster-based itinerary',
        interests: ['Top-rated', 'Nearby routing', 'Efficient days'],
        avatar: '',
      },
      image: itineraryPlaces[0]?.image || '',
      tags: ['Popularity-ranked', 'Clustered by 2km', 'Includes food & places'],
      views: 0,
      countriesCount: Math.max(1, selectedDestinations.length),
      dayCount,
      places: itineraryPlaces,
    }];
  }, [
    discoveryData?.places,
    discoveryData?.foods,
    filteredPlaces,
    filteredFoods,
    cityQuery,
    destinationLabel,
    selectedDestinations.length,
    days?.length,
    trip?.citySegments,
  ]);
}
