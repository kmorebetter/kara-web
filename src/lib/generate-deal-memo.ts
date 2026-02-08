import JSZip from "jszip";
import { ContractConfig } from "./types";
import { excelSerialDate } from "./excel-date";

export async function generateDealMemo(
  templateBytes: ArrayBuffer,
  config: ContractConfig
): Promise<Blob> {
  const zip = await JSZip.loadAsync(templateBytes);
  const p = config.performer;
  const a = config.agent;
  const d = config.deal;

  // --- Shared Strings ---
  let ss = await zip.file("xl/sharedStrings.xml")!.async("string");

  const stringSwaps: [string, string][] = [
    [">Toby Hargrave<", `>${p.name}<`],
    [">642-110-589<", `>${p.sin}<`],
    [">13748 8268<", `>${p.gst}<`],
    [">604-992-2386<", `>${p.phone}<`],
    [">seetobylive@gmail.com<", `>${p.email}<`],
    [">Roxanne Kinsman<", `>${a.name}<`],
    [">Nuance Talent Management<", `>${a.agency}<`],
    [">#102 2556 Highbury St<", a.agency_address_line1 ? `>${a.agency_address_line1}<` : "><"],
    [">Vancouver, BC V6R 3T3<", a.agency_address_line2 ? `>${a.agency_address_line2}<` : "><"],
    [">778-323-1252<", `>${a.cell}<`],
    [">roxanne@nuancemgmt.com (cc: eva@nuancemgmt.com)<", `>${a.email}<`],
    [">BIG MIKE<", `>${d.role}<`],
    [">#6<", `>${d.role_number}<`],
    [">July 7 - August 14, 2025<", `>${d.outside_dates}<`],
    [">Triple Banger<", `>${d.dressing_facility}<`],
  ];

  for (const [old, replacement] of stringSwaps) {
    ss = ss.replaceAll(old, replacement);
  }

  // Salary line (has leading space + xml:space="preserve")
  ss = ss.replaceAll(
    "> $1500/day +135% (Overtime, wardrobe, read thru, ADR etc. at Principal scale)<",
    `>${d.salary_line}<`
  );

  // Day guarantee (& -> &amp; for XML)
  const guaranteeText = `${d.num_days}, ${d.guaranteed_dates}`.replaceAll("&", "&amp;");
  ss = ss.replaceAll(
    ">One (1) Day, o/a July 7, 8, 14 &amp; 29, 2025<",
    `>${guaranteeText}<`
  );

  // Transport block (rich text replacement)
  const oldTransport =
    '<si><r><rPr><b/><sz val="10"/><rFont val="Eurostile"/></rPr>' +
    '<t xml:space="preserve">*Performer is n/a July 9 - Filming in Calgary. ' +
    "Performer to take the 2nd to last flight from YVR-YYC on July 8. </t></r>" +
    '<r><rPr><sz val="10"/><rFont val="Eurostile"/></rPr>' +
    "<t>TRANSPORT: Performer to Self Drive. Send Contract to Agent for signature. " +
    "All additional fees to be paid at Principal Scale. Cheques payable to " +
    "Toby Hargrave c/o Agent Address. *ALL FIGURES ARE IN CANADIAN DOLLARS*</t></r></si>";
  const newTransport =
    '<si><r><rPr><sz val="10"/><rFont val="Eurostile"/></rPr>' +
    `<t>${d.other_contractual}</t></r></si>`;
  ss = ss.replaceAll(oldTransport, newTransport);

  // Add new shared strings (passport, per_diem, address, dob)
  const newStrings = [
    p.passport || "n/a",
    d.per_diem || "n/a",
    p.address || "n/a",
    p.dob || "n/a",
  ];
  const newSiXml = newStrings.map((s) => `<si><t>${s}</t></si>`).join("");
  ss = ss.replace("</sst>", newSiXml + "</sst>");

  // Update counts (original had 107 strings)
  const newCount = 107 + newStrings.length;
  ss = ss.replace(/count="\d+"/, `count="${newCount}"`);
  ss = ss.replace(/uniqueCount="\d+"/, `uniqueCount="${newCount}"`);

  zip.file("xl/sharedStrings.xml", ss);

  // --- Sheet XML ---
  let sheet = await zip.file("xl/worksheets/sheet1.xml")!.async("string");

  // Memo date
  const newSerial = String(excelSerialDate(config.memo_date));
  sheet = sheet.replace(
    /(<c r="D5"[^>]*><v>)\d+(<\/v><\/c>)/,
    `$1${newSerial}$2`
  );

  // UBCP# cell: change to shared string type with value 38 (n/a)
  sheet = sheet.replace(
    /(<c r="D8" s=")(\d+")(><v>)\d+(<\/v><\/c>)/,
    '$1$2 t="s"$338$4'
  );

  // New string indices: passport=107, per_diem=108, address=109, dob=110
  sheet = sheet.replace(
    /(<c r="D10"[^>]*><v>)38(<\/v><\/c>)/,
    "$1107$2"
  );
  sheet = sheet.replace(
    /(<c r="D25"[^>]*><v>)38(<\/v><\/c>)/,
    "$1108$2"
  );
  sheet = sheet.replace(
    /(<c r="B9"[^>]*><v>)38(<\/v><\/c>)/,
    "$1109$2"
  );
  sheet = sheet.replace(
    /(<c r="D17"[^>]*><v>)38(<\/v><\/c>)/,
    "$1110$2"
  );

  // BC Resident: YES(34) -> NO(33) if not BC resident
  if (!p.bc_resident) {
    sheet = sheet.replace(
      /(<c r="B21"[^>]*><v>)34(<\/v><\/c>)/,
      "$133$2"
    );
  }

  zip.file("xl/worksheets/sheet1.xml", sheet);

  // Generate output
  return await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
