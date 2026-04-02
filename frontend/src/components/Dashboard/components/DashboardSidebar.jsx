import { Clock, FileText } from 'lucide-react';
import './DashboardSidebar.css';

export default function DashboardSidebar({
  comingUpTrips,
  allComingUpTrips,
  recentActivity,
  allRecentActivity,
  sidebarModalType,
  sidebarModalTitle,
  sidebarModalItems,
  onOpenSidebarModal,
  onCloseSidebarModal,
}) {
  const isSidebarModalOpen = sidebarModalType === 'coming-up' || sidebarModalType === 'recent-activity';

  return (
    <>
      <aside className="dashboard__sidebar">
        <section className="sidebar-block">
          <h3 className="sidebar-block__title">
            <Clock size={18} aria-hidden />
            Coming Up
          </h3>
          {comingUpTrips.length === 0 ? (
            <p className="dashboard__trips-empty">No upcoming trips yet.</p>
          ) : (
            <>
              <ul className="sidebar-block__list">
                {comingUpTrips.map((item) => (
                  <li key={item.id} className="coming-up-item">
                    <div className="coming-up-item__date">
                      <span className="coming-up-item__day">{item.day}</span>
                      <span className="coming-up-item__month">{item.month}</span>
                    </div>
                    <div className="coming-up-item__info">
                      <span className="coming-up-item__name">{item.name}</span>
                      <span className="coming-up-item__label">
                        {item.departureDateLabel} · {item.departureDistanceLabel}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {allComingUpTrips.length > 3 && (
                <button
                  type="button"
                  className="dashboard__trips-show-more"
                  onClick={() => onOpenSidebarModal('coming-up')}
                >
                  View all {allComingUpTrips.length} trips →
                </button>
              )}
            </>
          )}
        </section>

        <section className="sidebar-block">
          <h3 className="sidebar-block__title">
            <FileText size={18} aria-hidden />
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="dashboard__trips-empty">No recent activity yet.</p>
          ) : (
            <>
              <ul className="sidebar-block__list">
                {recentActivity.map((item) => (
                  <li key={item.id} className="activity-item">
                    <span className="activity-item__text">{item.text}</span>
                    <span className="activity-item__time">{item.timeLabel}</span>
                  </li>
                ))}
              </ul>

              {allRecentActivity.length > 5 && (
                <button
                  type="button"
                  className="dashboard__trips-show-more"
                  onClick={() => onOpenSidebarModal('recent-activity')}
                >
                  View all {allRecentActivity.length} activities →
                </button>
              )}
            </>
          )}
        </section>
      </aside>

      {isSidebarModalOpen && (
        <>
          <button
            type="button"
            className="dashboard__rename-backdrop"
            aria-label="Close list dialog"
            onClick={onCloseSidebarModal}
          />
          <div
            className="dashboard__sidebar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-sidebar-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard__sidebar-modal-header">
              <h3 id="dashboard-sidebar-modal-title" className="sidebar-block__title">
                {sidebarModalType === 'recent-activity' ? <FileText size={18} aria-hidden /> : <Clock size={18} aria-hidden />}
                {sidebarModalTitle}
              </h3>
              <button
                type="button"
                className="dashboard__sidebar-modal-close"
                onClick={onCloseSidebarModal}
              >
                Close
              </button>
            </div>

            <ul className="sidebar-block__list dashboard__sidebar-modal-list">
              {sidebarModalItems.map((item) => (
                <li key={item.id} className="dashboard__sidebar-modal-item">
                  <span className="dashboard__sidebar-modal-item-title">
                    {sidebarModalType === 'recent-activity' ? item.text : item.name}
                  </span>
                  <span className="dashboard__sidebar-modal-item-meta">
                    {sidebarModalType === 'recent-activity'
                      ? item.timeLabel
                      : `${item.departureDateLabel} · ${item.departureDistanceLabel}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
