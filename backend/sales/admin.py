from django.contrib import admin
from .models import Sale, SaleItem

# Register your models here.
@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['id', 'date', 'customer', 'total_amount', 'payment_method', 'processed_by', 'receipt_sent', 'email_status', 'sms_status']
    list_filter = ['customer', 'payment_method']
    search_fields = ['customer']
    list_per_page = 10
    
@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'sale', 'product', 'quantity', 'price_at_sale']
    list_filter = ['sale', 'product']
    search_fields = ['product']
    list_per_page = 10