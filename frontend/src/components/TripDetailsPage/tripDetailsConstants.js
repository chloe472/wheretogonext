import {
  Camera,
  UtensilsCrossed,
  Building2,
  Car,
  Ticket,
  Share2,
  Route,
} from 'lucide-react';

/** Options for the "Add to trip" action sheet (Itinerary kanban / calendar). */
export const ADD_TO_TRIP_OPTIONS = [
  {
    id: 'place',
    label: 'Place',
    description: 'Attractions, Events, Restaurants,...',
    Icon: Camera,
    color: '#16a34a',
  },
  {
    id: 'food',
    label: 'Food & Beverage',
    description: 'Local Food, Restaurant, Drinks,...',
    Icon: UtensilsCrossed,
    color: '#dc2626',
  },
  {
    id: 'stays',
    label: 'Stays',
    description: 'Hotel, Apartments, Villas,...',
    Icon: Building2,
    color: '#2563eb',
  },
  {
    id: 'transportation',
    label: 'Transportation',
    description: 'Flight, Train, Bus, Ferry, Boat & Private Transfer',
    Icon: Car,
    color: '#ea580c',
  },
  {
    id: 'experience',
    label: 'Experience',
    description: 'Tours, Cruises, Indoor & Outdoor Activities...',
    Icon: Ticket,
    color: '#7c3aed',
  },
  {
    id: 'routeIdeas',
    label: 'Smart Itinerary Generator',
    description: 'Builds day-by-day routes using popularity ranking and nearby-place clustering',
    Icon: Route,
    color: '#0ea5e9',
  },
  {
    id: 'social',
    label: 'Import from social media',
    description: 'Import places and posts from Instagram, Pinterest, TikTok...',
    Icon: Share2,
    color: '#8b5cf6',
  },
];
