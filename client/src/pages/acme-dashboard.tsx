import { Layout } from "@/components/layout";
import { DashboardTop } from "@/components/dashboard/dashboard-top";

export default function AcmeDashboard() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              ACME Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor inbound carrier calls and booking performance
            </p>
          </div>

          {/* Dashboard Top Section */}
          <DashboardTop />
        </div>
      </div>
    </Layout>
  );
}
