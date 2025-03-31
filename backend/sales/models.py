from django.db import models, transaction
from inventory.models import Inventory
from sites.models import Site
from accounts.models import User, Customer
from products.models import Product

# Create your models here.

class Sale(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('MOMO', 'Mobile Money'),
        ('CARD', 'Card'),
    ]

    branch = models.ForeignKey(Site, on_delete=models.CASCADE, db_index=True)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, db_index=True)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    receipt_sent = models.BooleanField(default=False)
    email_status = models.CharField(max_length=20, default='PENDING')
    sms_status = models.CharField(max_length=20, default='PENDING')

    def __str__(self):
        return f"Sale at {self.branch.name} - {self.total_amount}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} - {self.quantity} pcs"
