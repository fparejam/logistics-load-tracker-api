import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Vite only exposes variables prefixed with VITE_
const accessToken = (import.meta as any)?.env?.VITE_MAPBOX_API_TOKEN as string | undefined;

interface LoadsMapProps {
  className?: string;
  height?: string;
  filters?: {
    startDate?: string;
    endDate?: string;
    equipment?: string;
    agent_name?: string;
    outcome_tag?: string;
  };
}

// Layer group definitions - each group can contain multiple layer IDs
const LAYER_GROUPS = {
  loads: ["loads-clusters", "loads-cluster-count", "loads-unclustered"],
  routes: ["loads-routes"],
} as const;

type LayerGroupId = keyof typeof LAYER_GROUPS;

// Helper function to add loads layers to the map
const addLoadsLayers = (map: mapboxgl.Map) => {
  // Clusters layer
  if (!map.getLayer("loads-clusters")) {
    map.addLayer({
      id: "loads-clusters",
      type: "circle",
      source: "loads",
      filter: ["has", "point_count"],
      layout: { visibility: "none" },
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6",
          10, "#f1f075",
          30, "#f28cb1",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20,
          10, 30,
          30, 40,
        ],
        "circle-emissive-strength": 1,
      },
    });
  }

  // Cluster count labels
  if (!map.getLayer("loads-cluster-count")) {
    map.addLayer({
      id: "loads-cluster-count",
      type: "symbol",
      source: "loads",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
        visibility: "none",
      },
    });
  }

  // Unclustered points
  if (!map.getLayer("loads-unclustered")) {
    map.addLayer({
      id: "loads-unclustered",
      type: "circle",
      source: "loads",
      filter: ["!", ["has", "point_count"]],
      layout: { visibility: "none" },
      paint: {
        "circle-color": [
          "match",
          ["get", "equipment"],
          "dry_van", "#10b981",
          "reefer", "#f59e0b",
          "flatbed", "#8b5cf6",
          "#11b4da",
        ],
        "circle-radius": 6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
        "circle-emissive-strength": 1,
      },
    });
  }
};

