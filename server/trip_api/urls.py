from django.urls import path
from .views import calculate_route, generate_logs

urlpatterns = [
    path('route/', calculate_route, name='calculate_route'),
    path('logs/', generate_logs, name='generate_logs'),
]