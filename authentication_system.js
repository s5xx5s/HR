// ===============================
// نظام المصادقة وإدارة المستخدمين
// ===============================

/**
 * نظام المصادقة وإدارة المستخدمين
 * 
 * هذا الكود يقوم بتنفيذ نظام مصادقة وتفويض الصلاحيات
 * لحماية العمليات الحساسة في النظام
 */

// تهيئة وحدة المصادقة
window.HR = window.HR || {};
window.HR.Auth = {};

// تعريف أدوار المستخدمين
window.HR.Auth.ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};

// مفتاح التشفير (يتم إنشاؤه تلقائياً عند أول استخدام)
window.HR.Auth.ENCRYPTION_KEY = localStorage.getItem('hr_encryption_key') || generateEncryptionKey();

// حفظ مفتاح التشفير في localStorage
function saveEncryptionKey(key) {
    localStorage.setItem('hr_encryption_key', key);
}

// إنشاء مفتاح تشفير جديد
function generateEncryptionKey() {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    saveEncryptionKey(key);
    return key;
}

// تشفير النص
window.HR.Auth.encrypt = function(text) {
    try {
        // استخدام خوارزمية AES-GCM للتشفير
        const textToEncrypt = text.toString();
        const key = window.HR.Auth.ENCRYPTION_KEY;
        
        // تحويل النص إلى Base64 ثم تشفيره باستخدام XOR مع المفتاح
        const textBytes = new TextEncoder().encode(textToEncrypt);
        const keyBytes = new TextEncoder().encode(key);
        
        const encryptedBytes = new Uint8Array(textBytes.length);
        for (let i = 0; i < textBytes.length; i++) {
            encryptedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
        }
        
        // تحويل البايتات المشفرة إلى Base64
        return btoa(String.fromCharCode.apply(null, encryptedBytes));
    } catch (error) {
        console.error('Error encrypting text:', error);
        return '';
    }
};

// فك تشفير النص
window.HR.Auth.decrypt = function(encryptedText) {
    try {
        // فك تشفير النص المشفر باستخدام XOR مع المفتاح
        const key = window.HR.Auth.ENCRYPTION_KEY;
        
        // تحويل النص المشفر من Base64 إلى بايتات
        const encryptedBytes = new Uint8Array(
            atob(encryptedText).split('').map(c => c.charCodeAt(0))
        );
        
        const keyBytes = new TextEncoder().encode(key);
        
        const decryptedBytes = new Uint8Array(encryptedBytes.length);
        for (let i = 0; i < encryptedBytes.length; i++) {
            decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
        }
        
        // تحويل البايتات المفكوكة إلى نص
        return new TextDecoder().decode(decryptedBytes);
    } catch (error) {
        console.error('Error decrypting text:', error);
        return '';
    }
};

// تهيئة المستخدمين الافتراضيين إذا لم يكونوا موجودين
window.HR.Auth.initializeDefaultUsers = function() {
    const users = window.HR.Auth.getUsers();
    
    // إذا لم يكن هناك مستخدمين، إنشاء المستخدم الافتراضي
    if (users.length === 0) {
        const defaultAdmin = {
            username: 'admin',
            password: window.HR.Auth.hashPassword('admin123'),
            role: window.HR.Auth.ROLES.ADMIN,
            name: 'مدير النظام'
        };
        
        const defaultUser = {
            username: 'user',
            password: window.HR.Auth.hashPassword('user123'),
            role: window.HR.Auth.ROLES.USER,
            name: 'مستخدم عادي'
        };
        
        window.HR.Auth.saveUsers([defaultAdmin, defaultUser]);
        
        console.log('Default users created');
    }
};

// تجزئة كلمة المرور
window.HR.Auth.hashPassword = function(password) {
    // استخدام تجزئة بسيطة لكلمة المرور (في بيئة الإنتاج يجب استخدام خوارزمية أقوى)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // تحويل إلى 32bit integer
    }
    return hash.toString(16);
};

