import { useEffect, useRef, useState } from 'react';
import type { Project, GISFeature } from '@/mock/interfaces';

interface GoogleMapProps {
  projects: Project[];
  gisFeatures: GISFeature[];
  apiKey?: string;
}

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export const GoogleMap = ({ projects, gisFeatures, apiKey }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey || 'YOUR_API_KEY'}&libraries=places,drawing`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) return;

    // Center map on India (approximate center)
    const indiaCenter = { lat: 20.5937, lng: 78.9629 };

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: indiaCenter,
      zoom: 5,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_RIGHT,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
      streetViewControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP,
      },
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setMap(googleMap);

    // Fit bounds to show all projects
    if (projects.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      projects.forEach((project) => {
        bounds.extend(new window.google.maps.LatLng(project.location.lat, project.location.lng));
      });

      gisFeatures.forEach((feature) => {
        if (feature.geometry.type === 'Point') {
          const pointCoords = feature.geometry.coordinates[0] as number[];
          const [lng, lat] = pointCoords;
          bounds.extend(new window.google.maps.LatLng(lat, lng));
        }
      });

      if (projects.length > 0 || gisFeatures.length > 0) {
        googleMap.fitBounds(bounds);
        // Add padding
        googleMap.setOptions({
          zoom: googleMap.getZoom()! > 10 ? googleMap.getZoom()! - 1 : googleMap.getZoom(),
        });
      }
    }
  }, [isLoaded, projects, gisFeatures]);

  // Add project markers
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Add project markers
    projects.forEach((project) => {
      const marker = new window.google.maps.Marker({
        position: { lat: project.location.lat, lng: project.location.lng },
        map,
        title: project.name,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #0f172a;">${project.name}</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">${project.description}</p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Status:</strong> ${project.status}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Progress:</strong> ${project.progress}%</p>
              <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Manager:</strong> ${project.manager}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Location:</strong> ${project.location.address}</p>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    // Add GIS feature markers
    gisFeatures.forEach((feature) => {
      if (feature.geometry.type === 'Point') {
        const pointCoords = feature.geometry.coordinates[0] as unknown as number[];
        const [lng, lat] = pointCoords;

        const iconColor = 
          feature.type === 'Project Site' ? 'red' :
          feature.type === 'Utility' ? 'blue' :
          feature.type === 'Infrastructure' ? 'green' :
          'orange';

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: feature.properties.name,
          icon: {
            url: `http://maps.google.com/mapfiles/ms/icons/${iconColor}-dot.png`,
            scaledSize: new window.google.maps.Size(32, 32),
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #0f172a;">${feature.properties.name}</h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">${feature.properties.description}</p>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Type:</strong> ${feature.type}</p>
                ${feature.properties.projectId ? `<p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Project ID:</strong> ${feature.properties.projectId}</p>` : ''}
              </div>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      } else if (feature.geometry.type === 'Polygon') {
        const polygonCoords = feature.geometry.coordinates[0] as unknown as number[][];
        const paths = polygonCoords.map((coord: number[]) => {
          const [lng, lat] = coord;
          return { lat, lng };
        });

        const polygon = new window.google.maps.Polygon({
          paths,
          strokeColor: '#0284c7',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#0284c7',
          fillOpacity: 0.35,
          map,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #0f172a;">${feature.properties.name}</h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">${feature.properties.description}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Type:</strong> ${feature.type}</p>
            </div>
          `,
        });

        polygon.addListener('click', (event: google.maps.PolyMouseEvent) => {
          infoWindow.setPosition(event.latLng!);
          infoWindow.open(map);
        });
      } else if (feature.geometry.type === 'LineString') {
        const lineCoords = feature.geometry.coordinates as number[][];
        const path = lineCoords.map((coord: number[]) => {
          const [lng, lat] = coord;
          return { lat, lng };
        });

        const polyline = new window.google.maps.Polyline({
          path,
          strokeColor: '#f97316',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #0f172a;">${feature.properties.name}</h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">${feature.properties.description}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Type:</strong> ${feature.type}</p>
            </div>
          `,
        });

        polyline.addListener('click', (event: google.maps.PolyMouseEvent) => {
          infoWindow.setPosition(event.latLng!);
          infoWindow.open(map);
        });
      }
    });

    setMarkers(newMarkers);
  }, [map, projects, gisFeatures]);

  if (!isLoaded) {
    return (
      <div className="h-[600px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
          {!apiKey && (
            <p className="text-sm text-amber-600 mt-2">
              Please configure VITE_GOOGLE_MAPS_API_KEY in your .env file
            </p>
          )}
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="h-[600px] w-full rounded-lg" />;
};

