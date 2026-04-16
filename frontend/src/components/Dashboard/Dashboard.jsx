import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';
import PublishItineraryModal from '../PublishItineraryModal/PublishItineraryModal';
import SetCoverImageModal from './components/SetCoverImageModal';
import FriendlyModal from '../FriendlyModal/FriendlyModal';
import TripShareModal from '../TripDetailsPage/components/TripShareModal';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import {
  resolveTripStartDate,
  formatDepartureDistance,
  parseIsoDate,
  formatRelativeTime,
} from './lib/dashboardTripUtils';
import useDashboardTrips from './hooks/useDashboardTrips';
import useDashboardTripActions from './hooks/useDashboardTripActions';
import DashboardWelcome from './components/DashboardWelcome';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardTripsSection from './components/DashboardTripsSection';
import DashboardRenameModal from './components/DashboardRenameModal';
import './Dashboard.css';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [tripFilter, setTripFilter] = useState('All');
  const [openTripFilterDropdown, setOpenTripFilterDropdown] = useState(false);
  const tripFilterDropdownRef = useRef(null);
  const [tripStatuses, setTripStatuses] = useState({});
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const statusDropdownRef = useRef(null);
  const [openOwnerMenuId, setOpenOwnerMenuId] = useState(null);
  const ownerMenuRef = useRef(null);
  const [sidebarModalType, setSidebarModalType] = useState(null);
  const {
    myTrips,
    setMyTrips,
    myTripsLoading,
    tripRows,
    destinationCoverByQuery,
    refreshTrips,
  } = useDashboardTrips();
  const {
    publishTarget,
    setPublishTarget,
    coverImageTarget,
    setCoverImageTarget,
    renameTarget,
    renameTitleDraft,
    setRenameTitleDraft,
    dialog,
    closeDialog,
    closeRenameModal,
    applyRenameFromModal,
    handleItineraryOwnerMenu,
    shareModalOpen,
    setShareModalOpen,
    shareItinerary,
    shareFriends,
    shareLoading,
    searchUsers,
    handleShareInviteByEmail,
    handleShareInviteByUser,
    handleShareSendToFriends,
    handleShareUpdateCollaborator,
    handleShareRemoveCollaborator,
    handleShareCopyLink,
  } = useDashboardTripActions({
    setMyTrips,
    refreshTrips,
    user,
  });

  useEffect(() => {
    setTripStatuses((prev) => {
      const next = { ...prev };
      tripRows.forEach((t) => {
        if (next[t.id] === undefined) next[t.id] = t.status;
      });
      return next;
    });
  }, [tripRows]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setOpenStatusDropdownId(null);
      }
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(e.target)) {
        setOpenOwnerMenuId(null);
      }
      if (tripFilterDropdownRef.current && !tripFilterDropdownRef.current.contains(e.target)) {
        setOpenTripFilterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setTripStatus = (tripId, status) => {
    setTripStatuses((prev) => ({ ...prev, [tripId]: status }));
    setOpenStatusDropdownId(null);
  };

  const todayStr = (() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  })();

  const filteredTrips = useMemo(() => {
    
    const todayDate = new Date(`${todayStr}T12:00:00`);
    if (tripFilter === 'All') return tripRows;
    if (tripFilter === 'Upcoming') {
      return tripRows.filter((trip) => {
        const startDate = resolveTripStartDate(trip);
        return Boolean(startDate) && startDate >= todayDate;
      });
    }
    if (tripFilter === 'Past') {
      return tripRows.filter((trip) => {
        const startDate = resolveTripStartDate(trip);
        return Boolean(startDate) && startDate < todayDate;
      });
    }
    return tripRows;
  }, [tripRows, tripFilter, todayStr]);

  const allComingUpTrips = useMemo(() => {
    const todayDate = new Date(`${todayStr}T00:00:00`);
    return tripRows
      .map((trip) => {
        const startDate = resolveTripStartDate(trip);
        if (!startDate || startDate < todayDate) return null;
        return {
          id: trip.id,
          name: trip.title || 'Untitled trip',
          day: startDate.getDate(),
          month: startDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
          departureDateLabel: startDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          departureDistanceLabel: formatDepartureDistance(startDate, todayDate),
          ts: startDate.getTime(),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts)
  }, [tripRows, todayStr]);

  const comingUpTrips = allComingUpTrips.slice(0, 3);

  const allRecentActivity = useMemo(() => {
    const now = new Date();
    return tripRows
      .map((trip) => {
        const createdAt = parseIsoDate(trip.raw?.createdAt);
        const updatedAt = parseIsoDate(trip.raw?.updatedAt);
        const activityDate = updatedAt || createdAt;
        if (!activityDate) return null;

        
        const createdMs = createdAt ? createdAt.getTime() : null;
        const updatedMs = updatedAt ? updatedAt.getTime() : null;
        const isCreated =
          updatedMs == null
          || createdMs == null
          || Math.abs(updatedMs - createdMs) < 60 * 1000;

        return {
          id: trip.id,
          ts: activityDate.getTime(),
          text: `${isCreated ? 'You created' : 'You updated'} ${trip.title || 'Untitled trip'}`,
          timeLabel: formatRelativeTime(activityDate, now),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.ts - a.ts)
  }, [tripRows]);

  const recentActivity = allRecentActivity.slice(0, 5);
  const isSidebarModalOpen = sidebarModalType === 'coming-up' || sidebarModalType === 'recent-activity';
  const sidebarModalTitle = sidebarModalType === 'recent-activity' ? 'Recent Activity' : 'Coming Up';
  const sidebarModalItems = sidebarModalType === 'recent-activity' ? allRecentActivity : allComingUpTrips;

  return (
    <div className="dashboard">
      <DashboardHeader user={user} onLogout={onLogout} activeNav="dashboard" />

      <div className="dashboard__body">
        <main className="dashboard__main">
          <DashboardWelcome />
          <DashboardTripsSection
            user={user}
            tripFilter={tripFilter}
            setTripFilter={setTripFilter}
            openTripFilterDropdown={openTripFilterDropdown}
            setOpenTripFilterDropdown={setOpenTripFilterDropdown}
            tripFilterDropdownRef={tripFilterDropdownRef}
            myTripsLoading={myTripsLoading}
            myTrips={myTrips}
            filteredTrips={filteredTrips}
            tripStatuses={tripStatuses}
            openOwnerMenuId={openOwnerMenuId}
            openStatusDropdownId={openStatusDropdownId}
            ownerMenuRef={ownerMenuRef}
            statusDropdownRef={statusDropdownRef}
            destinationCoverByQuery={destinationCoverByQuery}
            setOpenOwnerMenuId={setOpenOwnerMenuId}
            setOpenStatusDropdownId={setOpenStatusDropdownId}
            setTripStatus={setTripStatus}
            handleItineraryOwnerMenu={handleItineraryOwnerMenu}
            onOpenTrip={(tripId) => navigate(`/trip/${tripId}`)}
          />
        </main>

        <DashboardSidebar
          comingUpTrips={comingUpTrips}
          allComingUpTrips={allComingUpTrips}
          recentActivity={recentActivity}
          allRecentActivity={allRecentActivity}
          sidebarModalType={sidebarModalType}
          sidebarModalTitle={sidebarModalTitle}
          sidebarModalItems={sidebarModalItems}
          onOpenSidebarModal={setSidebarModalType}
          onCloseSidebarModal={() => setSidebarModalType(null)}
        />
      </div>

      <DashboardRenameModal
        open={Boolean(renameTarget)}
        renameTitleDraft={renameTitleDraft}
        setRenameTitleDraft={setRenameTitleDraft}
        onClose={closeRenameModal}
        onSave={applyRenameFromModal}
      />

      <PublishItineraryModal
        open={Boolean(publishTarget)}
        onClose={() => setPublishTarget(null)}
        itinerary={publishTarget?.itinerary || null}
        initialStep={publishTarget?.initialStep || 1}
        mode={publishTarget?.mode || 'publish'}
        onPublished={async () => {
          try {
            await refreshTrips();
          } catch {
            
          }
        }}
      />
      <SetCoverImageModal
        open={Boolean(coverImageTarget)}
        itinerary={coverImageTarget}
        onClose={() => setCoverImageTarget(null)}
        onSaved={(updated) => {
          const updatedId = String(updated?._id ?? updated?.id ?? coverImageTarget?._id ?? coverImageTarget?.id ?? '');
          setMyTrips((prev) => prev.map((trip) => (
            String(trip?._id ?? trip?.id ?? '') === updatedId
              ? { ...trip, ...updated }
              : trip
          )));
        }}
      />
      <FriendlyModal
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        showCancel={dialog.showCancel}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onClose={closeDialog}
        onConfirm={async () => {
          if (typeof dialog.onConfirm === 'function') {
            await dialog.onConfirm();
            return;
          }
          closeDialog();
        }}
      />
      <TripShareModal
        open={shareModalOpen}
        loading={shareLoading}
        friends={shareFriends}
        collaborators={shareItinerary?.collaborators || []}
        owner={shareItinerary?.creator}
        currentUserId={String(user?.id || user?._id || '')}
        currentUserEmail={user?.email || ''}
        onClose={() => setShareModalOpen(false)}
        onShareWithFriend={(friend) => handleShareSendToFriends([friend.id], { [friend.id]: 'viewer' })}
        onInviteByEmail={handleShareInviteByEmail}
        onInviteByUser={handleShareInviteByUser}
        onSearchUsers={searchUsers}
        onSaveCollaboratorRoles={async (pendingRoles) => {
          const currentCollabs = Array.isArray(shareItinerary?.collaborators) ? shareItinerary.collaborators : [];
          for (const [userId, role] of Object.entries(pendingRoles || {})) {
            const collab = currentCollabs.find(
              (entry) => String(entry?.user?.id || entry?.userId || '') === String(userId)
            );
            if (!collab) continue;
            if ((collab?.role || 'viewer') === role) continue;
            await handleShareUpdateCollaborator(collab, role);
          }
        }}
        onRemoveCollaborator={async (userId) => {
          const currentCollabs = Array.isArray(shareItinerary?.collaborators) ? shareItinerary.collaborators : [];
          const collab = currentCollabs.find(
            (entry) => String(entry?.user?.id || entry?.userId || '') === String(userId)
          );
          if (!collab) throw new Error('Collaborator not found.');
          await handleShareRemoveCollaborator(collab);
        }}
        onCopy={handleShareCopyLink}
      />
    </div>
  );
}
