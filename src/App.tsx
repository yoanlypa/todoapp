import { useEffect } from "react";
import { ensureDbInitialized } from "./data/db/db";
import { AppProviders } from "./app/providers/AppProviders";

export default function App() {
  useEffect(() => {
    ensureDbInitialized().catch(console.error);
  }, []);

  return <AppProviders />;
}

