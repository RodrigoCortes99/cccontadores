"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import { usePanelUser } from "../../lib/PanelUserContext";
import { isClientRole } from "../../lib/roles";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, error, reload } = usePanelUser();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="appShellLoading">
        <LoadingState label="Cargando panel..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="appShellLoading">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className={`appShell ${collapsed ? "appShell--collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        esCliente={isClientRole(user)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="appShell__content">
        <Header
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />

        <main className="appMain">{children}</main>
      </div>
    </div>
  );
}
