from django.http import JsonResponse, FileResponse
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Trip, DailyLog
from .serializers import TripSerializer, DailyLogSerializer
import requests
import json
from datetime import datetime, timedelta
from weasyprint import HTML
from django.template.loader import render_to_string
from django.conf import settings

ORS_API_KEY = getattr(settings, 'ORS_API_KEY', 'your-key-here')

def calculate_hos_schedule(trip_duration, current_cycle_hours):
    MAX_CYCLE = 70  # 70 hours in 8 days
    MAX_DAILY = 14   # 14 hours on duty
    MAX_DRIVING = 11 # 11 hours driving
    
    days = []
    remaining_hours = trip_duration
    cycle_used = current_cycle_hours
    day_count = 1
    
    while remaining_hours > 0 and day_count <= 8:
        available_hours = min(MAX_CYCLE - cycle_used, MAX_DAILY)
        driving_hours = min(MAX_DRIVING, available_hours, remaining_hours)
        
        days.append({
            'day': day_count,
            'driving_hours': driving_hours,
            'on_duty_hours': min(driving_hours + 3, MAX_DAILY),  # Include 3 hrs for pickup/dropoff
            'cycle_remaining': MAX_CYCLE - (cycle_used + driving_hours)
        })
        
        remaining_hours -= driving_hours
        cycle_used += driving_hours
        day_count += 1
    
    return days

@api_view(['POST'])
def calculate_route(request):
    try:
        data = request.data
        required_fields = ['start', 'end', 'cycle_hours']
        if not all(field in data for field in required_fields):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Call OpenRouteService API
        try:
            response = requests.get(
                'https://api.openrouteservice.org/v2/directions/driving-car',
                params={
                    'api_key': ORS_API_KEY,
                    'start': f"{data['start']['lng']},{data['start']['lat']}",
                    'end': f"{data['end']['lng']},{data['end']['lat']}"
                },
                timeout=10
            )
            response.raise_for_status()
            route_data = response.json()
        except requests.RequestException as e:
            return Response(
                {'error': f'Routing service error: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Calculate trip duration in hours
        duration_seconds = route_data['features'][0]['properties']['segments'][0]['duration']
        duration_hours = duration_seconds / 3600
        
        # Calculate HOS schedule
        hos_schedule = calculate_hos_schedule(
            duration_hours,
            float(data['cycle_hours'])
        )
        
        # Create Trip record
        try:
            user = User.objects.get(id=1)  # Temp user
            trip = Trip.objects.create(
                user=user,
                start_location=f"{data['start']['lat']},{data['start']['lng']}",
                end_location=f"{data['end']['lat']},{data['end']['lng']}",
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(seconds=duration_seconds),
                current_cycle_hours=float(data['cycle_hours']),
                status='planned',
                distance_km=route_data['features'][0]['properties']['segments'][0]['distance']/1000
            )
            
            # Create DailyLog records
            logs = []
            for day in hos_schedule:
                log = DailyLog.objects.create(
                    trip=trip,
                    date=(trip.start_time + timedelta(days=day['day']-1)).date(),
                    driving_hours=day['driving_hours'],
                    on_duty_hours=day['on_duty_hours'],
                    off_duty_hours=24 - day['on_duty_hours'],
                    status='compliant',
                    notes=f"Day {day['day']} - {day['driving_hours']} hrs driving"
                )
                logs.append(log)
            
            serializer = TripSerializer(trip)
            return Response({
                'route': route_data,
                'trip': serializer.data,
                'hos_schedule': hos_schedule,
                'fuel_stops': int(trip.distance_km / 1000)  # Every 1000 km
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Trip creation failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def generate_logs(request):
    try:
        if 'trip_id' not in request.data:
            return Response(
                {'error': 'trip_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        trip = Trip.objects.get(id=request.data['trip_id'])
        logs = DailyLog.objects.filter(trip=trip).order_by('date')
        
        # Generate PDF with fuel stop reminders
        try:
            context = {
                'logs': logs,
                'fuel_stops': int(trip.distance_km / 1000),
                'trip': trip
            }
            html_string = render_to_string('eld_log_template.html', context)
            pdf_file = HTML(string=html_string).write_pdf()
            
            response = FileResponse(pdf_file, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="eld_logs_trip_{trip.id}.pdf"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'PDF generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Trip.DoesNotExist:
        return Response(
            {'error': 'Trip not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
