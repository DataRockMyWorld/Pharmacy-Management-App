from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Customer
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import ExtractMonth
from rest_framework import generics
from sales.models import Sale
from apis.serializers import SaleSerializer, InventorySerializer
from django.db.models import Q
from inventory.models import Inventory
from apis.utils import get_or_set_cache
from django.core.cache import cache
from dashboard.serializers import StatisticsSerializer, MonthlySalesSerializer
from sites.models import Site
from django.shortcuts import get_object_or_404

class SalesStatisticsAPIView(APIView):
    def get(self, request):
        user = request.user
        branch_id = request.query_params.get('branch')

        branch = None
        if user.role == 'CEO' and branch_id:
            branch = Site.objects.filter(id=branch_id).first()
        elif user.role != 'CEO':
            branch = user.branch

        cache_key = f"statistics_{user.role}_{branch.id if branch else 'all'}"

        def fetch_statistics():
            if user.role == 'CEO' and not branch_id:
                total_sales = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
                total_customers = Customer.objects.count()
                total_profits = total_sales
                out_of_stock = Inventory.objects.filter(quantity=0).count()
            else:
                total_sales = Sale.objects.filter(branch=branch).aggregate(total=Sum('total_amount'))['total'] or 0
                total_customers = Customer.objects.filter(sale__branch=branch).distinct().count()
                total_profits = total_sales
                out_of_stock = Inventory.objects.filter(branch=branch, quantity=0).count()

            statistics = [
                {"title": "Total Sales", "value": total_sales},
                {"title": "Total Customers", "value": total_customers},
                {"title": "Total Profits", "value": total_profits},
                {"title": "Out of Stock", "value": out_of_stock}
            ]
            return statistics

        data = cache.get(cache_key)
        if not data:
            data = fetch_statistics()
            cache.set(cache_key, data, timeout=600)

        return Response({"statistics": data}, status=status.HTTP_200_OK)


class MonthlySalesAPIView(APIView):
    serializer_class = MonthlySalesSerializer

    def get(self, request):
        user = request.user
        branch_id = request.query_params.get('branch')

        branch = None
        if user.role == 'CEO' and branch_id:
            branch = Site.objects.filter(id=branch_id).first()
        elif user.role != 'CEO':
            branch = user.branch

        cache_key = f"monthly_sales_{user.role}_{branch.id if branch else 'all'}"
        data = cache.get(cache_key)
        if data:
            return Response(data, status=status.HTTP_200_OK)

        today = timezone.now().date()
        start_of_year = today.replace(month=1, day=1)

        sales = Sale.objects.filter(date__gte=start_of_year)
        if branch:
            sales = sales.filter(branch=branch)

        monthly_sales = (
            sales.annotate(month=ExtractMonth('date'))
                 .values('month')
                 .annotate(total=Sum('total_amount'))
                 .order_by('month')
        )

        serializer = self.serializer_class(monthly_sales, many=True)
        data = serializer.data
        cache.set(cache_key, data, timeout=600)
        return Response(data, status=status.HTTP_200_OK)



class SalesTableAPIView(generics.ListAPIView):
    serializer_class = SaleSerializer

    def get_queryset(self):
        user = self.request.user
        request = self.request

        branch_id = request.query_params.get('branch')
        product_id = request.query_params.get('product')
        product_name = request.query_params.get('productName')
        customer_id = request.query_params.get('customer')
        customer_name = request.query_params.get('customerName')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        branch = None
        if user.role == 'CEO' and branch_id:
            branch = Site.objects.filter(id=branch_id).first()
        elif user.role != 'CEO':
            branch = user.branch

        queryset = Sale.objects.all()
        if branch:
            queryset = queryset.filter(branch=branch)

        if product_id:
            queryset = queryset.filter(items__product__id=product_id)
        if product_name:
            queryset = queryset.filter(items__product__name__icontains=product_name)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if customer_name:
            queryset = queryset.filter(customer__name__icontains=customer_name)
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        user = request.user
        params = request.query_params

        branch_id = params.get('branch')
        product_id = params.get('product')
        product_name = params.get('productName')
        customer_id = params.get('customer')
        customer_name = params.get('customerName')
        start_date = params.get('start_date')
        end_date = params.get('end_date')

        cache_key = f"sales_table_{user.role}_{branch_id or user.branch_id or 'all'}"
        if product_id:
            cache_key += f"_product_{product_id}"
        if product_name:
            cache_key += f"_product_name_{product_name}"
        if customer_id:
            cache_key += f"_customer_{customer_id}"
        if customer_name:
            cache_key += f"_customer_name_{customer_name}"
        if start_date and end_date:
            cache_key += f"_date_{start_date}_{end_date}"

        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        cache.set(cache_key, data, timeout=600)
        return Response(data)



class ExpiryListAPIView(generics.ListAPIView):
    serializer_class = InventorySerializer

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch')

        branch = None
        if user.role == 'CEO' and branch_id:
            branch = Site.objects.filter(id=branch_id).first()
        elif user.role != 'CEO':
            branch = user.branch

        cache_key = f"expiry_list_{user.role}_{branch.id if branch else 'all'}"
        data = cache.get(cache_key)
        if data:
            return Inventory.objects.none()

        queryset = Inventory.objects.filter(expiration_date__lte=timezone.now().date())
        if branch:
            queryset = queryset.filter(branch=branch)

        serializer = self.serializer_class(queryset, many=True)
        cache.set(cache_key, serializer.data, timeout=600)
        return queryset

