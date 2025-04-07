from rest_framework import serializers
from .models import Trip, DailyLog

class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = ['date', 'driving_hours', 'on_duty_hours', 'off_duty_hours', 'status', 'notes']
        read_only_fields = ['date', 'status']

class TripSerializer(serializers.ModelSerializer):
    logs = DailyLogSerializer(many=True, read_only=True)
    status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Trip
        fields = ['id', 'start_location', 'end_location', 'start_time', 
                'end_time', 'current_cycle_hours', 'status', 'logs']
        read_only_fields = ['id', 'start_time', 'end_time', 'status']