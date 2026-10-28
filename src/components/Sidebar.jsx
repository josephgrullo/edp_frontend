import React from "react";
import {
  Activity, Bot, Boxes, BarChart3, GraduationCap,
  LayoutDashboard, Menu, Settings2, X
} from 'lucide-react';

const links = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'equipment', label: 'Equipment', icon: Boxes },
  { id: 'assistant', label: 'AI assistant', icon: Bot, tag: 'AI' },
  { id: 'reports', label: 'Reports & insights', icon: BarChart3 },
];

export default function Sidebar({ activePage, onNavigate, open, onClose, connected }) {
  return (
    <>
      {open && <button className="scrim" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><GraduationCap size={23} strokeWidth={2.3} /></div>
          <div className="brand-copy"><strong>GearTrack</strong><span>Campus inventory</span></div>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {links.map(({ id, label, icon: Icon, tag }) => (
            <button key={id} className={`nav-item ${activePage === id ? 'active' : ''}`} onClick={() => { onNavigate(id); onClose(); }}>
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
              {tag && <span className="nav-tag">{tag}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-card">
            <span className={`status-dot ${connected ? 'status-dot--good' : 'status-dot--muted'}`} />
            <div><strong>{connected ? 'Backend connected' : 'Checking connection'}</strong><span>{connected ? 'MongoDB API available' : 'Waiting for API response'}</span></div>
            <Activity size={16} className="connection-icon" />
          </div>
          <div className="sidebar-footer"><span className="school-avatar">GT</span><div className="school-copy"><strong>Campus workspace</strong><span>Equipment operations</span></div><Settings2 size={17} className="settings-icon" /></div>
          <div className="version-label">GEARTRACK · LOCAL WORKSPACE</div>
        </div>
      </aside>
    </>
  );
}
