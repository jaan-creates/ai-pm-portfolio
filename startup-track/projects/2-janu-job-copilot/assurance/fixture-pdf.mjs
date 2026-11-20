// Tiny synthetic PDF with a real cross-reference table. The acceptance reader independently parses its bytes.
export function fixturePdf(lines, x=50) {
  const text='BT /F1 12 Tf '+x+' 750 Td 16 TL '+lines.map((s,i)=>(i?"T* ":"")+'('+s+') Tj').join('\n')+' ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+text.length+' >>\nstream\n'+text+'\nendstream'];
  let out='%PDF-1.4\n';const starts=[0];for(const [i,obj] of objects.entries()){starts.push(out.length);out+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';}
  const offset=out.length;out+='xref\n0 6\n0000000000 65535 f \n'+starts.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  return Buffer.from(out+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+offset+'\n%%EOF\n','ascii');
}