export function LoadsMap({ className = "", height = "75vh", filters = {} }: LoadsMapProps) {
  // Always log - even in production (helps debug)
  if (typeof window !== 'undefined') {
    window.__MAP_DEBUG__ = { initialized: true, timestamp: new Date().toISOString() };
  }
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  const loadsGeo = useQuery(api.map_points.getMapLoadsPoints, {
    start_date: filters.startDate,
    end_date: filters.endDate,
    equipment: filters.equipment,
    agent_name: filters.agent_name,
    outcome_tag: filters.outcome_tag,
  });
  const routesData = useQuery(api.geo_points.getLoadsRoutes, {
    start_date: filters.startDate,
    end_date: filters.endDate,
    equipment: filters.equipment,
    agent_name: filters.agent_name,
    outcome_tag: filters.outcome_tag,
  });
  const emptyGeo = { type: "FeatureCollection", features: [] } as const;
  
  const [activeLayerGroups, setActiveLayerGroups] = useState<LayerGroupId[]>(["loads"]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isClustering, setIsClustering] = useState(false);
  const [routesGeo, setRoutesGeo] = useState<{
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      properties: {
        load_id: string;
        equipment_type?: string;
        loadboard_rate?: number;
        miles?: number;
      };
      geometry: {
        type: "LineString";
        coordinates: Array<[number, number]>;
      };
    }>;
  }>({ type: "FeatureCollection", features: [] });

  // Fetch driving routes from Mapbox Directions API
  useEffect(() => {
    if (!routesData || !Array.isArray(routesData) || routesData.length === 0) {
      setRoutesGeo({ type: "FeatureCollection", features: [] });
      return;
    }

    if (!accessToken) {
      return;
    }

    // Fetch routes from Mapbox Directions API
    const fetchRoutes = async () => {
      const routeFeatures: Array<{
        type: "Feature";
        properties: {
          load_id: string;
          equipment_type?: string;
          loadboard_rate?: number;
          miles?: number;
        };
        geometry: {
          type: "LineString";
          coordinates: Array<[number, number]>;
        };
      }> = [];

      // Process routes in batches to avoid overwhelming the API
      for (const route of routesData) {
        try {
          const coords = `${route.origin.lng},${route.origin.lat};${route.destination.lng},${route.destination.lat}`;
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${accessToken}&geometries=geojson`;
          
          const response = await fetch(url);
          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          if (data.code === "Ok" && data.routes?.[0]?.geometry) {
            const geometry = data.routes[0].geometry;
            routeFeatures.push({
              type: "Feature",
              properties: {
                load_id: route.load_id,
                equipment_type: route.equipment_type,
                loadboard_rate: route.loadboard_rate,
                miles: route.miles,
              },
              geometry: {
                type: "LineString",
                coordinates: geometry.coordinates as Array<[number, number]>,
              },
            });
          }
        } catch (err) {
          // Silently skip failed routes
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setRoutesGeo({
        type: "FeatureCollection",
        features: routeFeatures,
      } as const);
    };

    fetchRoutes();
  }, [routesData, accessToken]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    // Get token - try multiple ways since Fly.io might obfuscate in console
    const tokenValue = import.meta.env.VITE_MAPBOX_API_TOKEN || (import.meta as any).env?.VITE_MAPBOX_API_TOKEN;
    
    // Debug info (available even if console is stripped)
    const debugInfo = {
      hasToken: !!tokenValue,
      tokenLength: tokenValue ? tokenValue.length : 0,
      tokenPreview: tokenValue ? tokenValue.substring(0, 10) + '...' : 'none',
    };
    
    if (typeof window !== 'undefined') {
      (window as any).__MAP_TOKEN_DEBUG__ = debugInfo;
    }
    
    // Check if token exists (even if it appears empty in console due to obfuscation)
    if (!tokenValue || tokenValue.trim() === '') {
      // Set debug error
      if (typeof window !== 'undefined') {
        (window as any).__MAP_ERROR__ = 'Token missing or empty';
      }
      return;
    }
    
    // Set token even if console shows it as empty (Fly.io may obfuscate)
    try {
      mapboxgl.accessToken = tokenValue;
      
      // Verify token is set
      if (!mapboxgl.accessToken || mapboxgl.accessToken === '') {
        if (typeof window !== 'undefined') {
          (window as any).__MAP_ERROR__ = 'Failed to set Mapbox token';
        }
        return;
      }
      
      if (typeof window !== 'undefined') {
        (window as any).__MAP_DEBUG__.tokenSet = true;
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        (window as any).__MAP_ERROR__ = `Error setting token: ${err}`;
      }
      return;
    }
    
    // Ensure container is empty
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
    
    const map = new mapboxgl.Map({
      container: containerRef.current!,
      style: "mapbox://styles/mapbox/standard",
      center: [-97.5, 39.8],
      zoom: 3,
      attributionControl: true,
      projection: "globe",
    });
    
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ unit: "imperial" }), "bottom-left");
    
    map.on("load", () => {
      try {
        map.setFog({});
        setTimeout(() => map.resize(), 0);
        
        // Start with empty data - the update effect will populate it when loadsGeo arrives
        map.addSource("loads", {
          type: "geojson",
          generateId: true,
          data: emptyGeo as any,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
        
        // Add loads layers
        addLoadsLayers(map);
        
        // Inspect a cluster on click
        map.on("click", "loads-clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["loads-clusters"],
          });
          if (features.length === 0) return;
          
          const clusterId = features[0].properties?.cluster_id;
          if (typeof clusterId !== "number") return;
          
          const source = map.getSource("loads") as mapboxgl.GeoJSONSource;
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || !zoom) return;
            
            const geometry = features[0].geometry as GeoJSON.Point;
            map.easeTo({
              center: geometry.coordinates as [number, number],
              zoom: zoom,
            });
          });
        });
        
        // Cursor pointer on hover for clusters
        map.on("mouseenter", "loads-clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        
        map.on("mouseleave", "loads-clusters", () => {
          map.getCanvas().style.cursor = "";
        });
        
        // Cursor pointer on hover for unclustered points
        map.on("mouseenter", "loads-unclustered", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        
        map.on("mouseleave", "loads-unclustered", () => {
          map.getCanvas().style.cursor = "";
        });
        
        // Add routes source and layer (renders below points)
        const routesDataForMap = routesGeo && typeof routesGeo === 'object' && 'type' in routesGeo && 'features' in routesGeo
          ? routesGeo
          : emptyGeo;
        
        // Add routes source
        if (!map.getSource("loads-routes")) {
          map.addSource("loads-routes", {
            type: "geojson",
            data: routesDataForMap as any,
          });
        }
        
        if (!map.getLayer("loads-routes")) {
          map.addLayer({
          id: "loads-routes",
          type: "line",
          source: "loads-routes",
          layout: {
            visibility: "none", // Hidden by default
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": [
              "match",
              ["get", "equipment_type"],
              "dry_van", "#10b981",
              "reefer", "#f59e0b",
              "flatbed", "#8b5cf6",
              "#64748b",
            ],
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              3, 1.5,
              6, 2.5,
              9, 4,
            ],
            "line-opacity": 0.7,
          },
        });
        }
        
        setMapLoaded(true);
      } catch (err) {
        // Silently fail map initialization
      }
    });
    
    map.on("error", (e) => {
      // Log map errors for debugging
      console.error("[LoadsMap] Mapbox error:", e.error);
    });
    
    mapRef.current = map;
    
    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } finally {
        mapRef.current = null;
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
      }
    };
  }, []);
  
  // Update loads data when query completes or map becomes ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) {
      return;
    }
    
    // Wait for source to be created (happens in map 'load' event)
    const source = map.getSource("loads") as mapboxgl.GeoJSONSource | undefined;
    if (!source) {
      // If source doesn't exist yet, create it with layers
      try {
        const loadsData = loadsGeo && typeof loadsGeo === 'object' && 'type' in loadsGeo && 'features' in loadsGeo
          ? loadsGeo
          : emptyGeo;
        map.addSource("loads", {
          type: "geojson",
          generateId: true,
          data: loadsData as any,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
        addLoadsLayers(map);
        return; // Source created, wait for next render to update data
      } catch (err) {
        return;
      }
    }
    
    const loadsData = loadsGeo && typeof loadsGeo === 'object' && 'type' in loadsGeo && 'features' in loadsGeo
      ? loadsGeo
      : emptyGeo;
    
    const featureCount = loadsData.features?.length || 0;
    
    // Show loading indicator for large datasets (clustering takes time)
    if (featureCount > 100) {
      setIsClustering(true);
    }
    
    // Debounce updates to batch rapid changes
    const timeoutId = setTimeout(() => {
      try {
        source.setData(loadsData as any);
        
        // Hide loading indicator after clustering completes
        if (featureCount > 100) {
          setTimeout(() => setIsClustering(false), 500);
        }
      } catch (err) {
        setIsClustering(false);
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [loadsGeo, mapLoaded]);

  // Update routes data when routesGeo changes
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("loads-routes") as mapboxgl.GeoJSONSource | undefined;
    if (!map || !source) {
      return;
    }
    
    const routesDataForMap = routesGeo && typeof routesGeo === 'object' && 'type' in routesGeo && 'features' in routesGeo
      ? routesGeo
      : emptyGeo;
    
    // Update routes source data
    try {
      source.setData(routesDataForMap as any);
    } catch (err) {
      // Silently fail
    }
  }, [routesGeo]);

  // Toggle layer visibility based on activeLayerGroups
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;
    const allLayerGroupIds = Object.keys(LAYER_GROUPS) as LayerGroupId[];

    allLayerGroupIds.forEach((groupId) => {
      const layerIds = LAYER_GROUPS[groupId];
      const isActive = activeLayerGroups.includes(groupId);
      
      layerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", isActive ? "visible" : "none");
        }
      });
    });
  }, [activeLayerGroups, mapLoaded]);

  const handleLayerToggle = (groupId: LayerGroupId) => {
    if (activeLayerGroups.includes(groupId)) {
      setActiveLayerGroups(activeLayerGroups.filter((id) => id !== groupId));
    } else {
      setActiveLayerGroups([...activeLayerGroups, groupId]);
    }
  };

  const layerLabels: Record<LayerGroupId, string> = {
    loads: "Loads",
    routes: "Routes",
  };

  const routesActive = activeLayerGroups.includes("routes");

  return (
    <div className="relative w-full">
      {/* Right side controls container */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {/* Layer Toggle Menu */}
        <div className="bg-white rounded-md border border-gray-300 shadow-lg min-w-[120px] overflow-hidden">
          {(Object.keys(LAYER_GROUPS) as LayerGroupId[]).map((groupId, index) => {
            const isActive = activeLayerGroups.includes(groupId);
            const isFirst = index === 0;
            const isLast = index === (Object.keys(LAYER_GROUPS).length - 1);
            
            return (
              <button
                key={groupId}
                id={groupId}
                onClick={() => handleLayerToggle(groupId)}
                className={`
                  block w-full px-4 py-2 text-sm text-center border-none cursor-pointer
                  transition-colors
                  ${isFirst ? "rounded-t-md" : ""}
                  ${isLast ? "rounded-b-md" : ""}
                  ${index > 0 ? "border-t border-gray-200" : ""}
                  ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                {layerLabels[groupId]}
              </button>
            );
          })}
        </div>

        {/* Routes Legend - Shows when routes layer is active */}
        {routesActive && (
          <div className="bg-white rounded-md border border-gray-300 shadow-lg p-3 min-w-[140px]">
            <div className="text-xs font-semibold text-gray-700 mb-2">Route Colors</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5" style={{ backgroundColor: "#10b981" }}></div>
                <span className="text-xs text-gray-600">Dry Van</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5" style={{ backgroundColor: "#f59e0b" }}></div>
                <span className="text-xs text-gray-600">Reefer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5" style={{ backgroundColor: "#8b5cf6" }}></div>
                <span className="text-xs text-gray-600">Flatbed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator for heatmap */}
      {isClustering && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white/90 rounded-lg px-4 py-2 shadow-lg border border-gray-300">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-gray-700">Loading clusters...</span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={containerRef}
        className={`w-full rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
        style={{ height }}
      />
    </div>
  );
}

