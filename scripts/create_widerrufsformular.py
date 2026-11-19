from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt


OUT = Path(__file__).resolve().parents[1] / "assets" / "de" / "Widerrufsformular_Yumetics.docx"


def set_font(run, size=11, bold=False):
    run.font.name = "Arial"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    run.font.size = Pt(size)
    run.bold = bold


def paragraph(document, text="", size=11, bold=False, space_after=8):
    p = document.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    set_font(run, size, bold)
    return p


def blank_field(document, label, lines=1):
    p = document.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(label)
    set_font(run, 11)
    for _ in range(lines):
        line = document.add_paragraph("________________________________________________________________________________")
        line.paragraph_format.space_after = Pt(4)
        for run in line.runs:
            set_font(run, 10)


doc = Document()
section = doc.sections[0]
section.top_margin = Inches(0.8)
section.bottom_margin = Inches(0.75)
section.left_margin = Inches(0.85)
section.right_margin = Inches(0.85)

styles = doc.styles
styles["Normal"].font.name = "Arial"
styles["Normal"]._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
styles["Normal"]._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
styles["Normal"].font.size = Pt(11)

title = doc.add_paragraph(style="Title")
title.alignment = WD_ALIGN_PARAGRAPH.LEFT
title.paragraph_format.space_after = Pt(18)
title_run = title.add_run("Muster Widerrufsformular")
set_font(title_run, 22, True)

paragraph(
    doc,
    "Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück.",
    11,
    False,
    18,
)

paragraph(doc, "An", 11, True, 2)
for line in [
    "NEXT MOVE DIGITAL",
    "2 Cresswell Gardens Flat 3",
    "London SW5 0BJ",
    "United Kingdom",
    "E-Mail: info-at@mobileinfo.biz",
    "Telefonnummer: 0800 100 336",
]:
    paragraph(doc, line, 11, False, 1)

paragraph(doc, "", 11, False, 10)
paragraph(
    doc,
    "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*):",
    11,
    False,
    2,
)
blank_field(doc, "", 2)
blank_field(doc, "Bestellt am (*) / erhalten am (*)", 1)
blank_field(doc, "Name des/der Verbraucher(s)", 1)
blank_field(doc, "Anschrift des/der Verbraucher(s)", 2)
blank_field(doc, "Datum", 1)
blank_field(doc, "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)", 1)

paragraph(doc, "(*) Unzutreffendes streichen.", 9, False, 0)

doc.core_properties.title = "Muster Widerrufsformular Yumetics"
doc.core_properties.subject = "Muster Widerrufsformular"
doc.core_properties.author = "Yumetics"
OUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUT)
print(OUT)
