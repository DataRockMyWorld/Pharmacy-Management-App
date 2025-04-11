from django.urls import path
from .views import PasswordResetConfirmView, LogOutUserView, MeAPIView, UserListCreateAPIView, UserDetailAPIView

urlpatterns = [
    path('password-reset-confirm/<int:user_id>/<str:reset_code>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('logout/', LogOutUserView.as_view(), name='logout'),
    path('user/me/', MeAPIView.as_view(), name='current_user'),
    path('users/', UserListCreateAPIView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserDetailAPIView.as_view(), name='user-detail'),
    
]
