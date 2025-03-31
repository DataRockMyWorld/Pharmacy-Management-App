from django.contrib import admin
from .models import Product

# Register your models here.
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "category", "unit_price", "manufacturer", "description"]  # Adds these fields to the list display
    list_filter = ["category", "manufacturer"]  # Adds filtering options in the sidebar
    search_fields = ["name", "category", "manufacturer__name"]  # Adds a search box for these fields
    ordering = ["name"]  # Orders the list by product name
    list_per_page = 20  # Limits the number of items displayed per page



