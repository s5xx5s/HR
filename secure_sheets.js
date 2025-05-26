// ===============================
// تأمين رابط Google Sheets والعمليات الحساسة
// ===============================

/**
 * تأمين رابط Google Sheets والعمليات الحساسة
 * 
 * هذا الكود يقوم بتأمين رابط Google Sheets وجميع العمليات الحساسة
 * بحيث لا يمكن تنفيذها إلا من قبل المسؤول، مع تطبيق التشفير والحماية اللازمة
 */

// تهيئة وحدة تأمين الرابط
window.HR = window.HR || {};
window.HR.SecureSheets = {};

// المفتاح المستخدم لتخزين رابط Google Sheets المشفر
const SHEETS_URL_KEY = 'hr_sheets_url';

// المفتاح المستخدم لتخزين روابط Google Sheets الشخصية
const PERSONAL_SHEETS_URL_KEY = 'hr_personal_sheets_url';

// الرابط الافتراضي لـ Google Sheets
const DEFAULT_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvWvuqjWEJoXOMH1qQxk1tCvxJSQxE4mFHfHIjP_GXnxt6CWKvLzQQyUTi-fUKQZG6LPwGzGYYD-Ib/pub?output=csv';

/**
 * تشفير رابط Google Sheets
 * @param {string} url - رابط Google Sheets
 * @returns {string} - الرابط المشفر
 */
window.HR.SecureSheets.encryptSheetsUrl = function(url) {
    return window.HR.Auth.encrypt(url);
};

/**
 * فك تشفير رابط Google Sheets
 * @param {string} encryptedUrl - الرابط المشفر
 * @returns {string} - الرابط الأصلي
 */
window.HR.SecureSheets.decryptSheetsUrl = function(encryptedUrl) {
    return window.HR.Auth.decrypt(encryptedUrl);
};

/**
 * حفظ رابط Google Sheets
 * @param {string} url - رابط Google Sheets
 * @param {boolean} isPersonal - ما إذا كان الرابط شخصياً
 * @returns {boolean} - نجاح العملية
 */
window.HR.SecureSheets.saveSheetsUrl = function(url, isPersonal = false) {
    try {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('update_sheet_url')) {
            console.error('User does not have permission to update sheet URL');
            return false;
        }
        
        // تشفير الرابط
        const encryptedUrl = window.HR.SecureSheets.encryptSheetsUrl(url);
        
        // حفظ الرابط
        if (isPersonal) {
            // الحصول على المستخدم الحالي
            const currentUser = window.HR.Auth.getCurrentUser();
            if (!currentUser) {
                console.error('No current user found');
                return false;
            }
            
            // الحصول على الروابط الشخصية الحالية
            let personalUrls = {};
            try {
                const encryptedPersonalUrls = localStorage.getItem(PERSONAL_SHEETS_URL_KEY);
                if (encryptedPersonalUrls) {
                    const decryptedPersonalUrls = window.HR.Auth.decrypt(encryptedPersonalUrls);
                    personalUrls = JSON.parse(decryptedPersonalUrls);
                }
            } catch (e) {
                console.error('Error loading personal URLs:', e);
                personalUrls = {};
            }
            
            // إضافة أو تحديث الرابط الشخصي للمستخدم الحالي
            personalUrls[currentUser.username] = encryptedUrl;
            
            // تشفير وحفظ الروابط الشخصية
            const encryptedPersonalUrls = window.HR.Auth.encrypt(JSON.stringify(personalUrls));
            localStorage.setItem(PERSONAL_SHEETS_URL_KEY, encryptedPersonalUrls);
        } else {
            // حفظ الرابط العام
            localStorage.setItem(SHEETS_URL_KEY, encryptedUrl);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving sheets URL:', error);
        return false;
    }
};

/**
 * الحصول على رابط Google Sheets
 * @returns {string} - رابط Google Sheets
 */
