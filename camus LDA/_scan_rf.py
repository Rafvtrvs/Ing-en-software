from pypdf import PdfReader
import re

r = PdfReader("Grupo 21-Documento 0 MODI.pdf")
targets = [
  "RF-36","RF-37","RF-38","RF-39","RF-40","RF-41","RF-42","RF-43",
  "RF36","RF37","RF38","RF39","RF40","RF41","RF42","RF43",
  "CU-120","CU-121","CU-122","CU-123","CU-124",
  "CU-135","CU-136","CU-137","CU-138","CU-139","CU-140",
  "CU-141","CU-142","CU-143","CU-144","CU-145","CU-146","CU-147","CU-148",
]
# also Spanish patterns
hits = {t: [] for t in targets}
rf_defs = {}

for i, p in enumerate(r.pages):
    t = p.extract_text() or ""
    tn = re.sub(r"\s+", " ", t)
    for tgt in targets:
        if tgt.replace("-","") in tn.replace("-","") or tgt in tn:
            # looser
            pass
        if re.search(re.escape(tgt).replace(r"\-", r"[\s\-]?"), tn, re.I) or tgt in tn:
            hits[tgt].append(i+1)

# Search RF definitions more carefully in section 9.2
print("=== PAGE HITS ===")
for t, pages in hits.items():
    print(f"{t}: {pages[:8]}{'...' if len(pages)>8 else ''}")

print("\n=== RF DEFINITIONS (section ~9.2) ===")
for page_num in range(40, 55):
    t = re.sub(r"\s+", " ", r.pages[page_num].extract_text() or "")
    for n in range(36, 44):
        m = re.search(rf"RF[- ]?{n}\b[^.]{{0,200}}", t, re.I)
        if m:
            print(f"p{page_num+1}: {m.group(0)}")

print("\n=== CU TABLE ENTRIES 120-148 ===")
for n in [120,121,122,123,124,135,136,137,138,139,140,141,142,143,144,145,146,147,148]:
    found = False
    for i, p in enumerate(r.pages):
        t = re.sub(r"\s+", " ", p.extract_text() or "")
        # Caso de Uso N°120 etc
        m = re.search(rf"(?:Caso\s+de\s+[Uu]so\s+N[^\d]*{n}|CU[- ]?{n})\s*[:\.]?\s*([^\.]{{10,120}})", t)
        if m:
            print(f"CU-{n} p{i+1}: {m.group(0)[:160]}")
            found = True
            break
    if not found:
        print(f"CU-{n}: NO ENCONTRADO")
