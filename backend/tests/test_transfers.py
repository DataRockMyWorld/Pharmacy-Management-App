from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from inventory.models import Inventory, StockTransfer, StockMovement, Notification
from products.models import Product
from sites.models import Site
from accounts.models import User
from django.utils import timezone

class WarehouseTransferTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.warehouse_site = Site.objects.create(name="Warehouse", is_warehouse=True)
        self.branch_site = Site.objects.create(name="Branch", is_warehouse=False)

        self.warehouse_user = User.objects.create_user(username="warehouse", password="pass", site=self.warehouse_site)
        self.branch_user = User.objects.create_user(username="branch", password="pass", site=self.branch_site)

        self.product = Product.objects.create(name="Test Product")
        self.inventory = Inventory.objects.create(product=self.product, branch=self.warehouse_site, quantity=100)

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_dispatch_success(self):
        self.authenticate(self.warehouse_user)
        response = self.client.post('/v1/warehouse/dispatch/', {
            "product_id": self.product.id,
            "quantity": 20,
            "destination_id": self.branch_site.id,
            "notes": "Urgent refill"
        })
        self.assertEqual(response.status_code, 200)
        transfer = StockTransfer.objects.get(id=response.data['transfer_id'])
        self.assertEqual(transfer.transfer_status, 'IN_TRANSIT')

    def test_dispatch_insufficient_stock(self):
        self.inventory.quantity = 5
        self.inventory.save()
        self.authenticate(self.warehouse_user)
        res = self.client.post('/v1/warehouse/dispatch/', {
            "product_id": self.product.id,
            "quantity": 10,
            "destination_id": self.branch_site.id
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('Insufficient stock', res.data['error'])

    def test_receive_transfer_success(self):
        transfer = StockTransfer.objects.create(
            product=self.product,
            quantity=15,
            transfer_status='IN_TRANSIT',
            from_branch=self.warehouse_site,
            to_branch=self.branch_site,
        )
        self.authenticate(self.branch_user)
        res = self.client.post(f'/v1/warehouse/receive-transfer/{transfer.id}/')
        self.assertEqual(res.status_code, 200)
        transfer.refresh_from_db()
        self.assertEqual(transfer.transfer_status, 'RECEIVED')

    def test_receive_transfer_already_done(self):
        transfer = StockTransfer.objects.create(
            product=self.product,
            quantity=15,
            transfer_status='RECEIVED',
            from_branch=self.warehouse_site,
            to_branch=self.branch_site,
        )
        self.authenticate(self.branch_user)
        res = self.client.post(f'/v1/warehouse/receive-transfer/{transfer.id}/')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Already received', res.data['error'])

    def test_receive_forbidden_for_warehouse(self):
        transfer = StockTransfer.objects.create(
            product=self.product,
            quantity=15,
            transfer_status='IN_TRANSIT',
            from_branch=self.warehouse_site,
            to_branch=self.branch_site,
        )
        self.authenticate(self.warehouse_user)
        res = self.client.post(f'/v1/warehouse/receive-transfer/{transfer.id}/')
        self.assertEqual(res.status_code, 403)

    def test_inventory_adjusted_on_dispatch(self):
        self.authenticate(self.warehouse_user)
        res = self.client.post('/v1/warehouse/dispatch/', {
            "product_id": self.product.id,
            "quantity": 10,
            "destination_id": self.branch_site.id
        })
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity, 90)

    def test_inventory_increased_on_receipt(self):
        transfer = StockTransfer.objects.create(
            product=self.product,
            quantity=15,
            transfer_status='IN_TRANSIT',
            from_branch=self.warehouse_site,
            to_branch=self.branch_site,
        )
        self.authenticate(self.branch_user)
        self.client.post(f'/v1/warehouse/receive-transfer/{transfer.id}/')
        inv = Inventory.objects.get(product=self.product, branch=self.branch_site)
        self.assertEqual(inv.quantity, 15)

