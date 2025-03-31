from io import BytesIO
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.core.mail import send_mail
from django.conf import settings
from twilio.rest import Client
from django.conf import settings
from weasyprint import HTML
from inventory.models import Inventory
from django.db import models
from django.core.cache import cache
from inventory.models import Notification
from tabulate import tabulate

def generate_pdf(template_src, context_dict={}):
    html_string = render_to_string(template_src, context_dict)
    html = HTML(string=html_string)
    result = BytesIO()
    html.write_pdf(target=result)
    
    return HttpResponse(result.getvalue(), content_type='application/pdf')

def send_email(subject, message, recipient_list, html_message=None):
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        recipient_list,
        fail_silently=False,
        html_message=html_message
    )


def send_sms(to, body):
    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to
        )
        return message.sid
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return None
    

def check_low_stock(branch):
    low_stock_items = Inventory.objects.filter(branch=branch, quantity__lt=models.F('threshold_quantity'))
    return low_stock_items


def get_or_set_cache(key, fetch_function, timeout=300):
    data = cache.get(key)
    if not data:
        data = fetch_function()
        cache.set(key, data, timeout)
    return data


def invalidate_cache(user=None):
    """
    Clears cache for all related keys.
    If 'user' is provided, only invalidate cache related to that user.
    """
    keys_to_invalidate = []

    # Invalidate all cached data for CEO
    if user is None or user.role == 'CEO':
        keys_to_invalidate += [
            'statistics_CEO_all',
            'monthly_sales_CEO_all',
            'sales_table_CEO_all',
            'expiry_list_CEO_all'
        ]

    # Invalidate cache for Branch Admins
    if user and user.role == 'Admin':
        keys_to_invalidate += [
            f'statistics_Admin_{user.branch.id}',
            f'monthly_sales_Admin_{user.branch.id}',
            f'sales_table_Admin_{user.branch.id}',
            f'expiry_list_Admin_{user.branch.id}'
        ]
    
    for key in keys_to_invalidate:
        cache.delete(key)
        


# notifications/utils.py

def create_notification(
    recipient,
    notification_type,
    title,
    message,
    sender=None,
    related_branch=None,
    related_object_id=None
):
    """
    Helper function to create notifications
    """
    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        sender=sender,
        related_branch=related_branch,
        related_object_id=related_object_id
    )
    return notification

def create_transfer_request_notification(transfer):
    """
    Create notification for stock transfer request
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # This assumes the CEO is the only warehouse user
    recipient = User.objects.filter(is_staff=True).first()
    
    if recipient:
        return create_notification(
            recipient=recipient,
            notification_type='TRANSFER_REQUEST',
            title=f'New Transfer Request from {transfer.from_branch.name}',
            message=f'{transfer.from_branch.name} requests {transfer.quantity} units of {transfer.product.name}',
            sender=transfer.requested_by,  # Assuming you have this field
            related_branch=transfer.from_branch,
            related_object_id=transfer.id
        )
        
        

def tabulate_qs(queryset, *, fields: list[str] | None = None, exclude: list[str] | None = None) -> str:
    # Make sure the table won't be empty
    if not fields:
        fields = [field.name for field in queryset.model._meta.fields]

    if not exclude:
        exclude = []

    fields = [field for field in fields if field not in exclude]

    return tabulate(
        tabular_data=queryset.values_list(*fields),
        headers=fields,
        tablefmt="github",
    )


def print_qs(queryset, *, fields: list[str] | None = None, exclude: list[str] | None = None) -> None:
    print(tabulate_qs(queryset, fields=fields, exclude=exclude))