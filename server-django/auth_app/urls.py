from django.urls import re_path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    re_path(r'^register/?$', views.register),
    re_path(r'^login/?$', views.login),
    re_path(r'^logout/?$', views.logout),
    re_path(r'^me/?$', views.me),
    re_path(r'^token/refresh/?$', TokenRefreshView.as_view()),
    re_path(r'^verify-email/?$', views.verify_email),
    re_path(r'^forgot-password/?$', views.forgot_password),
    re_path(r'^reset-password/?$', views.reset_password),
]
