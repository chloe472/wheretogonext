import PublishItineraryModal from '../PublishItineraryModal/PublishItineraryModal';
import FriendlyModal from '../FriendlyModal/FriendlyModal';
import ProfileEditModal from './ProfileEditModal';
import ProfileAddFriendModal from './ProfileAddFriendModal';
import ProfileDestinationsModal from './ProfileDestinationsModal';
import ProfileAddDestinationModal from './ProfileAddDestinationModal';
import ProfileRenameTripModal from './ProfileRenameTripModal';
import ProfileShareTripModal from './ProfileShareTripModal';

export default function ProfilePageModals({
  editModal,
  addFriendModal,
  destinationsModal,
  addDestinationModal,
  renameModal,
  shareModal,
  publishModal,
  dialogModal,
}) {
  return (
    <>
      <ProfileEditModal {...editModal} />
      <ProfileAddFriendModal {...addFriendModal} />
      <ProfileDestinationsModal {...destinationsModal} />
      <ProfileAddDestinationModal {...addDestinationModal} />
      <ProfileRenameTripModal {...renameModal} />
      <ProfileShareTripModal {...shareModal} />
      <PublishItineraryModal
        open={publishModal.open}
        onClose={publishModal.onClose}
        itinerary={publishModal.itinerary}
        onPublished={publishModal.onPublished}
      />
      <FriendlyModal
        open={dialogModal.open}
        title={dialogModal.title}
        message={dialogModal.message}
        showCancel={dialogModal.showCancel}
        confirmText={dialogModal.confirmText}
        cancelText={dialogModal.cancelText}
        onClose={dialogModal.onClose}
        onConfirm={dialogModal.onConfirm}
      />
    </>
  );
}
