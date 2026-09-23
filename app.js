(function(){
"use strict";
const $=s=>document.querySelector(s);
const E={sidebar:$("#sidebar"),scrim:$("#scrim"),history:$("#history"),welcome:$("#welcome"),messages:$("#messages"),chatArea:$("#chatArea"),prompt:$("#prompt"),send:$("#sendBtn"),newChat:$("#newChatBtn"),menu:$("#menuBtn"),attach:$("#attachBtn"),file:$("#fileInput"),attachment:$("#attachmentLabel"),theme:$("#themeBtn"),modelBtn:$("#modelBtn"),modelMenu:$("#modelMenu"),jump:$("#jumpBottom")};
const KEY="chat-clone-local-v1";
let state;try{state=JSON.parse(localStorage.getItem(KEY)||"")}catch(e){}
if(!state||!Array.isArray(state.chats))state={chats:[],current:null,theme:"light",model:"Local Smart"};
let generating=false,currentFiles=[];
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(t){const n=document.createElement("div");n.className="toast";n.textContent=t;document.body.append(n);setTimeout(()=>n.remove(),1300)}
function md(src){
  let s=esc(src),blocks=[];
  s=s.replace(/~~~([\w-]*)\n([\s\S]*?)~~~/g,function(_,lang,code){const i=blocks.length;blocks.push('<div class="codeblock"><div class="codebar"><span>'+(lang||"código")+'</span><button class="copy-code">Copiar</button></div><pre><code>'+code.trim()+'</code></pre></div>');return "@@B"+i+"@@"});
  s=s.replace(new RegExp("\\x60([^\\x60]+)\\x60","g"),"<code>$1</code>").replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/^\s*[-*] (.*)$/gm,"<li>$1</li>");
  s=s.split(/\n{2,}/).map(function(p){if(/^<h[1-3]>|^<li>|^@@B/.test(p))return p;return "<p>"+p.replace(/\n/g,"<br>")+"</p>"}).join("");
  s=s.replace(/(?:<li>.*?<\/li>)+/gs,m=>"<ul>"+m+"</ul>");
  blocks.forEach((b,i)=>{s=s.replace("@@B"+i+"@@",b)});return s;
}
const currentChat=()=>state.chats.find(c=>c.id===state.current);
function setTheme(){document.body.classList.toggle("dark",state.theme==="dark")}
function groupLabel(ts){const d=new Date(ts),n=new Date(),s=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),t=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();return t===s?"Hoje":t===s-86400000?"Ontem":"Anteriores"}
function renderHistory(filter){
  E.history.innerHTML="";const g={Hoje:[],Ontem:[],Anteriores:[]};
  state.chats.slice().sort((a,b)=>b.updated-a.updated).filter(c=>!filter||(c.title||"").toLowerCase().includes(filter.toLowerCase())).forEach(c=>g[groupLabel(c.updated)].push(c));
  Object.entries(g).forEach(([name,arr])=>{
    if(!arr.length)return;
    const h=document.createElement("div");h.className="group-title";h.textContent=name;E.history.append(h);
    arr.forEach(c=>{
      const row=document.createElement("div");row.className="chat-item"+(c.id===state.current?" active":"");
      row.innerHTML='<button class="chat-title">'+esc(c.title||"Novo chat")+'</button><button class="chat-delete" title="Excluir">×</button>';
      row.querySelector(".chat-title").onclick=()=>{state.current=c.id;save();render();closeSidebar()};
      row.querySelector(".chat-delete").onclick=e=>{e.stopPropagation();state.chats=state.chats.filter(x=>x.id!==c.id);if(state.current===c.id)state.current=state.chats[0]?.id||null;save();render()};
      E.history.append(row)
    })
  });
}
function bindCodeCopy(){document.querySelectorAll(".copy-code").forEach(b=>b.onclick=()=>{navigator.clipboard.writeText(b.closest(".codeblock").querySelector("code").innerText);b.textContent="Copiado";setTimeout(()=>b.textContent="Copiar",900)})}
function renderMessages(){
  const c=currentChat(),msgs=c?.messages||[];
  E.messages.innerHTML="";
  E.welcome.classList.toggle("hidden",msgs.length>0);
  msgs.forEach((m,i)=>{
    const a=document.createElement("article");a.className="message "+m.role;
    a.innerHTML='<div class="msg-inner"><div class="bubble">'+md(m.content)+'</div><div class="msg-actions"></div></div>';
    const actions=a.querySelector(".msg-actions");
    if(m.role==="assistant"){
      actions.innerHTML='<button data-copy>Copiar</button><button data-regen>Regenerar</button>';
      actions.querySelector("[data-copy]").onclick=()=>{navigator.clipboard.writeText(m.content);toast("Resposta copiada")};
      actions.querySelector("[data-regen]").onclick=()=>regenerate(i)
    }else{
      actions.innerHTML='<button data-edit>Editar</button><button data-copy>Copiar</button>';
      actions.querySelector("[data-copy]").onclick=()=>{navigator.clipboard.writeText(m.content);toast("Mensagem copiada")};
      actions.querySelector("[data-edit]").onclick=()=>editMessage(i)
    }
    E.messages.append(a)
  });
  bindCodeCopy()
}
function render(){setTheme();renderHistory();renderMessages();E.modelBtn.innerHTML=esc(state.model)+' <span>⌄</span>'}
function newChat(){const c={id:uid(),title:"Novo chat",created:Date.now(),updated:Date.now(),messages:[]};state.chats.unshift(c);state.current=c.id;save();render();E.prompt.focus();closeSidebar()}
function localReply(text,fast){
  const t=text.trim(),l=t.toLowerCase();
  if(/^(oi|olá|ola|e aí|eai|bom dia|boa tarde|boa noite)[!. ]*$/.test(l))return fast?"Olá! Como posso ajudar?":"Olá! Posso ajudar a demonstrar a experiência deste chat local.";
  if(l.includes("quem é você")||l.includes("quem e voce"))return "Sou o **Chat Clone**, uma interface local inspirada em chats de IA. Não uso API, backend externo ou modelo remoto.";
  if(l.includes("código")||l.includes("codigo")||l.includes("javascript"))return "Aqui vai um exemplo simples:\n\n~~~js\nfunction saudacao(nome) {\n  return 'Olá, ' + nome + '!';\n}\n\nconsole.log(saudacao('Alexandre'));\n~~~\n\nO bloco pode ser copiado pelo botão no topo.";
  if(l.includes("resuma")||l.includes("resumo"))return "### Resumo\n\n- O pedido foi recebido localmente.\n- Nenhum dado saiu do navegador.\n- O clone demonstra a experiência de conversa sem depender de API.";
  if(l.includes("ideia")||l.includes("produto"))return "Uma estrutura útil seria:\n\n- **Problema:** escolha uma dor específica.\n- **Mecanismo:** defina o que muda de verdade.\n- **Saída:** torne o resultado verificável.\n- **Teste:** compare a proposta com uma versão simples.";
  if(l.includes("explique")||l.includes("o que é")||l.includes("o que e"))return "Neste clone sem API eu consigo demonstrar o **produto e a interface**, mas não possuo um modelo geral de conhecimento embutido. O fluxo de chat, histórico, edição, regeneração, tema e persistência funcionam inteiramente no navegador.";
  return (fast?"Entendi. ":"Recebi sua mensagem. ")+'Você escreveu: **"'+t.slice(0,220)+(t.length>220?"…":"")+'”**.\n\nEsta resposta foi produzida pelo motor local demonstrativo, sem enviar dados para fora.';
}
function stop(){generating=false;E.send.textContent="↑";resize()}
async function typeAssistant(content){
  generating=true;E.send.textContent="■";
  const c=currentChat(),m={role:"assistant",content:""};c.messages.push(m);renderMessages();
  const el=E.messages.lastElementChild.querySelector(".bubble"),chunks=content.match(/.{1,5}/gs)||[content];
  for(const chunk of chunks){if(!generating)break;m.content+=chunk;el.innerHTML=md(m.content);E.chatArea.scrollTop=E.chatArea.scrollHeight;await new Promise(r=>setTimeout(r,8))}
  generating=false;E.send.textContent="↑";c.updated=Date.now();save();render();resize()
}
async function send(text){
  if(generating){stop();return}
  text=(text??E.prompt.value).trim();if(!text)return;
  let c=currentChat();if(!c){newChat();c=currentChat()}
  const suffix=currentFiles.length?"\n\n[Anexos: "+currentFiles.map(f=>f.name).join(", ")+"]":"";
  c.messages.push({role:"user",content:text+suffix});
  if(c.messages.filter(m=>m.role==="user").length===1)c.title=text.slice(0,46);
  c.updated=Date.now();E.prompt.value="";currentFiles=[];E.file.value="";E.attachment.textContent="";resize();save();render();scrollBottom();
  await new Promise(r=>setTimeout(r,180));
  await typeAssistant(localReply(text,state.model==="Local Fast"))
}
function editMessage(i){
  const c=currentChat(),m=c?.messages[i];if(!m)return;
  const v=window.prompt("Editar mensagem:",m.content.replace(/\n\n\[Anexos:[\s\S]*$/,""));
  if(v===null||!v.trim())return;
  c.messages=c.messages.slice(0,i);save();render();send(v)
}
function regenerate(i){
  const c=currentChat();if(!c)return;
  const u=[...c.messages.slice(0,i)].reverse().find(m=>m.role==="user");if(!u)return;
  c.messages=c.messages.slice(0,i);save();render();typeAssistant(localReply(u.content,state.model==="Local Fast"))
}
function resize(){E.prompt.style.height="auto";E.prompt.style.height=Math.min(E.prompt.scrollHeight,180)+"px";E.send.disabled=!E.prompt.value.trim()&&!generating}
function scrollBottom(){requestAnimationFrame(()=>E.chatArea.scrollTop=E.chatArea.scrollHeight)}
function openSidebar(){E.sidebar.classList.add("open");E.scrim.classList.add("show")}
function closeSidebar(){E.sidebar.classList.remove("open");E.scrim.classList.remove("show")}
E.newChat.onclick=newChat;
E.menu.onclick=openSidebar;
E.scrim.onclick=closeSidebar;
E.send.onclick=()=>send();
E.prompt.oninput=resize;
E.prompt.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};
E.attach.onclick=()=>E.file.click();
E.file.onchange=()=>{currentFiles=[...E.file.files];E.attachment.textContent=currentFiles.map(f=>f.name).join(", ")};
E.theme.onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";save();setTheme()};
E.modelBtn.onclick=e=>{e.stopPropagation();E.modelMenu.classList.toggle("hidden")};
E.modelMenu.onclick=e=>{const b=e.target.closest("[data-model]");if(!b)return;state.model=b.dataset.model;save();render();E.modelMenu.classList.add("hidden")};
document.addEventListener("click",e=>{if(!E.modelMenu.contains(e.target)&&e.target!==E.modelBtn)E.modelMenu.classList.add("hidden")});
document.querySelectorAll(".suggestions button").forEach(b=>b.onclick=()=>{E.prompt.value=b.textContent;resize();E.prompt.focus()});
E.jump.onclick=scrollBottom;
E.chatArea.onscroll=()=>{const d=E.chatArea.scrollHeight-E.chatArea.scrollTop-E.chatArea.clientHeight;E.jump.classList.toggle("hidden",d<180)};
$("#shareBtn").onclick=async()=>{
  const c=currentChat();if(!c)return;
  const text=c.messages.map(m=>(m.role==="user"?"Você":"Assistente")+": "+m.content).join("\n\n");
  try{if(navigator.share)await navigator.share({title:c.title,text});else{await navigator.clipboard.writeText(text);toast("Conversa copiada")}}catch(e){}
};
$("#moreBtn").onclick=()=>{
  const c=currentChat();
  if(c&&confirm("Excluir esta conversa?")){state.chats=state.chats.filter(x=>x.id!==c.id);state.current=state.chats[0]?.id||null;save();if(!state.chats.length)newChat();else render()}
};
$("#searchBtn").onclick=()=>{const q=window.prompt("Pesquisar conversas:");if(q!==null)renderHistory(q)};
if(!state.chats.length)newChat();else render();
resize();
})();