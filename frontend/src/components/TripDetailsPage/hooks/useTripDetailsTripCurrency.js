import { useEffect, useState } from 'react';

export function useTripDetailsTripCurrency(exchangeRates) {
  const [currency, setCurrency] = useState('USD');
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [modalCurrency, setModalCurrency] = useState('USD');

  useEffect(() => {
    if (currency !== 'USD' && !exchangeRates?.[currency]) {
      setCurrency('USD');
    }
    if (modalCurrency !== 'USD' && !exchangeRates?.[modalCurrency]) {
      setModalCurrency('USD');
    }
  }, [currency, exchangeRates, modalCurrency]);

  return {
    currency,
    setCurrency,
    currencyModalOpen,
    setCurrencyModalOpen,
    modalCurrency,
    setModalCurrency,
  };
}
