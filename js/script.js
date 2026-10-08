
document.addEventListener('DOMContentLoaded', () => {
    updateLoginStatus();
    if (typeof renderProgressBanner === 'function') renderProgressBanner();
    if (typeof loadAdminData === 'function') loadAdminData();
    if (typeof renderHskk === 'function') renderHskk();
    
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('userDropdown');
        const avatarBtn = document.getElementById('avatarBtn');
        if (dropdown && !dropdown.classList.contains('hidden') && avatarBtn && !dropdown.contains(event.target) && !avatarBtn.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    const video = document.getElementById('mainVideo');
    if (video) {
        video.addEventListener('timeupdate', function() { 
            if (!video.seeking && video.currentTime > supposedCurrentTime) supposedCurrentTime = video.currentTime;
            const badge = document.getElementById('currentVideoTimeBadge');
            if(badge) badge.innerText = formatTime(video.currentTime);
        });
        video.addEventListener('seeking', function() { 
            if (currentCourse !== 'Demo' && video.currentTime - supposedCurrentTime > 0.5) { 
                video.currentTime = supposedCurrentTime; 
                showToast("Bạn không được tua nhanh video!", "error"); 
            } 
        });
        video.addEventListener('ended', function() { 
            if (currentCourse !== 'Demo') showQuiz(); 
        });
    }

    const qaInput = document.getElementById('qaInput');
    if(qaInput) {
        qaInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postQA(); }
        });
    }
    const noteInput = document.getElementById('noteInput');
    if(noteInput) {
        noteInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); postNote(); }
        });
    }
});

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
    const toast = document.createElement('div'); toast.className = `toast ${type}`;
    let icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span class="text-xl">${icon}</span> <p class="text-sm font-medium text-gray-700">${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fadeOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu'); if(menu) menu.classList.toggle('hidden');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown'); if(dropdown) dropdown.classList.toggle('hidden');
}

function updateLoginStatus() {
    const user = Database.getSession();
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    if (user) {
        const name = user.name || "Học viên";
        const username = "@" + (user.email ? user.email.split('@')[0] : "hocvien");
        const initial = name.charAt(0).toUpperCase();
        let adminMenu = user.role === 'admin' ? `<a href="admin.html" class="block px-4 py-2 text-sm hover:bg-gray-800 rounded-lg text-[#F05123] font-bold">⚙ Quản trị viên (Admin)</a>` : '';
        let avatarHTML = user.avatar ? `<img src="${user.avatar}" class="w-full h-full object-cover rounded-full">` : initial;
        
        authContainer.innerHTML = `
            <div class="relative">
                <button id="avatarBtn" onclick="toggleUserMenu()" class="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F05123] to-[#ff8f6f] flex items-center justify-center text-white font-bold shadow-md border-2 border-white overflow-hidden p-0">${avatarHTML}</button>
                <div id="userDropdown" class="hidden absolute right-0 mt-2 w-72 bg-[#1C1D1F] rounded-2xl shadow-2xl border border-gray-800 z-50 overflow-hidden text-gray-300">
                    <div class="p-4 border-b border-gray-800 flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F05123] to-[#ff8f6f] flex items-center justify-center text-white font-bold text-lg overflow-hidden p-0">${avatarHTML}</div>
                        <div><h4 class="font-bold text-white text-base">${name}</h4><p class="text-xs text-gray-500">${username}</p></div>
                    </div>
                    <div class="p-2 space-y-1">${adminMenu}<a href="javascript:void(0)" onclick="openMyCourses()" class="block px-4 py-2 text-sm hover:bg-gray-800 rounded-lg">Khóa học của tôi</a></div>
                    <div class="p-2 border-t border-gray-800 space-y-1">
                        <a href="javascript:void(0)" onclick="openSettings()" class="block px-4 py-2 text-sm hover:bg-gray-800 rounded-lg">Cài đặt</a>
                        <a href="javascript:void(0)" onclick="doLogout()" class="block px-4 py-2 text-sm hover:bg-gray-800 rounded-lg text-red-400">Đăng xuất</a>
                    </div>
                </div>
            </div>
        `;
    } else {
        authContainer.innerHTML = `<button onclick="openModal('loginModal')" class="border border-gray-300 bg-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">👤 Đăng nhập</button>`;
    }
    if(typeof updateCourseButtons === 'function') updateCourseButtons();
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); if(id === 'loginModal') showLoginOptions(); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); }
function showEmailLogin() { document.getElementById('loginOptionsView').classList.add('hidden'); document.getElementById('emailLoginView').classList.remove('hidden'); }
function showLoginOptions() { const el = document.getElementById('emailLoginView'); if(el) el.classList.add('hidden'); document.getElementById('loginOptionsView').classList.remove('hidden'); }
function switchToRegister() { closeModal('loginModal'); openModal('registerModal'); }
function switchToLogin() { closeModal('registerModal'); openModal('loginModal'); }

