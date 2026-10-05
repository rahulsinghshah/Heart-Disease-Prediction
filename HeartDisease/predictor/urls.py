from django.urls import path
from .views import predict_api, form_view, health_check

urlpatterns = [
    path("", form_view, name="home"),
    path("predict/", predict_api, name="predict"),
    path("api/predict/", predict_api, name="api_predict"),
    path("api/health/", health_check, name="api_health"),
]
