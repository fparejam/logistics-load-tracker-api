import { Layout } from "@/components/layout";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Vite only exposes variables prefixed with VITE_
const accessToken = (import.meta as any).env?.VITE_MAPBOX_API_TOKEN as string | undefined;

export default function AcmeMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    // Debug token visibility in dev
    // eslint-disable-next-line no-console
    console.log("[Map] VITE_MAPBOX_API_TOKEN present:", Boolean(accessToken));
    if (!containerRef.current || mapRef.current) return;
    // eslint-disable-next-line no-console
    console.log("[Map] container size", containerRef.current.clientWidth, containerRef.current.clientHeight);
    if (accessToken) {
      mapboxgl.accessToken = accessToken;
    }
    // Ensure container is empty (React StrictMode can double-mount)
    try {
      containerRef.current.innerHTML = "";
    } catch {}
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [-97.5, 39.8],
      zoom: 3,
      attributionControl: true,
      projection: "globe",
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ unit: "imperial" }), "bottom-left");
    map.on("style.load", () => {
      map.setFog({});
      // Some environments need an explicit resize after mount
      setTimeout(() => map.resize(), 0);
    });
    map.on("error", (e) => {
      // eslint-disable-next-line no-console
      console.error("[Map] runtime error:", e?.error || e);
    });
    mapRef.current = map;
    return () => {
      try {
        map.remove();
      } finally {
        mapRef.current = null;
        if (containerRef.current) containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <Layout>
      <div className="flex flex-col flex-1 w-full">
        <div className="flex-1 px-4 sm:px-6 lg:px-8">
          <div
            ref={containerRef}
            className="w-full mt-2 rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            style={{ height: "75vh" }}
          />
        </div>
      </div>
    </Layout>
  );
}


