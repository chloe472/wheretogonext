import PublishItineraryModal from '../../PublishItineraryModal/PublishItineraryModal';
import FriendlyModal from '../../FriendlyModal/FriendlyModal';
import ProfileEditModal from './ProfileEditModal';
import ProfileAddFriendModal from './ProfileAddFriendModal';
import ProfileDestinationsModal from './ProfileDestinationsModal';
import ProfileAddDestinationModal from './ProfileAddDestinationModal';
import ProfileRenameTripModal from './ProfileRenameTripModal';
import TripShareModal from '../../TripDetailsPage/components/TripShareModal';

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
  const resolvedShareModal = shareModal
    ? {
        ...shareModal,
        onShareWithFriend:
          shareModal.onShareWithFriend ||
          (typeof shareModal.onSendToFriends === 'function'
            ? (friend) => shareModal.onSendToFriends([friend.id], { [friend.id]: 'viewer' })
            : undefined),
        onSaveCollaboratorRoles:
          shareModal.onSaveCollaboratorRoles ||
          (typeof shareModal.onUpdateCollaborator === 'function'
            ? async (pendingRoles) => {
                const currentCollabs = Array.isArray(shareModal.collaborators) ? shareModal.collaborators : [];
                for (const [userId, role] of Object.entries(pendingRoles || {})) {
                  const collab = currentCollabs.find(
                    (entry) => String(entry?.user?.id || entry?.userId || '') === String(userId)
                  );
                  if (!collab) continue;
                  if ((collab?.role || 'viewer') === role) continue;
                  await shareModal.onUpdateCollaborator(collab, role);
                }
              }
            : undefined),
        onRemoveCollaborator:
          typeof shareModal.onRemoveCollaborator === 'function'
            ? async (userId) => {
                const currentCollabs = Array.isArray(shareModal.collaborators) ? shareModal.collaborators : [];
                const collab = currentCollabs.find(
                  (entry) => String(entry?.user?.id || entry?.userId || '') === String(userId)
                );
                if (!collab) throw new Error('Collaborator not found.');
                await shareModal.onRemoveCollaborator(collab);
              }
            : undefined,
      }
    : shareModal;

  return (
    <>
      <ProfileEditModal {...editModal} />
      <ProfileAddFriendModal {...addFriendModal} />
      <ProfileDestinationsModal {...destinationsModal} />
      <ProfileAddDestinationModal {...addDestinationModal} />
      <ProfileRenameTripModal {...renameModal} />
      <TripShareModal {...resolvedShareModal} />
      <PublishItineraryModal
        open={publishModal.open}
        onClose={publishModal.onClose}
        itinerary={publishModal.itinerary}
        initialStep={publishModal.initialStep}
        mode={publishModal.mode}
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
