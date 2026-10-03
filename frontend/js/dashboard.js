async function checkSession() {
  const res = await fetch('/api/session');
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = 'login.html';
  } else {
    // Populate User Info
    const nameSpan = document.getElementById('user-display-name');
    if (nameSpan) nameSpan.innerText = data.user.name;
    
    const initialDiv = document.getElementById('user-initial');
    if (initialDiv) initialDiv.innerText = data.user.name.charAt(0).toUpperCase();

    const roleSpan = document.getElementById('user-role-label');
    if (roleSpan) roleSpan.innerText = data.user.role === 'admin' ? 'Administrator' : 'Verified Member';

    if (data.user.role === 'admin') {
      const adminLink = document.getElementById('admin-link');
      if (adminLink) adminLink.style.display = 'flex';
    }
    fetchStats();
  }
}

async function fetchStats() {
    const res = await fetch('/api/stats');
    const stats = await res.json();
    if (document.getElementById('stat-lost')) document.getElementById('stat-lost').innerText = stats.lost;
    if (document.getElementById('stat-found')) document.getElementById('stat-found').innerText = stats.found;
    if (document.getElementById('stat-resolved')) document.getElementById('stat-resolved').innerText = stats.claimed;
    
    // Campus wide stats
    if (document.getElementById('campus-pending')) {
        document.getElementById('campus-pending').innerText = stats.lost + stats.found;
    }
    if (document.getElementById('campus-claimed')) {
        document.getElementById('campus-claimed').innerText = stats.claimed;
    }
}

function showSection(id, element) {
  // Hide all sections
  document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
  
  // Show target
  const section = document.getElementById(id);
  if (section) {
    section.style.display = 'block';
    if (id === 'dashboard-section') {
        fetchMyItems();
        fetchStats();
    }
    if (id === 'profile-section') fetchProfile();
    if (id === 'notifications-section') {
        updateNotifications();
        markAllAsRead();
    }
    if (id === 'all-lost-section') fetchAllLostItems();
    if (id === 'found-section') fetchFoundItems();
    if (id === 'claimed-section') fetchClaimedItems();
  }

  // Update nav active state (Sidebar)
  if (element && element.classList.contains('nav-item')) {
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      element.classList.add('active');
  }
}

async function fetchProfile() {
    const res = await fetch('/api/session');
    const data = await res.json();
    if (data.user) {
        // Only if elements exist
        const fn = document.getElementById('profile-fullname');
        const em = document.getElementById('profile-email');
        const rg = document.getElementById('profile-reg');
        if (fn) fn.value = data.user.name;
        if (em) em.value = data.user.email;
        if (rg) rg.value = data.user.reg_no;
        
        const fnd = document.getElementById('profile-fullname-display');
        const emd = document.getElementById('profile-email-display');
        const rgd = document.getElementById('profile-reg-display');
        const ini = document.getElementById('profile-initial');
        if (fnd) fnd.innerText = data.user.name;
        if (emd) emd.innerText = data.user.email;
        if (rgd) rgd.innerText = `REG: ${data.user.reg_no}`;
        if (ini) ini.innerText = data.user.name.charAt(0).toUpperCase();
        
        // Update user pill sub-text as well
        const rp = document.getElementById('user-role-label');
        if (rp) rp.innerText = data.user.reg_no || 'Verified Member';
    }
}