function openMyCourses() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    
    const user = Database.getSession();
    if (!user) return;
    
    const container = document.getElementById('myCoursesList');
    if (!container) return;
    
    if (!user.courses || user.courses.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">Bạn chưa đăng ký khóa học nào.</p>';
    } else {
        let html = '';
        user.courses.forEach(c => {
            const cType = user.courseTypes ? user.courseTypes[c] : null;
            let actionBtn = '';
            
            if (c.includes('Video')) {
                actionBtn = `<button onclick="closeModal('myCoursesModal'); openCourse('${c}')" class="bg-[#F05123] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#d8481e] w-full">Vào học</button>`;
            } else if (cType === 'offline') {
                actionBtn = `<button onclick="closeModal('myCoursesModal'); showOfflineInfo('${c}')" class="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 w-full">Xem lịch học</button>`;
            } else {
                actionBtn = `<button onclick="window.open('https://zalo.me/', '_blank')" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold mb-1 w-full hover:bg-blue-600">Nhóm Zalo</button>
                             <button onclick="window.open('https://zoom.us/', '_blank')" class="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold w-full hover:bg-black">Vào Zoom</button>`;
            }
            
            let labelType = c.includes('Video') ? 'Video quay sẵn' : (cType === 'offline' ? 'Học Trực tiếp' : 'Học Online');
            
            html += `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 mb-3 hover:border-gray-300 transition-colors">
                <div class="flex-1 pr-2">
                    <h4 class="font-bold text-gray-800 text-sm mb-1">${c}</h4>
                    <span class="text-[10px] uppercase font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">${labelType}</span>
                </div>
                <div class="shrink-0 flex flex-col gap-1 w-24">${actionBtn}</div>
            </div>`;
        });
        container.innerHTML = html;
    }
    openModal('myCoursesModal');
}

function openGoogleOAuth() { closeModal('loginModal'); openModal('googleOAuthModal'); }
function processGoogleLogin(name, email, avatarUrl) {
    closeModal('googleOAuthModal');
    const res = Database.loginGoogle(name, email, avatarUrl);
    if(res.success) { updateLoginStatus(); showToast("Đăng nhập Google thành công!", "success"); if (typeof renderProgressBanner === 'function') renderProgressBanner(); }
    else { showToast(res.message, "error"); }
}
function doLogin() {
    const email = document.getElementById('loginEmail')?.value;
    const pass = document.getElementById('loginPassword')?.value;
    const res = Database.login(email, pass);
    if (res.success) { updateLoginStatus(); closeModal('loginModal'); showToast("Đăng nhập thành công!", "success"); if (typeof renderProgressBanner === 'function') renderProgressBanner(); }
    else { showToast(res.message, "error"); }
}
function doRegister() {
    const name = document.getElementById('regName')?.value;
    const email = document.getElementById('regEmail')?.value;
    const pass = document.getElementById('regPassword')?.value;
    const res = Database.register(name, email, pass);
    if (res.success) { updateLoginStatus(); closeModal('registerModal'); showToast("Đăng ký thành công!", "success"); }
    else { showToast(res.message, "error"); }
}
function doLogout() { Database.logout(); updateLoginStatus(); showToast("Đã đăng xuất!", "info"); if(window.location.pathname.includes('admin.html')) window.location.href='index.html'; }

function openSettings() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    
    const user = Database.getSession();
    if(user) { 
        const fn = document.getElementById('set-fullname');
        if (fn) fn.value = user.name || ""; 
        
        const un = document.getElementById('set-username');
        if (un) un.value = user.email ? user.email.split('@')[0] : ""; 
        
        const bio = document.getElementById('set-bio');
        if (bio) bio.value = user.bio || ""; 
    }
    openModal('settingsModal');
}
function saveSettings() { Database.updateProfile(document.getElementById('set-fullname').value, document.getElementById('set-bio').value); updateLoginStatus(); showToast("Đã lưu thông tin!", "success"); }
function savePassword() {
    const p0 = document.getElementById('set-pass0')?.value;
    const p1 = document.getElementById('set-pass1')?.value;
    const p2 = document.getElementById('set-pass2')?.value;
    if(!p0 || !p1 || !p2) { showToast("Vui lòng điền đầy đủ mật khẩu!", "error"); return; }
    if(p1 !== p2) { showToast("Mật khẩu nhập lại không khớp!", "error"); return; }
    const res = Database.changePassword(p0, p1);
    if(res.success) { 
        showToast(res.message, "success"); 
        closeModal('settingsModal'); 
        document.getElementById('set-pass0').value = '';
        document.getElementById('set-pass1').value = '';
        document.getElementById('set-pass2').value = '';
    } else { showToast(res.message, "error"); }
}
function switchSettingTab(tab) {
    document.querySelectorAll('.setting-tab-btn').forEach(btn => { btn.classList.remove('bg-[#F05123]', 'text-white', 'opacity-100'); btn.classList.add('text-gray-400', 'opacity-60'); });
    document.querySelectorAll('.setting-content').forEach(c => c.classList.add('hidden'));
    if(tab === 'info') { 
        document.getElementById('tab-btn-info').classList.add('bg-[#F05123]', 'text-white', 'opacity-100'); 
        document.getElementById('tab-btn-info').classList.remove('text-gray-400', 'opacity-60'); 
        document.getElementById('setting-content-info').classList.remove('hidden'); 
    } else { 
        document.getElementById('tab-btn-pass').classList.add('bg-[#F05123]', 'text-white', 'opacity-100'); 
        document.getElementById('tab-btn-pass').classList.remove('text-gray-400', 'opacity-60'); 
        document.getElementById('setting-content-pass').classList.remove('hidden'); 
    }
}

