from django.urls import path
from .views import (SiteDetailAPIView, 
                    SiteListCreateAPIView,
                    ProductListCreateAPIView,
                    ProductDetailAPIView,
                    InventoryListCreateAPIView,
                    InventoryDetailAPIView,
                    StockMovementListCreateAPIView,
                    StockTransferListCreateAPIView,
                    StockTransferDetailAPIView,
                    InventoryReportAPIView,
                    StockMovementReportAPIView,
                    StockTransferReportAPIView,
                    CustomerListCreateAPIView,
                    SaleListCreateAPIView,
                    SalesReportAPIView,
                    GenerateReceiptAPIView,
                    SendReceiptEmailAPIView,
                    SendReceiptSMSAPIView,
                    StockTransferApprovalAPIView,
                    NotificationListCreateAPIView,
                    NotificationDetailAPIView,
                    MarkAsReadAPIView,
                    MarkAllAsReadAPIView,
                    UnreadCountAPIView)

urlpatterns = [
    path('sites/', SiteListCreateAPIView.as_view(), name='site-list-create'),
    path('sites/<int:pk>/', SiteDetailAPIView.as_view(), name='site-detail'),
    
    path('products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    
    path('inventory/', InventoryListCreateAPIView.as_view(), name='inventory-list-create'),
    path('inventory/<int:pk>/', InventoryDetailAPIView.as_view(), name='inventory-detail'),
    
    path('stock-movement/', StockMovementListCreateAPIView.as_view(), name='stock-movement-list-create'),
    
    path('stock-transfer/', StockTransferListCreateAPIView.as_view(), name='stock-transfer-list-create'),
    path('stock-transfer/<int:pk>/', StockTransferDetailAPIView.as_view(), name='stock-transfer-detail'),
    path('stock-transfer/approve/<int:transfer_id>/', StockTransferApprovalAPIView.as_view(), name='stock-transfer-approve'),
    
    path('reports/inventory/', InventoryReportAPIView.as_view(), name='inventory-report'),
    path('reports/stock-movements/', StockMovementReportAPIView.as_view(), name='stock-movement-report'),
    path('reports/stock-transfers/', StockTransferReportAPIView.as_view(), name='stock-transfer-report'),
    
    path('customers/', CustomerListCreateAPIView.as_view(), name='customer-list-create'),
    path('sales/', SaleListCreateAPIView.as_view(), name='sale-list-create'),
    path('reports/sales/', SalesReportAPIView.as_view(), name='sales-report'),
    
    path('receipts/<int:sale_id>/', GenerateReceiptAPIView.as_view(), name='generate-receipt'),
    path('receipts/<int:sale_id>/send-email/', SendReceiptEmailAPIView.as_view(), name='send-receipt-email'),
    
    path('api/receipts/<int:sale_id>/send-sms/', SendReceiptSMSAPIView.as_view(), name='send-receipt-sms'),
    
    path('notifications/', NotificationListCreateAPIView.as_view(), name='notification-list-create'),
    path('notifications/<int:pk>/', NotificationDetailAPIView.as_view(), name='notification-detail'),
    path('notifications/<int:pk>/mark-as-read/', MarkAsReadAPIView.as_view(), name='mark-as-read'),
    path('notifications/mark-all-as-read/', MarkAllAsReadAPIView.as_view(), name='mark-all-as-read'),
    path('notifications/unread-count/', UnreadCountAPIView.as_view(), name='unread-count'),

]