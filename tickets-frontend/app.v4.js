// APP tickets v4 (conectado a PHP/MySQL)
console.log("APP v4 cargado");

// ===== Util =====
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const PRIORIDADES = ["baja","media","alta"];
const ESTADOS     = ["abierto","en_progreso","cerrado"];

const API = "http://localhost/tickets-backend";

// ===== Estado (memoria; ya no LocalStorage) =====
let cache = []; // lista proveniente de la BD

// ===== Store (API PHP) =====
const store = {
  async all() {
    const r = await fetch(`${API}/get_tickets.php`);
    const j = await r.json().catch(()=>({success:false,error:"Respuesta no válida"}));
    if (!r.ok || !j.success) throw new Error(j.error || `Error al listar (${r.status})`);
    return j.data;
  },
  async create({ titulo, descripcion, prioridad }) {
    const r = await fetch(`${API}/insert_ticket.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descripcion, prioridad })
    });
    const j = await r.json().catch(()=>({success:false,error:"Respuesta no válida"}));
    if (!r.ok || !j.success) throw new Error(j.error || `Error al crear (${r.status})`);
    return j.id;
  },
  async update(id, { titulo, descripcion, prioridad }) {
    const r = await fetch(`${API}/update_ticket.php`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, titulo, descripcion, prioridad })
    });
    const j = await r.json().catch(()=>({success:false,error:"Respuesta no válida"}));
    if (!r.ok || !j.success) throw new Error(j.error || `Error al actualizar (${r.status})`);
  },
  async nextState(id) {
    const r = await fetch(`${API}/patch_estado.php`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const j = await r.json().catch(()=>({success:false,error:"Respuesta no válida"}));
    if (!r.ok || !j.success) return { ok:false, msg: j.error || `Error al cambiar estado (${r.status})` };
    return { ok:true };
  },
  async remove(id) {
    const r = await fetch(`${API}/delete_tickets.php`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const j = await r.json().catch(()=>({success:false,error:"Respuesta no válida"}));
    if (!r.ok || !j.success) throw new Error(j.error || `Error al eliminar (${r.status})`);
  }
};

// ===== Validaciones =====
function validateTicket({titulo,descripcion,prioridad,estado,isCreate}){
  const errs = [];
  if(!titulo || titulo.trim().length < 5) errs.push("El título debe tener al menos 5 caracteres.");
  if(titulo && titulo.length > 120) errs.push("El título no debe exceder 120 caracteres.");
  if(!descripcion || descripcion.trim().length < 10) errs.push("La descripción debe tener al menos 10 caracteres.");
  if(descripcion && descripcion.length > 1000) errs.push("La descripción no debe exceder 1000 caracteres.");
  if(!PRIORIDADES.includes(prioridad)) errs.push("La prioridad debe ser baja | media | alta.");
  if(!isCreate && estado && !ESTADOS.includes(estado)) errs.push("Estado inválido.");
  return errs;
}

// ===== Render helpers =====
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
function nl2br(s){ return String(s).replace(/\n/g,"<br>"); }
function badgePrioridad(p){ const cls = p==="alta"?"high":p==="media"?"mid":"low"; return `<span class="badge ${cls}">${p}</span>`; }
function badgeEstado(e){ const cls = e==="abierto"?"state-open":e==="en_progreso"?"state-prog":"state-closed"; return `<span class="badge ${cls}">${e}</span>`; }
function row(t){
  return `<tr>
    <td>${t.id}</td>
    <td><strong>${escapeHTML(t.titulo)}</strong><br><small>${nl2br(escapeHTML(t.descripcion))}</small></td>
    <td>${badgePrioridad(t.prioridad)}</td>
    <td>${badgeEstado(t.estado)}</td>
    <td>${t.fecha_creacion}</td>
    <td class="actions">
      ${t.estado!=="cerrado" ? `<a href="#" class="link js-next" data-id="${t.id}">Siguiente estado</a>` : ""}
      <a href="#" class="link js-edit" data-id="${t.id}">Editar</a>
      <a href="#" class="link js-del" data-id="${t.id}">Eliminar</a>
    </td>
  </tr>`;
}

// ===== Filtros / orden / paginación =====
const state = { q:"", fEstado:"", fPrioridad:"", order:"fecha_desc", page:1, pageSize:5 };

function getFilteredOrdered() {
  let data = [...cache];
  const q = state.q.trim().toLowerCase();
  if(q) data = data.filter(t => t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q));
  if(state.fEstado)    data = data.filter(t => t.estado===state.fEstado);
  if(state.fPrioridad) data = data.filter(t => t.prioridad===state.fPrioridad);

  if(state.order==="fecha_asc")  data.sort((a,b)=> (a.fecha_creacion).localeCompare(b.fecha_creacion));
  if(state.order==="fecha_desc") data.sort((a,b)=> (b.fecha_creacion).localeCompare(a.fecha_creacion));
  if(state.order==="prioridad"){ const r={alta:3,media:2,baja:1}; data.sort((a,b)=> r[b.prioridad]-r[a.prioridad]); }
  if(state.order==="estado"){ const r={abierto:1,en_progreso:2,cerrado:3}; data.sort((a,b)=> r[a.estado]-r[b.estado]); }
  return data;
}

function render(){
  const data = getFilteredOrdered();
  const o = data.filter(t=>t.estado==="abierto").length;
  const p = data.filter(t=>t.estado==="en_progreso").length;
  const c = data.filter(t=>t.estado==="cerrado").length;
  $("#cntOpen").textContent   = `abierto: ${o}`;
  $("#cntProg").textContent   = `en_progreso: ${p}`;
  $("#cntClosed").textContent = `cerrado: ${c}`;
  $("#cntTotal").textContent  = `total: ${data.length}`;

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  if(state.page > totalPages) state.page = totalPages;
  const start = (state.page-1)*state.pageSize;
  const pageItems = data.slice(start, start + state.pageSize);

  $("#tbody").innerHTML = pageItems.length ? pageItems.map(row).join("") : `<tr><td colspan="6">Sin tickets.</td></tr>`;
  $("#pageInfo").textContent = `${state.page} / ${totalPages}`;
  $("#prevPage").disabled = state.page<=1;
  $("#nextPage").disabled = state.page>=totalPages;
}

// ===== Modal (crear/editar) =====
const dlg = $("#dlg");
const frm = $("#frm");

function openCreate(){
  $("#dlgTitle").textContent = "Nuevo Ticket";
  frm.reset(); $("#id").value = ""; $("#estado").value = "abierto";
  dlg.showModal();
}

function openEdit(t){
  $("#dlgTitle").textContent = "Editar Ticket";
  $("#id").value = t.id;
  $("#titulo").value = t.titulo;
  $("#descripcion").value = t.descripcion;
  $("#prioridad").value = t.prioridad;
  $("#estado").value = t.estado;
  dlg.showModal();
}

// ===== Eventos UI =====
$("#btnNew").addEventListener("click", openCreate);
$("#btnCancel").addEventListener("click", ()=> dlg.close());

$("#q").addEventListener("input", e => { state.q = e.target.value; state.page=1; render(); });
$("#fEstado").addEventListener("change", e => { state.fEstado = e.target.value; state.page=1; render(); });
$("#fPrioridad").addEventListener("change", e => { state.fPrioridad = e.target.value; state.page=1; render(); });
$("#fOrder").addEventListener("change", e => { state.order = e.target.value; render(); });

$("#pageSize").addEventListener("change", e => { state.pageSize = parseInt(e.target.value,10)||5; state.page=1; render(); });
$("#prevPage").addEventListener("click", ()=> { if(state.page>1){ state.page--; render(); } });
$("#nextPage").addEventListener("click", ()=> { state.page++; render(); });

$("#tbody").addEventListener("click", async (e)=>{
  const a = e.target.closest("a"); if(!a) return; e.preventDefault();
  const id = parseInt(a.dataset.id, 10);

  if(a.classList.contains("js-del")){
    if(confirm("¿Eliminar el ticket?")){
      try {
        await store.remove(id);
        alertBox("Ticket eliminado.", true);
        cache = await store.all();
        render();
      } catch(err){ alertBox(err.message, false); }
    }
  }

  if(a.classList.contains("js-next")){
    try {
      const r = await store.nextState(id);
      if(!r.ok) return alertBox(r.msg, false);
      alertBox("Estado actualizado.", true);
      cache = await store.all();
      render();
    } catch(err){ alertBox(err.message, false); }
  }

  if(a.classList.contains("js-edit")){
    const t = cache.find(x=> Number(x.id)===id);
    if(t) openEdit(t);
  }
});

frm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const id = $("#id").value || null;
  const payload = {
    titulo: $("#titulo").value,
    descripcion: $("#descripcion").value,
    prioridad: $("#prioridad").value,
    estado: $("#estado").value
  };
  const errs = validateTicket({ ...payload, isCreate: !id });
  if(errs.length){ return alertBox(errs.join("<br>"), false); }

  try {
    if(!id){
      await store.create({ titulo: payload.titulo, descripcion: payload.descripcion, prioridad: payload.prioridad });
      alertBox("Ticket creado.", true);
    } else {
      await store.update(Number(id), {
        titulo: payload.titulo,
        descripcion: payload.descripcion,
        prioridad: payload.prioridad
      });
      alertBox("Ticket actualizado.", true);
    }
    dlg.close();
    cache = await store.all();
    render();
  } catch(err){
    alertBox(err.message, false);
  }
});

// ===== Alertas =====
function alertBox(msg, ok=true){
  $("#alerts").innerHTML = `<div class="alert ${ok?'ok':'err'}">${msg}</div>`;
  setTimeout(()=> $("#alerts").innerHTML="", 2500);
}

// ===== Boot =====
document.addEventListener("DOMContentLoaded", async ()=>{
  $("#year").textContent = new Date().getFullYear();
  try {
    cache = await store.all();
  } catch(e) {
    cache = [];
    alertBox("No se pudo cargar desde la API", false);
  }
  render();
});
