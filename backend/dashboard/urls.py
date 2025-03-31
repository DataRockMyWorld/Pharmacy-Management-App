from django.urls import path
from .views import SalesStatisticsAPIView, MonthlySalesAPIView, SalesTableAPIView, ExpiryListAPIView



urlpatterns = [
    path('dashboard/statistics/', SalesStatisticsAPIView.as_view(), name='sales-statistics'),
    path('dashboard/monthly-sales/', MonthlySalesAPIView.as_view(), name='monthly-sales'),
    path('dashboard/sales-table/', SalesTableAPIView.as_view(), name='sales-table'),
    path('dashboard/expiry-list/', ExpiryListAPIView.as_view(), name='expiry-list'),
]
