import { useState } from 'react';

export const TRIP_DETAILS_FRIENDLY_DIALOG_INITIAL = {
  open: false,
  title: '',
  message: '',
  showCancel: false,
  confirmText: 'OK',
  cancelText: 'Cancel',
  onConfirm: null,
};

export function useTripDetailsFriendlyDialog() {
  return useState(TRIP_DETAILS_FRIENDLY_DIALOG_INITIAL);
}
