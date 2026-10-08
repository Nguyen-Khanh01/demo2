
const Database = {
    init: function() {
        if (!localStorage.getItem('tq_users_db')) {
            const initialUsers = [
                { id: 1, name: "Admin (Thắng)", email: "admin@gmail.com", password: "123", avatar: "", bio: "Quản trị viên hệ thống", courses: ["Video HSK 1 Toàn tập"], progress: {"Video HSK 1 Toàn tập": 0}, courseTypes: {}, courseDetails: {}, studyStreak: 5, role: "admin", status: "active" },
                { id: 2, name: "Học viên Chăm chỉ", email: "hocvien@gmail.com", password: "123", avatar: "", bio: "", courses: [], progress: {}, courseTypes: {}, courseDetails: {}, studyStreak: 2, role: "user", status: "active" },
                { id: 3, name: "Nguyễn Duy Khánh", email: "khanhnd@gmail.com", password: "123", avatar: "https://lh3.googleusercontent.com/pw/AP1GczPIzXdjS6uU5Ze0hZiBPDh0dyDTh012yg_nmrjG3uwGpLHtfusqRm79kx8GdoKuALgD12_nIoEceHL0XhjOa4qTrjr1o2kxx8gchW2r9K-zC-JmzJzZQAS1TFFxbcTqS39AX_nF30XUx1FSPcweczj5ag=w1374-h914-s-no-gm?authuser=0", bio: "Học viên VIP của TQ", courses: ["Lộ trình HSK 1", "Video HSK 2 Cải thiện"], progress: {}, courseTypes: {"Lộ trình HSK 1": "offline"}, courseDetails: {"Lộ trình HSK 1": {studyType: "offline", schedule: "2-4-6", time: "18h-21h", studentId: "HS88888"}}, studyStreak: 12, role: "user", status: "active" },
                { id: 4, name: "Trần Mỹ Thuần", email: "thuantm@gmail.com", password: "123", avatar: "", bio: "Sinh viên năm 3", courses: ["Video HSK 3 Đột phá", "Lộ trình HSK 2"], progress: {"Video HSK 3 Đột phá": 0}, courseTypes: {"Lộ trình HSK 2": "online"}, courseDetails: {"Lộ trình HSK 2": {studyType: "online", studentId: "HS12345"}}, studyStreak: 1, role: "user", status: "active" }
            ];
            localStorage.setItem('tq_users_db', JSON.stringify(initialUsers));
        }
        
        if (!localStorage.getItem('tq_qa_db')) {
            const initialQA = {
                "Video HSK 1 Toàn tập_0": [
                    { name: "Nguyễn Duy Khánh", text: "Thầy giảng phần thanh điệu này dễ hiểu quá ạ!", avatar: "https://lh3.googleusercontent.com/pw/AP1GczPIzXdjS6uU5Ze0hZiBPDh0dyDTh012yg_nmrjG3uwGpLHtfusqRm79kx8GdoKuALgD12_nIoEceHL0XhjOa4qTrjr1o2kxx8gchW2r9K-zC-JmzJzZQAS1TFFxbcTqS39AX_nF30XUx1FSPcweczj5ag=w1374-h914-s-no-gm?authuser=0", time: "05/10/2026" },
                    { name: "Admin (Thắng)", text: "Cảm ơn Khánh nhé, nhớ ôn tập thường xuyên để phát âm chuẩn hơn nha.", avatar: "", time: "06/10/2026" }
                ]
            };
            localStorage.setItem('tq_qa_db', JSON.stringify(initialQA));
        }
        if (!localStorage.getItem('tq_notes_db')) localStorage.setItem('tq_notes_db', JSON.stringify({}));
    },
    getUsers: function() { return JSON.parse(localStorage.getItem('tq_users_db') || '[]'); },
    saveUsers: function(users) { localStorage.setItem('tq_users_db', JSON.stringify(users)); },
    setSession: function(user) { localStorage.setItem('tq_current_session', JSON.stringify(user)); },
    getSession: function() { return JSON.parse(localStorage.getItem('tq_current_session') || 'null'); },
    
    register: function(name, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.email === email)) return { success: false, message: "Email này đã được đăng ký!" };
        const newUser = { id: Date.now(), name, email, password, avatar: "", bio: "", courses: [], progress: {}, courseTypes: {}, courseDetails: {}, studyStreak: 1, role: "user", status: "active" };
        users.push(newUser); this.saveUsers(users); this.setSession(newUser);
        return { success: true };
    },
    login: function(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            if (user.status === "banned") return { success: false, message: "Tài khoản của bạn đã bị khóa!" };
            this.setSession(user); return { success: true }; 
        }
        return { success: false, message: "Sai email hoặc mật khẩu!" };
    },
    loginGoogle: function(name, email, avatar) {
        const users = this.getUsers();
        let user = users.find(u => u.email === email);
        if (!user) { 
            user = { id: Date.now(), name, email, avatar, password: "", bio: "", courses: [], progress: {}, courseTypes: {}, courseDetails: {}, studyStreak: 1, role: "user", status: "active" }; 
            users.push(user); this.saveUsers(users); 
        } else if (avatar && user.avatar !== avatar) {
            user.avatar = avatar; let idx = users.findIndex(u => u.email === email);
            if(idx > -1) { users[idx] = user; this.saveUsers(users); }
        }
        if (user.status === "banned") return { success: false, message: "Tài khoản của bạn đã bị khóa!" };
        this.setSession(user); return { success: true };
    },
    logout: function() { localStorage.removeItem('tq_current_session'); },
    updateProfile: function(name, bio) {
        let session = this.getSession(); if(!session) return false;
        session.name = name; session.bio = bio; this.setSession(session);
        let users = this.getUsers(); let index = users.findIndex(u => u.id === session.id);
        if(index > -1) { users[index] = session; this.saveUsers(users); } return true;
    },
    changePassword: function(oldPass, newPass) {
        let session = this.getSession(); if(!session) return { success: false, message: "Chưa đăng nhập!" };
        if(session.password && session.password !== oldPass) return { success: false, message: "Mật khẩu cũ sai!" };
        session.password = newPass; this.setSession(session);
        let users = this.getUsers(); let index = users.findIndex(u => u.id === session.id);
        if(index > -1) { users[index] = session; this.saveUsers(users); } return { success: true, message: "Đổi mật khẩu thành công!" };
    },
    buyCourse: function(courseName, studyType = 'online', schedule = '', time = '', studentId = '') {
        let session = this.getSession(); if(!session) return;
        if(!session.courses) session.courses = [];
        if(!session.courseTypes) session.courseTypes = {};
        if(!session.courseDetails) session.courseDetails = {};
        
        if(!session.courses.includes(courseName)) session.courses.push(courseName);
        session.courseTypes[courseName] = studyType;
        if (!studentId) studentId = 'HS' + Math.floor(10000 + Math.random() * 90000);
        session.courseDetails[courseName] = { studyType, schedule, time, studentId };
        
        this.setSession(session);
        let users = this.getUsers(); let index = users.findIndex(u => u.id === session.id);
        if(index > -1) { users[index] = session; this.saveUsers(users); }
    },
    updateProgress: function(courseName, lessonIndex) {
        let session = this.getSession(); if(!session) return;
        if(!session.progress) session.progress = {};
        session.progress[courseName] = lessonIndex; this.setSession(session);
        let users = this.getUsers(); let index = users.findIndex(u => u.id === session.id);
        if(index > -1) { users[index] = session; this.saveUsers(users); }
    },
    getProgress: function(courseName) {
        let session = this.getSession();
        if(!session || !session.progress || !session.progress[courseName]) return 0;
        return session.progress[courseName];
    },
    
    // Q&A Database
    addQA: function(courseName, lessonIndex, data) {
        let db = JSON.parse(localStorage.getItem('tq_qa_db') || '{}');
        let key = `${courseName}_${lessonIndex}`;
        if(!db[key]) db[key] = [];
        db[key].push(data);
        localStorage.setItem('tq_qa_db', JSON.stringify(db));
    },
    getQA: function(courseName, lessonIndex) {
        let db = JSON.parse(localStorage.getItem('tq_qa_db') || '{}');
        return db[`${courseName}_${lessonIndex}`] || [];
    },
    
    // Notes Database
    addNote: function(courseName, lessonIndex, data) {
        let db = JSON.parse(localStorage.getItem('tq_notes_db') || '{}');
        let session = this.getSession();
        if(!session) return;
        let key = `${session.id}_${courseName}_${lessonIndex}`;
        if(!db[key]) db[key] = [];
        db[key].push(data);
        db[key].sort((a,b) => a.time - b.time); 
        localStorage.setItem('tq_notes_db', JSON.stringify(db));
    },
    getNotes: function(courseName, lessonIndex) {
        let db = JSON.parse(localStorage.getItem('tq_notes_db') || '{}');
        let session = this.getSession();
        if(!session) return [];
        let key = `${session.id}_${courseName}_${lessonIndex}`;
        return db[key] || [];
    },
    deleteNote: function(courseName, lessonIndex, noteIndex) {
        let db = JSON.parse(localStorage.getItem('tq_notes_db') || '{}');
        let session = this.getSession();
        if(!session) return;
        let key = `${session.id}_${courseName}_${lessonIndex}`;
        if(db[key]) {
            db[key].splice(noteIndex, 1);
            localStorage.setItem('tq_notes_db', JSON.stringify(db));
        }
    },
    
    // ADMIN FUNCTIONS
    toggleBanUser: function(userId) {
        let session = this.getSession();
        if(!session || session.role !== 'admin') return { success: false, message: "Không có quyền!" };
        let users = this.getUsers();
        let targetUser = users.find(u => u.id === userId);
        if(!targetUser) return { success: false, message: "Không tìm thấy user!" };
        if(targetUser.role === 'admin') return { success: false, message: "Không thể khóa Admin!" };
        targetUser.status = (targetUser.status === 'banned') ? 'active' : 'banned';
        this.saveUsers(users);
        return { success: true, message: targetUser.status === 'banned' ? "Đã khóa tài khoản!" : "Đã mở khóa!" };
    },
    addUserAdmin: function(name, email, password, role) {
        let session = this.getSession();
        if(!session || session.role !== 'admin') return { success: false, message: "Không có quyền!" };
        let users = this.getUsers();
        if (users.find(u => u.email === email)) return { success: false, message: "Email đã tồn tại!" };
        users.push({ id: Date.now(), name, email, password, avatar: "", bio: "", courses: [], progress: {}, courseTypes: {}, courseDetails: {}, studyStreak: 1, role: role, status: "active" });
        this.saveUsers(users);
        return { success: true, message: "Thêm người dùng thành công!" };
    },
    deleteUserAdmin: function(userId) {
        let session = this.getSession();
        if(!session || session.role !== 'admin') return { success: false, message: "Không có quyền!" };
        let users = this.getUsers();
        if (userId === session.id) return { success: false, message: "Không thể tự xóa chính mình!" };
        users = users.filter(u => u.id !== userId);
        this.saveUsers(users);
        return { success: true, message: "Đã xóa người dùng vĩnh viễn!" };
    }
};
Database.init();
