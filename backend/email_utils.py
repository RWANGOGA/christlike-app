import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from config import settings

def get_mail_config() -> ConnectionConfig:
    return ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME or "",
        MAIL_PASSWORD=settings.MAIL_PASSWORD or "",
        MAIL_FROM=settings.MAIL_FROM or "noreply@example.com",
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER or "",
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )

async def send_password_reset_email(email: str, token: str, username: str):
    if not settings.MAIL_USERNAME or not settings.MAIL_SERVER:
        return
    frontend_url = settings.FRONTEND_URL
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #D4A5A5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">Christ-Like</h2>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hello {username},</p>
                <p>We received a request to reset your password.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background: #9CAF88; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset My Password</a>
                </p>
                <p style="font-size: 12px; color: #666;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    message = MessageSchema(
        subject="Reset Your Christ-Like Password",
        recipients=[email],
        body=html_content,
        subtype="html"
    )
    
    fm = FastMail(get_mail_config())
    await fm.send_message(message)