window.HR.SecureSheets.getSheetsUrl = function() {
    try {
        // الحصول على المستخدم الحالي
        const currentUser = window.HR.Auth.getCurrentUser();
        
        // إذا كان هناك مستخدم حالي، البحث عن رابط شخصي
        if (currentUser) {
            try {
                const encryptedPersonalUrls = localStorage.getItem(PERSONAL_SHEETS_URL_KEY);
                if (encryptedPersonalUrls) {
                    const decryptedPersonalUrls = window.HR.Auth.decrypt(encryptedPersonalUrls);
                    const personalUrls = JSON.parse(decryptedPersonalUrls);
                    
                    // إذا كان هناك رابط شخصي للمستخدم الحالي، استخدامه
                    if (personalUrls[currentUser.username]) {
                        return window.HR.SecureSheets.decryptSheetsUrl(personalUrls[currentUser.username]);
                    }
                }
            } catch (e) {
                console.error('Error loading personal URL:', e);
            }
        }
        
        // إذا لم يكن هناك رابط شخصي، استخدام الرابط العام
        const encryptedUrl = localStorage.getItem(SHEETS_URL_KEY);
        if (encryptedUrl) {
            return window.HR.SecureSheets.decryptSheetsUrl(encryptedUrl);
        }
        
        // إذا لم يكن هناك رابط عام، استخدام الرابط الافتراضي
        return DEFAULT_SHEETS_URL;
    } catch (error) {
        console.error('Error getting sheets URL:', error);
        return DEFAULT_SHEETS_URL;
    }
};

/**
 * إعادة تعيين رابط Google Sheets إلى القيمة الافتراضية
 * @param {boolean} isPersonal - ما إذا كان الرابط شخصياً
 * @returns {boolean} - نجاح العملية
 */
window.HR.SecureSheets.resetSheetsUrl = function(isPersonal = false) {
    return window.HR.SecureSheets.saveSheetsUrl(DEFAULT_SHEETS_URL, isPersonal);
};

/**
 * حذف الرابط الشخصي للمستخدم الحالي
 * @returns {boolean} - نجاح العملية
 */
window.HR.SecureSheets.deletePersonalSheetsUrl = function() {
    try {
        // الحصول على المستخدم الحالي
        const currentUser = window.HR.Auth.getCurrentUser();
        if (!currentUser) {
            console.error('No current user found');
            return false;
        }
        
        // الحصول على الروابط الشخصية الحالية
        let personalUrls = {};
        try {
            const encryptedPersonalUrls = localStorage.getItem(PERSONAL_SHEETS_URL_KEY);
            if (encryptedPersonalUrls) {
                const decryptedPersonalUrls = window.HR.Auth.decrypt(encryptedPersonalUrls);
                personalUrls = JSON.parse(decryptedPersonalUrls);
            }
        } catch (e) {
            console.error('Error loading personal URLs:', e);
            personalUrls = {};
        }
        
        // حذف الرابط الشخصي للمستخدم الحالي
        delete personalUrls[currentUser.username];
        
        // تشفير وحفظ الروابط الشخصية
        const encryptedPersonalUrls = window.HR.Auth.encrypt(JSON.stringify(personalUrls));
        localStorage.setItem(PERSONAL_SHEETS_URL_KEY, encryptedPersonalUrls);
        
        return true;
    } catch (error) {
        console.error('Error deleting personal sheets URL:', error);
        return false;
    }
};

/**
 * التحقق مما إذا كان المستخدم الحالي يستخدم رابطاً شخصياً
 * @returns {boolean} - ما إذا كان المستخدم الحالي يستخدم رابطاً شخصياً
 */
