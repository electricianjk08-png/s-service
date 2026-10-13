import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const services = [
  {name:"Motor Repair & Winding",icon:"⚙️",visit:300,repair:1200},
  {name:"Ceiling Fan Winding",icon:"🌀",visit:250,repair:600},
  {name:"Farata / Table Fan Repair",icon:"🪭",visit:200,repair:400},
  {name:"House Wiring & Fault Solution",icon:"🏠",visit:300,repair:1000},
  {name:"Wall Cutting",icon:"🛠️",visit:300,repair:800},
  {name:"Factory Wiring",icon:"🏭",visit:500,repair:2000},
  {name:"Motor Starter Repair",icon:"🔌",visit:300,repair:700},
  {name:"Water Pump Repair",icon:"💧",visit:300,repair:900},
  {name:"Machine Motor Repair",icon:"🔩",visit:400,repair:1500}
];
let currentUser = null, currentRole = "customer", selectedService = services[0].name, allOwnerBookings = [];

function message(id, text, error=false){ const el=$(id); if(!el)return; el.textContent=text; el.classList.toggle("error",error); }
function friendlyError(e){ const code=e?.code||""; const map={"auth/invalid-credential":"Email or password is incorrect.","auth/email-already-in-use":"This email already has an account.","auth/weak-password":"Please use a stronger password (at least 6 characters).","auth/invalid-email":"Please enter a valid email address.","auth/too-many-requests":"Too many attempts. Please wait and try again.","permission-denied":"Permission denied. Check your Firestore rules and account role.","unavailable":"Network unavailable. Check your internet connection."}; return map[code]||e.message||"Something went wrong."; }
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
$("year").textContent=new Date().getFullYear(); $("booking-date").min=localDate(); $("booking-date").value=localDate();

function renderServices(filter=""){
 const grid=$("services-grid"); grid.innerHTML="";
 services.filter(s=>s.name.toLowerCase().includes(filter.toLowerCase())).forEach(s=>{
  const b=document.createElement("button"); b.type="button"; b.className="service-card"+(s.name===selectedService?" selected":"");
  b.innerHTML=`<span class="service-icon">${s.icon}</span><b>${esc(s.name)}</b><small>Visit from ₹${s.visit}</small>`;
  b.addEventListener("click",()=>selectService(s.name,true)); grid.appendChild(b);
 });
}
function fillServiceSelects(){
 $("booking-service").innerHTML=services.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("");
 $("tech-category").innerHTML=services.map(s=>`<option>${esc(s.name)}</option>`).join("");
}
function selectService(name,scroll=false){selectedService=name;$("booking-service").value=name;const s=services.find(x=>x.name===name);$("visit-price").textContent=`₹${s?.visit||300}`;renderServices($("service-search").value);if(scroll)$("booking-form-panel").scrollIntoView({behavior:"smooth",block:"start"});}
fillServiceSelects();renderServices();selectService(selectedService);
$("service-search").addEventListener("input",e=>renderServices(e.target.value));
$("booking-service").addEventListener("change",e=>selectService(e.target.value));

document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
 $("login-form").classList.toggle("hidden",b.dataset.tab!=="login");$("register-form").classList.toggle("hidden",b.dataset.tab!=="register");message("auth-message","");
}));
$("register-form").addEventListener("submit",async e=>{
 e.preventDefault();message("auth-message","Creating account…");
 try{
  const cred=await createUserWithEmailAndPassword(auth,$("reg-email").value.trim(),$("reg-password").value);
  await updateProfile(cred.user,{displayName:$("reg-name").value.trim()});
  await setDoc(doc(db,"users",cred.user.uid),{name:$("reg-name").value.trim(),email:cred.user.email,role:"customer",createdAt:serverTimestamp()});
  message("auth-message","Account created.");
 }catch(err){message("auth-message",friendlyError(err),true);}
});
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();message("auth-message","Signing in…");
 try{await signInWithEmailAndPassword(auth,$("login-email").value.trim(),$("login-password").value);}
 catch(err){message("auth-message",friendlyError(err),true);}
});
$("logout-btn").addEventListener("click",()=>signOut(auth));
onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){$("auth-view").classList.remove("hidden");$("app-view").classList.add("hidden");$("logout-btn").classList.add("hidden");$("user-label").textContent="";return;}
 try{
  const snap=await getDoc(doc(db,"users",user.uid));
  currentRole=snap.exists()?snap.data().role||"customer":"customer";
  if(!snap.exists()) await setDoc(doc(db,"users",user.uid),{name:user.displayName||"",email:user.email||"",role:"customer",createdAt:serverTimestamp()});
  $("auth-view").classList.add("hidden");$("app-view").classList.remove("hidden");$("logout-btn").classList.remove("hidden");$("user-label").textContent=user.displayName||user.email||"Signed in";
  document.querySelectorAll(".owner-only").forEach(x=>x.classList.toggle("hidden",currentRole!=="owner"));
  if(currentRole==="owner"){await loadOwnerDashboard();await loadTechnicians();}
  await loadMyBookings();
  $("booking-name").value=user.displayName||"";
 }catch(err){console.error(err);message("auth-message",friendlyError(err),true);}
});

