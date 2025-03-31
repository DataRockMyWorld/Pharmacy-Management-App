from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager
from sites.models import Site
from django.utils import timezone
from datetime import timedelta
from django.utils.crypto import get_random_string

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('CEO', 'CEO'),
        ('Admin', 'Admin'),
    )
    email = models.EmailField(max_length=255, unique=True, verbose_name='Email Address')
    role = models.CharField(max_length=100, choices=ROLE_CHOICES, default='Admin')
    first_name = models.CharField(max_length=100, verbose_name='First Name')
    last_name = models.CharField(max_length=100, verbose_name='Last Name')
    phone_number = models.CharField(max_length=15,)
    branch = models.ForeignKey(Site, on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(auto_now=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    reset_code = models.CharField(max_length=100, null=True, blank=True)
    reset_code_expiry = models.DateTimeField(null=True, blank=True
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    def __str__(self):
        return f'{self.first_name} ({self.role})'
    
    @property
    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'
    

    def generate_reset_code(self):
        """Generate a random code for password reset"""
        self.reset_code = get_random_string(length=32)
        self.reset_code_expiry = timezone.now() + timedelta(minutes=15)
        self.save()
        return self.reset_code
    
    
class Customer (models.Model):
    TITLE_CHOICES = [
        ('Mr', 'Mr'),
        ('Mrs', 'Mrs'),
        ('Miss', 'Miss'),
        ('Dr', 'Dr'),
    ]
    title = models.CharField(max_length=10, choices=TITLE_CHOICES, default='Mr')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.title} {self.first_name} {self.last_name}' if self.first_name else 'Anonymous'
    
    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'
    
    @property
    def total_sales(self):
        return self.sale_set.count()
    
    @property
    def total_amount(self):
        return sum(sale.total_amount for sale in self.sale_set.all())
    
    @property
    def last_purchase(self):
        return self.sale_set.last()
    
    @property
    def last_purchase_date(self):
        return self.last_purchase.date
    
    @property
    def last_purchase_amount(self):
        return self.last_purchase.total_amount