window.HR.SecureSheets.isUsingPersonalUrl = function() {
    try {
        // الحصول على المستخدم الحالي
        const currentUser = window.HR.Auth.getCurrentUser();
        if (!currentUser) {
            return false;
        }
        
        // الحصول على الروابط الشخصية الحالية
        try {
            const encryptedPersonalUrls = localStorage.getItem(PERSONAL_SHEETS_URL_KEY);
            if (encryptedPersonalUrls) {
                const decryptedPersonalUrls = window.HR.Auth.decrypt(encryptedPersonalUrls);
                const personalUrls = JSON.parse(decryptedPersonalUrls);
                
                // التحقق مما إذا كان هناك رابط شخصي للمستخدم الحالي
                return !!personalUrls[currentUser.username];
            }
        } catch (e) {
            console.error('Error checking personal URL:', e);
        }
        
        return false;
    } catch (error) {
        console.error('Error checking if using personal URL:', error);
        return false;
    }
};

/**
 * إنشاء واجهة إدارة رابط Google Sheets
 * @param {HTMLElement} container - عنصر الحاوية
 */
window.HR.SecureSheets.createSheetsUrlManagementUI = function(container) {
    if (!container) {
        console.error('Sheets URL management container not provided');
        return;
    }
    
    // مسح المحتوى الحالي
    container.innerHTML = '';
    
    // التحقق من تسجيل الدخول
    if (!window.HR.Auth.isLoggedIn()) {
        container.innerHTML = `
            <div class="alert alert-warning">
                يرجى تسجيل الدخول للوصول إلى إعدادات الرابط
            </div>
        `;
        return;
    }
    
    // التحقق من صلاحية المستخدم
    const canUpdateUrl = window.HR.Auth.canPerformAction('update_sheet_url');
    
    // الحصول على الرابط الحالي
    const currentUrl = window.HR.SecureSheets.getSheetsUrl();
    
    // التحقق مما إذا كان المستخدم يستخدم رابطاً شخصياً
    const isUsingPersonalUrl = window.HR.SecureSheets.isUsingPersonalUrl();
    
    // إنشاء العنوان
    const title = document.createElement('h4');
    title.className = 'mb-3';
    title.textContent = 'إدارة رابط Google Sheets';
    container.appendChild(title);
    
    // إنشاء وصف
    const description = document.createElement('p');
    description.className = 'mb-4';
    description.textContent = 'يمكنك تغيير رابط Google Sheets المستخدم لاستيراد البيانات. يمكنك حفظ الرابط لك فقط أو جعله افتراضياً للجميع.';
    container.appendChild(description);
    
    // إنشاء نموذج تحديث الرابط
    const form = document.createElement('form');
    form.id = 'sheetsUrlForm';
    form.className = 'mb-4';
    
    // حقل الرابط
    const urlGroup = document.createElement('div');
    urlGroup.className = 'mb-3';
    
    const urlLabel = document.createElement('label');
    urlLabel.htmlFor = 'sheetsUrl';
    urlLabel.className = 'form-label';
    urlLabel.textContent = 'رابط Google Sheets';
    
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'form-control';
    urlInput.id = 'sheetsUrl';
    urlInput.name = 'sheetsUrl';
    urlInput.value = currentUrl;
    urlInput.placeholder = 'أدخل رابط Google Sheets';
    urlInput.disabled = !canUpdateUrl;
    
    urlGroup.appendChild(urlLabel);
    urlGroup.appendChild(urlInput);
    
    // إضافة نص توضيحي
    const urlHelp = document.createElement('div');
    urlHelp.className = 'form-text';
    urlHelp.innerHTML = `
        يجب أن يكون الرابط بتنسيق CSV أو JSON. يمكنك الحصول على الرابط من خلال:
        <ol>
            <li>فتح جدول Google Sheets</li>
            <li>النقر على "ملف" > "نشر على الويب"</li>
            <li>اختيار "CSV" أو "JSON" من القائمة المنسدلة</li>
            <li>نسخ الرابط</li>
        </ol>
    `;
    urlGroup.appendChild(urlHelp);
    
    form.appendChild(urlGroup);
    
    // إضافة معلومات الرابط الحالي
    const currentUrlInfo = document.createElement('div');
    currentUrlInfo.className = 'alert alert-info mb-3';
    currentUrlInfo.innerHTML = `
        <strong>الرابط الحالي:</strong> 
        ${isUsingPersonalUrl ? 'رابط شخصي' : 'الرابط الافتراضي للجميع'}
    `;
    form.appendChild(currentUrlInfo);
    
    // أزرار الإجراءات
    if (canUpdateUrl) {
        const buttonsRow = document.createElement('div');
        buttonsRow.className = 'row';
        
        // زر التحديث للجميع
        const updateForAllCol = document.createElement('div');
        updateForAllCol.className = 'col-md-6 mb-2';
        
        const updateForAllButton = document.createElement('button');
        updateForAllButton.type = 'button';
        updateForAllButton.className = 'btn btn-primary w-100';
        updateForAllButton.innerHTML = '<i class="fas fa-users"></i> تعيين كافتراضي للجميع';
        updateForAllButton.addEventListener('click', function() {
            const url = urlInput.value.trim();
            if (!url) {
                alert('يرجى إدخال رابط صحيح');
                return;
            }
            
            if (confirm('هل أنت متأكد من تعيين هذا الرابط كافتراضي للجميع؟')) {
                const result = window.HR.SecureSheets.saveSheetsUrl(url, false);
                if (result) {
                    alert('تم تحديث الرابط بنجاح');
                    window.HR.SecureSheets.createSheetsUrlManagementUI(container);
                } else {
                    alert('حدث خطأ أثناء تحديث الرابط');
                }
            }
        });
        
        updateForAllCol.appendChild(updateForAllButton);
        buttonsRow.appendChild(updateForAllCol);
        
        // زر التحديث للمستخدم الحالي فقط
        const updateForMeCol = document.createElement('div');
        updateForMeCol.className = 'col-md-6 mb-2';
        
        const updateForMeButton = document.createElement('button');
        updateForMeButton.type = 'button';
        updateForMeButton.className = 'btn btn-success w-100';
        updateForMeButton.innerHTML = '<i class="fas fa-user"></i> حفظ لي فقط';
        updateForMeButton.addEventListener('click', function() {
            const url = urlInput.value.trim();
            if (!url) {
                alert('يرجى إدخال رابط صحيح');
                return;
            }
            
            const result = window.HR.SecureSheets.saveSheetsUrl(url, true);
            if (result) {
                alert('تم تحديث الرابط الشخصي بنجاح');
                window.HR.SecureSheets.createSheetsUrlManagementUI(container);
            } else {
                alert('حدث خطأ أثناء تحديث الرابط');
            }
        });
        
        updateForMeCol.appendChild(updateForMeButton);
        buttonsRow.appendChild(updateForMeCol);
        
        // زر إعادة التعيين
        const resetCol = document.createElement('div');
        resetCol.className = 'col-md-6 mb-2';
        
        const resetButton = document.createElement('button');
        resetButton.type = 'button';
        resetButton.className = 'btn btn-warning w-100';
        resetButton.innerHTML = '<i class="fas fa-undo"></i> إعادة تعيين إلى الافتراضي';
        resetButton.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من إعادة تعيين الرابط إلى القيمة الافتراضية؟')) {
                let result;
                
                if (isUsingPersonalUrl) {
                    // إذا كان المستخدم يستخدم رابطاً شخصياً، حذفه
                    result = window.HR.SecureSheets.deletePersonalSheetsUrl();
                } else {
                    // إعادة تعيين الرابط العام
                    result = window.HR.SecureSheets.resetSheetsUrl(false);
                }
                
                if (result) {
                    alert('تم إعادة تعيين الرابط بنجاح');
                    window.HR.SecureSheets.createSheetsUrlManagementUI(container);
                } else {
                    alert('حدث خطأ أثناء إعادة تعيين الرابط');
                }
            }
        });
        
        resetCol.appendChild(resetButton);
        buttonsRow.appendChild(resetCol);
        
        // زر اختبار الاتصال
        const testCol = document.createElement('div');
        testCol.className = 'col-md-6 mb-2';
        
        const testButton = document.createElement('button');
        testButton.type = 'button';
        testButton.className = 'btn btn-info w-100';
        testButton.innerHTML = '<i class="fas fa-vial"></i> اختبار الاتصال';
        testButton.addEventListener('click', function() {
            const url = urlInput.value.trim();
            if (!url) {
                alert('يرجى إدخال رابط صحيح');
                return;
            }
            
            // إظهار رسالة الانتظار
            const testResultDiv = document.getElementById('testResult');
            testResultDiv.className = 'alert alert-info mt-3';
            testResultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري اختبار الاتصال...';
            
            // اختبار الاتصال
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => {
                    // التحقق من صحة البيانات
                    let isValid = false;
                    try {
                        // محاولة تحليل البيانات كـ CSV أو JSON
                        if (data.includes(',') && data.includes('\n')) {
                            // على الأرجح CSV
                            const lines = data.split('\n');
                            if (lines.length > 1 && lines[0].includes(',')) {
                                isValid = true;
                            }
                        } else {
                            // محاولة تحليل البيانات كـ JSON
                            JSON.parse(data);
                            isValid = true;
                        }
                    } catch (e) {
                        console.error('Error parsing data:', e);
                    }
                    
                    if (isValid) {
                        testResultDiv.className = 'alert alert-success mt-3';
                        testResultDiv.innerHTML = '<i class="fas fa-check-circle"></i> تم الاتصال بنجاح! البيانات صحيحة.';
                    } else {
                        testResultDiv.className = 'alert alert-warning mt-3';
                        testResultDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> تم الاتصال، لكن تنسيق البيانات غير صحيح.';
                    }
                })
                .catch(error => {
                    testResultDiv.className = 'alert alert-danger mt-3';
                    testResultDiv.innerHTML = `<i class="fas fa-times-circle"></i> فشل الاتصال: ${error.message}`;
                });
        });
        
        testCol.appendChild(testButton);
        buttonsRow.appendChild(testCol);
        
        form.appendChild(buttonsRow);
        
        // إضافة عنصر لعرض نتيجة الاختبار
        const testResultDiv = document.createElement('div');
        testResultDiv.id = 'testResult';
        testResultDiv.className = 'd-none';
        form.appendChild(testResultDiv);
    } else {
        // رسالة عدم الصلاحية
        const noPermissionAlert = document.createElement('div');
        noPermissionAlert.className = 'alert alert-warning';
        noPermissionAlert.innerHTML = `
            <i class="fas fa-lock"></i> ليس لديك صلاحية لتغيير رابط Google Sheets.
            يرجى تسجيل الدخول كمدير نظام للوصول إلى هذه الميزة.
        `;
        form.appendChild(noPermissionAlert);
    }
    
    container.appendChild(form);
};

