from rest_framework.views import APIView
from sites.models import Site
from apis.serializers import SiteSerializer
from .permissions import IsCEOOrBranchAdmin, IsCEO
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework import generics
from products.models import Product
from apis.serializers import (ProductSerializer, 
                              InventorySerializer, 
                              StockMovementSerializer, 
                              StockTransferSerializer,
                              CustomerSerializer,
                              NotificationSerializer,
                              WarehouseReceivingSerializer)
from inventory.models import Inventory, StockMovement, StockTransfer, Notification, InventoryVersion
from accounts.models import User, Customer
import csv
from django.http import HttpResponse
from sales.models import Sale
from apis.serializers import SaleSerializer
from sales.models import SaleItem
from .utils import generate_pdf, send_email, send_sms, check_low_stock, create_transfer_request_notification
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from .utils import send_sms
from rest_framework import status
from .utils import invalidate_cache
from django.utils import timezone
from django.shortcuts import get_object_or_404
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from django.http import FileResponse
from io import BytesIO
import logging
from rest_framework import serializers

logger = logging.getLogger(__name__)



# Create your views here.

class SiteListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        user = request.user
        if user.role == 'CEO':
            branches = Site.objects.all()
        else:
            branches = Site.objects.filter(id=user.branch.id)
            
        serializer = SiteSerializer(branches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
    def post(self, request, pk, *args, **kwargs):
        if request.user.role == 'CEO':
            return Response({'detail': 'You are not authorized to create a site.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SiteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# Site Detail API View
class SiteDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, *args, **kwargs):
        try:
            branch = Site.objects.get(pk=pk)
        except Site.DoesNotExist:
            return Response({'detail': 'Site not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.user.role == 'Admin' and request.user.branch != branch:
            return Response({'detail': 'You are not authorized to view this site.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SiteSerializer(branch)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, pk, *args, **kwargs):
        try:
            branch = Site.objects.get(pk=pk)
        except Site.DoesNotExist:
            return Response({'detail': 'Branch not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.user.role == 'Admin' and request.user.branch != branch:
            return Response({'detail': 'You are not authorized to update this site.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SiteSerializer(branch, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk, *args, **kwargs):
        if request.user.role != 'CEO':
            return Response({'detail': 'You are not authorized to delete a site.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            branch = Site.objects.get(pk=pk)
        except Site.DoesNotExist:
            return Response({'detail': 'Branch not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        branch.delete()
        return Response({'detail': 'Branch deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
    

class ProductListCreateAPIView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

   
class InventoryListCreateAPIView(generics.ListCreateAPIView):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_query(self):
        user = self.request.user
        if user.role == 'CEO':
            return Inventory.objects.all()
        return Inventory.objects.filter(branch=user.branch)
    
    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)
        
        #Invalidate Cache
        invalidate_cache(user=self.request.user)

class InventoryListCreateAPIView(generics.ListCreateAPIView):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CEO':
            warehouse = Site.objects.filter(is_warehouse=True).first()
            return Inventory.objects.filter(branch=warehouse)
        return Inventory.objects.filter(branch=user.branch)  # Only branch-specific inventory for other users

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)
        # Invalidate Cache (if applicable)
        invalidate_cache(user=self.request.user)


        
class InventoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'CEO':
            return Inventory.objects.all()
        return Inventory.objects.filter(branch=user.branch)
    
    def perform_update(self, serializer):
        inventory = serializer.save()
        
        # Invalidate cache when inventory is updated
        invalidate_cache(user=self.request.user)
    
    def perform_destroy(self, instance):
        instance.delete()
        
        # Invalidate cache when inventory is deleted
        invalidate_cache(user=self.request.user)
    

class StockMovementListCreateAPIView(generics.ListCreateAPIView):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'CEO':
            return StockMovement.objects.all()
        return StockMovement.objects.filter(branch=user.branch)
    
    def perform_create(self, serializer):
        serializer.save(branch=self.request.user.branch)
        
class StockTransferListCreateAPIView(generics.ListCreateAPIView):
    queryset = StockTransfer.objects.all()
    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'CEO':
            return super().get_queryset()
        return StockTransfer.objects.filter(from_branch=user.branch)
    
    def perform_create(self, serializer):
        from_branch = self.request.user.branch
        try:
            to_branch = Site.objects.get(is_warehouse=True)
        except Site.DoesNotExist:
            raise serializers.ValidationError("Warehouse site not configured.")
        
        transfer = serializer.save(
            from_branch=from_branch,
            to_branch=to_branch,
            requested_by=self.request.user)
        
        # Create StockMovement placeholder
        create_transfer_request_notification(transfer)
        invalidate_cache(user=self.request.user)
        if transfer.to_branch:
            invalidate_cache()

class StockTransferDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StockTransfer.objects.all()
    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'CEO':
            return super().get_queryset()
        return StockTransfer.objects.filter(from_branch=user.branch)
    
    def perform_update(self, serializer):
        serializer.save()
        
        #Invalidate Cache for both branches
        invalidate_cache(user=self.request.user)
        if serializer.save().to_branch:
            invalidate_cache()
            
    def perform_destroy(self, instance):
        instance.delete()
        
        #Invalidate Cache for both branches
        invalidate_cache(user=self.request.user)
    
    
class InventoryReportAPIView(APIView):
    permission_classes = [IsCEOOrBranchAdmin]
    def get(self, request, format=None):
        inventories = Inventory.objects.all() if User.role == 'CEO' else Inventory.objects.filter(branch=User.branch)
        
        #Filtering Data by Range
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if start_date and end_date:
            inventories = inventories.filter(updated_at__range=[start_date, end_date])
            
        # Pagination
        paginator = Paginator(inventories, 10) #Show 10 inventories per page
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        
        
        #Export to CSV
        if format == 'pdf':
            context = {'inventories': page_obj}
            response = generate_pdf('inventory_report_template.html', context)
            if response:
                return response
            return Response({'detail': 'Error generating PDF report.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        #JSON Response
        serializer = InventorySerializer(page_obj, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        

class StockMovementReportAPIView(APIView):
    permission_classes = [IsCEOOrBranchAdmin]

    def get(self, request, format=None):
        user = request.user
        movements = StockMovement.objects.all() if user.role == 'CEO' else StockMovement.objects.filter(branch=user.branch)
        
        # Date Filtering
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if start_date and end_date:
            movements = movements.filter(date__range=[start_date, end_date])

        # Export to CSV
        if format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="stock_movement_report.csv"'

            writer = csv.writer(response)
            writer.writerow(['Product', 'Branch', 'Type', 'Quantity', 'Date'])
            
            for movement in movements:
                writer.writerow([
                    movement.product.name,
                    movement.branch.name,
                    movement.get_movement_type_display(),
                    movement.quantity,
                    movement.date
                ])
            return response

        # Standard JSON response
        serializer = StockMovementSerializer(movements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
 
class StockTransferApprovalAPIView(APIView):
    permission_classes = [IsCEO]  # or IsCEOOrBranchAdmin

    def post(self, request, transfer_id):
        transfer = get_object_or_404(StockTransfer, id=transfer_id)

        if transfer.transfer_status != 'PENDING':
            return Response({"error": "Transfer already processed."}, status=400)

        action = request.data.get("action")
        rejection_reason = request.data.get("rejection_reason", "")

        if action not in ["approve", "reject"]:
            return Response({"error": "Invalid action"}, status=400)

        transfer.processed_by = request.user
        transfer.processed_at = timezone.now()

        if action == "approve":
            # Move to IN_TRANSIT state
            transfer.transfer_status = 'IN_TRANSIT'
            transfer.approved = True
            transfer.approved_by = request.user
            transfer.save()

            # Notify branch
            Notification.objects.create(
                recipient=transfer.requested_by,
                sender=request.user,
                related_branch=transfer.to_branch,
                notification_type='TRANSFER_APPROVAL',
                title='Stock Transfer Approved',
                message=(
                    f"Your transfer request for {transfer.product.name} "
                    f"({transfer.quantity}) has been approved and is now in transit."
                ),
                related_object_id=transfer.id
            )

            return Response({
                "message": "Transfer approved and marked as in transit.",
                "status": "IN_TRANSIT",
                "transfer": StockTransferSerializer(transfer).data
            })

        elif action == "reject":
            transfer.transfer_status = 'REJECTED'
            transfer.approved = False
            transfer.rejection_reason = rejection_reason
            transfer.save()

            # Notify branch
            Notification.objects.create(
                recipient=transfer.requested_by,
                sender=request.user,
                related_branch=transfer.to_branch,
                notification_type='TRANSFER_REJECTION',
                title='Stock Transfer Rejected',
                message=(
                    f"Your transfer request for {transfer.product.name} "
                    f"was rejected. Reason: {rejection_reason or 'Not specified'}"
                ),
                related_object_id=transfer.id
            )

            return Response({
                "message": "Transfer request rejected.",
                "status": "REJECTED",
                "transfer": StockTransferSerializer(transfer).data
            })


class StockTransferReportAPIView(APIView):
    permission_classes = [IsCEOOrBranchAdmin]

    def get(self, request, format=None):
        user = request.user
        transfers = StockTransfer.objects.all() if user.role == 'CEO' else StockTransfer.objects.filter(from_branch=user.branch)
        
        # Date Filtering
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if start_date and end_date:
            transfers = transfers.filter(transfer_date__range=[start_date, end_date])
            
        # Pagination
        paginator = Paginator(transfers, 10)  # Show 10 transfers per page
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)

        # Export to CSV
        if format == 'pdf':
            context = {'transfers': page_obj}
            response = generate_pdf('stock_transfer_report_template.html', context)
            if response:
                return response
            return Response({"detail": "Error generating PDF report."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Standard JSON response
        serializer = StockTransferSerializer(page_obj, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class SaleListCreateAPIView(generics.ListCreateAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin':
            return Sale.objects.filter(branch=user.branch)
        return super().get_queryset()

    def perform_create(self, serializer):
        serializer.save(processed_by=self.request.user)


class CustomerListCreateAPIView(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    

class GenerateReceiptAPIView(APIView):

    def get(self, request, sale_id):
        try:
            sale = Sale.objects.get(id=sale_id)
            items = SaleItem.objects.filter(sale=sale)

            context = {
                'sale': sale,
                'items': items,
            }

            # Generate PDF
            response = generate_pdf('receipt_template.html', context)
            if response:
                return response
            return Response({"detail": "Error generating receipt."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Sale.DoesNotExist:
            return Response({"detail": "Sale not found."}, status=status.HTTP_404_NOT_FOUND)
        
class SendReceiptEmailAPIView(APIView):

    def post(self, request, sale_id):
        try:
            sale = Sale.objects.get(id=sale_id)
            items = SaleItem.objects.filter(sale=sale)
            customer_email = sale.customer.email

            if not customer_email:
                return Response({"detail": "Customer email not available."}, status=status.HTTP_400_BAD_REQUEST)

            # Render HTML receipt template
            context = {'sale': sale, 'items': items}
            html_message = render_to_string('receipt_template.html', context)
            
            # Send email
            send_email(
                subject=f"Receipt for Your Purchase at {sale.branch.name}",
                message="Here is your receipt",
                recipient_list=[customer_email],
                html_message=html_message
            )
            
            # Mark the sale as receipt sent
            sale.receipt_sent = True
            sale.save()

            return Response({"detail": "Receipt sent successfully via email."}, status=status.HTTP_200_OK)
        
        except Sale.DoesNotExist:
            return Response({"detail": "Sale not found."}, status=status.HTTP_404_NOT_FOUND)



class SendReceiptSMSAPIView(APIView):

    def post(self, request, sale_id):
        try:
            sale = Sale.objects.get(id=sale_id)
            customer = sale.customer

            if not customer or not customer.phone_number:
                return Response({"detail": "Customer phone number not available."}, status=status.HTTP_400_BAD_REQUEST)

            # Create the SMS message content
            message = (
                f"Thank you for your purchase at {sale.branch.name}!\n"
                f"Amount Paid: GHC{sale.total_amount}\n"
                f"Payment Method: {sale.payment_method}\n"
                f"Date: {sale.date}\n"
            )

            # Send SMS
            sms_sid = send_sms(customer.phone_number, message)

            if sms_sid:
                sale.receipt_sent = True
                sale.save()
                return Response({"detail": "Receipt sent successfully via SMS."}, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Failed to send SMS."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Sale.DoesNotExist:
            return Response({"detail": "Sale not found."}, status=status.HTTP_404_NOT_FOUND)


class RetryReceiptAPIView(APIView):

    def post(self, request, sale_id):
        try:
            sale = Sale.objects.get(id=sale_id)
            errors = []

            if sale.email_status == 'FAILED':
                # Retry sending email (using existing email-sending function)
                if not send_email(sale):  # Assume send_email_receipt() exists
                    errors.append("Failed to send email.")

            if sale.sms_status == 'FAILED':
                # Retry sending SMS (using existing SMS function)
                if not send_sms(sale):  # Assume send_sms_receipt() exists
                    errors.append("Failed to send SMS.")
            
            if errors:
                return Response({"errors": errors}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({"message": "Receipts resent successfully."}, status=status.HTTP_200_OK)

        except Sale.DoesNotExist:
            return Response({"message": "Sale not found."}, status=status.HTTP_404_NOT_FOUND)




class SalesReportAPIView(APIView):
    permission_classes = [IsCEOOrBranchAdmin]

    def get(self, request, format=None):
        user = request.user
        sales = Sale.objects.all() if user.role == 'CEO' else Sale.objects.filter(branch=user.branch)
        
        # Date Filtering
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if start_date and end_date:
            sales = sales.filter(date__range=[start_date, end_date])

        # Pagination
        paginator = Paginator(sales, 10)  # Show 10 sales per page
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)

        # Export to PDF
        if format == 'pdf':
            context = {'sales': page_obj}
            response = generate_pdf('sales_report_template.html', context)
            if response:
                return response
            return Response({"detail": "Error generating PDF report."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # JSON Response
        serializer = SaleSerializer(page_obj, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class LowStockAlertAPIView(APIView):

    def get(self, request, branch_id):
        try:
            branch = Site.objects.get(id=branch_id)
            low_stock_items = check_low_stock(branch)
            
            if low_stock_items.exists():
                return Response({"low_stock_items": [item.product.name for item in low_stock_items]}, status=status.HTTP_200_OK)
            return Response({"message": "No low stock items found."}, status=status.HTTP_200_OK)
        
        except Site.DoesNotExist:
            return Response({"message": "Branch not found."}, status=status.HTTP_404_NOT_FOUND)
        

class NotificationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only show notifications for the current user
        return Notification.objects.filter(recipient=self.request.user, is_archived=False).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(recipient=self.request.user)

class NotificationDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only allow access to notifications for the current user
        return Notification.objects.filter(recipient=self.request.user)
    

class ClearAllNotificationsAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def delete(self, request, *args, **kwargs):
        # Delete all notifications for the current user
        count, _ = self.get_queryset().delete()
        return Response(
            {"message": f"Successfully deleted {count} notifications"},
            status=status.HTTP_204_NO_CONTENT
        )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def archive_notification(request, pk):
    try:
        notification = Notification.objects.get(id=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)

    notification.is_archived = True
    notification.save()
    return Response({'message': 'Notification archived'}, status=200)

class MarkAsReadAPIView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_read = True
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class MarkAllAsReadAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        
        return Response({
            'status': 'success',
            'message': f'Marked {updated} notifications as read'
        }, status=status.HTTP_200_OK)

class UnreadCountAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({'unread_count': count})
    

class WarehouseReceivingAPIView(APIView):
    permission_classes = [IsAuthenticated, IsCEO]

    def post(self, request):
        serializer = WarehouseReceivingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product = data['product_id']
        quantity = data['quantity']
        batch_number = data.get('batch_number', '')
        expiration_date = data.get('expiration_date')

        warehouse = Site.objects.filter(is_warehouse=True).first()
        if not warehouse:
            return Response({"error": "Warehouse site not configured."}, status=500)

        inventory, created = Inventory.objects.get_or_create(
            product=product,
            branch=warehouse,
            batch_number=batch_number,
            defaults={
                "quantity": 0,
                "expiration_date": expiration_date,
                "received_by": request.user,
            }
        )

        prev_qty = inventory.quantity
        inventory.quantity += quantity
        if expiration_date:
            inventory.expiration_date = expiration_date
        inventory.received_by = request.user
        inventory.save()

        # Stock movement log
        sm = StockMovement.objects.create(
            product=product,
            branch=warehouse,
            movement_type='ADD',
            quantity=quantity,
            details=f"Warehouse received new stock. Batch: {batch_number or 'N/A'}"
        )

        # Inventory version log
        InventoryVersion.objects.create(
            inventory=inventory,
            previous_quantity=prev_qty,
            new_quantity=inventory.quantity,
            modified_by=request.user,
            stock_movement=sm
        )

        return Response({
            "message": f"{quantity} units of {product.name} received into warehouse.",
            "inventory_id": inventory.id,
            "current_quantity": inventory.quantity
        }, status=200)
        
class WarehouseReceivingDocumentPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, inventory_id):
        try:
            inventory = Inventory.objects.select_related('product', 'received_by').get(id=inventory_id)
        except Inventory.DoesNotExist:
            return Response({'error': 'Inventory not found'}, status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receiving_doc_{inventory_id}.pdf"'

        p = canvas.Canvas(response)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, "Warehouse Receiving Document")

        p.setFont("Helvetica", 12)
        p.drawString(100, 760, f"Product: {inventory.product.name}")
        p.drawString(100, 740, f"Quantity: {inventory.quantity}")
        p.drawString(100, 720, f"Batch: {inventory.batch_number or 'N/A'}")
        p.drawString(100, 700, f"Expiration Date: {inventory.expiration_date or 'N/A'}")
        p.drawString(100, 680, f"Received By: {inventory.received_by.get_full_name}")
        p.drawString(100, 660, f"Date: {inventory.updated_at.strftime('%Y-%m-%d')}")

        p.showPage()
        p.save()

        return response

class MarkTransferReceivedAPIView(APIView):
    def post(self, request, pk):
        transfer = get_object_or_404(StockTransfer, id=pk)
        transfer.received = True
        transfer.save()
        return Response({"message": "Marked as received."})


class GenerateTransferReceiptAPIView(APIView):
    def get(self, request, transfer_id):
        # Get transfer data
        transfer = get_object_or_404(StockTransfer, pk=transfer_id)
        
        # Create PDF response
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="transfer_receipt_{transfer_id}.pdf"'
        
        # Generate PDF
        p = canvas.Canvas(response, pagesize=letter)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 750, "Stock Transfer Receipt")
        
        # Add transfer details
        p.setFont("Helvetica", 12)
        p.drawString(100, 700, f"Transfer ID: {transfer.id}")
        p.drawString(100, 680, f"Date: {transfer.created_at.strftime('%Y-%m-%d %H:%M')}")
        p.drawString(100, 660, f"Product: {transfer.product.name}")
        p.drawString(100, 640, f"Quantity: {transfer.quantity}")
        p.drawString(100, 620, f"From: {transfer.source_site.name}")
        p.drawString(100, 600, f"To: {transfer.destination_site.name}")
        p.drawString(100, 580, f"Status: {transfer.status}")
        
        if transfer.status == 'REJECTED':
            p.drawString(100, 560, f"Reason: {transfer.rejection_reason}")
        
        # Add authorized signatures section
        p.drawString(100, 500, "Authorized Signatures:")
        p.line(100, 490, 300, 490)
        p.drawString(100, 470, "Warehouse Manager")
        
        p.line(350, 490, 550, 490)
        p.drawString(350, 470, "Receiving Branch Representative")
        
        p.showPage()
        p.save()
        return response
    
class ReceiveTransferAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, transfer_id):
        try:
            transfer = StockTransfer.objects.get(id=transfer_id, to_branch=request.user.branch)
        except StockTransfer.DoesNotExist:
            return Response({"error": "Transfer not found"}, status=404)

        if transfer.transfer_status != 'IN_TRANSIT':
            return Response({"error": "Already received or invalid state"}, status=400)

        # Decrease warehouse inventory
        from_inventory = Inventory.objects.filter(
            product=transfer.product,
            branch=transfer.from_branch
        ).order_by('-updated_at').first()

        if not from_inventory:
            return Response({"error": "Source inventory not found"}, status=404)

        prev_from_qty = from_inventory.quantity
        if prev_from_qty < transfer.quantity:
            return Response({"error": "Source branch has insufficient stock"}, status=400)

        # Decrease stock via logic, but record positive quantity
        from_inventory.adjust_quantity(-transfer.quantity)

        sm_out = StockMovement.objects.create(
            product=transfer.product,
            branch=from_inventory.branch,
            movement_type='TRANSFER',
            quantity=transfer.quantity,  # ✅ now POSITIVE
            details=f"Dispatched to {transfer.to_branch.name}",
            linked_transfer=transfer
        )

        InventoryVersion.objects.create(
            inventory=from_inventory,
            previous_quantity=prev_from_qty,
            new_quantity=from_inventory.quantity,
            modified_by=request.user,
            stock_movement=sm_out
        )

        # Increase inventory at destination
        to_inventory, _ = Inventory.objects.get_or_create(
            product=transfer.product,
            branch=transfer.to_branch,
            defaults={"quantity": 0}
        )
        prev_qty = to_inventory.quantity
        to_inventory.adjust_quantity(transfer.quantity)

        sm_in = StockMovement.objects.create(
            product=transfer.product,
            branch=to_inventory.branch,
            movement_type='TRANSFER',
            quantity=transfer.quantity,
            details=f"Received from {transfer.from_branch.name}",
            linked_transfer=transfer
        )

        InventoryVersion.objects.create(
            inventory=to_inventory,
            previous_quantity=prev_qty,
            new_quantity=to_inventory.quantity,
            modified_by=request.user,
            stock_movement=sm_in
        )

        transfer.transfer_status = 'RECEIVED'
        transfer.received_by = request.user
        transfer.received_at = timezone.now()
        transfer.save()

        # Notify sender admin
        try:
            admin_user = User.objects.get(branch=transfer.from_branch, role='Admin')
            Notification.objects.create(
                recipient=admin_user,
                sender=request.user,
                related_object_id=transfer.id,
                notification_type='SYSTEM',
                title="Dispatch Received",
                message=f"{transfer.product.name} was received at {transfer.to_branch.name}."
            )
        except User.DoesNotExist:
            logger.warning(f"No Admin user found at branch {transfer.from_branch.name} to notify about transfer {transfer.id}")

        return Response({"message": "Transfer received successfully"})



class WarehouseDispatchAPIView(APIView):
    permission_classes = [IsCEO]

    def post(self, request):
        data = request.data
        product_id = data.get("product_id")
        quantity = int(data.get("quantity", 0))
        destination_id = data.get("destination_id")
        notes = data.get("notes", "")

        if not all([product_id, destination_id, quantity]):
            return Response({"error": "Missing required fields"}, status=400)

        try:
            product = Product.objects.get(id=product_id)
            destination = Site.objects.get(id=destination_id)
            warehouse = request.user.branch
            from_inventory = Inventory.objects.filter(product=product, branch=warehouse).order_by('-updated_at').first()
            if not from_inventory:
                return Response({"error": "No inventory record found"}, status=404)
        except (Product.DoesNotExist, Site.DoesNotExist):
            return Response({"error": "Invalid product or destination"}, status=404)

        if from_inventory.quantity < quantity:
            return Response({"error": "Insufficient stock"}, status=400)

        # Create transfer record
        transfer = StockTransfer.objects.create(
            from_branch=warehouse,
            to_branch=destination,
            product=product,
            quantity=quantity,
            transfer_status='IN_TRANSIT',
            is_warehouse_initiated=True,
            approved=True,
            processed_by=request.user,
            processed_at=timezone.now(),
            details=notes
        )

        # Send notification to receiving branch admin
        if hasattr(destination, 'admin_user'):
            Notification.objects.create(
                recipient=destination.admin_user,
                sender=request.user,
                notification_type='TRANSFER_APPROVAL',
                related_branch=warehouse,
                related_object_id=transfer.id,
                title=f"Dispatch Incoming: {product.name}",
                message=f"{quantity}x {product.name} has been dispatched to your branch.",
            )

        return Response({"message": "Dispatch successful", "transfer_id": transfer.id})

class DispatchDocumentAPIView(APIView):
    permission_classes = [IsCEO]

    def get(self, request, transfer_id):
        try:
            transfer = StockTransfer.objects.get(id=transfer_id)
            
            # Create PDF
            buffer = BytesIO()
            p = canvas.Canvas(buffer)
            
            # Add document content
            p.drawString(100, 800, f"Dispatch Document #{transfer.id}")
            p.drawString(100, 780, f"Product: {transfer.product.name}")
            p.drawString(100, 760, f"Quantity: {transfer.quantity}")
            # ... add more details
            
            p.showPage()
            p.save()
            
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=True, filename=f"dispatch_{transfer_id}.pdf")
        except StockTransfer.DoesNotExist:
            return Response({"error": "Transfer not found"}, status=404)

# views.py
class InTransitTransfersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transfers = StockTransfer.objects.filter(
            to_branch=request.user.branch,
            transfer_status='IN_TRANSIT'
        )
        serializer = StockTransferSerializer(transfers, many=True)
        return Response(serializer.data)
