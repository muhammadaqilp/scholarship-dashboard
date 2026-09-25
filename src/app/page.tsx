import { AccessGate } from "@/components/AccessGate";
import { App } from "@/components/App";

export default function Home() {
  return (
    <AccessGate>
      <App />
    </AccessGate>
  );
}