/**
 * تأمين عمليات إدارة الموظفين
 */
window.HR.SecureSheets.secureEmployeeOperations = function() {
    // حفظ الدوال الأصلية
    const originalAddEmployee = window.HR.addEmployee;
    const originalUpdateEmployee = window.HR.updateEmployee;
    const originalDeleteEmployee = window.HR.deleteEmployee;
    const originalOpenEmployeeForm = window.HR.openEmployeeForm;
    
    // استبدال دالة إضافة موظف
    window.HR.addEmployee = function(employee) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('add_employee')) {
            alert('ليس لديك صلاحية لإضافة موظف');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalAddEmployee(employee);
    };
    
    // استبدال دالة تحديث موظف
    window.HR.updateEmployee = function(employee) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('edit_employee')) {
            alert('ليس لديك صلاحية لتعديل بيانات الموظف');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalUpdateEmployee(employee);
    };
    
    // استبدال دالة حذف موظف
    window.HR.deleteEmployee = function(employeeId) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('delete_employee')) {
            alert('ليس لديك صلاحية لحذف الموظف');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalDeleteEmployee(employeeId);
    };
    
    // استبدال دالة فتح نموذج الموظف
    window.HR.openEmployeeForm = function(mode, employeeId) {
        // التحقق من صلاحية المستخدم
        if (mode === 'add' && !window.HR.Auth.canPerformAction('add_employee')) {
            alert('ليس لديك صلاحية لإضافة موظف');
            return false;
        }
        
        if (mode === 'edit' && !window.HR.Auth.canPerformAction('edit_employee')) {
            alert('ليس لديك صلاحية لتعديل بيانات الموظف');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalOpenEmployeeForm(mode, employeeId);
    };
};

