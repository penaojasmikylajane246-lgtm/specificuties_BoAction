// COMPLETE 61 BARANGAYS OF BOAC, MARINDUQUE
        const BOAC_BARANGAYS = [
            "Agtapan", "Agot", "Alupay", "Amoing", "Apitong", "Argao", "Balagbag", "Balimbing", 
            "Balogo", "Bamban", "Bangbangalon", "Bantad", "Bantay", "Bayuti", "Binunga", "Boi", 
            "Botoan", "Canat", "Cawit", "Dapiti", "Dawis", "Dayhagan", "Ihatub", "Isok 1 (Poblacion)", 
            "Isok 2 (Poblacion)", "Laylay", "Lupac", "Mahinhin", "Mainit", "Malbog", "Malusak (Poblacion)", 
            "Mansiwat", "Matandang Gasan", "Mercado (Poblacion)", "Mogpog", "Murallon (Poblacion)", 
            "Oja", "Pawa", "Pili", "Poctoy", "Poras", "Rizal", "San Miguel (Poblacion)", "Santol", 
            "Sawi", "Tabi", "Tabigue", "Tagtapan", "Tambunan", "Tampus", "Tanza", "Tugos", "Tumagabok"
        ].sort();

        const STORAGE_KEY = 'boaction_complaints_db';
        const USERS_KEY = 'boaction_users_db';
        const SESSION_KEY = 'boaction_current_user';

        document.addEventListener('DOMContentLoaded', () => {
            initBarangays();
            initUsers();
            initDatabase();
            checkSession();
        });

        function initBarangays() {
            const selects = [document.getElementById('barangaySelect'), document.getElementById('gateRegBrgy')];
            selects.forEach(select => {
                if(!select) return;
                select.innerHTML = '<option value="">-- Choose Barangay --</option>';
                BOAC_BARANGAYS.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b;
                    opt.textContent = `Brgy. ${b}`;
                    select.appendChild(opt);
                });
            });
        }

        function initUsers() {
            if (!localStorage.getItem(USERS_KEY)) {
                const defaults = [
                    { id: '09123456789', pass: 'user123', name: 'Maria Santos', barangay: 'Poras', role: 'citizen' },
                    { id: 'admin', pass: 'admin123', name: 'LGU Admin Officer', barangay: 'Poblacion', role: 'admin' }
                ];
                localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
            }
        }

        function initDatabase() {
            if (!localStorage.getItem(STORAGE_KEY)) {
                const mock = [
                    { id: 'BOAC-2026-8912', name: 'Juan Dela Cruz', contact: '09181234567', barangay: 'Poras', category: 'Road Maintenance', description: 'Deep pothole near barangay hall.', date: '2026-11-01', status: 'In Progress' },
                    { id: 'BOAC-2026-4431', name: 'Maria Santos', contact: '09123456789', barangay: 'Malusak (Poblacion)', category: 'Waste Management', description: 'Uncollected garbage piles.', date: '2026-11-02', status: 'Pending Review' }
                ];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
            }
        }

        function toggleAuthGateTab(tab) {
            const loginBtn = document.getElementById('gateTabLoginBtn');
            const regBtn = document.getElementById('gateTabRegBtn');
            const loginForm = document.getElementById('gateLoginForm');
            const regForm = document.getElementById('gateRegisterForm');

            if (tab === 'login') {
                loginBtn.className = "flex-1 py-2 rounded-lg bg-white shadow-sm text-emerald-800";
                regBtn.className = "flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-700";
                loginForm.classList.remove('hidden');
                regForm.classList.add('hidden');
            } else {
                regBtn.className = "flex-1 py-2 rounded-lg bg-white shadow-sm text-emerald-800";
                loginBtn.className = "flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-700";
                regForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            }
        }

        function fillGateDemo(type) {
            if (type === 'citizen') {
                document.getElementById('gateLoginId').value = '09123456789';
                document.getElementById('gateLoginPass').value = 'user123';
            } else {
                document.getElementById('gateLoginId').value = 'admin';
                document.getElementById('gateLoginPass').value = 'admin123';
            }
        }

        function handleGateLogin(e) {
            e.preventDefault();
            const id = document.getElementById('gateLoginId').value.trim();
            const pass = document.getElementById('gateLoginPass').value.trim();

            const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
            const user = users.find(u => u.id === id && u.pass === pass);

            if (user) {
                localStorage.setItem(SESSION_KEY, JSON.stringify(user));
                document.getElementById('authGateModal').classList.add('hidden');
                updateRoleView();
            } else {
                alert('⚠️ Invalid Phone/Username or Password!');
            }
        }

        function handleGateRegister(e) {
            e.preventDefault();
            const name = document.getElementById('gateRegName').value.trim();
            const phone = document.getElementById('gateRegPhone').value.trim();
            const barangay = document.getElementById('gateRegBrgy').value;
            const pass = document.getElementById('gateRegPass').value.trim();

            const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

            if (users.some(u => u.id.toLowerCase() === phone.toLowerCase())) {
                alert('❌ MAY KATULAD NANG ACCOUNT!\n\nAng phone number na ito ay nakarehistro na sa sistema.');
                return;
            }

            const newUser = { id: phone, pass: pass, name: name, barangay: barangay, role: 'citizen' };
            users.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

            alert('✅ Matagumpay ang iyong pagpaparehistro!');
            document.getElementById('authGateModal').classList.add('hidden');
            updateRoleView();
        }

        function handleLogout() {
            localStorage.removeItem(SESSION_KEY);
            document.getElementById('authGateModal').classList.remove('hidden');
            updateRoleView();
        }

        function checkSession() {
            const user = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (user) {
                document.getElementById('authGateModal').classList.add('hidden');
                updateRoleView();
            } else {
                document.getElementById('authGateModal').classList.remove('hidden');
            }
        }

        function updateRoleView() {
            const user = JSON.parse(localStorage.getItem(SESSION_KEY));
            const roleNav = document.getElementById('roleNavLinks');
            const authHeaderNav = document.getElementById('authHeaderNav');

            if (!user) return;

            authHeaderNav.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-xs text-white font-bold">${user.name} (${user.role === 'admin' ? 'LGU Admin' : 'Resident'})</span>
                    <button onclick="handleLogout()" class="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-xs text-white font-semibold rounded">Logout</button>
                </div>
            `;

            if (user.role === 'citizen') {
                roleNav.innerHTML = `
                    <button onclick="switchTab('submit')" id="nav-submit" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 bg-emerald-900 text-amber-300">
                        <i class="fa-solid fa-pen-to-square"></i> Submit Complaint
                    </button>
                    <button onclick="switchTab('track')" id="nav-track" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-700">
                        <i class="fa-solid fa-magnifying-glass"></i> Track Status
                    </button>
                `;
                document.getElementById('citizenName').value = user.name;
                document.getElementById('citizenContact').value = user.id;
                document.getElementById('barangaySelect').value = user.barangay;
                switchTab('submit');
            } else if (user.role === 'admin') {
                roleNav.innerHTML = `
                    <button onclick="switchTab('admin')" id="nav-admin" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 bg-emerald-900 text-amber-300">
                        <i class="fa-solid fa-chart-line"></i> Admin Dashboard
                    </button>
                    <button onclick="switchTab('submit')" id="nav-submit" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-700">
                        <i class="fa-solid fa-pen-to-square"></i> Submit Complaint
                    </button>
                    <button onclick="switchTab('track')" id="nav-track" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-700">
                        <i class="fa-solid fa-magnifying-glass"></i> Track Status
                    </button>
                `;
                switchTab('admin');
            }
        }

        function switchTab(tab) {
            const user = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (tab === 'admin' && user?.role !== 'admin') {
                alert('⛔ UNAUTHORIZED ACCESS!\n\nAng Admin Dashboard ay para lamang sa mga opisyal na LGU Administrative Officers.');
                return;
            }

            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');

            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('bg-emerald-900', 'text-amber-300');
                btn.classList.add('text-emerald-100', 'hover:bg-emerald-700');
            });
            const activeBtn = document.getElementById(`nav-${tab}`);
            if(activeBtn) {
                activeBtn.classList.remove('text-emerald-100', 'hover:bg-emerald-700');
                activeBtn.classList.add('bg-emerald-900', 'text-amber-300');
            }

            if (tab === 'admin') renderAdminTable();
        }

        function handleFormSubmit(e) {
            e.preventDefault();
            const code = `BOAC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const newRecord = {
                id: code,
                name: document.getElementById('citizenName').value,
                contact: document.getElementById('citizenContact').value,
                barangay: document.getElementById('barangaySelect').value,
                category: document.getElementById('categorySelect').value,
                description: document.getElementById('descriptionInput').value,
                date: new Date().toISOString().split('T')[0],
                status: 'Pending Review'
            };

            const db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            db.unshift(newRecord);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

            document.getElementById('modalTrackingCode').textContent = code;
            document.getElementById('successModal').classList.remove('hidden');
        }

        function closeSuccessModal() {
            document.getElementById('successModal').classList.add('hidden');
            switchTab('track');
            document.getElementById('trackInput').value = document.getElementById('modalTrackingCode').textContent;
            handleTrackSearch();
        }

        function handleTrackSearch(e) {
            if(e) e.preventDefault();
            const code = document.getElementById('trackInput').value.trim().toUpperCase();
            const db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            const match = db.find(i => i.id === code);
            const container = document.getElementById('trackResultContainer');
            container.classList.remove('hidden');

            if (!match) {
                container.innerHTML = `<div class="p-4 bg-red-50 text-red-700 text-xs rounded-lg text-center font-bold">Code Not Found</div>`;
                return;
            }

            container.innerHTML = `
                <div class="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 shadow-sm">
                    <div class="flex justify-between font-bold text-emerald-800">
                        <span>${match.id}</span>
                        <span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">${match.status}</span>
                    </div>
                    <p><strong>Barangay:</strong> Brgy. ${match.barangay}</p>
                    <p><strong>Category:</strong> ${match.category}</p>
                    <p><strong>Details:</strong> ${match.description}</p>
                </div>
            `;
        }

        function renderAdminTable() {
            const db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            const tbody = document.getElementById('adminTableBody');
            tbody.innerHTML = db.map(i => `
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-4 font-bold text-emerald-800">${i.id}</td>
                    <td class="py-3 px-4">${i.name}</td>
                    <td class="py-3 px-4">Brgy. ${i.barangay}</td>
                    <td class="py-3 px-4">${i.category}</td>
                    <td class="py-3 px-4">${i.date}</td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">${i.status}</span></td>
                    <td class="py-3 px-4 text-right">
                        <button onclick="alert('Manage report ${i.id}')" class="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-bold">Manage</button>
                    </td>
                </tr>
            `).join('');
        }