import sys
import socket
import qrcode

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

sys.stdout.reconfigure(encoding='utf-8')
local_ip = get_local_ip()
mobile_url = f"http://{local_ip}:5173/"

print("=" * 48)
print("🏛️  CAMPUS MAINTENANCE SYSTEM — MOBILE QR ACCESS")
print("=" * 48)
print(f"📱 Connect mobile to same Wi-Fi: {local_ip.rsplit('.', 1)[0]}.x")
print(f"🔗 Direct Link: {mobile_url}\n")

qr = qrcode.QRCode(border=1)
qr.add_data(mobile_url)
qr.make(fit=True)
qr.print_ascii(invert=True)

print("=" * 48)
print("Point your phone's camera at the QR code above to open.")
print("=" * 48)
