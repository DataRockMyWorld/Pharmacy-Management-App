from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from .serializers import LoginSerializer, PasswordResetConfirmSerializer, LogoutUserSerializer, UserMeSerializer
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from rest_framework.permissions import AllowAny
from urllib.parse import unquote
import logging
from .models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)

class PasswordResetConfirmView(GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    throttle_classes = [AnonRateThrottle]  # Limit the number of requests to this endpoint

    def post(self, request, user_id, reset_code):
        logger.info(f"Password reset request received for user_id: {user_id}, reset_code: {reset_code}")

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            logger.error(f"User not found for user_id: {user_id}")
            return Response({"message": "Invalid User ID"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the reset code matches and is not expired
        if user.reset_code != reset_code or user.reset_code_expiry < timezone.now():
            logger.warning("Invalid or expired reset code.")
            return Response(
                {"message": "Invalid or expired reset code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                # Set new password
                user.set_password(serializer.validated_data['password'])
                user.reset_code = None  # Clear the reset code
                user.reset_code_expiry = None
                user.save()
                logger.info(f"Password reset successful for user: {user.email}")
                send_password_change_notification(user)
                return Response(
                    {"message": "Password reset successful. You can now log in."},
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                logger.error(f"Unexpected error during password reset: {str(e)}")
                return Response(
                    {"message": "An unexpected error occurred. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning(f"Password reset failed due to invalid data: {serializer.errors}")
        return Response(
            {"message": "Invalid data provided.", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
           
class LoginUserView(GenericAPIView):
    throttle_classes = [AnonRateThrottle]# Limit the number of requests to this endpoint
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    def post(self, request):
        logger.info(f"Login attempt from IP: {request.META.get('REMOTE_ADDR')}")
        serializer= self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        logger.info(f"Login successful for email: {serializer.validated_data.get('email')}")
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
    
class LogOutUserView(GenericAPIView):
    """
    Log out user
    """
    permission_classes = [AllowAny]
    serializer_class = LogoutUserSerializer

    def post(self, request):
        print("Received data:", request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_200_OK)
    

def send_password_change_notification(user):
    subject = "Password Changed"
    message = (
        f"Hello {user.first_name},\n\n"
        f"Your password has been successfully changed. If you did not initiate this change, please contact support immediately.\n\n"
        f"Thank you."
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print(f"DEBUG: user = {request.user}")
        print(f"DEBUG: user.is_authenticated = {request.user.is_authenticated}")
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)