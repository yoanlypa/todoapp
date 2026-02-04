import { useEffect } from "react";
import { ensureDbInitialized } from "../data/db/db";

export default function App() {
  useEffect(() => {
    ensureDbInitialized().catch(console.error);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>todoapp</h1>
      <p>DB initialized. Next: screens + first CRUD.</p>
    </div>
  );
}
