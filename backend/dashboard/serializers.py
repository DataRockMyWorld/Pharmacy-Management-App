from rest_framework import serializers
from sales.models import Sale
from inventory.models import Inventory
from accounts.models import Customer
from django.db.models import Sum

class StatisticsSerializer(serializers.Serializer):
    total_sales = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_customers = serializers.IntegerField()
    total_profits = serializers.DecimalField(max_digits=10, decimal_places=2)
    out_of_stock = serializers.IntegerField()

class MonthlySalesSerializer(serializers.Serializer):
    month = serializers.IntegerField()
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    

