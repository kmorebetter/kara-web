import JSZip from "jszip";
import { ContractConfig } from "./types";

export async function generateContract(
  templateBytes: ArrayBuffer,
  config: ContractConfig
): Promise<Blob> {
  const zip = await JSZip.loadAsync(templateBytes);
  const p = config.performer;
  const a = config.agent;
  const d = config.deal;
  const agentPhone = a.cell !== "n/a" ? a.cell : a.phone;

  let xml = await zip.file("word/document.xml")!.async("string");

  // Production title (& -> &amp; for XML)
  const prodTitle = config.production_title.replaceAll("&", "&amp;");

  // Text swaps — use replaceAll since performer name appears 3 times
  const textSwaps: [string, string][] = [
    [">EFFIGY<", `>${prodTitle}<`],
    [">Toby Hargrave<", `>${p.name}<`],
    [">Canadian<", `>${p.citizenship}<`],
    [">604-992-2386<", `>${p.phone}<`],
    [">11525<", `>${p.ubcp_number}<`],
    [">642-110-589<", `>${p.sin}<`],
    [">HART1429<", `>${p.cavco}<`],
    [">13748 8268<", `>${p.gst}<`],
    [">Roxanne Kinsman<", `>${a.name}<`],
    [">roxanne@nuancemgmt.com (cc: eva@nuancemgmt.com)<", `>${a.email}<`],
    [">778-323-1252<", `>${agentPhone}<`],
    [">At Producer Discretion<", `>${d.credit}<`],
    [">Performer to Self Drive<", `>${d.transportation}<`],
  ];

  for (const [old, replacement] of textSwaps) {
    xml = xml.replaceAll(old, replacement);
  }

  // Address (has xml:space="preserve" and trailing space)
  xml = xml.replaceAll(
    "c/o Nuance Talent Management, #102 2556 Highbury St, Vancouver, BC ",
    p.address
  );

  // Postal code
  xml = xml.replaceAll(" V6R 3T3", ` ${p.postal_code}`);

  // Role
  xml = xml.replaceAll(">#6 BIG MIKE<", `>${d.role}<`);

  // Guaranteed dates (& -> &amp; in XML)
  xml = xml.replaceAll(
    ">July 7, 8 &amp; 14, 2025<",
    `>${d.guaranteed_dates.replaceAll("&", "&amp;")}<`
  );

  // Daily rate
  xml = xml.replaceAll(">1500.00<", `>${d.daily_rate}<`);

  // Hourly / OT rates
  xml = xml.replaceAll(">114.71<", `>${d.hourly_rate}<`);
  xml = xml.replaceAll(">172.07<", `>${d.ot_15x}<`);
  xml = xml.replaceAll(">229.42<", `>${d.ot_20x}<`);

  // Location
  xml = xml.replaceAll(
    " Fraserwood Studios, 22031 Fraserwood Way, Richmond BC V6W 1J5 ",
    ` ${d.location} `
  );

  // Other Contractual Obligations (two-part replacement)
  xml = xml.replaceAll(
    "Dressing Facility: Triple Banger. Send Contract to Agent for signature.",
    d.other_contractual
  );
  xml = xml.replaceAll(
    "All additional fees to be paid at Principal Scale. Cheques payable to " +
      "Toby Hargrave c/o Agent Address. *Performer is n/a July 9 - Filming in " +
      "Calgary. Performer to take the 2nd to last flight from YVR-YYC on July 8." +
      "*ALL FIGURES ARE IN CANADIAN DOLLARS* ",
    ""
  );

  // DOB - find the bookmark Text16, then replace the next >n/a< after it
  const bookmarkPos = xml.indexOf('w:name="Text16"');
  if (bookmarkPos > 0) {
    const naPos = xml.indexOf(">n/a<", bookmarkPos);
    if (naPos > 0) {
      xml = xml.substring(0, naPos) + `>${p.dob}<` + xml.substring(naPos + 5);
    }
  }

  zip.file("word/document.xml", xml);

  return await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
