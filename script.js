function isAdmin() {
  return localStorage.getItem('adminLogado') === 'sim';
}

window.onload = () => {
  // Mostra ou esconde botões de admin
  if(isAdmin()){
    document.getElementById('addItemBtn').style.display = '';
    document.getElementById('addCatBtn').style.display = '';
    document.getElementById('logoutBtn').style.display = '';
    document.getElementById('loginBtn').style.display = 'none';
  } else {
    document.getElementById('addItemBtn').style.display = 'none';
    document.getElementById('addCatBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('loginBtn').style.display = '';
  }

  renderCategorias();
  document.getElementById('addItemBtn').onclick = abrirModalProduto;
  document.getElementById('addCatBtn').onclick = abrirModalCategoria;
  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('loginBtn').onclick = () => window.location.href = 'login.html';
};

function logout() {
  firebase.auth().signOut().then(()=>{
    localStorage.removeItem('adminLogado');
    window.location.href = "index.html";
  });
}

// Renderiza categorias e produtos
async function renderCategorias() {
  const main = document.getElementById('categorias');
  main.innerHTML = '<p>Carregando...</p>';

  const categoriasSnap = await db.collection('categorias').get();
  let html = '';
  for (const catDoc of categoriasSnap.docs) {
    const catData = catDoc.data();
    html += `<div class="categoria"><h2>${catData.nome}`;
    if(isAdmin()) {
      html += `<button class="btn-excluir-cat" onclick="excluirCategoria('${catDoc.id}')">Excluir</button>
               <button class="btn-editar-cat" onclick="editarCategoria('${catDoc.id}','${catData.nome}')">Editar</button>`;
    }
    html += `</h2><div class="produtos">`;
    // Busca produtos dessa categoria
    const prodsSnap = await db.collection('categorias').doc(catDoc.id).collection('produtos').get();
    for (const prodDoc of prodsSnap.docs) {
      const p = prodDoc.data();
      html += `
        <div class="produto-card" onclick="abrirDetalhe('${catDoc.id}','${prodDoc.id}')">
          <img src="${p.img || 'img/noimg.png'}" class="produto-img">
          <div class="produto-info">
            <div class="produto-nome">${p.nome}</div>
            <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
            <div class="produto-desc">${p.desc || ''}</div>
          </div>`;
      if(isAdmin()) {
        html += `<button onclick="event.stopPropagation(); editarProduto('${catDoc.id}','${prodDoc.id}')">Editar</button>
                 <button onclick="event.stopPropagation(); excluirProduto('${catDoc.id}','${prodDoc.id}')">Excluir</button>`;
      }
      html += `</div>`;
    }
    html += '</div></div>';
  }
  main.innerHTML = html;
}

function abrirDetalhe(catId, prodId) {
  localStorage.setItem('catId', catId);
  localStorage.setItem('prodId', prodId);
  window.location.href = 'detalhe.html';
}

// --------- CRUD CATEGORIA ----------
function abrirModalCategoria() {
  if(!isAdmin()) return;
  const modal = document.getElementById('modal');
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div style="background:#fff;padding:25px 20px;border-radius:16px;max-width:350px;width:95%">
      <h3>Nova Coleção</h3>
      <input id="catNome" type="text" placeholder="Nome da Coleção" style="width:100%;margin-bottom:10px;padding:8px">
      <button onclick="salvarCategoria()">Salvar</button>
      <button onclick="fecharModal()">Cancelar</button>
    </div>
  `;
}
function salvarCategoria() {
  const nome = document.getElementById('catNome').value.trim();
  if(!nome) return alert('Preencha o nome!');
  db.collection('categorias').add({ nome }).then(()=>{
    fecharModal();
    renderCategorias();
  });
}
function editarCategoria(catId, nomeAntigo) {
  if(!isAdmin()) return;
  const modal = document.getElementById('modal');
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div style="background:#fff;padding:25px 20px;border-radius:16px;max-width:350px;width:95%">
      <h3>Editar Coleção</h3>
      <input id="catNomeEdit" type="text" value="${nomeAntigo}" style="width:100%;margin-bottom:10px;padding:8px">
      <button onclick="salvarEdicaoCategoria('${catId}')">Salvar</button>
      <button onclick="fecharModal()">Cancelar</button>
    </div>
  `;
}
function salvarEdicaoCategoria(catId) {
  const nome = document.getElementById('catNomeEdit').value.trim();
  if(!nome) return alert('Preencha o nome!');
  db.collection('categorias').doc(catId).update({ nome }).then(()=>{
    fecharModal();
    renderCategorias();
  });
}
function excluirCategoria(catId) {
  if(!isAdmin()) return;
  if(confirm('Excluir esta coleção e todos os produtos nela?')) {
    db.collection('categorias').doc(catId).collection('produtos').get().then(snapshot=>{
      const batch = db.batch();
      snapshot.forEach(doc=>{
        batch.delete(doc.ref);
      });
      batch.commit().then(()=>{
        db.collection('categorias').doc(catId).delete().then(()=>{
          renderCategorias();
        });
      });
    });
  }
}
function fecharModal() {
  document.getElementById('modal').style.display = 'none';
}

// --------- CRUD PRODUTO ----------
function abrirModalProduto() {
  if(!isAdmin()) return;
  const modal = document.getElementById('modal');
  modal.style.display = 'flex';
  db.collection('categorias').get().then(cats=>{
    let options = '';
    cats.forEach(doc=>{
      options += `<option value="${doc.id}">${doc.data().nome}</option>`;
    });
    modal.innerHTML = `
      <div style="background:#fff;padding:25px 20px;border-radius:16px;max-width:370px;width:95%">
        <h3>Novo Produto</h3>
        <select id="prodCat" style="width:100%;margin-bottom:10px;padding:8px">
          <option value="">Escolha a coleção</option>
          ${options}
        </select>
        <input id="prodNome" type="text" placeholder="Nome do Produto" style="width:100%;margin-bottom:8px;padding:8px">
        <input id="prodPreco" type="number" step="0.01" placeholder="Preço" style="width:100%;margin-bottom:8px;padding:8px">
        <input id="prodImg" type="text" placeholder="URL da imagem" style="width:100%;margin-bottom:8px;padding:8px">
        <textarea id="prodDesc" placeholder="Descrição" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <button onclick="salvarProduto()">Salvar</button>
        <button onclick="fecharModal()">Cancelar</button>
      </div>
    `;
  });
}
function salvarProduto() {
  const catId = document.getElementById('prodCat').value;
  const nome = document.getElementById('prodNome').value.trim();
  const preco = parseFloat(document.getElementById('prodPreco').value);
  const img = document.getElementById('prodImg').value.trim();
  const desc = document.getElementById('prodDesc').value.trim();
  if(!catId || !nome || isNaN(preco)) return alert('Preencha todos os campos!');
  db.collection('categorias').doc(catId).collection('produtos').add({
    nome, preco, img, desc
  }).then(()=>{
    fecharModal();
    renderCategorias();
  });
}
function editarProduto(catId, prodId) {
  if(!isAdmin()) return;
  event.stopPropagation();
  db.collection('categorias').doc(catId).collection('produtos').doc(prodId).get().then
    (doc=>{
    const p = doc.data();
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div style="background:#fff;padding:25px 20px;border-radius:16px;max-width:370px;width:95%">
        <h3>Editar Produto</h3>
        <input id="prodNomeEdit" type="text" value="${p.nome}" style="width:100%;margin-bottom:8px;padding:8px">
        <input id="prodPrecoEdit" type="number" step="0.01" value="${p.preco}" style="width:100%;margin-bottom:8px;padding:8px">
        <input id="prodImgEdit" type="text" value="${p.img}" placeholder="URL da imagem" style="width:100%;margin-bottom:8px;padding:8px">
        <textarea id="prodDescEdit" placeholder="Descrição" style="width:100%;margin-bottom:8px;padding:8px">${p.desc || ''}</textarea>
        <button onclick="salvarEdicaoProduto('${catId}','${prodId}')">Salvar</button>
        <button onclick="fecharModal()">Cancelar</button>
      </div>
    `;
  });
}

function salvarEdicaoProduto(catId, prodId) {
  const nome = document.getElementById('prodNomeEdit').value.trim();
  const preco = parseFloat(document.getElementById('prodPrecoEdit').value);
  const img = document.getElementById('prodImgEdit').value.trim();
  const desc = document.getElementById('prodDescEdit').value.trim();
  if(!nome || isNaN(preco)) return alert('Preencha todos os campos!');
  db.collection('categorias').doc(catId).collection('produtos').doc(prodId).set({
    nome, preco, img, desc
  }).then(()=>{
    fecharModal();
    renderCategorias();
  });
}

function excluirProduto(catId, prodId) {
  if(!isAdmin()) return;
  event.stopPropagation();
  if(confirm('Deseja excluir este produto?')) {
    db.collection('categorias').doc(catId).collection('produtos').doc(prodId).delete().then(()=>{
      renderCategorias();
    });
  }
}



