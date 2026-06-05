import codecs

filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/patient-modules/patient-invoices/patientInvoices.tsx'
with codecs.open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

bad_chunk = """                </ul>
<div className="d-flex table-dropdown
</div>
</div>
</div>

          {/* Search & Sort */} mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">"""

good_chunk = """                </ul>
              </div>
            </div>
          </div>

          {/* Search & Sort */}
          <div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center justify-content-end flex-wrap row-gap-3">"""

content = content.replace(bad_chunk.replace('\n', '\r\n'), good_chunk)
content = content.replace(bad_chunk, good_chunk)

with codecs.open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
