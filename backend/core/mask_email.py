def mask_email(email):
    """
    Mask email for secure logging: j***@domain.com
    """
    local, domain = email.split('@')
    return f"{local[0]}***@{domain}"
