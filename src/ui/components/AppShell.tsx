import { NavLink, Outlet } from "react-router-dom";

function NavItem(props: { to: string; label: string }) {
  return (
    <NavLink
      to={props.to}
      style={({ isActive }) => ({
        textDecoration: "none",
        color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
        fontWeight: isActive ? 700 : 600,
        padding: "10px 12px",
        borderRadius: 12,
        background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
      })}
    >
      {props.label}
    </NavLink>
  );
}

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--background-dark)] text-white">
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(16,25,34,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>todoapp</div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mx-auto w-full max-w-[430px]">
          <Outlet />
        </div>
      </main>

      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(16,25,34,0.9)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: 10,
        }}
      >
        <div
          style={{
            maxWidth: 430,
            margin: "0 auto",
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <NavItem to="/" label="Today" />
          <NavItem to="/jobs" label="Jobs" />
          <NavItem to="/inventory" label="Inventory" />
          <NavItem to="/settings" label="Settings" />
        </div>
      </nav>
    </div>
  );
}
