import FriendlyModal from '../../FriendlyModal/FriendlyModal';
import SocialImportModal from '../../SocialImportModal/SocialImportModal';

export function TripDetailsSocialImportLayer({
  socialImportModalProps,
  resolveImageUrl,
  onImageError,
  onAddDetectedDestination,
}) {
  return (
    <SocialImportModal
      {...socialImportModalProps}
      resolveImageUrl={resolveImageUrl}
      onImageError={onImageError}
      onAddDetectedDestination={onAddDetectedDestination}
    />
  );
}

export function TripDetailsFriendlyDialogLayer({ friendlyDialog, setFriendlyDialog }) {
  return (
    <FriendlyModal
      open={friendlyDialog.open}
      title={friendlyDialog.title}
      message={friendlyDialog.message}
      showCancel={friendlyDialog.showCancel}
      confirmText={friendlyDialog.confirmText}
      cancelText={friendlyDialog.cancelText}
      onClose={() => setFriendlyDialog((prev) => ({ ...prev, open: false, onConfirm: null }))}
      onConfirm={async () => {
        if (typeof friendlyDialog.onConfirm === 'function') {
          await friendlyDialog.onConfirm();
          setFriendlyDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
          return;
        }
        setFriendlyDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
      }}
    />
  );
}