document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",async()=>{
 document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x===b));
 document.querySelectorAll(".view").forEach(x=>x.classList.add("hidden"));$(b.dataset.view+"-view").classList.remove("hidden");
 if(b.dataset.view==="bookings")await loadMyBookings();
 if(b.dataset.view==="dashboard"&&currentRole==="owner")await loadOwnerDashboard();
 if(b.dataset.view==="technicians"&&currentRole==="owner")await loadTechnicians();
}));
$("booking-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!currentUser){message("booking-message","Please log in first.",true);return;}
 const s=services.find(x=>x.name===$("booking-service").value)||services[0];
 const data={userId:currentUser.uid,customerName:$("booking-name").value.trim(),phone:$("booking-phone").value.trim(),address:$("booking-address").value.trim(),service:s.name,problem:$("booking-problem").value.trim(),date:$("booking-date").value,time:$("booking-time").value,visitCharge:s.visit,estimatedRepairCost:s.repair,totalApprox:s.visit+s.repair,status:"Pending",createdAt:serverTimestamp()};
 message("booking-message","Submitting booking…");
 try{
  const ref=await addDoc(collection(db,"bookings"),data);
  message("booking-message",`Booking successful! Your Booking ID is ${ref.id}. Approximate total: ₹${data.totalApprox}. Final amount may vary after inspection.`);
  $("booking-problem").value="";await loadMyBookings();
 }catch(err){message("booking-message",friendlyError(err),true);}
});
$("booking-filter").addEventListener("change",loadMyBookings);
function statusClass(status){return status==="In Progress"?"in-progress":status.toLowerCase();}
function bookingCard(d,id){
 return `<article class="booking-card"><div class="booking-card-head"><div><div class="booking-id">#SS${esc(id.slice(-5).toUpperCase())}</div><h3>${esc(d.service||"Service booking")}</h3></div><span class="status ${statusClass(d.status||"Pending")}">${esc(d.status||"Pending")}</span></div><p>▣ ${esc(d.date||"Date not set")} · ${esc(d.time||"Time not set")}</p><p>⌖ ${esc(d.address||"")}</p><p>${esc(d.problem||"")}</p><p><b>Approx. total: ₹${Number(d.totalApprox||0).toLocaleString("en-IN")}</b></p></article>`;
}
async function loadMyBookings(){
 if(!currentUser)return;
 const list=$("bookings-list");list.innerHTML='<div class="empty">Loading bookings…</div>';
 try{
  const q=query(collection(db,"bookings"),where("userId","==",currentUser.uid));
  const snap=await getDocs(q);let rows=snap.docs.map(x=>({id:x.id,...x.data()}));
  rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  const filter=$("booking-filter").value;if(filter!=="All")rows=rows.filter(x=>x.status===filter);
  list.innerHTML=rows.length?rows.map(x=>bookingCard(x,x.id)).join(""):'<div class="empty">No bookings found. Select a service and make your first booking.</div>';
 }catch(err){list.innerHTML=`<div class="empty">${esc(friendlyError(err))}</div>`;}
}
async function loadOwnerDashboard(){
 if(currentRole!=="owner")return;
 $("owner-bookings").innerHTML='<tr><td colspan="6">Loading…</td></tr>';
 try{
  const snap=await getDocs(query(collection(db,"bookings"),orderBy("createdAt","desc")));
  allOwnerBookings=snap.docs.map(x=>({id:x.id,...x.data()}));
  const count=s=>allOwnerBookings.filter(b=>b.status===s).length;
  $("stats-grid").innerHTML=`<div class="stat"><span>Total bookings</span><b>${allOwnerBookings.length}</b></div><div class="stat"><span>Pending</span><b>${count("Pending")}</b></div><div class="stat"><span>In progress</span><b>${count("In Progress")}</b></div><div class="stat"><span>Completed</span><b>${count("Completed")}</b></div>`;
  $("owner-bookings").innerHTML=allOwnerBookings.length?allOwnerBookings.map(b=>`<tr><td><b>#SS${esc(b.id.slice(-5).toUpperCase())}</b></td><td>${esc(b.customerName||"")}<br><small>${esc(b.phone||"")}</small></td><td>${esc(b.service||"")}</td><td>${esc(b.date||"")}<br>${esc(b.time||"")}</td><td><span class="status ${statusClass(b.status||"Pending")}">${esc(b.status||"Pending")}</span></td><td><select data-booking-id="${esc(b.id)}" class="status-select"><option ${b.status==="Pending"?"selected":""}>Pending</option><option ${b.status==="In Progress"?"selected":""}>In Progress</option><option ${b.status==="Completed"?"selected":""}>Completed</option><option ${b.status==="Cancelled"?"selected":""}>Cancelled</option></select></td></tr>`).join(""):'<tr><td colspan="6">No bookings yet.</td></tr>';
  document.querySelectorAll(".status-select").forEach(sel=>sel.addEventListener("change",async()=>{
   try{await updateDoc(doc(db,"bookings",sel.dataset.bookingId),{status:sel.value,updatedAt:serverTimestamp()});await loadOwnerDashboard();await loadMyBookings();}
   catch(err){alert(friendlyError(err));}
  }));
 }catch(err){$("owner-bookings").innerHTML=`<tr><td colspan="6">${esc(friendlyError(err))}</td></tr>`;}
}
$("refresh-owner").addEventListener("click",loadOwnerDashboard);
$("technician-form").addEventListener("submit",async e=>{
 e.preventDefault();if(currentRole!=="owner")return;
 const data={name:$("tech-name").value.trim(),phone:$("tech-phone").value.trim(),email:$("tech-email").value.trim(),qualification:$("tech-qualification").value,experience:Number($("tech-experience").value),category:$("tech-category").value,status:"Active",createdAt:serverTimestamp()};
 try{await addDoc(collection(db,"technicians"),data);$("technician-form").reset();message("tech-message","Technician saved.");await loadTechnicians();}
 catch(err){message("tech-message",friendlyError(err),true);}
});
async function loadTechnicians(){
 if(currentRole!=="owner")return;const list=$("technicians-list");list.innerHTML='<div class="empty">Loading technicians…</div>';
 try{
  const snap=await getDocs(query(collection(db,"technicians"),orderBy("createdAt","desc")));
  list.innerHTML=snap.empty?'<div class="empty">No technicians added yet.</div>':snap.docs.map(x=>{const d=x.data();return `<article class="tech-card"><h3>${esc(d.name)}</h3><span class="status ${d.status==="Inactive"?"cancelled":"completed"}">${esc(d.status||"Active")}</span><p>☎ ${esc(d.phone)}<br>${esc(d.email||"No email")}<br>⚙ ${esc(d.category)}<br>Experience: ${Number(d.experience||0)} years<br>${esc(d.qualification||"")}</p><button class="btn secondary" data-toggle-tech="${x.id}" data-status="${d.status==="Inactive"?"Inactive":"Active"}">${d.status==="Inactive"?"Activate":"Deactivate"}</button></article>`;}).join("");
  list.querySelectorAll("[data-toggle-tech]").forEach(b=>b.addEventListener("click",async()=>{const next=b.dataset.status==="Inactive"?"Active":"Inactive";try{await updateDoc(doc(db,"technicians",b.dataset.toggleTech),{status:next});await loadTechnicians();}catch(err){alert(friendlyError(err));}}));
 }catch(err){list.innerHTML=`<div class="empty">${esc(friendlyError(err))}</div>`;}
}