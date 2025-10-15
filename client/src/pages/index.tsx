import { Layout } from "@/components/layout";

export default function Index() {
  return (
    <Layout>
      <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full gap-4 items-center justify-center">
        <h1 className="text-2xl text-foreground">
          The agent is working on your app
        </h1>
      </div>
    </Layout>
  );
}
