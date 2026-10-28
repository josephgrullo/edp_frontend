
import React from 'react';
import { useMemo, useState } from 'react';
import {
  ArrowDownUp, ChevronLeft, ChevronRight, Eye, Search,
  SlidersHorizontal, Plus, Trash2, X
} from 'lucide-react';

function conditionClass(value = '') {
  const condition = value.toLowerCase();
  if (condition.includes('repair') || condition.includes('poor') || condition.includes('damage')) return 'condition condition--repair';
  if (condition.includes('fair') || condition.includes('maintenance')) return 'condition condition--fair';
  return 'condition condition--good';
}

function displayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

const emptyForm = {
  name: '',
  category: '',
  quantity: '1',
  item_condition: 'Good',
  location: ''
};

export default function EquipmentTable({
  equipment = [],
  loading,
  onSelect,
  onAdd,
  onDelete
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const pageSize = 7;

  const categories = useMemo(
    () => ['All categories', ...new Set(equipment.map(item => item.category).filter(Boolean))],
    [equipment]
  );

  const filtered = useMemo(() => {
    const needle = search.toLowerCase().trim();

    return equipment.filter(item => {
      const matchesSearch = !needle ||
        [item.name, item.category, item.location, item.item_condition]
          .some(value => String(value || '').toLowerCase().includes(needle));

      return matchesSearch &&
        (category === 'All categories' || item.category === category);
    }).sort((a, b) => {
      let first = a[sortBy] ?? '';
      let second = b[sortBy] ?? '';

      if (sortBy === 'quantity' || sortBy === 'id') {
        first = Number(first);
        second = Number(second);
      } else {
        first = String(first).toLowerCase();
        second = String(second).toLowerCase();
      }

      const result = first < second ? -1 : first > second ? 1 : 0;
      return sortDirection === 'asc' ? result : -result;
    });
  }, [equipment, search, category, sortBy, sortDirection]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const sort = key => {
    setSortDirection(current =>
      sortBy === key && current === 'asc' ? 'desc' : 'asc'
    );
    setSortBy(key);
    setPage(1);
  };

  async function handleAdd(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.location.trim()) {
      alert('Please fill in the name, category, and location.');
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      alert('Quantity must be a whole number greater than or equal to zero.');
      return;
    }

    if (!onAdd) {
      alert('Add feature is not connected to the backend yet.');
      return;
    }

    try {
      setSaving(true);
      await onAdd({
        name: form.name.trim(),
        category: form.category.trim(),
        quantity,
        item_condition: form.item_condition,
        location: form.location.trim()
      });
      setForm(emptyForm);
      setShowForm(false);
      setPage(1);
    } catch (error) {
      alert(error.message || 'Could not add inventory item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete "${item.name}" from inventory? This cannot be undone.`
    );
    if (!confirmed) return;

    if (!onDelete) {
      alert('Delete feature is not connected to the backend yet.');
      return;
    }

    try {
      await onDelete(item);
    } catch (error) {
      alert(error.message || 'Could not delete inventory item.');
    }
  }

  return (
    <section className="panel equipment-panel">
      <div className="panel-heading table-heading">
        <div>
          <h2>Equipment inventory</h2>
          <p>Search and manage the equipment recorded in your database.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="count-pill">{filtered.length} records</span>
          <button className="add-inventory-btn" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Inventory
          </button>
        </div>
      </div>

      {showForm && (
        <div className="inventory-form-overlay">
          <form className="inventory-form" onSubmit={handleAdd}>
            <div className="inventory-form-heading">
              <h3>Add inventory item</h3>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close form">
                <X size={18} />
              </button>
            </div>

            <label>
              Equipment name
              <input required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Projector" />
            </label>

            <label>
              Category
              <input required value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Electronics" />
            </label>

            <label>
              Quantity
              <input required type="number" min="0" step="1" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </label>

            <label>
              Condition
              <select value={form.item_condition}
                onChange={e => setForm({ ...form, item_condition: e.target.value })}>
                <option>Good</option>
                <option>Fair</option>
                <option>Needs Repair</option>
                <option>Damaged</option>
              </select>
            </label>

            <label>
              Location
              <input required value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Room 101" />
            </label>

            <div className="inventory-form-actions">
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Inventory'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input value={search} onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }} placeholder="Search equipment, location..." aria-label="Search equipment" />
          <kbd>/</kbd>
        </label>

        <label className="filter-select">
          <SlidersHorizontal size={16} />
          <select value={category} onChange={e => {
            setCategory(e.target.value);
            setPage(1);
          }} aria-label="Filter by category">
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="table-state">
          <span className="spinner" />
          <strong>Loading equipment...</strong>
          <p>Connecting to the GearTrack API.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="table-state">
          <div className="empty-icon"><Search size={22} /></div>
          <strong>No equipment found</strong>
          <p>{equipment.length ? 'Try changing your search or category filter.' : 'No equipment records yet. Add your first item.'}</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="equipment-table">
              <thead>
                <tr>
                  <th><button className="sort-button" onClick={() => sort('name')}>Equipment <ArrowDownUp size={13} /></button></th>
                  <th>Category</th>
                  <th><button className="sort-button" onClick={() => sort('quantity')}>Quantity <ArrowDownUp size={13} /></button></th>
                  <th>Condition</th>
                  <th>Location</th>
                  <th><button className="sort-button" onClick={() => sort('date_added')}>Date added <ArrowDownUp size={13} /></button></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item, index) => (
                  <tr key={item._id || item.id || `${item.name}-${index}`}>
                    <td>
                      <div className="equipment-name-cell">
                        <span className={`equipment-mini-icon mini-icon-${index % 4}`}>
                          {String(item.name || '?').slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <strong>{item.name || 'Unnamed equipment'}</strong>
                          <span>GT-{String(item.id ?? '—').padStart(4, '0')}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="category-text">{item.category || 'Uncategorized'}</span></td>
                    <td>
                      <span className="quantity-value">{Number(item.quantity ?? 0).toLocaleString()}</span>
                      <span className="units-label"> units</span>
                    </td>
                    <td>
                      <span className={conditionClass(item.item_condition || item.condition)}>
                        <span className="condition-dot" />
                        {item.item_condition || item.condition || 'Unknown'}
                      </span>
                    </td>
                    <td><span className="location-cell">{item.location || 'Not specified'}</span></td>
                    <td className="date-cell">{displayDate(item.date_added || item.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="row-action" onClick={() => onSelect?.(item)}
                          aria-label={`View ${item.name || 'equipment'} details`} title="View details">
                          <Eye size={17} />
                        </button>
                        <button className="row-action delete-action" onClick={() => handleDelete(item)}
                          aria-label={`Delete ${item.name || 'equipment'}`} title="Delete inventory">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing <strong>{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> records</span>
            <div className="pagination">
              <button className="page-arrow" disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)} aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <span>Page {safePage} of {pages}</span>
              <button className="page-arrow" disabled={safePage === pages}
                onClick={() => setPage(safePage + 1)} aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
