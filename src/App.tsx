import { useEffect } from "react";
import { ensureDbInitialized } from "./data/db/db";
import { DevScreen } from "./ui/screens/DevScreen";

export default function App() {
  useEffect(() => {
    ensureDbInitialized().catch(console.error);
  }, []);

  return <DevScreen />;
}
