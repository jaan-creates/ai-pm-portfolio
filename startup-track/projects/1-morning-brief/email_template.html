// Parse Claude's reply, compute cost from usage, build the HTML email
const resp = $json;                                   // HTTP Request output (content + usage)
let raw = resp.content[0].text.replace(/```json/g,'').replace(/```/g,'').trim();
let b;
try { b = JSON.parse(raw); }
catch(e){ b = { hook:"Brief parse failed", one_thing: raw.slice(0,400), weather_line:"",
  work_items:[], personal_items:[], news:[], world_cup:[], read_more:[], actionables:[], closure_line:null }; }

const date = $('Assemble').first().json.dateInfo.Date;

// Cost — VERIFY current Sonnet pricing in your Anthropic console; these are ~early-2026 rates
const IN_RATE = 3/1e6, OUT_RATE = 15/1e6;
const u = resp.usage || {input_tokens:0, output_tokens:0};
const cost = "$" + (u.input_tokens*IN_RATE + u.output_tokens*OUT_RATE).toFixed(4);

const INK="#0D0D0F", PURPLE="#7F77DD", GREEN="#22C55E", ORANGE="#F97316", CARD="#fff", BG="#f4f4f7";
// Normalize any item shape (string or object) to a display string
const toLine = x => {
  if (typeof x === 'string') return x;
  if (x && typeof x === 'object') {
    // common shapes Claude produces: {task, time}, {item, estimate}, {text}
    const main = x.task || x.item || x.text || x.action || Object.values(x).find(v => typeof v === 'string') || JSON.stringify(x);
    const time = x.time || x.time_estimate || x.estimate || '';
    return time ? `${main} <span style="color:#999">(${time})</span>` : main;
  }
  return String(x);
};
const li = a => (a||[]).map(x=>`<div style="margin:6px 0;color:#333;font-size:14px;line-height:1.5">• ${toLine(x)}</div>`).join('');
const card = (t,inner,acc)=>`<tr><td style="padding:8px 0"><table width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border-radius:14px;border-left:4px solid ${acc};box-shadow:0 1px 3px rgba(0,0,0,.06)"><tr><td style="padding:16px 20px"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${acc};font-weight:700;margin-bottom:8px">${t}</div>${inner}</td></tr></table></td></tr>`;
const readMore = (b.read_more||[]).map(r=>`<div style="margin:10px 0"><div style="font-size:14px;font-weight:600;color:${INK}">${r.source?r.source+' — ':''}${r.headline||''}</div><div style="font-size:13px;color:#555;line-height:1.5;margin-top:2px">${r.blurb||''}</div></div>`).join('');
const wc = (b.world_cup&&b.world_cup.length)? card('⚽ World Cup 2026', li(b.world_cup), ORANGE):'';

const html = `<div style="margin:0;padding:0;background:${BG}"><style>@keyframes shimmer{0%{background-position:0% 50%}100%{background-position:100% 50%}}</style>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
<tr><td style="background:linear-gradient(120deg,${PURPLE},${ORANGE});background-size:200% 200%;animation:shimmer 6s linear infinite alternate;border-radius:16px;padding:26px 24px">
<div style="color:#fff;font-size:13px;opacity:.9;font-weight:600">☀️ DAYBREAK · ${date}</div>
<div style="color:#fff;font-size:22px;font-weight:800;line-height:1.3;margin-top:6px">${b.hook||''}</div></td></tr>
<tr><td style="padding:16px 0 4px"><table width="100%" cellpadding="0" cellspacing="0" style="background:${INK};border-radius:14px"><tr><td style="padding:20px 22px">
<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${GREEN};font-weight:700;margin-bottom:6px">Today's one thing</div>
<div style="color:#fff;font-size:17px;line-height:1.5;font-weight:600">${b.one_thing||''}</div></td></tr></table></td></tr>
<tr><td style="padding:4px 6px 8px;color:#555;font-size:13px">🌦️ ${b.weather_line||''}</td></tr>
${wc}
${(b.work_items&&b.work_items.length)?card('Work',li(b.work_items),PURPLE):''}
${(b.personal_items&&b.personal_items.length)?card('For you',li(b.personal_items),GREEN):''}
${(b.actionables&&b.actionables.length)?card('Actionables',li(b.actionables),ORANGE):''}
${(b.news&&b.news.length)?card('World & India',li(b.news),'#888'):''}
${readMore?card('Read more',readMore,PURPLE):''}
${b.closure_line?`<tr><td style="padding:10px 8px;color:#999;font-size:12px;font-style:italic">${b.closure_line}</td></tr>`:''}
<tr><td style="padding:14px 8px;color:#999;font-size:11px;border-top:1px solid #e5e5e5">🔥 Day ${$('Assemble').first().json.dateInfo.streak_count||1} · ⚙️ Claude Sonnet · ${u.input_tokens} in / ${u.output_tokens} out · ~${cost}/run · n8n self-hosted</td></tr>
</table></td></tr></table></div>`;

return [{ json: { ...b, html, cost, tokens_in:u.input_tokens, tokens_out:u.output_tokens } }];
