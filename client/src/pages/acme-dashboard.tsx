import { Layout } from "@/components/layout";
import { DashboardTop } from "@/components/dashboard/dashboard-top";

export default function AcmeDashboard() {
  return (
    <Layout>
      <div className="min-h-screen bg-white pb-8">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <DashboardTop />
        </div>
      </div>
    </Layout>
  );
}
