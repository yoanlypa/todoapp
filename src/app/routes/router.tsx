import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../../ui/components/AppShell";
import { TodayScreen } from "../../ui/screens/TodayScreen";
import { JobsScreen } from "../../ui/screens/JobsScreen";
import { JobDetailScreen } from "../../ui/screens/JobDetailScreen";
import { InventoryScreen } from "../../ui/screens/InventoryScreen";
import { SettingsScreen } from "../../ui/screens/SettingsScreen";
import { DevScreen } from "../../ui/screens/DevScreen";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <TodayScreen /> },
      { path: "/jobs", element: <JobsScreen /> },
      { path: "/jobs/:jobId", element: <JobDetailScreen /> },
      { path: "/inventory", element: <InventoryScreen /> },
      { path: "/settings", element: <SettingsScreen /> },

      // TEMP: para seguir probando DB sin perderlo
      { path: "/dev", element: <DevScreen /> },
    ],
  },
]);
