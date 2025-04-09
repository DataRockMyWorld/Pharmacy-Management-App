from rest_framework import permissions
from sites.models import Site
from accounts.models import User
from inventory.models import Inventory, StockMovement, StockTransfer
from sales.models import Sale

class IsCEOOrBranchAdmin(permissions.BasePermission):
    """
    Custom permission to allow only CEOs or Branch Admins to access views.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.role == 'CEO':
            return True
        
        if request.user.role == 'Admin' and request.user.branch:
            if request.method == ['GET', 'POST']:
                return True
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'CEO':
            return True
        
        if request.user.role == 'Admin':
            if isinstance(obj, (Site, Inventory, StockMovement, StockTransfer, Sale)):
                return obj.branch == request.user.branch
        
        return False

class IsCEO(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'CEO'
