import os
import requests
from dotenv import load_dotenv

load_dotenv('backend/.env')

token = os.getenv("TELEGRAM_BOT_TOKEN")
chat_id = os.getenv("TELEGRAM_CHAT_ID")

print(f"Token: {token}")
print(f"Chat ID: {chat_id}")

if not token or not chat_id:
    print("Error: Missing token or chat_id in .env")
    exit(1)

url = f"https://api.telegram.org/bot{token}/sendMessage"
payload = {
    "chat_id": chat_id,
    "text": "🧪 Test notification from RescueVision. If you see this, the bot is working!",
    "parse_mode": "HTML"
}

try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
