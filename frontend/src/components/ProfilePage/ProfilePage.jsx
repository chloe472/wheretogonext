import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import { resolveImageUrl, applyImageFallback } from '../../lib/imageFallback';
import { useProfilePage } from './useProfilePage';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import ProfileTabs from './ProfileTabs';
import ProfileOverview from './ProfileOverview';
import ProfileTrips from './ProfileTrips';
import ProfileFriends from './ProfileFriends';
import ProfilePageModals from './ProfilePageModals';
import ProfileShareModal from './ProfileShareModal';
import { platformIcon } from './profileSocialUtils';
import '../Dashboard/Dashboard.css';
import './ProfilePage.css';
export default function ProfilePage({ user, onLogout, onUserUpdate }) {
  const navigate = useNavigate();
  const { id: profileId } = useParams();
  const [searchParams] = useSearchParams();
  const profile = useProfilePage({
    user,
    profileId,
    searchParams,
    onUserUpdate,
  });
  const {
    activeTab,
    setActiveTab,
    profile: profileData,
    displayName,
    picture,
    interestsList,
    socialsList,
    stats,
    trips,
    tripStatuses,
    openStatusDropdownId,
    setOpenStatusDropdownId,
    statusDropdownRef,
    openOwnerMenuId,
    setOpenOwnerMenuId,
    ownerMenuRef,
    publishTarget,
    setPublishTarget,
    renameTarget,
    setRenameTarget,
    renameTitleDraft,
    setRenameTitleDraft,
    dialog,
    friendsList,
    isFriend,
    friendLoading,
    requestStatus,
    viewerRequestId,
    requests,
    requestsLoading,
    outgoingRequests,
    outgoingLoading,
    addFriendOpen,
    setAddFriendOpen,
    addFriendValue,
    setAddFriendValue,
    addFriendError,
    setAddFriendError,
    addFriendLoading,
    addFriendResults,
    setAddFriendResults,
    addFriendSelectedId,
    setAddFriendSelectedId,
    addFriendSearching,
    loading,
    errorMsg,
    geoData,
    geoLoading,
    geoError,
    addDestinationOpen,
    setAddDestinationOpen,
    destinationCountry,
    setDestinationCountry,
    destinationCountryInput,
    setDestinationCountryInput,
    destinationCountryOpen,
    setDestinationCountryOpen,
    destinationCity,
    setDestinationCity,
    destinationCityOpen,
    setDestinationCityOpen,
    destinationError,
    setDestinationError,
    destinationLoading,
    countryDropdownRef,
    cityDropdownRef,
    editOpen,
    setEditOpen,
    editDraft,
    setEditDraft,
    editError,
    editSaving,
    photoFile,
    setPhotoFile,
    photoPreview,
    setPhotoPreview,
    photoUploading,
    socialDraft,
    setSocialDraft,
    statsListOpen,
    setStatsListOpen,
    shareOpen,
    shareTrip,
    isSelf,
    countries,
    countriesCount,
    citiesCount,
    visitedCountries,
    visitedCities,
    mapFlags,
    flagForCountry,
    openEdit,
    acceptRequest,
    declineRequest,
    handleFriendToggle,
    handleShare,
    profileShareOpen,
    setProfileShareOpen,
    profileShareSelectedIds,
    profileShareSending,
    handleProfileShareToggleFriend,
    handleProfileShareSend,
    handleProfileShareCopyLink,
    getTripLink,
    refreshProfile,
    removeFriendFromList,
    submitAddFriend,
    submitDestination,
    setTripStatus,
    handleItineraryOwnerMenu,
    applyRenameFromModal,
    closeShareTrip,
    handleShareWithFriend,
    handleCopyShareLink,
    commitSocialDraft,
    saveProfile,
    removeProfilePhoto,
    closeDialog,
  } = profile;
  const handleOwnerMenuToggle = (tripId) => {
    setOpenOwnerMenuId((id) => (id === tripId ? null : tripId));
  };
  const handleStatusToggle = (tripId) => {
    setOpenStatusDropdownId((id) => (id === tripId ? null : tripId));
  };
  const handleStatusSelect = (tripId, value) => {
    setOpenStatusDropdownId(null);
    setTripStatus(tripId, value);
  };
  const handleOwnerAction = (trip, action) => {
    setOpenOwnerMenuId(null);
    handleItineraryOwnerMenu(trip, action);
  };
  const handleAddDestinationOpen = () => {
    setDestinationError('');
    setDestinationCountry('');
    setDestinationCountryInput('');
    setDestinationCity('');
    setAddDestinationOpen(true);
  };
  const handleAddFriendOpen = () => {
    setAddFriendError('');
    setAddFriendOpen(true);
  };
  const handleEditClose = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setEditOpen(false);
  };
  const handleAddFriendClose = () => {
    setAddFriendOpen(false);
    setAddFriendValue('');
    setAddFriendResults([]);
    setAddFriendSelectedId(null);
    setAddFriendError('');
  };
  const handleRenameClose = () => {
    setRenameTarget(null);
    setRenameTitleDraft('');
  };
  return (
    <div className="profile-page">
      <DashboardHeader user={user} onLogout={onLogout} activeNav="profile" />
      <main className="profile-page__main">
        <section className="profile-page__cover" />
        <button
          type="button"
          className="profile-page__back-btn wtg-back-btn"
          onClick={() => {
            const idx = window.history?.state?.idx ?? 0;
            if (idx > 0) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
        >
          <span>Back</span>
        </button>
        <section className="profile-page__card-wrap">
          <article className="profile-page__card">
            <ProfileHeader
              picture={picture}
              displayName={displayName}
              profile={profileData}
              socialsList={socialsList}
              interestsList={interestsList}
              flagForCountry={flagForCountry}
              platformIcon={platformIcon}
              isSelf={isSelf}
              requestStatus={requestStatus}
              isFriend={isFriend}
              friendLoading={friendLoading}
              incomingRequestId={viewerRequestId}
              onEdit={openEdit}
              onAcceptRequest={acceptRequest}
              onFriendToggle={handleFriendToggle}
              onShare={handleShare}
              resolveImageUrl={resolveImageUrl}
              applyImageFallback={applyImageFallback}
            />

            <ProfileStats stats={stats} />

            <ProfileTabs activeTab={activeTab} onChange={setActiveTab} isSelf={isSelf} />

            <section className="profile-page__content">
              {loading && <p className="profile-page__empty">Loading profile...</p>}
              {errorMsg && !loading && <p className="profile-page__empty profile-page__error">{errorMsg}</p>}
              {activeTab === 'overview' && (
                <ProfileOverview
                  isSelf={isSelf}
                  displayName={displayName}
                  countriesCount={countriesCount}
                  citiesCount={citiesCount}
                  onViewDestinations={() => setStatsListOpen('all')}
                  onAddDestination={handleAddDestinationOpen}
                  geoLoading={geoLoading}
                  geoError={geoError}
                  geoData={geoData}
                  mapFlags={mapFlags}
                />
              )}
              {activeTab === 'trips' && (
                <ProfileTrips
                  isSelf={isSelf}
                  trips={trips}
                  openOwnerMenuId={openOwnerMenuId}
                  openStatusDropdownId={openStatusDropdownId}
                  statusDropdownRef={statusDropdownRef}
                  ownerMenuRef={ownerMenuRef}
                  tripStatuses={tripStatuses}
                  onOwnerMenuToggle={handleOwnerMenuToggle}
                  onStatusToggle={handleStatusToggle}
                  onStatusSelect={handleStatusSelect}
                  onOwnerAction={handleOwnerAction}
                  onTripOpen={(link) => navigate(link)}
                  getTripLink={getTripLink}
                />
              )}
              {activeTab === 'friends' && (
                <ProfileFriends
                  isSelf={isSelf}
                  requests={requests}
                  requestsLoading={requestsLoading}
                  outgoingRequests={outgoingRequests}
                  outgoingLoading={outgoingLoading}
                  friendsList={friendsList}
                  onAccept={acceptRequest}
                  onDecline={declineRequest}
                  onRemove={removeFriendFromList}
                  onOpenAddFriend={handleAddFriendOpen}
                  displayName={displayName}
                />
              )}
            </section>
          </article>
        </section>
      </main>

      <ProfilePageModals
        editModal={{
          open: editOpen,
          onClose: handleEditClose,
          photoPreview,
          picture,
          displayName,
          photoFile,
          setPhotoFile,
          setPhotoPreview,
          editDraft,
          setEditDraft,
          socialDraft,
          setSocialDraft,
          commitSocialDraft,
          editError,
          editSaving,
          photoUploading,
          removeProfilePhoto,
          saveProfile,
          countries,
          flagForCountry,
        }}
        addFriendModal={{
          open: addFriendOpen,
          onClose: handleAddFriendClose,
          addFriendValue,
          setAddFriendValue,
          addFriendResults,
          addFriendSelectedId,
          setAddFriendSelectedId,
          addFriendError,
          setAddFriendError,
          addFriendLoading,
          addFriendSearching,
          submitAddFriend,
        }}
        destinationsModal={{
          open: Boolean(statsListOpen),
          onClose: () => setStatsListOpen(null),
          isSelf,
          displayName,
          countriesCount,
          visitedCountries,
          citiesCount,
          visitedCities,
        }}
        addDestinationModal={{
          open: addDestinationOpen,
          onClose: () => setAddDestinationOpen(false),
          destinationCountry,
          setDestinationCountry,
          destinationCountryInput,
          setDestinationCountryInput,
          destinationCountryOpen,
          setDestinationCountryOpen,
          destinationCity,
          setDestinationCity,
          destinationCityOpen,
          setDestinationCityOpen,
          destinationError,
          setDestinationError,
          destinationLoading,
          submitDestination,
          countryDropdownRef,
          cityDropdownRef,
        }}
        renameModal={{
          renameTarget,
          renameTitleDraft,
          setRenameTitleDraft,
          onClose: handleRenameClose,
          onSave: applyRenameFromModal,
        }}
        shareModal={{
          open: shareOpen,
          shareTrip,
          friendsList,
          onClose: closeShareTrip,
          onShareWithFriend: handleShareWithFriend,
          onCopy: handleCopyShareLink,
        }}
        publishModal={{
          open: Boolean(publishTarget),
          onClose: () => setPublishTarget(null),
          itinerary: publishTarget,
          onPublished: async () => {
            try {
              await refreshProfile();
            } catch {
              /* ignore */
            }
          },
        }}
        dialogModal={{
          open: dialog.open,
          title: dialog.title,
          message: dialog.message,
          showCancel: dialog.showCancel,
          confirmText: dialog.confirmText,
          cancelText: dialog.cancelText,
          onClose: closeDialog,
          onConfirm: async () => {
            if (typeof dialog.onConfirm === 'function') {
              await dialog.onConfirm();
              return;
            }
            closeDialog();
          },
        }}
      />
      <ProfileShareModal
        open={profileShareOpen}
        friends={friendsList}
        selectedFriendIds={profileShareSelectedIds}
        sending={profileShareSending}
        onToggleFriend={handleProfileShareToggleFriend}
        onSend={handleProfileShareSend}
        onCopy={handleProfileShareCopyLink}
        onClose={() => setProfileShareOpen(false)}
      />
    </div>
  );
}
