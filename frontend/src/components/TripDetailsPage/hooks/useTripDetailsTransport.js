import { useCallback, useState } from 'react';
import { Car } from 'lucide-react';
import { convertCurrencyToUsd } from '../lib/tripDetailsPageHelpers';

export function useTripDetailsTransport({
  currency,
  exchangeRates,
  days,
  setTripExpenseItems,
}) {
  const [addTransportOpen, setAddTransportOpen] = useState(false);
  const [addTransportDay, setAddTransportDay] = useState(1);
  const [addCustomTransportOpen, setAddCustomTransportOpen] = useState(false);
  const [customTransportVehicle, setCustomTransportVehicle] = useState('Bus');

  const appendTransportTripItem = useCallback(({
    id,
    name,
    date,
    detail,
    startTime = '',
    durationHrs = 0,
    durationMins = 0,
    notes = '',
    total = 0,
    Icon = Car,
    transportType = 'transport',
  }) => {
    const normalizedTotalUsd = convertCurrencyToUsd(Number(total) || 0, currency, exchangeRates);
    setTripExpenseItems((prev) => [...prev, {
      id: id || `transport-${Date.now()}`,
      name,
      total: normalizedTotalUsd,
      categoryId: 'transportations',
      category: 'Transportations',
      date: date || days[0]?.date,
      detail,
      startTime,
      durationHrs,
      durationMins,
      Icon,
      notes,
      attachments: [],
      externalLink: '',
      transportType,
    }]);
  }, [currency, exchangeRates, days, setTripExpenseItems]);

  return {
    addTransportOpen,
    setAddTransportOpen,
    addTransportDay,
    setAddTransportDay,
    addCustomTransportOpen,
    setAddCustomTransportOpen,
    customTransportVehicle,
    setCustomTransportVehicle,
    appendTransportTripItem,
  };
}
