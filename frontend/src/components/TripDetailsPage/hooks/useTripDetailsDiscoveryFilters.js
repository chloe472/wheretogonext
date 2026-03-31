import { useMemo } from 'react';
import {
  enrichFoodDetails,
  getStayStarLevel,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsDiscoveryFilters({
  discoveryData,
  cityQuery,
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
}) {
  const filteredPlaces = useMemo(() => {
    const deriveSemanticTags = (place) => {
      const rawTags = place?.tags;
      if (Array.isArray(rawTags) && rawTags.length > 0) {
        return rawTags.map((tag) => String(tag));
      }
      if (typeof rawTags === 'string' && rawTags.trim()) {
        return [rawTags.trim()];
      }
      return place?.type ? [place.type] : [];
    };

    const scorePlaceRecommendation = (place) => {
      const recommended = Number(place?.recommendedScore || 0);
      const rating = Number(place?.rating || 0);
      const reviewCount = Math.max(0, Number(place?.reviewCount || 0));
      const priorMean = 4.2;
      const priorWeight = 120;
      const confidenceRating = ((reviewCount * rating) + (priorWeight * priorMean)) / (reviewCount + priorWeight);

      let score = 0;
      score += recommended;
      score += confidenceRating * 11;
      score += Math.log10(reviewCount + 1) * 6;
      if (reviewCount < 15) score -= 2;
      return score;
    };

    const source = Array.isArray(discoveryData?.places)
      ? discoveryData.places.map((place) => ({
        ...place,
        tags: deriveSemanticTags(place),
      }))
      : [];
    let results = source;
    if (placeSearchQuery.trim()) {
      const q = placeSearchQuery.trim().toLowerCase();
      results = results.filter((p) =>
        (p.name || '').toLowerCase().includes(q)
        || (p.address || '').toLowerCase().includes(q)
        || (p.description || '').toLowerCase().includes(q),
      );
    }
    if (placeSortBy === 'Rating: Low to High') {
      results = [...results].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (placeSortBy === 'Rating: High to Low') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      results = [...results].sort((a, b) => scorePlaceRecommendation(b) - scorePlaceRecommendation(a));
    }
    return results;
  }, [discoveryData?.places, placeSearchQuery, placeSortBy]);

  const filteredFoods = useMemo(() => {
    const source = (Array.isArray(discoveryData?.foods) ? discoveryData.foods : [])
      .map((food) => enrichFoodDetails(food, cityQuery));
    let results = source;
    if (foodSearchQuery.trim()) {
      const q = foodSearchQuery.trim().toLowerCase();
      results = results.filter((f) =>
        (f.name || '').toLowerCase().includes(q)
        || (f.address || '').toLowerCase().includes(q)
        || (f.cuisine || '').toLowerCase().includes(q),
      );
    }
    if (foodDietaryFilter && foodDietaryFilter !== 'All') {
      const selected = String(foodDietaryFilter).toLowerCase();
      results = results.filter((f) => {
        const tags = Array.isArray(f.dietaryTags) ? f.dietaryTags.map((d) => String(d).toLowerCase()) : [];
        const amenity = String(f.amenityType || f.type || '').toLowerCase();
        const price = String(f.priceLevel || '').trim();
        const rating = Number(f.rating || 0);
        const opening = String(f.openingHoursRaw || '').toLowerCase();

        if (selected === 'top rated (4.5+)') return rating >= 4.5;
        if (selected === 'budget ($-$$)') return price === '$' || price === '$$' || Number(f.priceLevel) <= 2;
        if (selected === 'cafe') return amenity.includes('cafe') || tags.some((t) => t.includes('cafe'));
        if (selected === 'late night') {
          return tags.some((t) => t.includes('late night'))
            || opening.includes('24')
            || opening.includes('late');
        }
        if (selected === 'vegetarian / vegan') {
          return tags.some((t) => t.includes('vegetarian') || t.includes('vegan'));
        }
        if (selected === 'muslim-friendly') {
          return tags.some((t) => t.includes('muslim'));
        }
        return true;
      });
    }
    if (foodSortBy === 'Rating') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (foodSortBy === 'Most reviewed') {
      results = [...results].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }
    return results;
  }, [discoveryData?.foods, foodSearchQuery, foodDietaryFilter, foodSortBy, cityQuery]);

  const filteredExperiences = useMemo(() => {
    const source = Array.isArray(discoveryData?.experiences) ? discoveryData.experiences : [];
    let results = source;
    if (experienceSearchQuery.trim()) {
      const q = experienceSearchQuery.trim().toLowerCase();
      results = results.filter((e) =>
        (e.name || '').toLowerCase().includes(q)
        || (e.description || '').toLowerCase().includes(q)
        || (e.type || '').toLowerCase().includes(q),
      );
    }
    if (experienceTypeFilter && experienceTypeFilter !== 'All') {
      const type = experienceTypeFilter.toLowerCase();
      results = results.filter((e) => (e.type || '').toLowerCase().includes(type));
    }
    if (experiencePriceRange && experiencePriceRange !== 'All') {
      const normalizedPriceFilter = String(experiencePriceRange).toLowerCase();
      results = results.filter((e) => {
        const price = Number(e.price || 0);
        if (normalizedPriceFilter.includes('0') && normalizedPriceFilter.includes('50')) return price < 50;
        if (normalizedPriceFilter.includes('50') && normalizedPriceFilter.includes('100')) return price >= 50 && price < 100;
        if (normalizedPriceFilter.includes('100') && normalizedPriceFilter.includes('200')) return price >= 100 && price < 200;
        if (normalizedPriceFilter.includes('200+')) return price >= 200;
        return true;
      });
    }
    if (experienceDurationFilter && experienceDurationFilter !== 'All') {
      const normalizedDurationFilter = String(experienceDurationFilter).toLowerCase();
      results = results.filter((e) => {
        const hrs = Number(e.durationHours || 0);
        if (normalizedDurationFilter.includes('under 4') || normalizedDurationFilter.includes('less than 4')) return hrs < 4;
        if (normalizedDurationFilter.includes('4-8')) return hrs >= 4 && hrs <= 8;
        if (normalizedDurationFilter.includes('8-12')) return hrs > 8 && hrs <= 12;
        if (normalizedDurationFilter.includes('12+') || normalizedDurationFilter.includes('full day')) return hrs > 12;
        return true;
      });
    }
    if (experienceSortBy === 'Price: Low to High') {
      results = [...results].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (experienceSortBy === 'Price: High to Low') {
      results = [...results].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (experienceSortBy === 'Highest Rated' || experienceSortBy === 'Rating') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (experienceSortBy === 'Most reviewed') {
      results = [...results].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (experienceSortBy === 'Duration') {
      results = [...results].sort((a, b) => (a.durationHours || 0) - (b.durationHours || 0));
    }
    return results;
  }, [
    discoveryData?.experiences,
    experienceSearchQuery,
    experienceTypeFilter,
    experiencePriceRange,
    experienceDurationFilter,
    experienceSortBy,
  ]);

  const filteredStays = useMemo(() => {
    const source = Array.isArray(discoveryData?.stays) ? discoveryData.stays : [];
    let results = source;

    if (staySearchQuery.trim()) {
      const q = staySearchQuery.trim().toLowerCase();
      results = results.filter((s) =>
        (s.name || '').toLowerCase().includes(q)
        || (s.address || '').toLowerCase().includes(q)
        || (s.type || '').toLowerCase().includes(q),
      );
    }

    if (stayTypeFilter !== 'All') {
      const selectedType = String(stayTypeFilter).toLowerCase();
      results = results.filter((s) => {
        const stayType = String(s.type || '').toLowerCase();
        return stayType === selectedType || stayType.includes(selectedType);
      });
    }

    if (stayStarFilter !== 'All') {
      results = results.filter((s) => {
        const stars = getStayStarLevel(s);
        return String(stars) === String(stayStarFilter);
      });
    }

    if (staySortBy === 'Stars: High to Low') {
      results = [...results].sort((a, b) => getStayStarLevel(b) - getStayStarLevel(a));
    } else if (staySortBy === 'Stars: Low to High') {
      results = [...results].sort((a, b) => getStayStarLevel(a) - getStayStarLevel(b));
    } else if (staySortBy === 'Rating: High to Low') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      results = [...results].sort((a, b) => {
        const scoreA = (a.rating || 0) * 10 + Math.log10((a.reviewCount || 0) + 1) * 5;
        const scoreB = (b.rating || 0) * 10 + Math.log10((b.reviewCount || 0) + 1) * 5;
        return scoreB - scoreA;
      });
    }

    return results;
  }, [discoveryData?.stays, staySearchQuery, stayTypeFilter, stayStarFilter, staySortBy]);

  const stayTypeOptions = useMemo(() => {
    const source = Array.isArray(discoveryData?.stays) ? discoveryData.stays : [];
    const normalized = source
      .map((stay) => String(stay?.type || '').trim())
      .filter(Boolean);
    const deduped = [...new Set(normalized)].sort((a, b) => a.localeCompare(b));
    if (deduped.length > 0) return ['All', ...deduped];
    return ['All', 'Hotel', 'Resort', 'Motel', 'Guesthouse', 'Extended Stay', 'Accommodation'];
  }, [discoveryData?.stays]);

  return {
    filteredPlaces,
    filteredFoods,
    filteredExperiences,
    filteredStays,
    stayTypeOptions,
  };
}
