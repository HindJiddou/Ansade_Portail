import qrcode

url = "http://102.216.27.135:5173/"

qr = qrcode.make(url)
qr.save("qr_site.png")

print("QR code généré avec succès")
