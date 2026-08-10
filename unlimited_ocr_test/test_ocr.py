import os
import sys
import tempfile

import pymupdf as fitz
import torch

from transformers import AutoModel, AutoTokenizer

MODEL_NAME = "baidu/Unlimited-OCR"

print("Loading Unlimited-OCR...")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
)

model = AutoModel.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
    use_safetensors=True,
    torch_dtype=torch.bfloat16,
)

model = model.eval().cuda()

print("Model loaded.")


def pdf_to_images(pdf_path, dpi=300):
    doc = fitz.open(pdf_path)

    tmp_dir = tempfile.mkdtemp(
        prefix="unlimited_ocr_"
    )

    matrix = fitz.Matrix(
        dpi / 72,
        dpi / 72,
    )

    paths = []

    for i, page in enumerate(doc):
        output = os.path.join(
            tmp_dir,
            f"page_{i + 1:04d}.png",
        )

        page.get_pixmap(
            matrix=matrix
        ).save(output)

        paths.append(output)

    doc.close()

    return paths


def run_image(image_path):
    output_dir = "./outputs"

    os.makedirs(
        output_dir,
        exist_ok=True,
    )

    model.infer(
        tokenizer,
        prompt="<image>document parsing.",
        image_file=image_path,
        output_path=output_dir,

        base_size=1024,
        image_size=640,
        crop_mode=True,

        max_length=32768,
        no_repeat_ngram_size=35,
        ngram_window=128,

        save_results=True,
    )


def run_pdf(pdf_path):
    output_dir = "./outputs"

    os.makedirs(
        output_dir,
        exist_ok=True,
    )

    pages = pdf_to_images(
        pdf_path,
        dpi=300,
    )

    print(
        f"PDF converted to {len(pages)} pages."
    )

    model.infer_multi(
        tokenizer,
        prompt="<image>Multi page parsing.",
        image_files=pages,
        output_path=output_dir,

        image_size=1024,

        max_length=32768,
        no_repeat_ngram_size=35,
        ngram_window=1024,

        save_results=True,
    )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Usage: python test_ocr.py document.pdf"
        )
        sys.exit(1)

    document = sys.argv[1]

    if not os.path.exists(document):
        raise FileNotFoundError(document)

    extension = os.path.splitext(
        document
    )[1].lower()

    if extension == ".pdf":
        run_pdf(document)
    else:
        run_image(document)

    print("\nDone.")
    print("Check ./outputs")