/**
 * تأمين عمليات إدارة البيانات المرجعية
 */
window.HR.SecureSheets.secureReferenceDataOperations = function() {
    // حفظ الدوال الأصلية
    const originalAddDepartment = window.HR.addDepartment;
    const originalAddJobTitle = window.HR.addJobTitle;
    const originalAddLocation = window.HR.addLocation;
    const originalDeleteDepartment = window.HR.deleteDepartment;
    const originalDeleteJobTitle = window.HR.deleteJobTitle;
    const originalDeleteLocation = window.HR.deleteLocation;
    
    // استبدال دالة إضافة قسم
    window.HR.addDepartment = function(department) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('manage_departments')) {
            alert('ليس لديك صلاحية لإضافة قسم');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalAddDepartment(department);
    };
    
    // استبدال دالة إضافة مسمى وظيفي
    window.HR.addJobTitle = function(jobTitle) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('manage_job_titles')) {
            alert('ليس لديك صلاحية لإضافة مسمى وظيفي');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalAddJobTitle(jobTitle);
    };
    
    // استبدال دالة إضافة موقع
    window.HR.addLocation = function(location) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('manage_locations')) {
            alert('ليس لديك صلاحية لإضافة موقع');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalAddLocation(location);
    };
    
    // استبدال دالة حذف قسم
    window.HR.deleteDepartment = function(department) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('manage_departments')) {
            alert('ليس لديك صلاحية لحذف قسم');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalDeleteDepartment(department);
    };
    
    // استبدال دالة حذف مسمى وظيفي
    window.HR.deleteJobTitle = function(jobTitle) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('manage_job_titles')) {
            alert('ليس لديك صلاحية لحذف مسمى وظيفي');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalDeleteJobTitle(jobTitle);
    };
    
    // استبدال دالة حذف موقع
    window.HR.deleteLocation = function(location) {
        // التحقق من صلاحية المستخدم
        if (!window.HR.Auth.canPerformAction('manage_locations')) {
            alert('ليس لديك صلاحية لحذف موقع');
            return false;
        }
        
        // استدعاء الدالة الأصلية
        return originalDeleteLocation(location);
    };
};

