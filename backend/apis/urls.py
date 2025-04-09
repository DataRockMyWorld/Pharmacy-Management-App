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
                    UnreadCountAPIView,
                    WarehouseReceivingAPIView,
                    ClearAllNotificationsAPIView,
                    GenerateTransferReceiptAPIView,
                    WarehouseReceivingDocumentPDFView,
                    ReceiveTransferAPIView,
                    WarehouseDispatchAPIView,
                    ReceiveTransferAPIView,
                    InTransitTransfersAPIView,
                    DispatchDocumentAPIView,
                    archive_notification,
                    )

urlpatterns = [
    # 📍 SITE MANAGEMENT
    path('sites/', SiteListCreateAPIView.as_view(), name='site-list-create'),  # Create or list branches/sites
    path('sites/<int:pk>/', SiteDetailAPIView.as_view(), name='site-detail'),  # Retrieve, update, delete a site

    # 📦 PRODUCT CATALOG
    path('products/', ProductListCreateAPIView.as_view(), name='product-list-create'),  # Create or list products
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),  # Retrieve, update, delete a product

    # 📊 INVENTORY MANAGEMENT
    path('inventory/', InventoryListCreateAPIView.as_view(), name='inventory-list-create'),  # View or add stock to a branch
    path('inventory/<int:pk>/', InventoryDetailAPIView.as_view(), name='inventory-detail'),  # Get inventory details per item/branch

    # 🚚 STOCK MOVEMENTS (historical records)
    path('stock-movement/', StockMovementListCreateAPIView.as_view(), name='stock-movement-list-create'),

    # 🔁 STOCK TRANSFER (request + detail)
    path('stock-transfer/', StockTransferListCreateAPIView.as_view(), name='stock-transfer-list-create'),  # Create/view transfer requests
    path('stock-transfer/<int:pk>/', StockTransferDetailAPIView.as_view(), name='stock-transfer-detail'),  # Detail/edit/delete
    path('stock-transfer/approve/<int:transfer_id>/', StockTransferApprovalAPIView.as_view(), name='stock-transfer-approve'),  # CEO approves/rejects transfer

    # 📈 REPORTING
    path('reports/inventory/', InventoryReportAPIView.as_view(), name='inventory-report'),
    path('reports/stock-movements/', StockMovementReportAPIView.as_view(), name='stock-movement-report'),
    path('reports/stock-transfers/', StockTransferReportAPIView.as_view(), name='stock-transfer-report'),

    # 💳 SALES & CUSTOMERS
    path('customers/', CustomerListCreateAPIView.as_view(), name='customer-list-create'),
    path('sales/', SaleListCreateAPIView.as_view(), name='sale-list-create'),
    path('reports/sales/', SalesReportAPIView.as_view(), name='sales-report'),

    # 🧾 RECEIPTS
    path('receipts/<int:sale_id>/', GenerateReceiptAPIView.as_view(), name='generate-receipt'),  # View/print receipt
    path('receipts/<int:sale_id>/send-email/', SendReceiptEmailAPIView.as_view(), name='send-receipt-email'),  # Email receipt
    path('api/receipts/<int:sale_id>/send-sms/', SendReceiptSMSAPIView.as_view(), name='send-receipt-sms'),  # SMS receipt

    # 🔔 NOTIFICATIONS
    path('notifications/', NotificationListCreateAPIView.as_view(), name='notification-list-create'),
    path('notifications/<int:pk>/', NotificationDetailAPIView.as_view(), name='notification-detail'),
    path('notifications/<int:pk>/mark-as-read/', MarkAsReadAPIView.as_view(), name='mark-as-read'),
    path('notifications/mark-all-as-read/', MarkAllAsReadAPIView.as_view(), name='mark-all-as-read'),
    path('notifications/unread-count/', UnreadCountAPIView.as_view(), name='unread-count'),
    path('notifications/clear-all/', ClearAllNotificationsAPIView.as_view(), name='clear-all-notifications'),
    path('notifications/<int:pk>/archive/', archive_notification, name='archive-notification'),  # Archive a notification

    # 📥 WAREHOUSE RECEIVING
    path('warehouse/receive/', WarehouseReceivingAPIView.as_view(), name='warehouse-receive'),  # Manual input of warehouse stock
    path('warehouse/receiving-document/<int:inventory_id>/', WarehouseReceivingDocumentPDFView.as_view()),  # PDF for receiving docs
    path('transfer-receipt/<int:pk>/', GenerateTransferReceiptAPIView.as_view, name="generate-transfer"),  # Receipt for stock transfer

    # 📤 WAREHOUSE DISPATCH & TRANSFER CONFIRMATION
    path('warehouse/dispatch/', WarehouseDispatchAPIView.as_view(), name='warehouse-dispatch'),  # CEO direct dispatch
    path('warehouse/dispatch-document/<int:transfer_id>/', DispatchDocumentAPIView.as_view(), name='dispatch-document'),  # PDF of dispatch
    path('warehouse/receive-transfer/<int:transfer_id>/', ReceiveTransferAPIView.as_view(), name='receive-transfer'),  # CONFIRM delivery + adjust stock

    # 🚚 TRANSFER TRACKING
    path('transfers/in-transit/', InTransitTransfersAPIView.as_view(), name='in-transit-transfers'),  # View all IN_TRANSIT transfers
]
