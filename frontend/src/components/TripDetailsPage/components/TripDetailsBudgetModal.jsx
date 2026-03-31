import { Info, Wallet, X } from 'lucide-react';
import {
  formatExpenseDate,
  formatUsdAsCurrency,
  getBudgetBreakdown,
} from '../lib/tripDetailsPageHelpers';

export default function TripDetailsBudgetModal({
  onClose,
  trip,
  currency,
  exchangeRates,
  tripExpenseItems,
  expenseSortBy,
  setExpenseSortBy,
}) {
  const breakdown = getBudgetBreakdown(trip, currency, tripExpenseItems);
  const total = breakdown.total;
  const withAmount = breakdown.byCategory.filter((c) => c.amount > 0);
  const pieStyle = total > 0 && withAmount.length > 0 ? {
    background: `conic-gradient(${withAmount.map((c, i) => {
      const start = withAmount.slice(0, i).reduce((s, x) => s + x.amount, 0) / total * 100;
      const end = start + (c.amount / total * 100);
      return `${c.color} ${start}% ${end}%`;
    }).join(', ')})`,
  } : { background: '#e5e7eb' };
  const sortedItems = [...breakdown.items].sort((a, b) => expenseSortBy === 'category' ? (a.category.localeCompare(b.category) || a.name.localeCompare(b.name)) : (b.total - a.total));

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-details__budget-modal" role="dialog" aria-labelledby="budget-modal-title" aria-modal="true">
        <div className="trip-details__budget-modal-head">
          <h2 id="budget-modal-title" className="trip-details__budget-modal-title">Estimated expenses</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="trip-details__budget-your-expenses">
          <span className="trip-details__budget-your-label">Your expenses</span>
          <span className="trip-details__budget-total">{formatUsdAsCurrency(total, currency, exchangeRates)}</span>
          <Wallet size={24} className="trip-details__budget-wallet-icon" aria-hidden />
        </div>
        <div className="trip-details__budget-summary">
          <div className="trip-details__budget-pie" style={pieStyle} aria-hidden />
          <div className="trip-details__budget-details">
            <h3 className="trip-details__budget-details-title">
              Details <Info size={14} className="trip-details__budget-info-icon" aria-hidden />
            </h3>
            <ul className="trip-details__budget-category-list">
              {breakdown.byCategory.map((c) => (
                <li key={c.id} className="trip-details__budget-category-item">
                  <span className="trip-details__budget-category-dot" style={{ backgroundColor: c.color }} aria-hidden />
                  <span className="trip-details__budget-category-label">{c.label}</span>
                  <span className="trip-details__budget-category-amount">{formatUsdAsCurrency(c.amount, currency, exchangeRates)}</span>
                </li>
              ))}
            </ul>
            <p className="trip-details__budget-details-total">
              <strong>Total</strong> {formatUsdAsCurrency(total, currency, exchangeRates)}
            </p>
          </div>
        </div>
        <div className="trip-details__budget-breakdown">
          <h3 className="trip-details__budget-breakdown-title">Expenses breakdown</h3>
          <div className="trip-details__budget-sort">
            <label htmlFor="expense-sort">Sort by:</label>
            <select id="expense-sort" className="trip-details__budget-sort-select" value={expenseSortBy} onChange={(e) => setExpenseSortBy(e.target.value)}>
              <option value="category">Category</option>
              <option value="amount">Amount</option>
            </select>
          </div>
          <ul className="trip-details__budget-item-list">
            {sortedItems.map((item) => (
              <li key={item.id} className="trip-details__budget-item">
                <span className="trip-details__budget-item-icon">
                  <item.Icon size={20} aria-hidden />
                </span>
                <div className="trip-details__budget-item-body">
                  <span className="trip-details__budget-item-name">{item.name}</span>
                  <span className="trip-details__budget-item-meta">{item.category}</span>
                  <span className="trip-details__budget-item-dates">
                    {item.endDate ? `${formatExpenseDate(item.startDate)} - ${formatExpenseDate(item.endDate)}` : formatExpenseDate(item.date)}
                  </span>
                  <span className="trip-details__budget-item-detail">{item.detail}</span>
                  <span className="trip-details__budget-item-total">{formatUsdAsCurrency(item.total, currency, exchangeRates)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
