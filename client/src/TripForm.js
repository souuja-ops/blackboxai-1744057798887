import { 
  Box, Button, Container, FormControl, InputLabel, 
  MenuItem, Select, TextField, Typography, 
  InputAdornment, CircularProgress, Snackbar,
  Alert, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { geocodeAddress } from './geocode';
import { useState } from 'react';
import { calculateRoute, generateLogs } from './apiService';
import { validateTripForm } from './validation';

function TripForm({ locations, setLocations, onRouteCalculated, tripId }) {
  const [formData, setFormData] = useState({
    cycleHours: 0,
    vehicleType: 'solo',
    tripDate: ''
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [hosSchedule, setHosSchedule] = useState([]);
  const [fuelStops, setFuelStops] = useState(0);

  const handleLocationBlur = (field) => {
    return async (e) => {
      const value = e.target.value;
      if (!value || !['pickup', 'dropoff'].includes(field)) return;

      try {
        setIsGeocoding(true);
        setErrors(prev => ({...prev, [field]: null}));
        const result = await geocodeAddress(value);
        
        if (result) {
          setLocations(prev => ({
            ...prev,
            [field]: {
              ...prev[field],
              ...result
            }
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            [field]: 'Could not find location'
          }));
        }
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          [field]: 'Geocoding service error'
        }));
      } finally {
        setIsGeocoding(false);
      }
    };
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({...prev, [field]: value}));
    setErrors(prev => ({...prev, [field]: null}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateTripForm({
      ...locations,
      ...formData
    });
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      
      const result = await calculateRoute({
        ...locations,
        ...formData
      });

      setHosSchedule(result.hos_schedule);
      setFuelStops(result.fuel_stops);
      onRouteCalculated(result);
      setSuccess('Route calculated successfully!');
      
    } catch (error) {
      setErrors({submit: error.message});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateLogs = async () => {
    if (!tripId) return;
    
    try {
      setIsSubmitting(true);
      setErrors({});
      await generateLogs(tripId);
      setSuccess('ELD logs generated successfully!');
    } catch (error) {
      setErrors({submit: error.message});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Trip Details
      </Typography>
      
      {errors.submit && (
        <Snackbar open={!!errors.submit} autoHideDuration={6000} onClose={() => setErrors({})}>
          <Alert severity="error">{errors.submit}</Alert>
        </Snackbar>
      )}
      
      {success && (
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
          <Alert severity="success">{success}</Alert>
        </Snackbar>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          required
          fullWidth
          label="Pickup Location"
          variant="outlined"
          value={locations.pickup?.address || locations.pickup || ''}
          onChange={(e) => setLocations(prev => ({
            ...prev,
            pickup: e.target.value
          }))}
          onBlur={handleLocationBlur('pickup')}
          error={!!errors.pickup}
          helperText={errors.pickup}
          disabled={isGeocoding}
          InputProps={{
            endAdornment: isGeocoding && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
        />
        
        <TextField
          required
          fullWidth
          label="Dropoff Location"
          variant="outlined"
          value={locations.dropoff?.address || locations.dropoff || ''}
          onChange={(e) => setLocations(prev => ({
            ...prev,
            dropoff: e.target.value
          }))}
          onBlur={handleLocationBlur('dropoff')}
          error={!!errors.dropoff}
          helperText={errors.dropoff}
          disabled={isGeocoding}
          InputProps={{
            endAdornment: isGeocoding && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
        />
        
        <TextField
          required
          fullWidth
          label="Current Cycle Used (Hours)"
          type="number"
          value={formData.cycleHours}
          onChange={handleChange('cycleHours')}
          error={!!errors.cycleHours}
          helperText={errors.cycleHours}
          inputProps={{ min: 0, max: 70 }}
          variant="outlined"
        />
        
        <TextField
          required
          fullWidth
          label="Trip Start Date"
          type="date"
          value={formData.tripDate}
          onChange={handleChange('tripDate')}
          error={!!errors.tripDate}
          helperText={errors.tripDate}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EventIcon />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
            shrink: true,
          }}
        />
        
        <FormControl fullWidth>
          <InputLabel>Vehicle Type</InputLabel>
          <Select 
            label="Vehicle Type"
            value={formData.vehicleType}
            onChange={handleChange('vehicleType')}
          >
            <MenuItem value="solo">Solo Driver</MenuItem>
            <MenuItem value="team">Team Drivers</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          type="submit" 
          variant="contained" 
          size="large"
          sx={{ mt: 2 }}
          disabled={isGeocoding || isSubmitting}
        >
          {isSubmitting ? 'Calculating...' : 'Calculate Route'}
        </Button>

        {tripId && (
          <Button 
            variant="outlined" 
            size="large"
            onClick={handleGenerateLogs}
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? 'Generating...' : 'Generate ELD Logs'}
          </Button>
        )}
      </Box>

      {hosSchedule.length > 0 && (
        <Paper elevation={3} sx={{ mt: 4, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            HOS Schedule (70hrs/8days)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Driving Hours</TableCell>
                  <TableCell>On Duty Hours</TableCell>
                  <TableCell>Cycle Remaining</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hosSchedule.map((day) => (
                  <TableRow key={day.day}>
                    <TableCell>{day.day}</TableCell>
                    <TableCell>{day.driving_hours}</TableCell>
                    <TableCell>{day.on_duty_hours}</TableCell>
                    <TableCell>{day.cycle_remaining}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {fuelStops > 0 && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <DirectionsCarIcon color="warning" sx={{ mr: 1 }} />
              <Typography>
                Fuel stops required: {fuelStops} (every 1000 km)
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}

export default TripForm;