// الحصول على قائمة المستخدمين
window.HR.Auth.getUsers = function() {
    try {
        const encryptedUsers = localStorage.getItem('hr_users');
        if (!encryptedUsers) {
            return [];
        }
        
        const decryptedUsers = window.HR.Auth.decrypt(encryptedUsers);
        return JSON.parse(decryptedUsers);
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
};

// حفظ قائمة المستخدمين
window.HR.Auth.saveUsers = function(users) {
    try {
        const usersJson = JSON.stringify(users);
        const encryptedUsers = window.HR.Auth.encrypt(usersJson);
        localStorage.setItem('hr_users', encryptedUsers);
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
};

// إضافة مستخدم جديد
window.HR.Auth.addUser = function(username, password, role, name) {
    try {
        const users = window.HR.Auth.getUsers();
        
        // التحقق من عدم وجود مستخدم بنفس اسم المستخدم
        if (users.some(user => user.username === username)) {
            return { success: false, message: 'اسم المستخدم موجود بالفعل' };
        }
        
        // إنشاء المستخدم الجديد
        const newUser = {
            username,
            password: window.HR.Auth.hashPassword(password),
            role,
            name
        };
        
        // إضافة المستخدم إلى القائمة
        users.push(newUser);
        
        // حفظ القائمة المحدثة
        window.HR.Auth.saveUsers(users);
        
        return { success: true, message: 'تم إضافة المستخدم بنجاح' };
    } catch (error) {
        console.error('Error adding user:', error);
        return { success: false, message: 'حدث خطأ أثناء إضافة المستخدم' };
    }
};

// تعديل مستخدم
window.HR.Auth.updateUser = function(username, updates) {
    try {
        const users = window.HR.Auth.getUsers();
        
        // البحث عن المستخدم
        const userIndex = users.findIndex(user => user.username === username);
        if (userIndex === -1) {
            return { success: false, message: 'المستخدم غير موجود' };
        }
        
        // تحديث بيانات المستخدم
        if (updates.password) {
            updates.password = window.HR.Auth.hashPassword(updates.password);
        }
        
        users[userIndex] = { ...users[userIndex], ...updates };
        
        // حفظ القائمة المحدثة
        window.HR.Auth.saveUsers(users);
        
        return { success: true, message: 'تم تحديث المستخدم بنجاح' };
    } catch (error) {
        console.error('Error updating user:', error);
        return { success: false, message: 'حدث خطأ أثناء تحديث المستخدم' };
    }
};

// حذف مستخدم
window.HR.Auth.deleteUser = function(username) {
    try {
        const users = window.HR.Auth.getUsers();
        
        // التحقق من عدم حذف المستخدم الوحيد بدور المسؤول
        const admins = users.filter(user => user.role === window.HR.Auth.ROLES.ADMIN);
        if (admins.length === 1 && admins[0].username === username) {
            return { success: false, message: 'لا يمكن حذف المسؤول الوحيد' };
        }
        
        // حذف المستخدم
        const updatedUsers = users.filter(user => user.username !== username);
        
        // حفظ القائمة المحدثة
        window.HR.Auth.saveUsers(updatedUsers);
        
        return { success: true, message: 'تم حذف المستخدم بنجاح' };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, message: 'حدث خطأ أثناء حذف المستخدم' };
    }
};

// تسجيل الدخول
window.HR.Auth.login = function(username, password) {
    try {
        const users = window.HR.Auth.getUsers();
        
        // البحث عن المستخدم
        const user = users.find(user => user.username === username);
        if (!user) {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
        
        // التحقق من كلمة المرور
        const hashedPassword = window.HR.Auth.hashPassword(password);
        if (user.password !== hashedPassword) {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
        
        // إنشاء جلسة المستخدم
        const session = {
            username: user.username,
            role: user.role,
            name: user.name,
            loginTime: new Date().toISOString()
        };
        
        // تشفير وحفظ الجلسة
        const encryptedSession = window.HR.Auth.encrypt(JSON.stringify(session));
        localStorage.setItem('hr_session', encryptedSession);
        
        return { success: true, message: 'تم تسجيل الدخول بنجاح', user: session };
    } catch (error) {
        console.error('Error logging in:', error);
        return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
    }
};

// تسجيل الخروج
window.HR.Auth.logout = function() {
    try {
        localStorage.removeItem('hr_session');
        return { success: true, message: 'تم تسجيل الخروج بنجاح' };
    } catch (error) {
        console.error('Error logging out:', error);
        return { success: false, message: 'حدث خطأ أثناء تسجيل الخروج' };
    }
};

// الحصول على المستخدم الحالي
window.HR.Auth.getCurrentUser = function() {
    try {
        const encryptedSession = localStorage.getItem('hr_session');
        if (!encryptedSession) {
            return null;
        }
        
        const decryptedSession = window.HR.Auth.decrypt(encryptedSession);
        return JSON.parse(decryptedSession);
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// التحقق من تسجيل الدخول
window.HR.Auth.isLoggedIn = function() {
    return window.HR.Auth.getCurrentUser() !== null;
};

// التحقق من دور المستخدم
window.HR.Auth.hasRole = function(role) {
    const currentUser = window.HR.Auth.getCurrentUser();
    return currentUser && currentUser.role === role;
};

// التحقق من صلاحية المستخدم للعملية
window.HR.Auth.canPerformAction = function(action) {
    const currentUser = window.HR.Auth.getCurrentUser();
    
    // إذا لم يكن هناك مستخدم حالي، لا يمكن تنفيذ أي عملية
    if (!currentUser) {
        return false;
    }
    
    // تعريف العمليات المسموح بها لكل دور
    const permissions = {
        [window.HR.Auth.ROLES.ADMIN]: [
            'view_employees',
            'add_employee',
            'edit_employee',
            'delete_employee',
            'manage_departments',
            'manage_job_titles',
            'manage_locations',
            'update_sheet_url',
            'manage_users',
            'manage_fields',
            'manage_stats'
        ],
        [window.HR.Auth.ROLES.USER]: [
            'view_employees'
        ]
    };
    
    // التحقق من صلاحية المستخدم للعملية
    return permissions[currentUser.role].includes(action);
};

// إنشاء واجهة تسجيل الدخول
window.HR.Auth.createLoginUI = function(container) {
    if (!container) {
        console.error('Login container not provided');
        return;
    }
    
    // مسح المحتوى الحالي
    container.innerHTML = '';
    
    // إنشاء نموذج تسجيل الدخول
    const loginForm = document.createElement('div');
    loginForm.className = 'login-form';
    
    // إضافة الشعار
    const logo = document.createElement('div');
    logo.className = 'text-center mb-4';
    logo.innerHTML = `
        <i class="fas fa-users-cog fa-4x text-primary"></i>
        <h2 class="mt-2">نظام إدارة الموارد البشرية</h2>
        <p class="text-muted">يرجى تسجيل الدخول للوصول إلى النظام</p>
    `;
    loginForm.appendChild(logo);
    
    // إنشاء نموذج الإدخال
    const form = document.createElement('form');
    form.id = 'loginForm';
    form.className = 'needs-validation';
    form.noValidate = true;
    
    // حقل اسم المستخدم
    const usernameGroup = document.createElement('div');
    usernameGroup.className = 'form-group mb-3';
    
    const usernameLabel = document.createElement('label');
    usernameLabel.htmlFor = 'username';
    usernameLabel.className = 'form-label';
    usernameLabel.textContent = 'اسم المستخدم';
    
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'username';
    usernameInput.name = 'username';
    usernameInput.className = 'form-control';
    usernameInput.required = true;
    
    const usernameInvalid = document.createElement('div');
    usernameInvalid.className = 'invalid-feedback';
    usernameInvalid.textContent = 'يرجى إدخال اسم المستخدم';
    
    usernameGroup.appendChild(usernameLabel);
    usernameGroup.appendChild(usernameInput);
    usernameGroup.appendChild(usernameInvalid);
    form.appendChild(usernameGroup);
    
    // حقل كلمة المرور
    const passwordGroup = document.createElement('div');
    passwordGroup.className = 'form-group mb-4';
    
    const passwordLabel = document.createElement('label');
    passwordLabel.htmlFor = 'password';
    passwordLabel.className = 'form-label';
    passwordLabel.textContent = 'كلمة المرور';
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'password';
    passwordInput.name = 'password';
    passwordInput.className = 'form-control';
    passwordInput.required = true;
    
    const passwordInvalid = document.createElement('div');
    passwordInvalid.className = 'invalid-feedback';
    passwordInvalid.textContent = 'يرجى إدخال كلمة المرور';
    
    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);
    passwordGroup.appendChild(passwordInvalid);
    form.appendChild(passwordGroup);
    
    // عنصر عرض رسائل الخطأ
    const alertContainer = document.createElement('div');
    alertContainer.id = 'loginAlert';
    alertContainer.className = 'd-none alert alert-danger';
    alertContainer.role = 'alert';
    form.appendChild(alertContainer);
    
    // زر تسجيل الدخول
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary w-100';
    submitButton.textContent = 'تسجيل الدخول';
    form.appendChild(submitButton);
    
    // إضافة معالج الحدث للنموذج
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // التحقق من صحة النموذج
        if (form.checkValidity() === false) {
            form.classList.add('was-validated');
            return;
        }
        
        // جمع بيانات النموذج
        const username = usernameInput.value;
        const password = passwordInput.value;
        
        // محاولة تسجيل الدخول
        const result = window.HR.Auth.login(username, password);
        
        if (result.success) {
            // إعادة تحميل الصفحة بعد تسجيل الدخول
            window.location.reload();
        } else {
            // عرض رسالة الخطأ
            alertContainer.textContent = result.message;
            alertContainer.classList.remove('d-none');
        }
    });
    
    loginForm.appendChild(form);
    
    // إضافة معلومات المستخدمين الافتراضيين
    const defaultUsersInfo = document.createElement('div');
    defaultUsersInfo.className = 'mt-4 p-3 bg-light rounded text-center';
    defaultUsersInfo.innerHTML = `
        <h5>بيانات الدخول الافتراضية</h5>
        <div class="row mt-2">
            <div class="col-md-6">
                <div class="card mb-2">
                    <div class="card-body">
                        <h6>مدير النظام</h6>
                        <p class="mb-1"><strong>اسم المستخدم:</strong> admin</p>
                        <p class="mb-0"><strong>كلمة المرور:</strong> admin123</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card mb-2">
                    <div class="card-body">
                        <h6>مستخدم عادي</h6>
                        <p class="mb-1"><strong>اسم المستخدم:</strong> user</p>
                        <p class="mb-0"><strong>كلمة المرور:</strong> user123</p>
                    </div>
                </div>
            </div>
        </div>
        <p class="text-muted small mt-2">يمكنك تغيير هذه البيانات بعد تسجيل الدخول كمدير نظام</p>
    `;
    loginForm.appendChild(defaultUsersInfo);
    
    // إضافة CSS للنموذج
    const loginStyles = document.createElement('style');
    loginStyles.textContent = `
        .login-form {
            max-width: 500px;
            margin: 50px auto;
            padding: 30px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
    `;
    document.head.appendChild(loginStyles);
    
    // إضافة النموذج إلى الحاوية
    container.appendChild(loginForm);
};

// إنشاء واجهة إدارة المستخدمين
window.HR.Auth.createUserManagementUI = function(container) {
    if (!container) {
        console.error('User management container not provided');
        return;
    }
    
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('manage_users')) {
        container.innerHTML = `
            <div class="alert alert-danger">
                ليس لديك صلاحية للوصول إلى هذه الصفحة
            </div>
        `;
        return;
    }
    
    // مسح المحتوى الحالي
    container.innerHTML = '';
    
    // إنشاء العنوان
    const title = document.createElement('h4');
    title.className = 'mb-4';
    title.textContent = 'إدارة المستخدمين';
    container.appendChild(title);
    
    // إنشاء زر إضافة مستخدم جديد
    const addButton = document.createElement('button');
    addButton.className = 'btn btn-primary mb-4';
    addButton.innerHTML = '<i class="fas fa-user-plus"></i> إضافة مستخدم جديد';
    addButton.addEventListener('click', function() {
        showUserForm(container);
    });
    container.appendChild(addButton);
    
    // إنشاء جدول المستخدمين
    const table = document.createElement('table');
    table.className = 'table table-striped table-hover';
    
    // إنشاء رأس الجدول
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = [
        'اسم المستخدم',
        'الاسم',
        'الدور',
        'الإجراءات'
    ];
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // إنشاء جسم الجدول
    const tbody = document.createElement('tbody');
    
    // الحصول على قائمة المستخدمين
    const users = window.HR.Auth.getUsers();
    
    // إضافة صفوف المستخدمين
    users.forEach(user => {
        const row = document.createElement('tr');
        
        // خلية اسم المستخدم
        const usernameCell = document.createElement('td');
        usernameCell.textContent = user.username;
        row.appendChild(usernameCell);
        
        // خلية الاسم
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name;
        row.appendChild(nameCell);
        
        // خلية الدور
        const roleCell = document.createElement('td');
        const roleBadge = document.createElement('span');
        roleBadge.className = `badge ${user.role === window.HR.Auth.ROLES.ADMIN ? 'bg-danger' : 'bg-info'}`;
        roleBadge.textContent = user.role === window.HR.Auth.ROLES.ADMIN ? 'مدير نظام' : 'مستخدم عادي';
        roleCell.appendChild(roleBadge);
        row.appendChild(roleCell);
        
        // خلية الإجراءات
        const actionsCell = document.createElement('td');
        
        // زر التعديل
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-primary me-2';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.title = 'تعديل';
        editButton.addEventListener('click', function() {
            showUserForm(container, user);
        });
        actionsCell.appendChild(editButton);
        
        // زر الحذف
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-danger';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'حذف';
        deleteButton.addEventListener('click', function() {
            if (confirm(`هل أنت متأكد من حذف المستخدم ${user.username}؟`)) {
                const result = window.HR.Auth.deleteUser(user.username);
                if (result.success) {
                    // تحديث واجهة إدارة المستخدمين
                    window.HR.Auth.createUserManagementUI(container);
                } else {
                    alert(result.message);
                }
            }
        });
        actionsCell.appendChild(deleteButton);
        
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
};

// إظهار نموذج المستخدم
function showUserForm(container, user = null) {
    // إنشاء النموذج
    const formContainer = document.createElement('div');
    formContainer.className = 'modal fade';
    formContainer.id = 'userFormModal';
    formContainer.tabIndex = -1;
    formContainer.setAttribute('aria-labelledby', 'userFormModalLabel');
    formContainer.setAttribute('aria-hidden', 'true');
    
    formContainer.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="userFormModalLabel">
                        ${user ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="userForm" class="needs-validation" novalidate>
                        <div class="mb-3">
                            <label for="username" class="form-label">اسم المستخدم</label>
                            <input type="text" class="form-control" id="username" name="username" 
                                value="${user ? user.username : ''}" 
                                ${user ? 'readonly' : 'required'}>
                            <div class="invalid-feedback">
                                يرجى إدخال اسم المستخدم
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="name" class="form-label">الاسم</label>
                            <input type="text" class="form-control" id="name" name="name" 
                                value="${user ? user.name : ''}" required>
                            <div class="invalid-feedback">
                                يرجى إدخال الاسم
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">كلمة المرور</label>
                            <input type="password" class="form-control" id="password" name="password" 
                                ${user ? '' : 'required'}>
                            <div class="invalid-feedback">
                                يرجى إدخال كلمة المرور
                            </div>
                            ${user ? '<div class="form-text">اترك هذا الحقل فارغاً إذا لم ترغب في تغيير كلمة المرور</div>' : ''}
                        </div>
                        <div class="mb-3">
                            <label for="role" class="form-label">الدور</label>
                            <select class="form-select" id="role" name="role" required>
                                <option value="">اختر الدور...</option>
                                <option value="${window.HR.Auth.ROLES.ADMIN}" ${user && user.role === window.HR.Auth.ROLES.ADMIN ? 'selected' : ''}>
                                    مدير نظام
                                </option>
                                <option value="${window.HR.Auth.ROLES.USER}" ${user && user.role === window.HR.Auth.ROLES.USER ? 'selected' : ''}>
                                    مستخدم عادي
                                </option>
                            </select>
                            <div class="invalid-feedback">
                                يرجى اختيار الدور
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                    <button type="button" class="btn btn-primary" id="saveUserBtn">حفظ</button>
                </div>
            </div>
        </div>
    `;
    
    // إضافة النموذج إلى الصفحة
    document.body.appendChild(formContainer);
    
    // تهيئة النموذج
    const modal = new bootstrap.Modal(formContainer);
    
    // إضافة معالج الحدث لزر الحفظ
    document.getElementById('saveUserBtn').addEventListener('click', function() {
        const form = document.getElementById('userForm');
        
        // التحقق من صحة النموذج
        if (form.checkValidity() === false) {
            form.classList.add('was-validated');
            return;
        }
        
        // جمع بيانات النموذج
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            name: formData.get('name'),
            role: formData.get('role')
        };
        
        // إضافة كلمة المرور إذا تم إدخالها
        const password = formData.get('password');
        if (password) {
            userData.password = password;
        }
        
        let result;
        
        if (user) {
            // تعديل المستخدم
            result = window.HR.Auth.updateUser(user.username, userData);
        } else {
            // إضافة مستخدم جديد
            result = window.HR.Auth.addUser(userData.username, userData.password, userData.role, userData.name);
        }
        
        if (result.success) {
            // إغلاق النموذج
            modal.hide();
            
            // تحديث واجهة إدارة المستخدمين
            window.HR.Auth.createUserManagementUI(container);
        } else {
            alert(result.message);
        }
    });
    
    // عرض النموذج
    modal.show();
    
    // إضافة معالج الحدث لإزالة النموذج من الصفحة عند إغلاقه
    formContainer.addEventListener('hidden.bs.modal', function() {
        formContainer.remove();
    });
}

// إنشاء واجهة معلومات المستخدم الحالي
window.HR.Auth.createUserInfoUI = function(container) {
    if (!container) {
        console.error('User info container not provided');
        return;
    }
    
    // مسح المحتوى الحالي
    container.innerHTML = '';
    
    // الحصول على المستخدم الحالي
    const currentUser = window.HR.Auth.getCurrentUser();
    
    if (!currentUser) {
        return;
    }
    
    // إنشاء واجهة معلومات المستخدم
    const userInfo = document.createElement('div');
    userInfo.className = 'd-flex align-items-center';
    
    // أيقونة المستخدم
    const userIcon = document.createElement('div');
    userIcon.className = 'me-2';
    userIcon.innerHTML = `
        <i class="fas fa-user-circle fa-2x text-primary"></i>
    `;
    userInfo.appendChild(userIcon);
    
    // معلومات المستخدم
    const userDetails = document.createElement('div');
    userDetails.className = 'me-3';
    userDetails.innerHTML = `
        <div class="fw-bold">${currentUser.name}</div>
        <div class="small text-muted">
            ${currentUser.role === window.HR.Auth.ROLES.ADMIN ? 'مدير نظام' : 'مستخدم عادي'}
        </div>
    `;
    userInfo.appendChild(userDetails);
    
    // زر تسجيل الخروج
    const logoutButton = document.createElement('button');
    logoutButton.className = 'btn btn-sm btn-outline-danger';
    logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> تسجيل الخروج';
    logoutButton.addEventListener('click', function() {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            window.HR.Auth.logout();
            window.location.reload();
        }
    });
    userInfo.appendChild(logoutButton);
    
    // إضافة واجهة معلومات المستخدم إلى الحاوية
    container.appendChild(userInfo);
};

// تهيئة نظام المصادقة
window.HR.Auth.initialize = function() {
    // تهيئة المستخدمين الافتراضيين
    window.HR.Auth.initializeDefaultUsers();
    
    console.log('✅ Authentication System Initialized');
};

// تنفيذ التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', window.HR.Auth.initialize);

console.log('✅ Authentication Module Loaded');
