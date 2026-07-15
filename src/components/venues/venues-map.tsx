"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type VenueMapPoint = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  image: string;
  latitude: number;
  longitude: number;
};

function createVenueImageIcon(image: string) {
  return L.divIcon({
    className: "venue-image-marker",
    html: `
      <div class="venue-image-marker__pin">
        <div class="venue-image-marker__photo">
          <img src="${image}" alt="" loading="lazy" />
        </div>
        <div class="venue-image-marker__pointer"></div>
      </div>
    `,
    iconSize: [56, 66],
    iconAnchor: [28, 66],
    popupAnchor: [0, -68],
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [56, 56], maxZoom: 14 });
  }, [map, positions]);

  return null;
}

interface VenuesMapProps {
  venues: VenueMapPoint[];
}

export function VenuesMap({ venues }: VenuesMapProps) {
  const positions = venues.map(
    (venue) => [venue.latitude, venue.longitude] as [number, number]
  );
  const center = positions[0] ?? [-1.2724, 36.8154];
  const icons = useMemo(
    () => new Map(venues.map((venue) => [venue.id, createVenueImageIcon(venue.image)])),
    [venues]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="z-0 h-[320px] w-full sm:h-[440px] lg:h-[520px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            position={[venue.latitude, venue.longitude]}
            icon={icons.get(venue.id)!}
          >
            <Popup className="venue-map-popup" minWidth={240} maxWidth={280}>
              <div className="venue-map-popup__content">
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="venue-map-popup__image"
                />
                <p className="venue-map-popup__title">{venue.name}</p>
                <p className="venue-map-popup__address">
                  {venue.address}, {venue.city}
                </p>
                <div className="venue-map-popup__links">
                  <a
                    href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                  </a>
                  <Link href={`/venues/${venue.slug}`}>View venue details</Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