async function fetchAllLostItems() {
  const res = await fetch('/api/lost-items');
  const items = await res.json();
  const list = document.getElementById('all-lost-list');
  if (!list) return;
  list.innerHTML = items.length ? '' : '<p style="color:var(--text-secondary)">No lost items reported yet.</p>';
  items.forEach(item => {
    const isClaimed = item.status === 'claimed';
    list.innerHTML += `
      <div class="item-card fade-in" style="${isClaimed ? 'opacity: 0.7;' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3 style="margin:0">${item.item_name}</h3>
            <span style="font-size:0.6rem; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:10px; border:1px solid var(--glass-border)">${item.category || 'General'}</span>
        </div>
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.item_name}" style="width:100%; height:150px; object-fit:cover; border-radius:10px; margin:10px 0;">` : ''}
        <p style="font-size: 0.8rem; color: var(--text-secondary)">${item.date} | ${item.location}</p>
        <p style="margin: 0.5rem 0; font-size: 0.9rem;">${item.description || 'No description'}</p>
        
        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin: 10px 0; border:1px solid var(--glass-border)">
            <p style="font-size:0.75rem; margin:0; color:var(--text-secondary)"> Contact: <b style="color:var(--text-primary)">${item.contact_info || 'Not provided'}</b></p>
        </div>

        ${!isClaimed ? `
        <div style="border-top: 1px solid var(--glass-border); padding-top: 10px; margin-top: 10px;">
             <p style="font-size:0.75rem; margin:0; color:var(--text-secondary)">Reported by: <b>${item.fullname}</b></p>
             <p style="font-size:0.75rem; margin:0; color:var(--primary)"><a href="mailto:${item.email}" style="color:inherit; text-decoration:none">${item.email}</a></p>
        </div>` : '<p style="font-size:0.8rem; color:var(--success); margin-top:10px;"><b>Item Claimed! 🎉</b></p>'}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem">
            <span class="status-badge status-${item.status}">${item.status.toUpperCase()}</span>
            ${!isClaimed ? `<button onclick="handleFoundThis('${item.item_name}', '${item.location}')" class="btn btn-primary" style="padding:4px 10px; width:auto; font-size:0.7rem; background:var(--success)">Found This?</button>` : ''}
        </div>
      </div>
    `;
  });
}

function handleFoundThis(name, loc) {
    showSection('report-found-section');
    document.getElementById('found-name').value = name;
    document.getElementById('found-location').value = loc;
    document.getElementById('found-date').valueAsDate = new Date();
}

async function fetchMyItems() {
  const res = await fetch('/api/my-lost-items');
  const items = await res.json();
  const list = document.getElementById('my-items-list');
  if (!list) return;
  list.innerHTML = items.length ? '' : '<p style="color:var(--text-secondary); padding: 20px;">No items reported yet.</p>';
  items.forEach(item => {
    list.innerHTML += `
      <div class="item-card fade-in">
        <h3 style="margin:0">${item.item_name}</h3>
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.item_name}" style="width:100%; height:150px; object-fit:cover; border-radius:10px; margin:10px 0;">` : ''}
        <p style="font-size: 0.8rem; color: var(--text-secondary)">${item.date} | ${item.location}</p>
        <p style="margin: 0.5rem 0; font-size: 0.9rem;">${item.description || 'No description'}</p>
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="status-badge status-${item.status}">${item.status.toUpperCase()}</span>
            ${item.status === 'lost' ? `<button onclick="resolveItem('${item.id}')" class="btn btn-secondary" style="padding:5px 12px; width:auto; font-size:0.75rem; background: rgba(16,185,129,0.1); border: 1px solid var(--success); color: var(--success);">✓ Mark as Claimed</button>` : ''}
        </div>
      </div>
    `;
  });
}

async function fetchClaimedItems() {
  const res = await fetch('/api/my-lost-items');
  const items = await res.json();
  const claimed = items.filter(i => i.status === 'claimed');
  const list = document.getElementById('claimed-items-list');
  if (!list) return;
  if (claimed.length === 0) {
    list.innerHTML = '<p style="color:var(--text-secondary); padding: 20px;">🎉 No claimed items yet. Once an admin marks your report as resolved, it will appear here.</p>';
    return;
  }
  list.innerHTML = '';
  claimed.forEach(item => {
    list.innerHTML += `
      <div class="item-card fade-in" style="border-left: 3px solid var(--success);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <h3 style="margin:0">${item.item_name}</h3>
          <span style="font-size:0.6rem; background:rgba(16,185,129,0.1); padding:3px 10px; border-radius:10px; border:1px solid var(--success); color:var(--success);">RECOVERED ✓</span>
        </div>
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.item_name}" style="width:100%; height:150px; object-fit:cover; border-radius:10px; margin:10px 0;">` : ''}
        <p style="font-size: 0.8rem; color: var(--text-secondary)">${item.date} | ${item.location}</p>
        <p style="margin: 0.5rem 0; font-size: 0.9rem;">${item.description || 'No description'}</p>
      </div>
    `;
  });
}

async function resolveItem(id) {
    if (!confirm('Mark this item as resolved/found?')) return;
    const res = await fetch('/api/lost-items/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    if (res.ok) fetchMyItems();
}

async function fetchFoundItems() {
  const res = await fetch('/api/found-items');
  const items = await res.json();
  const list = document.getElementById('found-items-list');
  if (!list) return;
  list.innerHTML = items.length ? '' : '<p style="color:var(--text-secondary)">No found items yet.</p>';
  items.forEach(item => {
    list.innerHTML += `
      <div class="item-card fade-in">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3 style="margin:0">${item.item_name}</h3>
            <span style="font-size:0.6rem; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:10px; border:1px solid var(--glass-border)">${item.category || 'General'}</span>
        </div>
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.item_name}" style="width:100%; height:150px; object-fit:cover; border-radius:10px; margin:10px 0;">` : ''}
        <p style="font-size: 0.8rem; color: var(--text-secondary)">${item.date} | ${item.location}</p>
        <p style="margin: 0.5rem 0; font-size: 0.9rem;">${item.description || 'No description'}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem">
            <span class="status-badge status-found">${item.status.toUpperCase()}</span>
        </div>
      </div>
    `;
  });
}

async function updateNotifications() {
  const res = await fetch('/api/notifications');
  const notices = await res.json();
  const countBadge = document.getElementById('notif-count');
  const sidebarBadge = document.getElementById('sidebar-notif-count');
  const unreadCount = notices.filter(n => !n.is_read).length;
  
  if (countBadge) {
      countBadge.innerText = unreadCount;
      countBadge.style.display = unreadCount > 0 ? 'block' : 'none';
  }
  if (sidebarBadge) {
      sidebarBadge.innerText = unreadCount;
      sidebarBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }

  // Dropdown List
  const list = document.getElementById('notif-list');
  if (list) {
    if (notices.length === 0) {
        list.innerHTML = '<div class="notif-item">No notifications.</div>';
    } else {
        list.innerHTML = '';
        notices.forEach(n => {
            list.innerHTML += `
            <div class="notif-item ${n.is_read ? '' : 'notif-unread'}">
                <div class="notif-msg">${n.message}</div>
                <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:5px;">${new Date(n.created_at + 'Z').toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}</div>
                <span class="notif-close" onclick="deleteNotification('${n.id}')">&times;</span>
            </div>`;
        });
    }
  }

  // Full History Section
  const fullList = document.getElementById('full-notif-list');
  if (fullList) {
      if (notices.length === 0) {
          fullList.innerHTML = '<div class="glass-card" style="padding:2rem; width:100%; color:var(--text-secondary)">No history found yet.</div>';
      } else {
          fullList.innerHTML = '';
          notices.forEach(n => {
              fullList.innerHTML += `
                <div class="item-card fade-in" style="${n.is_read ? 'opacity:0.8' : 'border-left: 3px solid var(--primary)'}">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:1rem">
                            <i class="fa-solid fa-bell" style="color:var(--primary)"></i>
                            <div>
                                <p style="margin:0; font-size:1rem">${n.message}</p>
                                <p style="margin:0; font-size:0.75rem; color:var(--text-secondary)">${new Date(n.created_at + 'Z').toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}</p>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px">
                            <button onclick="deleteNotification('${n.id}')" class="btn btn-secondary" style="width:auto; padding:5px 10px; font-size:0.7rem">Remove</button>
                        </div>
                    </div>
                </div>
              `;
          });
      }
  }
}

async function markAsRead(id) {
    await fetch('/api/notifications/read-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    updateNotifications();
}

async function deleteNotification(id) {
    await fetch('/api/notifications/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    updateNotifications();
}

async function markAllAsRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    updateNotifications();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    updateNotifications();
    setInterval(updateNotifications, 30000);

    const bell = document.getElementById('bell-icon');
    if (bell) {
        bell.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notif-dropdown');
            const isOpening = dropdown.style.display !== 'block';
            dropdown.style.display = isOpening ? 'block' : 'none';
            if (isOpening) markAllAsRead();
            e.stopPropagation();
        });
    }

    window.addEventListener('click', () => {
        const dropdown = document.getElementById('notif-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    });

    const logout = document.getElementById('logout-btn');
    if (logout) {
        logout.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/logout');
            window.location.href = 'index.html';
        });
    }

    // Profile form
    const profileForm = document.getElementById('profile-update-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                fullname: document.getElementById('profile-fullname').value,
                email: document.getElementById('profile-email').value,
                reg_no: document.getElementById('profile-reg').value
            };
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                alert('Profile updated! Refreshing...');
                location.reload();
            } else {
                alert(data.error || 'Update failed');
            }
        });
    }

    // Item Forms
    const lostForm = document.getElementById('lost-form');
    if (lostForm) {
        lostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = new FormData();
            body.append('name', document.getElementById('lost-name').value);
            body.append('date', document.getElementById('lost-date').value);
            body.append('location', document.getElementById('lost-location').value);
            body.append('description', document.getElementById('lost-desc').value);
            body.append('category', document.getElementById('lost-category').value);
            body.append('contact_info', document.getElementById('lost-contact').value);
            
            const imageFile = document.getElementById('lost-image').files[0];
            if (imageFile) body.append('image', imageFile);

            const res = await fetch('/api/lost-items', {
                method: 'POST',
                body: body
            });
            const data = await res.json();
            if (data.success) {
                alert('Reported successfully!');
                showSection('dashboard-section');
                updateNotifications();
            }
        });
    }

    const foundForm = document.getElementById('found-form');
    if (foundForm) {
        foundForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = new FormData();
            body.append('name', document.getElementById('found-name').value);
            body.append('date', document.getElementById('found-date').value);
            body.append('location', document.getElementById('found-location').value);
            body.append('description', document.getElementById('found-desc').value);
            body.append('category', document.getElementById('found-category').value);
            body.append('contact_info', document.getElementById('found-contact').value);

            const imageFile = document.getElementById('found-image').files[0];
            if (imageFile) body.append('image', imageFile);

            const res = await fetch('/api/found-items', {
                method: 'POST',
                body: body
            });
            const data = await res.json();
            if (data.success) {
                alert('Reported found item successfully!');
                showSection('found-section');
                updateNotifications();
            }
        });
    }
});
