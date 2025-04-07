import { useState } from 'react';
import { Container, CssBaseline } from '@mui/material';
import TripForm from './TripForm';
import MapView from './MapView';

function App() {
  const [locations, setLocations] = useState({
    pickup: null,
    dropoff: null
  });
  const [routeData, setRouteData] = useState(null);
  const [fuelStops, setFuelStops] = useState(0);
  const [hosSchedule, setHosSchedule] = useState([]);
  const [tripId, setTripId] = useState(null);

  const handleRouteCalculated = (data) => {
    setRouteData(data.route);
    setFuelStops(data.fuel_stops);
    setHosSchedule(data.hos_schedule);
    setTripId(data.trip.id);
  };

  return (
    <Container maxWidth="lg">
      <CssBaseline />
      <TripForm 
        locations={locations} 
        setLocations={setLocations}
        onRouteCalculated={handleRouteCalculated}
        tripId={tripId}
      />
      {routeData && (
        <MapView 
          locations={locations} 
          routeData={routeData}
          fuelStops={fuelStops}
          hosSchedule={hosSchedule}
        />
      )}
    </Container>
  );
}

export default App;
