import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Box, Typography, Paper } from '@mui/material';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

function MapView({ locations }) {
  const defaultPosition = [51.505, -0.09];
  const center = locations.pickup?.lat ? 
    [locations.pickup.lat, locations.pickup.lng] : 
    defaultPosition;
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (!locations.pickup?.lat || !locations.dropoff?.lat) return;

    const map = L.map('map');
    const control = L.Routing.control({
      waypoints: [
        L.latLng(locations.pickup.lat, locations.pickup.lng),
        L.latLng(locations.dropoff.lat, locations.dropoff.lng)
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{color: '#3a7bd5', opacity: 0.7, weight: 5}]
      }
    }).addTo(map);

    control.on('routesfound', (e) => {
      const routes = e.routes;
      const summary = routes[0].summary;
      setRouteInfo({
        distance: (summary.totalDistance / 1000).toFixed(1),
        time: (summary.totalTime / 60).toFixed(0)
      });
    });

    return () => {
      map.removeControl(control);
    };
  }, [locations.pickup, locations.dropoff]);

  return (
    <div style={{ position: 'relative' }}>
      {routeInfo && (
        <Paper 
          elevation={3} 
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            p: 2,
            minWidth: 200
          }}
        >
          <Typography variant="h6" gutterBottom>Route Summary</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Distance:</Typography>
            <Typography>{routeInfo.distance} km</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Duration:</Typography>
            <Typography>{routeInfo.time} mins</Typography>
          </Box>
        </Paper>
      )}
      
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '500px', width: '100%' }}
        whenCreated={(map) => { window.map = map }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.pickup?.lat && (
          <Marker position={[locations.pickup.lat, locations.pickup.lng]}>
            <Popup>{locations.pickup.address || 'Pickup Location'}</Popup>
          </Marker>
        )}
        {locations.dropoff?.lat && (
          <Marker position={[locations.dropoff.lat, locations.dropoff.lng]}>
            <Popup>{locations.dropoff.address || 'Dropoff Location'}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
