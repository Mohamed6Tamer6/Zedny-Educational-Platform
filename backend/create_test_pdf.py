
from reportlab.pdfgen import canvas

def create_pdf(filename):
    c = canvas.Canvas(filename)
    text = "This is a test document about the history of computers. " * 50
    c.drawString(100, 750, text[:100])
    c.drawString(100, 730, text[100:200])
    c.drawString(100, 710, text[200:])
    c.save()

if __name__ == "__main__":
    create_pdf("test_content_large.pdf")
