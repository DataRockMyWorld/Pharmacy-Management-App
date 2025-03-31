from django.urls import path
from .views import PasswordResetConfirmView, LogOutUserView, MeAPIView

urlpatterns = [
    path('password-reset-confirm/<int:user_id>/<str:reset_code>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('logout/', LogOutUserView.as_view(), name='logout'),
    path('user/me/', MeAPIView.as_view(), name='current_user'),
    
]