const courseData = {
    'Lộ trình HSK 1': [ { title: "1. Tổng quan Lộ trình HSK 1", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Giới thiệu phương pháp học HSK 1.", duration: "10:00" } ],
    'Lộ trình HSK 2': [ { title: "1. Tổng quan Lộ trình HSK 2", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Giới thiệu phương pháp học HSK 2.", duration: "12:00" } ],
    'Lộ trình HSK 3': [ { title: "1. Tổng quan Lộ trình HSK 3", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Định hướng HSK 3.", duration: "15:00" } ],
    'Lộ trình HSK 4': [ { title: "1. Tổng quan Lộ trình HSK 4", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Định hướng HSK 4.", duration: "20:00" } ],
    'Lộ trình HSK 5': [ { title: "1. Tổng quan Lộ trình HSK 5", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Định hướng HSK 5 Cao cấp.", duration: "25:00" } ],
    'Video HSK 1 Toàn tập': [
        { 
            title: "1. Giới thiệu & Xin chào", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Bài học đầu tiên, làm quen với cách chào hỏi và phát âm cơ bản nhất trong tiếng Trung.", duration: "02:15", 
            quizzes: [
                { q: "Làm sao để nói 'Xin chào' trong tiếng Trung?", opts: ["Nǐ hǎo", "Xièxie", "Zàijiàn", "Duìbùqǐ"], ans: 0 }, 
                { q: "Chữ Hán của từ 'Xin chào' là gì?", opts: ["谢谢", "你好", "再见", "对不起"], ans: 1 },
                { q: "Khi người khác chào 'Nǐ hǎo', bạn nên đáp lại thế nào?", opts: ["Xièxie", "Nǐ hǎo", "Zàijiàn", "Bù kèqì"], ans: 1 },
                { q: "'Bạn khỏe không?' trong tiếng Trung nói thế nào?", opts: ["Nǐ hǎo ma?", "Wǒ hěn hǎo", "Nǐ zǎo", "Míngtiān jiàn"], ans: 0 },
                { q: "Đại từ nhân xưng ngôi thứ nhất (Tôi) trong tiếng Trung là gì?", opts: ["Nǐ (你)", "Tā (他)", "Wǒ (我)", "Wǒmen (我们)"], ans: 2 }
            ] 
        },
        { 
            title: "2. Cảm ơn & Xin lỗi", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Cách thể hiện sự biết ơn và xin lỗi một cách lịch sự.", duration: "04:30", 
            quizzes: [ 
                { q: "Câu nào dùng để xin lỗi?", opts: ["Bù kèqì", "Duìbùqǐ", "Méi guānxì", "Xièxie"], ans: 1 },
                { q: "Đáp lại lời xin lỗi (Duìbùqǐ) dùng câu nào?", opts: ["Méi guānxì", "Bù kèqì", "Zàijiàn", "Nǐ hǎo"], ans: 0 },
                { q: "Cảm ơn tiếng Trung nói thế nào?", opts: ["Duìbùqǐ", "Xièxie", "Zàijiàn", "Hǎo de"], ans: 1 },
                { q: "Đáp lại lời cảm ơn (Xièxie) là gì?", opts: ["Méi guānxì", "Bù kèqì", "Zàijiàn", "Nǐ hǎo"], ans: 1 }
            ] 
        },
        { 
            title: "3. Tạm biệt", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Cách chào tạm biệt và hẹn gặp lại phù hợp.", duration: "03:20", 
            quizzes: [ 
                { q: "Tạm biệt tiếng Trung là gì?", opts: ["Zàijiàn", "Wǎn'ān", "Zǎoshang hǎo", "Wǎnshang hǎo"], ans: 0 },
                { q: "Chữ Hán của từ Tạm biệt?", opts: ["再见", "你好", "谢谢", "没关系"], ans: 0 },
                { q: "'Hẹn ngày mai gặp lại' nói thế nào?", opts: ["Jīntiān jiàn", "Míngtiān jiàn", "Zàijiàn", "Xiàcì jiàn"], ans: 1 },
                { q: "Từ 'Míngtiān' (Ngày mai) viết chữ Hán như thế nào?", opts: ["今天", "明天", "昨天", "后天"], ans: 1 }
            ] 
        }
    ],
    'Video HSK 2 Cải thiện': [ 
        { 
            title: "1. Hỏi đường cơ bản", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Cách hỏi đường đi, chỉ phương hướng.", duration: "05:00", 
            quizzes: [
                { q: "Từ nào nghĩa là 'Ở đâu'?", opts: ["Shénme", "Nǎr", "Shéi", "Zěnme"], ans: 1 },
                { q: "'Bệnh viện ở đâu?' dịch sang tiếng Trung là?", opts: ["Yīyuàn zài nǎr?", "Xuéxiào zài nǎr?", "Chāoshì zài nǎr?", "Yínháng zài nǎr?"], ans: 0 },
                { q: "Phương hướng 'Bên trái' tiếng Trung là gì?", opts: ["Yòubiān", "Zuǒbiān", "Qiánbian", "Hòubian"], ans: 1 }
            ] 
        } 
    ],
    'Video HSK 3 Đột phá': [ { title: "1. Ngữ pháp câu chữ 把", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Cấu trúc quan trọng.", duration: "10:00", quizzes: [{ q: "Câu nào đúng ngữ pháp?", opts: ["我把书放在桌子上", "我放在桌子上把书", "把书我放在桌子上", "我把放在桌子上书"], ans: 0 }] } ],
    'Video HSK 4 Tiêu chuẩn': [ { title: "1. Phân tích câu phức", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Liên từ.", duration: "12:30", quizzes: [{ q: "Cấu trúc chỉ nguyên nhân - kết quả?", opts: ["因为...所以...", "虽然...但是...", "不仅...而且...", "如果...就..."], ans: 0 }] } ],
    'Video HSK 5 Cao cấp': [ { title: "1. Đọc hiểu đoạn văn", vid: "https://www.w3schools.com/html/mov_bbb.mp4", desc: "Skimming.", duration: "15:45", quizzes: [{ q: "Ý nghĩa của 'Kiên trì không bỏ cuộc'?", opts: ["半途而废", "坚持不懈", "马马虎虎", "不可思议"], ans: 1 }] } ]
};

function renderProgressBanner() { 
    const banner = document.getElementById('continue-learning-banner'); if(!banner) return;
    const user = Database.getSession();
    if(!user || !user.courses || user.courses.length === 0) { banner.classList.add('hidden'); return; }

    let activeCourse = null; let maxProgress = -1;
    user.courses.forEach(course => {
        if(courseData[course]) {
            let p = Database.getProgress(course);
            if (p >= maxProgress) { maxProgress = p; activeCourse = course; }
        }
    });

    if (activeCourse) {
        let total = courseData[activeCourse].length;
        let percent = Math.round((maxProgress / total) * 100);
        let nextLessonName = courseData[activeCourse][maxProgress] ? courseData[activeCourse][maxProgress].title : "Đã hoàn thành";
        let streak = user.studyStreak || 1;
        
        banner.innerHTML = `
            <div class="bg-[#1C1D1F] rounded-2xl p-4 shadow-xl border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 hover-lift max-w-4xl mx-auto">
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <div class="text-[#F05123] font-bold text-2xl shrink-0 w-16 text-center">${percent}%</div>
                    <div class="w-px h-10 bg-gray-700 hidden md:block"></div>
                    <div class="flex-1">
                        <h3 class="text-white font-bold text-base mb-1">${activeCourse}</h3>
                        <div class="flex flex-wrap items-center gap-2 text-xs text-gray-400"><span>Bài tiếp: ${nextLessonName}</span><span>•</span><span>${maxProgress}/${total} bài</span><span>•</span><span class="bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded-full font-medium">Chuỗi ${streak} ngày</span></div>
                    </div>
                </div>
                <button onclick="window.location.href='videos.html'" class="w-full md:w-auto shrink-0 bg-[#F05123] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#d8481e] transition-colors text-sm shadow-sm">Tiếp tục học</button>
            </div>
        `;
        banner.classList.remove('hidden');
    } else { banner.classList.add('hidden'); }
}

function updateCourseButtons() { 
    const user = Database.getSession();
    const isLoggedIn = !!user;
    const purchased = user ? (user.courses || []) : [];
    
    document.querySelectorAll('.course-card').forEach(card => {
        const courseName = card.getAttribute('data-course'); const price = card.getAttribute('data-price');
        const actionsDiv = card.querySelector('.course-actions'); const priceSpan = card.querySelector('.price-display');
        if(!actionsDiv) return;

        if (isLoggedIn && purchased.includes(courseName)) {
            actionsDiv.innerHTML = `<button onclick="openCourse('${courseName}')" class="bg-[#1B2A24] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-black transition-colors w-full font-medium mt-2">▶ Vào học ngay</button>`;
            if(priceSpan) priceSpan.style.display = 'none';
        } else {
            actionsDiv.innerHTML = `<div class="flex gap-2 w-full mt-2"><button onclick="playDemo('${courseName}')" class="flex-1 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Xem demo</button><button onclick="buyCourse('${courseName}', '${price}')" class="flex-1 bg-[#F05123] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#d8481e] transition-colors">Mua ngay</button></div>`;
            if(priceSpan) priceSpan.style.display = 'block';
        }
    });

    document.querySelectorAll('.path-card').forEach(card => {
        const courseName = card.getAttribute('data-course'); const price = card.getAttribute('data-price');
        const actionsDiv = card.querySelector('.path-actions'); const priceSpan = card.querySelector('.price-display');
        if(!actionsDiv) return;

        if (isLoggedIn && purchased.includes(courseName)) {
            const courseTypes = user.courseTypes || {};
            const studyType = courseTypes[courseName] || 'online';
            
            if (studyType === 'offline') {
                actionsDiv.innerHTML = `<div class="flex gap-2 w-full mt-2"><button onclick="showOfflineInfo('${courseName}')" class="flex-1 bg-orange-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm">📍 Xem Địa điểm & Lịch</button></div>`;
            } else {
                actionsDiv.innerHTML = `<div class="flex gap-2 w-full mt-2">
                    <button onclick="window.open('https://zalo.me/', '_blank')" class="flex-1 bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-colors shadow-sm">👥 Vào nhóm Zalo</button>
                    <button onclick="window.open('https://zoom.us/', '_blank')" class="flex-1 bg-[#1B2A24] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-black transition-colors shadow-sm">▶ Vào Zoom</button>
                </div>`;
            }
            if(priceSpan) priceSpan.style.display = 'none';
        } else {
            actionsDiv.innerHTML = `<button onclick="buyPathCourse('${courseName}', '${price}')" class="bg-[#1B2A24] text-white px-5 py-2.5 rounded-xl text-sm font-medium w-full mt-2 hover:bg-black transition-colors shadow-sm">Mua khóa học</button>`;
            if(priceSpan) priceSpan.style.display = 'block';
        }
    });
}

function showOfflineInfo(courseName) {
    const user = Database.getSession();
    if(!user || !user.courseDetails || !user.courseDetails[courseName]) return;
    const details = user.courseDetails[courseName];
    
    document.getElementById('offlineCourseName').innerText = courseName;
    document.getElementById('offlineStudentId').innerText = details.studentId || 'HS99999';
    document.getElementById('offlineSchedule').innerText = details.schedule === '2-4-6' ? 'Thứ 2 - 4 - 6' : 'Thứ 3 - 5 - 7';
    document.getElementById('offlineTime').innerText = details.time === '18h-21h' ? '18:00 - 21:00 (6h - 9h tối)' : '18:00 - 21:00';
    
    openModal('offlineInfoModal');
}

let selectedCourse = null; let selectedPrice = null; let isPathCourse = false; 
let currentStudentId = ''; let paymentTimer = null;

function buyCourse(courseName, price) {
    if(!Database.getSession()) { openModal('loginModal'); return; }
    isPathCourse = false; selectedCourse = courseName; selectedPrice = price;
    document.getElementById('checkoutCourseName').innerText = courseName; document.getElementById('checkoutPrice').innerText = price;
    document.getElementById('studyTypeSelection').classList.add('hidden'); 
    document.getElementById('scheduleSelection').classList.add('hidden');
    openModal('checkoutModal');
}
function buyPathCourse(courseName, price) {
    if(!Database.getSession()) { openModal('loginModal'); return; }
    isPathCourse = true; selectedCourse = courseName; selectedPrice = price;
    document.getElementById('checkoutCourseName').innerText = courseName; document.getElementById('checkoutPrice').innerText = price;
    document.getElementById('studyTypeSelection').classList.remove('hidden'); 
    document.getElementById('scheduleSelection').classList.remove('hidden');
    openModal('checkoutModal');
}

function processPayment() {
    const typeSelect = document.getElementById('studyTypeSelect');
    const studyType = (isPathCourse && typeSelect) ? typeSelect.value : 'online';

    currentStudentId = 'HS' + Math.floor(10000 + Math.random() * 90000);
    const priceNum = selectedPrice.replace(/[^0-9]/g, ''); 
    
    document.getElementById('qrAmount').innerText = selectedPrice;
    document.getElementById('qrContent').innerText = 'TQ ' + currentStudentId;
    document.getElementById('qrImage').src = `https://img.vietqr.io/image/MB-0357640277-compact2.png?amount=${priceNum}&addInfo=TQ%20${currentStudentId}&accountName=LE%20DUC%20THANG`;
    
    closeModal('checkoutModal'); openModal('qrModal');
    
    paymentTimer = setTimeout(() => { executeRealPayment(studyType); }, 5000);
}

function cancelPayment() {
    clearTimeout(paymentTimer); closeModal('qrModal'); showToast("Đã hủy quá trình thanh toán", "info");
}

function executeRealPayment(studyType) {
    const scheduleSelect = document.getElementById('checkoutSchedule');
    const timeSelect = document.getElementById('checkoutTime');
    const schedule = (isPathCourse && scheduleSelect) ? scheduleSelect.value : '';
    const time = (isPathCourse && timeSelect) ? timeSelect.value : '';

    Database.buyCourse(selectedCourse, studyType, schedule, time, currentStudentId);
    closeModal('qrModal');
    
    document.getElementById('successCourseName').innerText = selectedCourse;
    let stepsHtml = '';
    
    if (!isPathCourse) {
        stepsHtml = `
            <li>Vào mục <strong>Khóa học Video</strong> trên thanh công cụ.</li>
            <li>Bấm <strong>▶ Vào học ngay</strong> để bắt đầu ôn luyện.</li>
            <li>Mã học viên của bạn là: <strong class="text-black bg-gray-200 px-1 rounded">${currentStudentId}</strong></li>
        `;
    } else if (studyType === 'online') {
        stepsHtml = `
            <li>Tham gia <a href="https://zalo.me/" target="_blank" class="underline font-bold text-blue-600">Nhóm Zalo lớp học</a> để nhận thông báo.</li>
            <li>Lưu lại Link Zoom phòng học để vào học đúng giờ.</li>
            <li>Mã học viên của bạn là: <strong class="text-black bg-gray-200 px-1 rounded">${currentStudentId}</strong>.</li>
        `;
    } else {
        const schText = document.getElementById('checkoutSchedule').options[document.getElementById('checkoutSchedule').selectedIndex].text;
        const timeText = document.getElementById('checkoutTime').options[document.getElementById('checkoutTime').selectedIndex].text;
        stepsHtml = `
            <li>Ghi chú lịch học: <strong>${schText}</strong>.</li>
            <li>Giờ lên lớp: <strong>${timeText}</strong>.</li>
            <li>Đến đúng giờ tại địa chỉ: <strong>Quảng Yên, Quảng Ninh</strong>.</li>
            <li>Vui lòng đọc Mã học viên: <strong class="text-black bg-gray-200 px-1 rounded">${currentStudentId}</strong> cho trợ giảng khi đến lớp.</li>
        `;
    }
    document.getElementById('nextStepsList').innerHTML = stepsHtml;
    openModal('paymentSuccessModal');
}

// =====================================
// KHÓA HỌC VIDEO TABS, QA VÀ NOTES
// =====================================
let currentCourse = ''; let currentLessonIndex = 0; let supposedCurrentTime = 0; let currentQuizIndex = 0;

function stopVideo() { const video = document.getElementById('mainVideo'); if(video) { video.pause(); video.currentTime = 0; } }

function playDemo(courseName) {
    currentCourse = 'Demo'; document.getElementById('videoTopTitle').innerText = "Xem thử: " + courseName;
    document.getElementById('videoTitle').innerText = "Bản xem thử";
    document.getElementById('videoDesc').innerText = "Đây là bản xem thử. Mua khóa học để lưu tiến trình, mở khóa bài tập và đặt câu hỏi.";
    const video = document.getElementById('mainVideo'); 
    if(video) { video.src = "https://www.w3schools.com/html/mov_bbb.mp4"; }
    document.getElementById('lessonList').innerHTML = `<div class="text-gray-400 text-sm p-4 bg-[#1C1D1F] m-4 rounded-xl border border-gray-800">ℹ️ Đây là bản xem thử. Vui lòng mua khóa học để xem danh sách bài học.</div>`;
    document.getElementById('quizSectionWrapper').classList.add('hidden'); 
    document.getElementById('learningTabsSection').classList.add('hidden');
    supposedCurrentTime = 999999; openModal('videoCourseModal'); if(video) video.play();
}

function openCourse(courseName) {
    if(!courseData[courseName]) { showToast("Dữ liệu khóa học đang được cập nhật!", "info"); return; }
    currentCourse = courseName; document.getElementById('videoTopTitle').innerText = courseName;
    let progress = Database.getProgress(currentCourse);
    if(progress >= courseData[currentCourse].length) progress = courseData[currentCourse].length - 1;
    openModal('videoCourseModal'); 
    playLesson(progress);
}

function renderLessonList() {
    const listDiv = document.getElementById('lessonList'); const lessons = courseData[currentCourse];
    let progress = Database.getProgress(currentCourse);
    let html = '';
    lessons.forEach((lesson, index) => {
        const isUnlocked = index <= progress; const isCompleted = index < progress; const isActive = index === currentLessonIndex;
        let bgClass = isActive ? 'bg-[#333333]' : (isUnlocked ? 'bg-[#1C1D1F] hover:bg-[#2A2B2D]' : 'bg-[#141414] opacity-50 cursor-not-allowed');
        let icon = isCompleted ? '<span class="text-[#22c55e]">✔</span>' : (isActive ? '<span class="text-[#F05123]">▶</span>' : (isUnlocked ? '<span class="text-gray-400">▶</span>' : '🔒'));
        let borderClass = isActive ? 'border-l-4 border-[#F05123]' : 'border-l-4 border-transparent';
        html += `<div class="${bgClass} ${borderClass} px-4 py-3 cursor-pointer transition-colors border-b border-gray-800" ${isUnlocked ? `onclick="playLesson(${index})"` : `onclick="showToast('Bạn cần hoàn thành bài trước đó!', 'error')"`}><div class="flex items-start gap-3"><div class="mt-1">${icon}</div><div><h4 class="text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}">${lesson.title}</h4><div class="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><span>⏱</span> ${lesson.duration || '00:00'}</div></div></div></div>`;
    });
    listDiv.innerHTML = html;
}

function playLesson(index) {
    currentLessonIndex = index; currentQuizIndex = 0;
    const lesson = courseData[currentCourse][index]; const video = document.getElementById('mainVideo');
    if(video) video.src = lesson.vid; supposedCurrentTime = 0; 
    
    document.getElementById('videoTitle').innerText = lesson.title;
    document.getElementById('videoDesc').innerText = lesson.desc || "Không có mô tả.";
    
    document.getElementById('quizSectionWrapper').classList.add('hidden'); 
    document.getElementById('learningTabsSection').classList.remove('hidden');
    
    document.getElementById('btnPrevLesson').disabled = (index === 0);
    
    renderLessonList(); 
    switchVideoTab('overview');
    renderQA();
    renderNotes();
    
    const user = Database.getSession();
    if(user && document.getElementById('qaUserAvatar')) {
        document.getElementById('qaUserAvatar').innerHTML = user.avatar ? `<img src="${user.avatar}" class="w-full h-full rounded-full object-cover">` : user.name.charAt(0).toUpperCase();
    }
    
    if(video) video.play();
}

function prevLesson() { if (currentLessonIndex > 0) playLesson(currentLessonIndex - 1); }

function nextLesson() {
    let maxUnlocked = Database.getProgress(currentCourse);
    if (currentLessonIndex < courseData[currentCourse].length - 1) {
        if (currentLessonIndex < maxUnlocked) playLesson(currentLessonIndex + 1);
        else showToast("Bạn phải xem hết video và làm bài tập để qua bài!", "error");
    } else {
        showToast("Đây là bài học cuối cùng!", "info");
    }
}

function switchVideoTab(tabName) {
    document.querySelectorAll('.video-tab-btn').forEach(btn => {
        btn.classList.remove('border-[#F05123]', 'text-white', 'opacity-100');
        btn.classList.add('border-transparent', 'text-gray-400', 'opacity-60');
    });
    document.querySelectorAll('.video-tab-content').forEach(c => c.classList.add('hidden'));
    
    document.getElementById('tab-' + tabName).classList.add('border-[#F05123]', 'text-white', 'opacity-100');
    document.getElementById('tab-' + tabName).classList.remove('border-transparent', 'text-gray-400', 'opacity-60');
    document.getElementById('content-' + tabName).classList.remove('hidden');
}

// Logic QA
function renderQA() {
    const qaList = Database.getQA(currentCourse, currentLessonIndex);
    const container = document.getElementById('qaList');
    if(!container) return;
    if(qaList.length === 0) {
        container.innerHTML = `<p class="text-sm text-gray-500 italic text-center py-4">Chưa có thảo luận nào. Hãy là người đầu tiên đặt câu hỏi!</p>`;
        return;
    }
    let html = '';
    qaList.forEach(qa => {
        let avaHTML = qa.avatar ? `<img src="${qa.avatar}" class="w-full h-full rounded-full object-cover">` : qa.name.charAt(0).toUpperCase();
        html += `
        <div class="flex gap-3 text-sm">
            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">${avaHTML}</div>
            <div>
                <p><span class="font-bold text-white">${qa.name}</span> <span class="text-gray-500 text-xs ml-2">${qa.time}</span></p>
                <p class="text-gray-300 mt-1">${qa.text}</p>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function postQA() {
    const user = Database.getSession();
    if(!user) { showToast("Vui lòng đăng nhập để bình luận", "error"); return; }
    const input = document.getElementById('qaInput');
    const text = input.value.trim();
    if(!text) return;
    Database.addQA(currentCourse, currentLessonIndex, { name: user.name, text: text, avatar: user.avatar, time: new Date().toLocaleDateString() });
    input.value = '';
    renderQA();
    showToast("Đã gửi bình luận!", "success");
}

// Logic Notes
function renderNotes() {
    const notesList = Database.getNotes(currentCourse, currentLessonIndex);
    const container = document.getElementById('notesList');
    if(!container) return;
    if(notesList.length === 0) {
        container.innerHTML = `<p class="text-sm text-gray-500 italic text-center py-4">Bạn chưa có ghi chú nào trong bài học này.</p>`;
        return;
    }
    let html = '';
    notesList.forEach((n, idx) => {
        html += `
        <div class="bg-[#1C1D1F] p-3 rounded-lg flex items-start gap-3 border border-gray-800 hover:border-gray-600 transition-colors relative group">
            <button onclick="seekVideo(${n.time})" class="bg-[#F05123]/20 text-[#F05123] px-2 py-1 rounded text-xs font-bold hover:bg-[#F05123] hover:text-white transition-colors shrink-0">${formatTime(n.time)}</button>
            <div class="flex-1">
                <p class="text-gray-300 text-sm">${n.text}</p>
                <p class="text-gray-600 text-xs mt-1">${n.date}</p>
            </div>
            <button onclick="deleteNote(${idx})" class="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        </div>`;
    });
    container.innerHTML = html;
}

function postNote() {
    const user = Database.getSession();
    if(!user) { showToast("Vui lòng đăng nhập để tạo ghi chú", "error"); return; }
    const input = document.getElementById('noteInput');
    const text = input.value.trim();
    if(!text) return;
    const video = document.getElementById('mainVideo');
    Database.addNote(currentCourse, currentLessonIndex, { time: video.currentTime, text: text, date: new Date().toLocaleDateString() });
    input.value = '';
    renderNotes();
    showToast("Đã lưu ghi chú!", "success");
}

function deleteNote(noteIndex) {
    Database.deleteNote(currentCourse, currentLessonIndex, noteIndex);
    renderNotes();
    showToast("Đã xóa ghi chú", "info");
}

function seekVideo(time) {
    const video = document.getElementById('mainVideo');
    if(video) { video.currentTime = time; if(video.paused) video.play(); }
}

// QUIZ
function showQuiz() {
    const lesson = courseData[currentCourse][currentLessonIndex];
    if(!lesson.quizzes || lesson.quizzes.length === 0) { completeLesson(); return; }
    document.getElementById('quizSectionWrapper').classList.remove('hidden');
    document.getElementById('learningTabsSection').classList.add('hidden');
    renderQuiz();
}

function renderQuiz() {
    const lesson = courseData[currentCourse][currentLessonIndex]; const quiz = lesson.quizzes[currentQuizIndex];
    document.getElementById('quizProgressText').innerText = `Câu hỏi ${currentQuizIndex + 1}/${lesson.quizzes.length}`;
    document.getElementById('quizQuestionText').innerText = quiz.q;
    const optsDiv = document.getElementById('quizOptionsContainer'); optsDiv.innerHTML = '';
    quiz.opts.forEach((opt, idx) => {
        optsDiv.innerHTML += `<button onclick="checkAnswer(${idx}, ${quiz.ans})" class="w-full text-left p-4 mb-3 border border-gray-700 bg-[#1C1D1F] rounded-xl font-medium hover:border-[#F05123] hover:bg-[#F05123]/10 focus:border-[#F05123] transition-all text-gray-200 flex items-center gap-3"><span class="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center text-xs text-gray-400 shrink-0">${String.fromCharCode(65 + idx)}</span><span>${opt}</span></button>`;
    });
}

function checkAnswer(selected, correct) {
    if(selected === correct) {
        showToast("Tuyệt vời! Đáp án chính xác.", "success");
        const lesson = courseData[currentCourse][currentLessonIndex];
        if (currentQuizIndex + 1 < lesson.quizzes.length) { currentQuizIndex++; renderQuiz(); } else { completeLesson(); }
    } else { showToast("Sai rồi! Hãy suy nghĩ lại nhé.", "error"); }
}

function completeLesson() {
    let progress = Database.getProgress(currentCourse);
    if (currentLessonIndex === progress) {
        if (currentLessonIndex + 1 < courseData[currentCourse].length) {
            Database.updateProgress(currentCourse, progress + 1);
            document.getElementById('quizSectionWrapper').innerHTML = `<div class="text-center py-10"><div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl text-white mx-auto mb-4 animate-bounce">✔</div><h3 class="text-2xl font-bold text-white mb-2">Chúc mừng!</h3><p class="text-gray-400 mb-6">Bạn đã hoàn thành bài học này.</p><button onclick="playLesson(${currentLessonIndex + 1})" class="bg-[#F05123] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#d8481e]">Học bài tiếp theo</button></div>`;
        } else {
            document.getElementById('quizSectionWrapper').innerHTML = `<div class="text-center py-10"><div class="text-6xl mb-4">🏆</div><h3 class="text-2xl font-bold text-white mb-2">Quá xuất sắc!</h3><p class="text-gray-400 mb-6">Bạn đã hoàn thành khóa học.</p><button onclick="closeModal('videoCourseModal')" class="bg-[#F05123] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#d8481e]">Trở về</button></div>`;
        }
    }
    renderLessonList(); 
}

// HSKK & TRANSLATE
const hskkSentences = [
    { zh: "你好中国", py: "Nǐ hǎo zhōngguó", vi: "Xin chào Trung Quốc" },
    { zh: "谢谢你的帮助", py: "Xièxiè nǐ de bāngzhù", vi: "Cảm ơn sự giúp đỡ của bạn" },
    { zh: "我喜欢学习汉语", py: "Wǒ xǐhuān xuéxí hànyǔ", vi: "Tôi thích học tiếng Hán" }
];
let currentHskkIndex = 0;
function renderHskk() {
    const targetEl = document.getElementById('target-phrase'); if(!targetEl) return;
    const s = hskkSentences[currentHskkIndex]; targetEl.innerText = s.zh; 
    document.getElementById('target-pinyin').innerText = s.py; document.getElementById('target-vi').innerText = s.vi;
}
function nextHskk() { currentHskkIndex = (currentHskkIndex + 1) % hskkSentences.length; renderHskk(); }
function startSpeaking() { showToast("Đang ghi âm...", "info"); }

let isViToZh = true; 
function swapLanguage() {
    isViToZh = !isViToZh; document.getElementById('lang-from').innerText = isViToZh ? "Việt" : "Trung"; document.getElementById('lang-to').innerText = isViToZh ? "Trung" : "Việt";
}
function clearText() { document.getElementById('trans-input').value = ""; document.getElementById('trans-output').value = ""; }
function copyTranslation() { showToast("Đã sao chép bản dịch!", "success"); }
async function doTranslate() { showToast("Tính năng đang dịch...", "info"); }

// TUTOR
let currentTutor = {};
function openBookTutor(name, phone, email) {
    if(!Database.getSession()) { showToast("Vui lòng đăng nhập để đặt lịch!", "error"); openModal('loginModal'); return; }
    currentTutor = { name, phone, email }; document.getElementById('tutorNameDisplay').innerText = name; openModal('bookTutorModal');
}
function submitTutorBooking() { closeModal('bookTutorModal'); document.getElementById('contactTutorName').innerText = currentTutor.name; document.getElementById('contactTutorPhone').innerText = currentTutor.phone; document.getElementById('contactTutorEmail').innerText = currentTutor.email; openModal('tutorContactModal'); }

// ==========================================
// TÍNH NĂNG TRANG ADMIN
// ==========================================
function loadAdminData() {
    const session = Database.getSession();
    const container = document.getElementById('admin-content');
    if(!container) return;
    if (!session || session.role !== 'admin') {
        container.innerHTML = `<div class="text-center py-20 text-red-600 font-bold text-2xl">⛔ Truy cập bị từ chối. Chỉ Admin mới được vào trang này!</div>`;
        return;
    }
    renderUsersTable();
}

function renderUsersTable() {
    const users = Database.getUsers();
    const tbody = document.getElementById('admin-users-list');
    if(!tbody) return;
    let html = '';
    users.forEach(u => {
        const isBanned = u.status === 'banned';
        html += `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="p-4">#${u.id}</td>
                <td class="p-4 font-bold">${u.name}<br><span class="text-xs text-gray-500">${u.email}</span></td>
                <td class="p-4">${u.role === 'admin' ? '<span class="text-purple-600 font-bold">Admin</span>' : 'Học viên'}</td>
                <td class="p-4">${isBanned ? '<span class="text-red-500 font-bold">Đã khóa</span>' : '<span class="text-green-600">Hoạt động</span>'}</td>
                <td class="p-4 text-right whitespace-nowrap">
                    ${u.role !== 'admin' ? `<button onclick="adminToggleBan(${u.id})" class="px-3 py-1.5 rounded text-xs font-bold ${isBanned ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-orange-500 text-white hover:bg-orange-600'} transition-colors">${isBanned ? 'Mở khóa' : 'Khóa'}</button>` : ''}
                    ${u.role !== 'admin' ? `<button onclick="adminDeleteUser(${u.id})" class="px-3 py-1.5 rounded text-xs font-bold bg-red-600 text-white ml-2 hover:bg-red-700 transition-colors">Xóa</button>` : ''}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    document.getElementById('total-users').innerText = users.length;
}

function adminToggleBan(id) {
    const res = Database.toggleBanUser(id);
    if(res.success) { showToast(res.message, "success"); renderUsersTable(); }
    else { showToast(res.message, "error"); }
}

function adminAddUser() {
    const name = document.getElementById('addUserName').value;
    const email = document.getElementById('addUserEmail').value;
    const pass = document.getElementById('addUserPass').value;
    const role = document.getElementById('addUserRole').value;
    
    if(!name || !email || !pass) { showToast("Vui lòng nhập đủ thông tin!", "error"); return; }
    
    const res = Database.addUserAdmin(name, email, pass, role);
    if(res.success) {
        showToast(res.message, "success");
        closeModal('addUserModal');
        renderUsersTable();
        document.getElementById('addUserName').value = '';
        document.getElementById('addUserEmail').value = '';
        document.getElementById('addUserPass').value = '';
    } else {
        showToast(res.message, "error");
    }
}

function adminDeleteUser(id) {
    if(confirm("⚠ Cảnh báo: Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này khỏi hệ thống không? Hành động này không thể hoàn tác.")) {
        const res = Database.deleteUserAdmin(id);
        if(res.success) {
            showToast(res.message, "success");
            renderUsersTable();
        } else {
            showToast(res.message, "error");
        }
    }
}
