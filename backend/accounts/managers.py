from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils.translation import gettext_lazy as _
from django.utils.http import urlsafe_base64_encode
from urllib.parse import quote
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
import logging

logger = logging.getLogger(__name__)

class UserManager(BaseUserManager):
    
    def email_validator(self, email):
        """Validate the email address."""
        try:
            validate_email(email)
        except ValidationError:
            raise ValidationError(_('The Email field must be a valid email address'))

    def create_user(self, email, first_name, last_name, phone_number, password=None, **extra_fields):
        """Create and save a regular user with the given email, name, phone number, and password."""
        if not email:
            raise ValueError(_('The Email field must be set'))
        else:
            email = self.normalize_email(email)
            self.email_validator(email)
        if not first_name:
            raise ValueError(_('The First Name field must be set'))
        if not last_name:
            raise ValueError(_('The Last Name field must be set'))
        if not phone_number:
            raise ValueError(_('The Phone Number field must be set'))
        
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            **extra_fields
        )

        # Generate a random password for the user if it's not a superuser creation
        if not extra_fields.get('is_superuser', False):
            password = get_random_string(length=12)
            user.set_password(password)
            user.save(using=self._db)
            self.send_verification_email(user)  # Trigger email to allow user to set their own password
        else:
            # This block is for creating superusers
            raise ValueError(_('Regular users cannot have password set by superusers'))
        
        return user

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        """Create and save a superuser with the given email, name, phone number, and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'CEO')
        
        if not password:
            raise ValueError(_('Superusers must have a password.'))

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        user = self.model (
            email=self.normalize_email(email),
            first_name=first_name,
            last_name=last_name,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def send_verification_email(self, user):
        """Send a verification email to the user with a password reset link."""
        try:
            reset_code = user.generate_reset_code()
            print(f"Generated Code: {reset_code}")
            reset_url = f"http://127.0.0.1:8000/api/v1/password-reset-confirm/{user.pk}/{reset_code}/"

            logger.info(f"Generated Token: {reset_code}")
            logger.info(f"Generated UID: {user.pk}")

            subject = "Account Created - Set Your Password"
            message = (
                f"Hello {user.first_name},\n\n"
                f"Your account has been created. Please set your password by clicking the link below:\n\n"
                f"{reset_url}\n\n"
                f"Thank you."
            )
            

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            raise