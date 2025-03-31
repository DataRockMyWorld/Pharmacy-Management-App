from django.contrib import admin
from .models import Inventory, StockMovement, StockTransfer, InventoryVersion


# Register your models here.
@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'quantity', 'branch', 'batch_number', 'expiration_date', 'is_expired','threshold_quantity', 'received_by', 'last_checked']
    list_filter = ['branch']
    search_fields = ['product']
    list_per_page = 10
    
    
@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'branch', 'movement_type', 'quantity', 'date']
    list_filter = ['branch', 'movement_type']
    search_fields = ['product']
    list_per_page = 10
    
@admin.register(StockTransfer)
class StockTransferAdmin(admin.ModelAdmin):
    list_display = ['id', 'from_branch', 'to_branch', 'product', 'quantity', 'transfer_date', 'approved', 'approved_by', 'transfer_status', 'received']
    list_filter = ['from_branch', 'to_branch', 'product']
    search_fields = ['product']
    list_per_page = 10
    
@admin.register(InventoryVersion)
class InventoryVersionAdmin(admin.ModelAdmin):
    list_display = ['id', 'inventory']
    list_per_page = 10

