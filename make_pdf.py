from pypdf import PdfWriter
import os

def create_dummy_pdf(filename="dummy.pdf"):
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    
    # Writing to absolute path to avoid confusion
    target_path = os.path.join(os.getcwd(), filename if not filename == "dummy.pdf" else "dummy.pdf")
    print(f"Writing to {target_path}")
    
    with open(target_path, "wb") as f:
        writer.write(f)
    print(f"Created {target_path}")

if __name__ == "__main__":
    create_dummy_pdf("dummy.pdf")
