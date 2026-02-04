import { Link } from "react-router-dom";

export function SettingsScreen() {
  return (
    <div>
      <h1>Settings</h1>
      <ul>
        <li>
          <Link to="/dev">Dev Screen (temporary)</Link>
        </li>
      </ul>
      <p>Later: export/import JSON, reset DB, schema version.</p>
    </div>
  );
}
