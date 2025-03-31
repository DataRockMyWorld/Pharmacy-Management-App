from django.db import models
from accounts.models import User
from products.models import Product
from sites.models import Site
from django.utils import timezone

class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_index=True)
    branch = models.ForeignKey(Site, on_delete=models.CASCADE, db_index=True)
    batch_number = models.CharField(max_length=50, blank=True)
    expiration_date = models.DateField(null=True, blank=True)
    quantity = models.PositiveIntegerField(default=0)
    threshold_quantity = models.PositiveIntegerField(default=10)  # Low-stock alert trigger
    received_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    last_checked = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'branch', 'batch_number')

    def __str__(self):
        return f"{self.product.name} at {self.branch.name}"

    def is_expired(self):
        return self.expiration_date and self.expiration_date < timezone.now().date()

    def adjust_quantity(self, quantity):
        self.quantity += quantity
        self.save()


class StockTransfer(models.Model):
    TRANSFER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]

    from_branch = models.ForeignKey(Site, related_name='from_branch', on_delete=models.CASCADE)
    to_branch = models.ForeignKey(Site, related_name='to_branch', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    transfer_date = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    transfer_status = models.CharField(max_length=10, choices=TRANSFER_STATUS_CHOICES, default='PENDING')
    received = models.BooleanField(default=False)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"Transfer from {self.from_branch.name} to {self.to_branch.name} - {self.product.name}"



class StockMovement(models.Model):
    MOVEMENT_TYPE_CHOICES = [
        ('ADD', 'Addition'),
        ('REMOVE', 'Removal'),
        ('TRANSFER', 'Transfer'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    branch = models.ForeignKey(Site, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.PositiveIntegerField()
    date = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.product.name} at {self.branch.name}"



class InventoryVersion(models.Model):
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE)
    previous_quantity = models.PositiveIntegerField()
    new_quantity = models.PositiveIntegerField()
    modified_by = models.ForeignKey(User, on_delete=models.CASCADE)
    modified_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Change in {self.inventory.product.name} at {self.inventory.branch.name} - {self.modified_at}"
    

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('TRANSFER_REQUEST', 'Transfer Request'),
        ('TRANSFER_APPROVAL', 'Transfer Approval'),
        ('TRANSFER_REJECTION', 'Transfer Rejection'),
        ('STOCK_ALERT', 'Stock Alert'),
        ('SYSTEM', 'System Notification'),
    ]

    recipient = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    related_branch = models.ForeignKey(Site, null=True, blank=True, on_delete=models.SET_NULL)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default="Transfer Request")
    title = models.CharField(max_length=100, null=True, default="Untitled Notification")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_object_id = models.PositiveIntegerField(null=True, blank=True)  # For linking to transfers, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.notification_type} - {self.title}"
