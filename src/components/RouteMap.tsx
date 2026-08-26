/**
 * Interactive Leaflet Route Map
 * Visualizes origin, step-by-step stops, polylines, meeting participants, and midway points.
 */

import L from 'leaflet';
import { Layers, MapPin, Maximize2, Minimize2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Location, OptimizationResult, Participant, ScheduleItem } from '../types';

interface RouteMapProps {
  originLocation: Location;
  schedules: ScheduleItem[];
  optimizationResult: OptimizationResult | null;
  activeMeetingParticipants?: Participant[];
  activeMidwayPoint?: Location | null;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  originLocation,
  schedules,
  optimizationResult,
  activeMeetingParticipants,
  activeMidwayPoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [originLocation.lat, originLocation.lng],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Polylines whenever inputs change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds = L.latLngBounds([originLocation.lat, originLocation.lng], [originLocation.lat, originLocation.lng]);

    // 1. Add Origin Marker (Home)
    const homeIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="background-color: #1A1A1A; color: white; width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
          🏠
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([originLocation.lat, originLocation.lng], { icon: homeIcon })
      .bindPopup(`<b>출발지 / 귀가지</b><br/>${originLocation.name}`)
      .addTo(layerGroup);

    // 2. Add Schedule Stop Markers
    const orderedSchedules = optimizationResult?.orderedSchedules || schedules;

    orderedSchedules.forEach((item, index) => {
      bounds.extend([item.location.lat, item.location.lng]);
      const isFixed = item.type === 'fixed';
      const bgColor = isFixed ? '#E63946' : '#1A1A1A';

      const stopIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="background-color: ${bgColor}; color: white; width: 26px; height: 26px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; font-family: monospace; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
            ${index + 1}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker([item.location.lat, item.location.lng], { icon: stopIcon })
        .bindPopup(`
          <div style="font-size: 12px; font-family: sans-serif;">
            <b>${index + 1}. ${item.title}</b><br/>
            ${item.location.name}<br/>
            <span style="color: ${isFixed ? '#E63946' : '#1A1A1A'}; font-weight: bold; font-size: 11px;">
              ${isFixed ? `고정: ${item.fixedStartTime}` : '유연 일정'}
            </span>
          </div>
        `)
        .addTo(layerGroup);
    });

    // 3. Draw Route Polylines from optimization legs
    if (optimizationResult && optimizationResult.legs.length > 0) {
      const lineCoordinates: [number, number][] = [];

      optimizationResult.legs.forEach((leg) => {
        if (leg.pathCoordinates && leg.pathCoordinates.length > 0) {
          leg.pathCoordinates.forEach((coord) => lineCoordinates.push(coord));
        } else {
          lineCoordinates.push([leg.from.lat, leg.from.lng]);
          lineCoordinates.push([leg.to.lat, leg.to.lng]);
        }
      });

      if (lineCoordinates.length > 0) {
        L.polyline(lineCoordinates, {
          color: '#1A1A1A',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '4, 6',
        }).addTo(layerGroup);
      }
    }

    // 4. Draw Meeting Participants & Midway Point if active
    if (activeMeetingParticipants && activeMeetingParticipants.length > 0) {
      activeMeetingParticipants.forEach((p, idx) => {
        bounds.extend([p.origin.lat, p.origin.lng]);

        const pIcon = L.divIcon({
          className: 'custom-participant-marker',
          html: `
            <div style="background-color: #8C8273; color: white; width: 22px; height: 22px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white;">
              ${idx + 1}
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        L.marker([p.origin.lat, p.origin.lng], { icon: pIcon })
          .bindPopup(`<b>참여자: ${p.name}</b><br/>출발: ${p.origin.name}`)
          .addTo(layerGroup);

        if (activeMidwayPoint) {
          L.polyline(
            [
              [p.origin.lat, p.origin.lng],
              [activeMidwayPoint.lat, activeMidwayPoint.lng],
            ],
            { color: '#8C8273', weight: 2, dashArray: '3, 3', opacity: 0.7 }
          ).addTo(layerGroup);
        }
      });
    }

    // 5. Draw Midway Center Pin if present
    if (activeMidwayPoint) {
      bounds.extend([activeMidwayPoint.lat, activeMidwayPoint.lng]);

      const midIcon = L.divIcon({
        className: 'custom-midway-marker',
        html: `
          <div style="background-color: #2A9D8F; color: white; width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 0 12px rgba(42,157,143,0.6);">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([activeMidwayPoint.lat, activeMidwayPoint.lng], { icon: midIcon })
        .bindPopup(`<b>약속 중간지점 (공평 지점)</b><br/>${activeMidwayPoint.name}`)
        .addTo(layerGroup);
    }

    // Fit map bounds safely
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch {
      // Ignored
    }
  }, [originLocation, schedules, optimizationResult, activeMeetingParticipants, activeMidwayPoint]);

  return (
    <div
      className={`relative border border-[#E5E1DA] bg-[#FDFCFB] overflow-hidden shadow-xs transition-all ${
        isExpanded ? 'h-[500px]' : 'h-[280px] sm:h-[320px]'
      }`}
    >
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* Map Overlay Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1 border border-[#E5E1DA] shadow-2xs">
        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
            setIsExpanded(!isExpanded);
          }}
          className="p-1 text-[#1A1A1A] hover:bg-[#F9F8F6]"
          title={isExpanded ? '지도 축소' : '지도 확장'}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-2 left-2 z-20 flex flex-wrap items-center gap-2.5 bg-white/95 px-3 py-1.5 text-xs font-bold text-[#1A1A1A] backdrop-blur-xs border border-[#E5E1DA] shadow-2xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-[#1A1A1A]" />
          <span>출발지/집</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#E63946]">
          <span className="h-2.5 w-2.5 bg-[#E63946]" />
          <span>고정 일정</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#8C8273]">
          <span className="h-2.5 w-2.5 bg-[#1A1A1A]" />
          <span>유연 일정</span>
        </div>
        {activeMidwayPoint && (
          <div className="flex items-center gap-1.5 text-[#2A9D8F]">
            <span className="h-2.5 w-2.5 bg-[#2A9D8F]" />
            <span>약속 중간지점</span>
          </div>
        )}
      </div>
    </div>
  );
};
