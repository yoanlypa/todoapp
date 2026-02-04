import { useParams } from "react-router-dom";

export function JobDetailScreen() {
  const { jobId } = useParams<{ jobId: string }>();

  return (
    <div>
      <h1>Job Detail</h1>
      <p>jobId: {jobId}</p>
      <p>Tabs: Notes / Buy / Materials will live here.</p>
    </div>
  );
}
