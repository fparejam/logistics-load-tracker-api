import { Layout } from "@/components/layout";
import { DashboardTop } from "@/components/dashboard/dashboard-top";

export default function AcmeDashboard() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <DashboardTop />
        </div>
      </div>
    </Layout>
  );
}
