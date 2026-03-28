async function checkAdminSession() {
  const res = await fetch('/api/session');
  const data = await res.json();
  if (!data.loggedIn || data.user.role !== 'admin') {
    window.location.href = 'index.html';
  }
}

let currentTable = ''; // Global variable to store the current table type

async function loadAdminData(type, element) {
    currentTable = type;
    const res = await fetch(`/api/admin/${type}`);
    const items = await res.json(); // Renamed 'data' back to 'items' to match existing loops
    
    const title = document.getElementById('current-view-title');
    title.innerText = type.replace('-', ' ').toUpperCase();

    // Sidebar active state
    if (element) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
    }

  const head = document.getElementById('table-head');
  const body = document.getElementById('table-body');

  head.innerHTML = '';
  body.innerHTML = '';

  if (type === 'users') {
    title.innerText = 'All Registered Users';
    head.innerHTML = '<tr><th>Full Name</th><th>Email</th><th>Reg No.</th><th>Role</th><th>Actions</th></tr>';
    items.forEach(u => {
      body.innerHTML += `<tr>
        <td>${u.fullname}</td>
        <td>${u.email}</td>
        <td>${u.reg_no}</td>
        <td>${u.role}</td>
        <td>${u.role !== 'admin' ? `<button onclick="deleteUser('${u.id}')" style="color:var(--danger); background:none; border:1px solid var(--danger); padding:2px 5px; cursor:pointer; border-radius:4px;">Delete</button>` : 'System'}</td>
      </tr>`;
    });
  } else if (type === 'lost-items') {
    title.innerText = 'Total Lost Item Reports';
    head.innerHTML = '<tr><th>Image</th><th>Item</th><th>Date</th><th>Location</th><th>Status</th><th>Actions</th></tr>';
    items.forEach(i => {
      body.innerHTML += `<tr>
        <td>${i.image_url ? `<img src="${i.image_url}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">` : '-'}</td>
        <td>${i.item_name}</td>
        <td>${i.date}</td>
        <td>${i.location}</td>
        <td>${i.status}</td>
        <td style="display:flex; gap: 10px;">
          ${i.status === 'lost' ? `<button onclick="adminResolve('${i.id}')" style="color:var(--success); background:none; border:1px solid var(--success); padding:2px 5px; cursor:pointer; border-radius:4px;">Resolve</button>` : '-'}
          <button onclick="deleteLostItem('${i.id}')" style="color:var(--danger); background:none; border:1px solid var(--danger); padding:2px 5px; cursor:pointer; border-radius:4px;">Delete</button>
        </td>
      </tr>`;
    });
  } else if (type === 'found-items') {
    title.innerText = 'Total Found Items';
    head.innerHTML = '<tr><th>Image</th><th>Item</th><th>Date</th><th>Location</th><th>Status</th><th>Actions</th></tr>';
    items.forEach(i => {
        body.innerHTML += `<tr>
          <td>${i.image_url ? `<img src="${i.image_url}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">` : '-'}</td>
          <td>${i.item_name}</td>
          <td>${i.date}</td>
          <td>${i.location}</td>
          <td>${i.status}</td>
          <td style="display:flex; gap: 10px;">
            ${i.status === 'found' ? `<button onclick="adminClaim('${i.id}')" style="color:var(--primary); background:none; border:1px solid var(--primary); padding:2px 5px; cursor:pointer; border-radius:4px;">Claimed</button>` : '-'}
            <button onclick="deleteFoundItem('${i.id}')" style="color:var(--danger); background:none; border:1px solid var(--danger); padding:2px 5px; cursor:pointer; border-radius:4px;">Delete</button>
          </td>
        </tr>`;
    });
  }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    if (res.ok) loadAdminData('users');
}

async function adminResolve(id) {
    await fetch('/api/lost-items/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    loadAdminData('lost-items');
}

async function adminClaim(id) {
    await fetch('/api/found-items/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    loadAdminData('found-items');
}

async function deleteLostItem(id) {
    if (!confirm('Permanently delete this lost item report?')) return;
    const res = await fetch('/api/admin/lost-items/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    if (res.ok) loadAdminData('lost-items');
}

async function deleteFoundItem(id) {
    if (!confirm('Permanently delete this found item record?')) return;
    const res = await fetch('/api/admin/found-items/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    if (res.ok) loadAdminData('found-items');
}

document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    loadAdminData('users');

    document.getElementById('logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/logout');
        window.location.href = 'index.html';
    });
});
