import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  return (
    <div className="app-root">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <img src="/hb-logo.png" alt="HB+" style={{ height: '42px', objectFit: 'contain' }} />
        </div>
        <div className="header-meta">HB+ Digital Assessment Engine v2.0</div>
      </header>

      <div className="app-container">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Main Menu</div>
            <button 
              onClick={() => setActiveView('clients')}
              className={`sidebar-btn ${activeView === 'clients' ? 'active' : ''}`}
            >
              <span className="icon">📂</span> Client Directory
            </button>
            <button 
              onClick={() => setActiveView('new-intake')}
              className={`sidebar-btn ${activeView === 'new-intake' ? 'active' : ''}`}
            >
              <span className="icon">➕</span> New Assessment
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
