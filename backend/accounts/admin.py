from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import Customer

CustomUser = get_user_model()


class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = [
        "id",
        "email",
        "first_name",
        "last_name",
        "phone_number",
        "branch",
        "is_active",
        "is_superuser",
        "role",
    ]
    ordering = ["email"]
    search_fields = ["email", "first_name", "last_name", "phone_number"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone_number", "branch")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "phone_number", "branch", "is_active", "is_staff", "is_superuser"),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # When creating a new user
            if not obj.is_superuser:  # Only generate password for non-superusers
                password = self.model.objects.make_random_password()  # Generate a random password
                obj.set_password(password)
                obj.save()
                
                obj._password = password  # Set the password to be sent in the email
                self.model.objects.send_verification_email(obj)  # Send the email
            else:
                obj.set_password(form.cleaned_data["password1"])  # Allow superusers to set their own password
        super().save_model(request, obj, form, change)




class CustomerAdmin(admin.ModelAdmin):
    list_display = ['id', 'first_name', 'last_name', 'phone_number', 'email', 'created_at']
    search_fields = ['first_name', 'last_name', 'phone_number', 'email']
    list_per_page = 10
    
admin.site.register(Customer, CustomerAdmin)
admin.site.register(CustomUser, CustomUserAdmin)