/**
 * تأمين واجهة المستخدم
 */
window.HR.SecureSheets.secureUI = function() {
    // إخفاء أو إظهار عناصر واجهة المستخدم حسب صلاحيات المستخدم
    document.addEventListener('DOMContentLoaded', function() {
        // التحقق من تسجيل الدخول
        if (!window.HR.Auth.isLoggedIn()) {
            return;
        }
        
        // إخفاء أزرار الإضافة والتعديل والحذف للمستخدمين غير المصرح لهم
        if (!window.HR.Auth.canPerformAction('add_employee')) {
            // إخفاء زر إضافة موظف
            const addEmployeeButtons = document.querySelectorAll('.add-employee-btn');
            addEmployeeButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
        
        if (!window.HR.Auth.canPerformAction('edit_employee')) {
            // إخفاء أزرار تعديل الموظفين
            const editButtons = document.querySelectorAll('.edit-btn');
            editButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
        
        if (!window.HR.Auth.canPerformAction('delete_employee')) {
            // إخفاء أزرار حذف الموظفين
            const deleteButtons = document.querySelectorAll('.delete-btn');
            deleteButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
        
        if (!window.HR.Auth.canPerformAction('manage_departments') &&
            !window.HR.Auth.canPerformAction('manage_job_titles') &&
            !window.HR.Auth.canPerformAction('manage_locations')) {
            // إخفاء قسم إدارة البيانات المرجعية
            const referenceDataSection = document.getElementById('referenceDataSection');
            if (referenceDataSection) {
                referenceDataSection.style.display = 'none';
            }
        }
        
        if (!window.HR.Auth.canPerformAction('manage_fields')) {
            // إخفاء قسم إدارة الحقول
            const fieldManagementSection = document.getElementById('fieldManagementSection');
            if (fieldManagementSection) {
                fieldManagementSection.style.display = 'none';
            }
        }
        
        if (!window.HR.Auth.canPerformAction('manage_stats')) {
            // إخفاء قسم إدارة الإحصائيات
            const statsManagementSection = document.getElementById('statsManagementSection');
            if (statsManagementSection) {
                statsManagementSection.style.display = 'none';
            }
        }
    });
    
    // مراقبة التغييرات في DOM لتطبيق الأمان على العناصر الجديدة
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                // التحقق من صلاحيات المستخدم
                if (!window.HR.Auth.isLoggedIn()) {
                    return;
                }
                
                // إخفاء أزرار الإضافة والتعديل والحذف للمستخدمين غير المصرح لهم
                if (!window.HR.Auth.canPerformAction('add_employee')) {
                    // إخفاء زر إضافة موظف
                    const addEmployeeButtons = document.querySelectorAll('.add-employee-btn');
                    addEmployeeButtons.forEach(button => {
                        button.style.display = 'none';
                    });
                }
                
                if (!window.HR.Auth.canPerformAction('edit_employee')) {
                    // إخفاء أزرار تعديل الموظفين
                    const editButtons = document.querySelectorAll('.edit-btn');
                    editButtons.forEach(button => {
                        button.style.display = 'none';
                    });
                }
                
                if (!window.HR.Auth.canPerformAction('delete_employee')) {
                    // إخفاء أزرار حذف الموظفين
                    const deleteButtons = document.querySelectorAll('.delete-btn');
                    deleteButtons.forEach(button => {
                        button.style.display = 'none';
                    });
                }
            }
        });
    });
    
    // بدء مراقبة التغييرات في DOM
    observer.observe(document.body, { childList: true, subtree: true });
};

