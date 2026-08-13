import asyncio
import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

# Load environment variables from .env
load_dotenv()

# Configure Brevo SMTP
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_TLS=os.getenv("MAIL_TLS", "true").lower() == "true",
    MAIL_SSL=os.getenv("MAIL_SSL", "false").lower() == "true",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

async def test_email():
    print("📤 Sending test email via Brevo...")
    
    message = MessageSchema(
        subject="Test Email from Christ-Like 🚀",
        recipients=["akandwanahojonan256@gmail.com"],
        body="<h2>Hello Jonan!</h2><p>If you are reading this, your Brevo SMTP connection is working perfectly!</p>",
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)
    print("✅ Success! Check your Gmail inbox (and spam folder just in case).")

if __name__ == "__main__":
    asyncio.run(test_email())