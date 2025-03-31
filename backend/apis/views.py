from rest_framework.views import APIView
from sites.models import Site
from apis.serializers import SiteSerializer
from .permissions import IsCEOOrBranchAdmin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from products.models import Product
from apis.serializers import (ProductSerializer, 
                              InventorySerializer, 
                              StockMovementSerializer, 
                              StockTransferSerializer,
                              CustomerSerializer,
                              NotificationSerializer)
from inventory.models import Inventory, StockMovement, StockTransfer, Notification
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
            return Inventory.objects.all()  # CEO can see all inventory
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
        serializer.save()
        
        #Invalidate Cache for both branches
        invalidate_cache(user=self.request.user)
        if serializer.save().to_branch:
            invalidate_cache()
            
    def perform_create(self, serializer):
        transfer = serializer.save(requested_by=self.request.user)
        create_transfer_request_notification(transfer)
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
    permission_classes = [IsCEOOrBranchAdmin]

    def post(self, request, transfer_id):
        transfer = StockTransfer.objects.get(id=transfer_id)

        # Approve the transfer
        if transfer.transfer_status == 'PENDING':
            transfer.transfer_status = 'APPROVED'
            transfer.approved_by = request.user
            transfer.save()

            # Adjust inventory quantities
            from_inventory = Inventory.objects.get(product=transfer.product, branch=transfer.from_branch)
            to_inventory = Inventory.objects.get(product=transfer.product, branch=transfer.to_branch)

            from_inventory.adjust_quantity(-transfer.quantity)  # Reduce stock at the source branch
            to_inventory.adjust_quantity(transfer.quantity)     # Increase stock at the destination branch

            # Log stock movement
            StockMovement.objects.create(
                product=transfer.product,
                branch=transfer.from_branch,
                movement_type='TRANSFER',
                quantity=-transfer.quantity,
                details=f"Transferred to {transfer.to_branch.name}"
            )

            StockMovement.objects.create(
                product=transfer.product,
                branch=transfer.to_branch,
                movement_type='TRANSFER',
                quantity=transfer.quantity,
                details=f"Transferred from {transfer.from_branch.name}"
            )

            return Response({"message": "Transfer approved and stock updated."}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "Transfer already processed or rejected."}, status=status.HTTP_400_BAD_REQUEST)



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
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(recipient=self.request.user)

class NotificationDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only allow access to notifications for the current user
        return Notification.objects.filter(recipient=self.request.user)

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