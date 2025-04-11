from sites.models import Site
from products.models import Product
from rest_framework import serializers
from inventory.models import Inventory, StockMovement, StockTransfer, Notification
from django.db import transaction
from sales.models import Sale, SaleItem
from accounts.models import Customer
from .utils import invalidate_cache
from accounts.serializers import UserMeSerializer
from django.utils.timesince import timesince

class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = '__all__'
        
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'brand', 'category', 'unit_price', 'created_at', 'manufacturer']
        
class InventorySerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = Inventory
        fields = '__all__'

class StockMovementSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = StockMovement
        fields = '__all__'


class StockTransferSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    from_branch = serializers.PrimaryKeyRelatedField(read_only=True)
    to_branch = serializers.PrimaryKeyRelatedField(read_only=True)

    product_name = serializers.CharField(source='product.name', read_only=True)
    from_branch_name = serializers.CharField(source='from_branch.name', read_only=True)
    to_branch_name = serializers.CharField(source='to_branch.name', read_only=True)

    approved_by = serializers.StringRelatedField(read_only=True)
    processed_by = serializers.StringRelatedField(read_only=True)
    confirmed_by = serializers.StringRelatedField(read_only=True)

    quantity_received = serializers.IntegerField(read_only=True)
    damaged_quantity = serializers.IntegerField(read_only=True)
    
    status_display = serializers.CharField(source='get_transfer_status_display', read_only=True)
    time_since_requested = serializers.SerializerMethodField()
    formatted_transfer_date = serializers.SerializerMethodField()

    metadata = serializers.SerializerMethodField()

    class Meta:
        model = StockTransfer
        fields = [
            'id',
            'from_branch',
            'from_branch_name',
            'to_branch',
            'to_branch_name',
            'product',
            'product_name',
            'quantity',
            'transfer_date',
            'formatted_transfer_date',
            'time_since_requested',
            'approved',
            'approved_by',
            'transfer_status',
            'status_display',
            'processed_by',
            'rejection_reason',
            'is_warehouse_initiated',
            'received',
            'details',
            'requested_by',
            'confirmed_by',
            'confirmed_at',
            'quantity_received',
            'damaged_quantity',
            'metadata',
        ]
    
    def get_time_since_requested(self, obj):
        return timesince(obj.transfer_date)
    
    def get_formatted_transfer_date(self, obj):
        return obj.transfer_date.strftime('%Y-%m-%d %H:%M:%S') if obj.transfer_date else None

    def get_metadata(self, obj):
        return {
            'product_name': obj.product.name,
            'quantity': obj.quantity,
            'branch_name': obj.to_branch.name if obj.to_branch else None,
            'requested_by': str(obj.requested_by),
            'rejection_reason': obj.rejection_reason,
            'status_display': obj.get_transfer_status_display(),
            'time_since': timesince(obj.transfer_date) if obj.transfer_date else None,
        }


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserMeSerializer(read_only=True)
    recipient = UserMeSerializer(read_only=True)
    related_branch = SiteSerializer(read_only=True)
    time_since = serializers.SerializerMethodField()
    related_transfer = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'is_read',
            'sender',
            'recipient',
            'related_branch',
            'related_object_id',
            'created_at',
            'updated_at',
            'time_since',
            'related_transfer',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_time_since(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)

    def get_related_transfer(self, obj):
        if obj.notification_type == 'TRANSFER_REQUEST':
            try:
                transfer = StockTransfer.objects.get(id=obj.related_object_id)
                return StockTransferSerializer(transfer, context=self.context).data
            except StockTransfer.DoesNotExist:
                return None
        return None


class SaleItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    product_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SaleItem
        fields = ['product', 'product_name', 'quantity', 'price_at_sale']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else None



class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)  # Nested serializer for SaleItem
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Sale
        fields = ['branch', 'customer', 'customer_name', 'payment_method', 'total_amount', 'processed_by', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')  # Extract nested items data
        print("ITEM DESERIALIZATION TYPES:")
        for i, item in enumerate(items_data):
            print(f"Item {i}: product={item.get('product')} ({type(item.get('product'))})")

        print("Validated Data:", validated_data)  # Debug log
        print("Items Data:", items_data)  # Debug log

        with transaction.atomic():
            # Create the Sale object
            sale = Sale.objects.create(**validated_data)

            # Create SaleItem objects for each item in items_data
            for item_data in items_data:
                print("Processing Item:", item_data)  # Debug log
                product= item_data.get('product')  # Use .get() to avoid KeyError
                quantity = item_data.get('quantity')
                price_at_sale = item_data.get('price_at_sale')

                # Validate that product_id is present
                if not product:
                    raise serializers.ValidationError("Product ID is required for each item.")
                    print("Product ID is required for each item.")  # Debug log

                # Fetch the inventory item
                inventory_item = Inventory.objects.filter(product=product, branch=sale.branch).first()
                
                if not inventory_item or inventory_item.quantity < quantity:
                    raise serializers.ValidationError(f"Insufficient stock for product {product.name}")
                
                # Deduct stock
                inventory_item.quantity -= quantity
                inventory_item.save()
                
                # Log the stock movement
                StockMovement.objects.create(
                    product=product,
                    branch=sale.branch,
                    movement_type='REMOVE',
                    quantity=quantity,
                    details=f"Sold via {sale.payment_method}"
                )

                # Create SaleItem
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    price_at_sale=price_at_sale
                )
            
            # Invalidate cache (if applicable)
            invalidate_cache(user=self.context['request'].user)
        
        return sale

class CustomerSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'name', 'title','first_name', 'last_name','phone_number', 'email']

    def get_name(self, obj):
        return f'{obj.title} {obj.first_name} {obj.last_name}'.strip() or 'Anonymous'
    

class NotificationSerializer(serializers.ModelSerializer):
    sender = UserMeSerializer(read_only=True)
    recipient = UserMeSerializer(read_only=True)
    related_branch = SiteSerializer(read_only=True)
    time_since = serializers.SerializerMethodField()
    related_transfer = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'is_read',
            'sender',
            'recipient',
            'related_branch',
            'related_object_id',
            'created_at',
            'updated_at',
            'time_since',
            'related_transfer',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_time_since(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)

    def get_related_transfer(self, obj):
        if obj.notification_type == 'TRANSFER_REQUEST':
            try:
                transfer = StockTransfer.objects.get(id=obj.related_object_id)
                return StockTransferSerializer(transfer, context=self.context).data
            except StockTransfer.DoesNotExist:
                return None
        return None
    

class WarehouseReceivingSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    batch_number = serializers.CharField(required=False, allow_blank=True)
    expiration_date = serializers.DateField(required=False, allow_null=True)

    def validate(self, data):
        if data['quantity'] <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return data
