from django.db import models

class Trip(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    current_cycle_hours = models.FloatField()
    status = models.CharField(max_length=20, choices=[
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Trip from {self.start_location} to {self.end_location}"

class DailyLog(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE)
    date = models.DateField()
    driving_hours = models.FloatField()
    on_duty_hours = models.FloatField()
    off_duty_hours = models.FloatField()
    status = models.CharField(max_length=20, choices=[
        ('compliant', 'Compliant'),
        ('violation', 'Violation')
    ])
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Log for {self.date} - {self.status}"
