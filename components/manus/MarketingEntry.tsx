import MarketingPage from "./MarketingPages";
import { normalizePageRoute } from "./routes";
import "./pages.css";
import "./service-seo.css";

/** Route-specific entry keeps service/review code out of the homepage bundle. */
export default function MarketingEntry({ initialPath, locationName = "Melbourne", reviewPage = 1 }: {
  initialPath: string; embedded?: boolean; locationName?: string; reviewPage?: number;
}) {
  return <div className="app"><main><MarketingPage path={normalizePageRoute(initialPath)} locationName={locationName} reviewPage={reviewPage} /></main></div>;
}
