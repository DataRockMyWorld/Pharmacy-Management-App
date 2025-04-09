from django.contrib import admin
from .models import Inventory, StockMovement, StockTransfer, InventoryVersion


# Register your models here.
@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'quantity', 'branch', 'batch_number', 'expiration_date', 'is_expired','threshold_quantity', 'received_by', 'last_checked']
    list_filter = ['branch']
    search_fields = ['product']
    list_per_page = 10
    

