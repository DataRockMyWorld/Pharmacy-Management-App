from django.db import models


class Site(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    branch_code = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(max_length=155)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_warehouse = models.BooleanField(default=False)


    def __str__(self):
        return f'{self.name} ({"Warehouse" if self.is_warehouse else "Branch"})' 