/**
 * تأمين عملية جلب البيانات من Google Sheets
 */
window.HR.SecureSheets.secureFetchData = function() {
    // حفظ الدالة الأصلية
    const originalFetchData = window.HR.fetchData;
    
    // استبدال دالة جلب البيانات
    window.HR.fetchData = function() {
        // الحصول على رابط Google Sheets المؤمن
        const sheetsUrl = window.HR.SecureSheets.getSheetsUrl();
        
        // استدعاء الدالة الأصلية مع الرابط المؤمن
        return originalFetchData(sheetsUrl);
    };
};

/**
 * تهيئة نظام تأمين رابط Google Sheets والعمليات الحساسة
 */
window.HR.SecureSheets.initialize = function() {
    // تهيئة الرابط الافتراضي إذا لم يكن موجوداً
    if (!localStorage.getItem(SHEETS_URL_KEY)) {
        window.HR.SecureSheets.saveSheetsUrl(DEFAULT_SHEETS_URL, false);
    }
    
    // تأمين عمليات إدارة الموظفين
    window.HR.SecureSheets.secureEmployeeOperations();
    
    // تأمين عمليات إدارة البيانات المرجعية
    window.HR.SecureSheets.secureReferenceDataOperations();
    
    // تأمين واجهة المستخدم
    window.HR.SecureSheets.secureUI();
    
    // تأمين عملية جلب البيانات
    window.HR.SecureSheets.secureFetchData();
    
    console.log('✅ Secure Sheets Module Initialized');
};

// تنفيذ التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', window.HR.SecureSheets.initialize);

console.log('✅ Secure Sheets Module Loaded');
