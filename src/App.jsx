import React from "react";
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Boxes, CalendarDays, CheckCircle2, ChevronRight,
  Download, Laptop, MapPin, Menu, Moon, PackageCheck, RefreshCw, Sun, Wrench, X
} from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import EquipmentTable from './components/EquipmentTable.jsx';
import AiChat from './components/AiChat.jsx';
import {
  getDashboard,
  getEquipment,
  getHealth,
  addEquipment,
  deleteEquipment
} from './api.js';

const pageMeta = {
  dashboard: { title: 'Overview', subtitle: 'Here’s what’s happening with your campus equipment.' },
  equipment: { title: 'Equipment inventory', subtitle: 'Browse, search, and review equipment stored in your GearTrack database.' },
  assistant: { title: 'AI inventory assistant', subtitle: 'Get quick answers about the equipment records in your campus inventory.' },
  reports: { title: 'Reports & insights', subtitle: 'Understand equipment distribution and recorded condition at a glance.' },
};

function isNeedsRepair(item) {
  const condition = String(item.item_condition || item.condition || '').toLowerCase();
  return condition.includes('repair') || condition.includes('poor') || condition.includes('damage');
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function MetricCard({ label, value, suffix, note, icon: Icon, tone = 'blue', trendIcon: TrendIcon }) {
  return <article className="metric-card"><div className="metric-top"><span className={`metric-icon metric-icon--${tone}`}><Icon size={19} /></span>{TrendIcon && <span className="metric-trend"><TrendIcon size={14} /> Live data</span>}</div><p className="metric-label">{label}</p><div className="metric-value-row"><strong>{value}</strong>{suffix && <span>{suffix}</span>}</div><p className="metric-note">{note}</p></article>;
}

function EmptyPanel({ icon: Icon = Boxes, title, body }) {
  return <div className="report-empty"><span><Icon size={22} /></span><strong>{title}</strong><p>{body}</p></div>;
}

function Overview({ equipment, dashboard, loading, error, onRetry, onSelect, onNavigate }) {
  const repairItems = equipment.filter(isNeedsRepair);
  const categoryGroups = useMemo(() => {
    const counts = new Map();
    equipment.forEach(item => counts.set(item.category || 'Uncategorized', (counts.get(item.category || 'Uncategorized') || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [equipment]);
  const maxCategory = Math.max(1, ...categoryGroups.map(([, count]) => count));
  const recentItems = [...equipment].sort((a, b) => new Date(b.date_added || 0) - new Date(a.date_added || 0)).slice(0, 4);
  const totalTypes = dashboard?.total_equipment ?? equipment.length;
  const totalQuantity = dashboard?.total_quantity ?? equipment.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return <>
    {error && <div className="alert-banner" role="alert"><AlertTriangle size={18} /><div><strong>Equipment data could not be loaded</strong><span>{error}</span></div><button onClick={onRetry}>Try again</button></div>}
    <div className="metric-grid">
      <MetricCard label="Equipment records" value={loading ? '—' : totalTypes.toLocaleString()} note="Unique inventory entries" icon={Boxes} tone="blue" trendIcon={Activity} />
      <MetricCard label="Total units" value={loading ? '—' : totalQuantity.toLocaleString()} note="Combined recorded quantity" icon={PackageCheck} tone="violet" />
      <MetricCard label="Needs attention" value={loading ? '—' : repairItems.length.toLocaleString()} note="Records marked for repair" icon={Wrench} tone="amber" />
      <MetricCard label="Categories" value={loading ? '—' : new Set(equipment.map(item => item.category).filter(Boolean)).size.toLocaleString()} note="Equipment types in use" icon={Laptop} tone="green" />
    </div>

    <div className="overview-grid">
      <section className="panel category-panel">
        <div className="panel-heading"><div><h2>Equipment by category</h2><p>Number of records in each category</p></div><button className="text-button" onClick={() => onNavigate('reports')}>View report <ChevronRight size={15} /></button></div>
        {loading ? <div className="inline-loading"><span className="spinner" /> Loading category data...</div> : categoryGroups.length ? <div className="category-bars">{categoryGroups.map(([name, count], index) => <div className="category-bar-row" key={name}><div className="category-bar-copy"><span>{name}</span><strong>{count}</strong></div><div className="bar-track"><span className={`bar-fill bar-fill--${index % 5}`} style={{ width: `${(count / maxCategory) * 100}%` }} /></div></div>)}</div> : <EmptyPanel title="No category data yet" body="Equipment categories will appear here once records are returned by your API." />}
        <div className="panel-footnote"><span className="legend-dot" /> Records are grouped using the database category field.</div>
      </section>

      <section className="panel attention-panel">
        <div className="panel-heading"><div><h2>Needs attention</h2><p>Equipment recorded as needing repair</p></div><span className="attention-count">{repairItems.length}</span></div>
        {loading ? <div className="inline-loading"><span className="spinner" /> Checking conditions...</div> : repairItems.length ? <div className="attention-list">{repairItems.slice(0, 4).map(item => <button className="attention-item" key={item._id || item.id || item.name} onClick={() => onSelect(item)}><span className="attention-item-icon"><Wrench size={17} /></span><span className="attention-copy"><strong>{item.name}</strong><small><MapPin size={12} /> {item.location || 'Location not specified'}</small></span><ChevronRight size={16} className="muted-chevron" /></button>)}</div> : <EmptyPanel icon={CheckCircle2} title="All clear" body="No records are currently marked as needing repair." />}
        {repairItems.length > 4 && <button className="panel-bottom-link" onClick={() => onNavigate('equipment')}>View all {repairItems.length} records <ChevronRight size={15} /></button>}
      </section>
    </div>

    <section className="panel activity-panel">
      <div className="panel-heading"><div><h2>Recently added equipment</h2><p>Latest records according to the date added field</p></div><button className="text-button" onClick={() => onNavigate('equipment')}>All equipment <ChevronRight size={15} /></button></div>
      {loading ? <div className="inline-loading"><span className="spinner" /> Loading recent records...</div> : recentItems.length ? <div className="recent-list">{recentItems.map((item, index) => <button className="recent-item" key={item._id || item.id || item.name} onClick={() => onSelect(item)}><span className={`recent-icon mini-icon-${index % 4}`}>{String(item.name || '?').slice(0, 1).toUpperCase()}</span><span className="recent-copy"><strong>{item.name}</strong><small>{item.category || 'Uncategorized'} · {item.location || 'Location not specified'}</small></span><span className="recent-quantity">{Number(item.quantity || 0)} <small>units</small></span><span className="recent-date"><CalendarDays size={14} /> {item.date_added ? new Date(item.date_added).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}</span><ChevronRight size={16} className="muted-chevron" /></button>)}</div> : <EmptyPanel title="No equipment records" body="Your recent inventory records will appear when the API returns equipment." />}
    </section>
  </>;
}

function Reports({ equipment, dashboard, loading }) {
  const categories = useMemo(() => {
    const counts = new Map();
    equipment.forEach(item => counts.set(item.category || 'Uncategorized', (counts.get(item.category || 'Uncategorized') || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [equipment]);
  const conditions = useMemo(() => {
    const counts = new Map();
    equipment.forEach(item => { const key = item.item_condition || item.condition || 'Unknown'; counts.set(key, (counts.get(key) || 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [equipment]);
  const totalUnits = dashboard?.total_quantity ?? equipment.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const maxCat = Math.max(1, ...categories.map(([, count]) => count));
  return <>
    <div className="report-summary"><div><span className="summary-eyebrow">INVENTORY SNAPSHOT</span><strong>{loading ? '—' : totalUnits.toLocaleString()}</strong><span>Total recorded units</span></div><div><span className="summary-eyebrow">RECORDS</span><strong>{loading ? '—' : equipment.length.toLocaleString()}</strong><span>Unique equipment entries</span></div><div><span className="summary-eyebrow">CATEGORIES</span><strong>{loading ? '—' : categories.length.toLocaleString()}</strong><span>Recorded category groups</span></div></div>
    <div className="reports-grid"><section className="panel report-panel"><div className="panel-heading"><div><h2>Category distribution</h2><p>Count of equipment records per category</p></div></div>{loading ? <div className="inline-loading"><span className="spinner" /> Loading...</div> : categories.length ? <div className="report-bars">{categories.map(([name, count], index) => <div className="category-bar-row" key={name}><div className="category-bar-copy"><span>{name}</span><strong>{count} <small>records</small></strong></div><div className="bar-track bar-track--large"><span className={`bar-fill bar-fill--${index % 5}`} style={{ width: `${count / maxCat * 100}%` }} /></div></div>)}</div> : <EmptyPanel title="No categories available" body="Category data will appear when equipment is loaded." />}</section>
    <section className="panel report-panel"><div className="panel-heading"><div><h2>Condition overview</h2><p>Based on condition values in MongoDB</p></div></div>{loading ? <div className="inline-loading"><span className="spinner" /> Loading...</div> : conditions.length ? <div className="condition-report-list">{conditions.map(([name, count]) => <div className="condition-report-row" key={name}><span className={`condition condition--${isNeedsRepair({ item_condition: name }) ? 'repair' : name.toLowerCase().includes('fair') ? 'fair' : 'good'}`}><span className="condition-dot" />{name}</span><div className="condition-report-track"><span style={{ width: `${count / Math.max(1, equipment.length) * 100}%` }} /></div><strong>{count}</strong></div>)}</div> : <EmptyPanel title="No condition data" body="Condition summaries will appear when records have been loaded." />}</section></div>
    <section className="panel report-note"><div className="section-icon section-icon--blue"><Activity size={20} /></div><div><strong>About these insights</strong><p>Reports are computed from the equipment records returned by your live backend. They summarize current stored values; they do not forecast future demand or equipment failures.</p></div></section>
  </>;
}

function DetailModal({ item, onClose }) {
  useEffect(() => {
    if (!item) return undefined;
    const handler = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, onClose]);
  if (!item) return null;
  const fields = [
    ['Equipment ID', item.id ?? '—'], ['Category', item.category || 'Uncategorized'], ['Quantity', Number(item.quantity || 0).toLocaleString()], ['Condition', item.item_condition || item.condition || 'Unknown'], ['Location', item.location || 'Not specified'], ['Date added', item.date_added ? new Date(item.date_added).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—']
  ];
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div className="modal-head"><div><span className="modal-eyebrow">EQUIPMENT DETAILS</span><h2 id="detail-title">{item.name || 'Equipment record'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close details"><X size={19} /></button></div><div className="detail-emblem"><Boxes size={24} /><div><strong>GT-{String(item.id ?? '—').padStart(4, '0')}</strong><span>Record from MongoDB</span></div></div><div className="detail-fields">{fields.map(([label, value]) => <div key={label} className="detail-field"><span>{label}</span><strong>{value}</strong></div>)}</div>
  <p className="modal-note">
  <Activity size={15} />
  This displays the equipment details stored in your GearTrack database.
</p><button className="primary-button modal-done" onClick={onClose}>Done</button></section></div>;
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [equipment, setEquipment] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState('');
  const [connected, setConnected] = useState(false);
  const [healthMessage, setHealthMessage] = useState('Checking backend connection');
  const [selectedItem, setSelectedItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true); else setLoading(true);
    setDataError('');
    const [healthResult, dashboardResult, equipmentResult] = await Promise.allSettled([getHealth(), getDashboard(), getEquipment()]);
    if (healthResult.status === 'fulfilled') {
      setConnected(true);
      setHealthMessage(healthResult.value.message || 'GearTrack backend is running');
    } else {
      setConnected(false);
      setHealthMessage('Backend connection unavailable');
    }
    if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value);
    else setDashboard(null);
    if (equipmentResult.status === 'fulfilled') setEquipment(equipmentResult.value);
    else setDataError(equipmentResult.reason?.message || 'Could not load equipment.');
    if (equipmentResult.status === 'fulfilled' && dashboardResult.status === 'rejected') {
      // Dashboard metrics will fall back to values derived from the actual equipment response.
      setDashboard(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  
  // Add a new inventory item and refresh the dashboard.
  const handleAddEquipment = useCallback(async (item) => {
    await addEquipment(item);
    await loadData(true);
  }, [loadData]);

  // Delete an inventory item using its numeric database ID.
  const handleDeleteEquipment = useCallback(async (item) => {
    if (!item?.id) {
      throw new Error('This equipment record has no valid numeric ID.');
    }

    await deleteEquipment(item.id);

    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    }

    await loadData(true);
  }, [loadData, selectedItem]);


  const exportCsv = useCallback(() => {
    if (!equipment.length) return;
    const columns = ['id', 'name', 'category', 'quantity', 'item_condition', 'location', 'date_added'];
    const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [columns.join(','), ...equipment.map(item => columns.map(key => csvCell(item[key] ?? (key === 'item_condition' ? item.condition : ''))).join(','))];
    const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geartrack-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [equipment]);

  const meta = pageMeta[activePage];
  const totalUnits = useMemo(() => dashboard?.total_quantity ?? equipment.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [dashboard, equipment]);

  return <div className="app-shell">
    <Sidebar activePage={activePage} onNavigate={setActivePage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} connected={connected} />
    <main className="main-shell">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="breadcrumbs"><span>GearTrack</span><span className="breadcrumb-separator">/</span><strong>{meta.title}</strong></div></div>
        <div className="topbar-actions"><span className="date-label"><CalendarDays size={15} />{formatDate()}</span><span className="topbar-divider" /><button className="icon-button theme-toggle" onClick={() => setDarkMode(value => !value)} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button><div className="profile-avatar" aria-label="Campus workspace profile">GT</div></div>
      </header>

      <div className="page-content">
        <div className="page-title-row"><div><div className="eyebrow">CAMPUS EQUIPMENT MANAGEMENT</div><h1>{meta.title}</h1><p>{meta.subtitle}</p></div><div className="page-actions">{activePage === 'equipment' && <button className="secondary-button" onClick={exportCsv} disabled={!equipment.length}><Download size={16} /> Export CSV</button>}<button className="secondary-button refresh-button" onClick={() => loadData(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} /> <span>{refreshing ? 'Refreshing' : 'Refresh data'}</span></button></div></div>

       
                {activePage === 'equipment' && (
          <>
            <div className="quick-info-row">
              <div className="quick-info">
                <span className="quick-info-icon">
                  <Boxes size={18} />
                </span>
                <div>
                  <span>Current records</span>
                  <strong>
                    {loading ? '—' : equipment.length.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="quick-info">
                <span className="quick-info-icon quick-info-icon--purple">
                  <PackageCheck size={18} />
                </span>
                <div>
                  <span>Total units</span>
                  <strong>
                    {loading ? '—' : totalUnits.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="quick-info">
                <span className="quick-info-icon quick-info-icon--amber">
                  <Wrench size={18} />
                </span>
                <div>
                  <span>Flagged for repair</span>
                  <strong>
                    {loading
                      ? '—'
                      : equipment.filter(isNeedsRepair).length.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            <EquipmentTable
              equipment={equipment}
              loading={loading}
              onSelect={setSelectedItem}
              onAdd={handleAddEquipment}
              onDelete={handleDeleteEquipment}
            />

            {dataError && (
              <div className="alert-banner bottom-alert">
                <AlertTriangle size={18} />
                <div>
                  <strong>Unable to refresh equipment</strong>
                  <span>{dataError}</span>
                </div>
                <button onClick={() => loadData(true)}>Try again</button>
              </div>
            )}
          </>
        )}

        {activePage === 'dashboard' && (
          <Overview
            equipment={equipment}
            dashboard={dashboard}
            loading={loading}
            error={dataError}
            onRetry={() => loadData(true)}
            onSelect={setSelectedItem}
            onNavigate={setActivePage}
          />
        )}

        {activePage === 'assistant' && <AiChat />}

        {activePage === 'reports' && (
          <Reports
            equipment={equipment}
            dashboard={dashboard}
            loading={loading}
          />
        )}

        <footer className="main-footer">
          <div>
            <span className="footer-logo">
              <GraduationCapFallback />
            </span>
            <span>
              GearTrack <i>·</i> Campus Equipment Management
            </span>
          </div>

          <span className="footer-status">
            <span
              className={`status-dot ${
                connected ? 'status-dot--good' : 'status-dot--muted'
              }`}
            />
            {connected ? 'Connected to local API' : 'API unavailable'}
            <span className="footer-separator">·</span>
            <span title={healthMessage}>Local workspace</span>
          </span>
        </footer>
      </div>
    </main>

    <DetailModal
      item={selectedItem}
      onClose={() => setSelectedItem(null)}
    />
  </div>;
  function GraduationCapFallback() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m2 9 10-5 10 5-10 5L2 9Z" />
      <path d="M6 11v5c3.8 3 8.2 3 12 0v-5M22 9v6" />
    </svg>
  );
}
}
