// ===============================
// دمج وتكامل جميع الوحدات البرمجية
// ===============================

/**
 * دمج وتكامل جميع الوحدات البرمجية
 * 
 * هذا الملف يقوم بدمج جميع الوحدات البرمجية المطورة في ملف واحد
 * للتأكد من تكامل النظام وعمل جميع الميزات بشكل صحيح
 */

// تهيئة النظام
window.HR = window.HR || {};

// ترتيب تحميل الوحدات البرمجية
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة نظام المصادقة أولاً
    window.HR.Auth.initialize();
    
    // تهيئة نظام تأمين رابط Google Sheets
    window.HR.SecureSheets.initialize();
    
    // تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
    updateUIBasedOnAuth();
    
    // تحميل البيانات من Google Sheets
    loadData();
});

/**
 * تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
 */
function updateUIBasedOnAuth() {
    // التحقق من تسجيل الدخول
    if (window.HR.Auth.isLoggedIn()) {
        // إظهار واجهة النظام الرئيسية
        showMainUI();
    } else {
        // إظهار نموذج تسجيل الدخول
        showLoginUI();
    }
}

/**
 * إظهار نموذج تسجيل الدخول
 */
function showLoginUI() {
    // إخفاء واجهة النظام الرئيسية
    document.getElementById('mainContainer').style.display = 'none';
    
    // إظهار نموذج تسجيل الدخول
    const loginContainer = document.getElementById('loginContainer');
    loginContainer.style.display = 'block';
    
    // إنشاء واجهة تسجيل الدخول
    window.HR.Auth.createLoginUI(loginContainer);
}

/**
 * إظهار واجهة النظام الرئيسية
 */
function showMainUI() {
    // إخفاء نموذج تسجيل الدخول
    document.getElementById('loginContainer').style.display = 'none';
    
    // إظهار واجهة النظام الرئيسية
    document.getElementById('mainContainer').style.display = 'block';
    
    // إنشاء واجهة معلومات المستخدم الحالي
    const userInfoContainer = document.getElementById('userInfoContainer');
    window.HR.Auth.createUserInfoUI(userInfoContainer);
    
    // تحديث واجهة المستخدم بناءً على صلاحيات المستخدم
    updateUIBasedOnPermissions();
}

/**
 * تحديث واجهة المستخدم بناءً على صلاحيات المستخدم
 */
function updateUIBasedOnPermissions() {
    // إخفاء أو إظهار عناصر واجهة المستخدم حسب صلاحيات المستخدم
    
    // زر إضافة موظف
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if (addEmployeeBtn) {
        addEmployeeBtn.style.display = window.HR.Auth.canPerformAction('add_employee') ? 'block' : 'none';
    }
    
    // قسم إدارة المستخدمين
    const userManagementTab = document.getElementById('userManagementTab');
    if (userManagementTab) {
        userManagementTab.style.display = window.HR.Auth.canPerformAction('manage_users') ? 'block' : 'none';
    }
    
    // قسم إدارة الحقول
    const fieldManagementTab = document.getElementById('fieldManagementTab');
    if (fieldManagementTab) {
        fieldManagementTab.style.display = window.HR.Auth.canPerformAction('manage_fields') ? 'block' : 'none';
    }
    
    // قسم إدارة الإحصائيات
    const statsManagementTab = document.getElementById('statsManagementTab');
    if (statsManagementTab) {
        statsManagementTab.style.display = window.HR.Auth.canPerformAction('manage_stats') ? 'block' : 'none';
    }
}

/**
 * تحميل البيانات من Google Sheets
 */
function loadData() {
    // عرض مؤشر التحميل
    showLoadingIndicator();
    
    // الحصول على رابط Google Sheets المؤمن
    const sheetsUrl = window.HR.SecureSheets.getSheetsUrl();
    
    // جلب البيانات
    fetch(sheetsUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            // تحويل البيانات من CSV إلى JSON
            const employees = parseCSVData(data);
            
            // تحويل البيانات مع دعم الحقول الديناميكية
            const transformedEmployees = window.HR.DynamicData.transformDataWithDynamicFields(employees);
            
            // حفظ البيانات
            window.HR.setEmployees(transformedEmployees);
            
            // تحديث واجهة المستخدم
            updateEmployeeTable();
            
            // تحديث لوحة المعلومات
            window.HR.refreshDashboard();
            
            // إخفاء مؤشر التحميل
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            
            // عرض رسالة الخطأ
            showErrorMessage(`حدث خطأ أثناء تحميل البيانات: ${error.message}`);
            
            // إخفاء مؤشر التحميل
            hideLoadingIndicator();
        });
}

/**
 * تحويل البيانات من CSV إلى JSON
 * @param {string} csvData - بيانات CSV
 * @returns {Array} - مصفوفة من الكائنات
 */
function parseCSVData(csvData) {
    // تقسيم البيانات إلى أسطر
    const lines = csvData.split('\n');
    
    // الحصول على أسماء الحقول من السطر الأول
    const headers = lines[0].split(',').map(header => header.trim());
    
    // تحويل البيانات إلى كائنات
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        // تجاهل الأسطر الفارغة
        if (!lines[i].trim()) continue;
        
        const obj = {};
        const currentLine = lines[i].split(',');
        
        // التعامل مع القيم التي تحتوي على فواصل داخل علامات اقتباس
        let mergedLine = [];
        let merging = false;
        let mergedValue = '';
        
        for (let j = 0; j < currentLine.length; j++) {
            let value = currentLine[j].trim();
            
            if (!merging && value.startsWith('"') && !value.endsWith('"')) {
                // بداية قيمة مدمجة
                merging = true;
                mergedValue = value.substring(1);
            } else if (merging && value.endsWith('"')) {
                // نهاية قيمة مدمجة
                mergedValue += ',' + value.substring(0, value.length - 1);
                merging = false;
                mergedLine.push(mergedValue);
                mergedValue = '';
            } else if (merging) {
                // وسط قيمة مدمجة
                mergedValue += ',' + value;
            } else {
                // قيمة عادية
                mergedLine.push(value);
            }
        }
        
        // إذا كان هناك قيمة مدمجة غير مكتملة، إضافتها
        if (merging) {
            mergedLine.push(mergedValue);
        }
        
        // إنشاء الكائن
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = j < mergedLine.length ? mergedLine[j] : '';
        }
        
        result.push(obj);
    }
    
    return result;
}

/**
 * تحديث جدول الموظفين
 */
function updateEmployeeTable() {
    // الحصول على قائمة الموظفين
    const employees = window.HR.getEmployees();
    
    // الحصول على عنصر الجدول
    const tableContainer = document.getElementById('employeeTableContainer');
    
    // تحديث الجدول باستخدام الوحدة الديناميكية
    window.HR.DynamicUI.updateEmployeeTable(employees, 'employeeTable');
}

/**
 * عرض مؤشر التحميل
 */
function showLoadingIndicator() {
    // إنشاء عنصر مؤشر التحميل إذا لم يكن موجوداً
    let loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">جاري التحميل...</span>
            </div>
            <div class="mt-2">جاري تحميل البيانات...</div>
        `;
        document.body.appendChild(loadingIndicator);
    }
    
    // إظهار مؤشر التحميل
    loadingIndicator.style.display = 'flex';
}

/**
 * إخفاء مؤشر التحميل
 */
function hideLoadingIndicator() {
    // الحصول على عنصر مؤشر التحميل
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // إخفاء مؤشر التحميل إذا كان موجوداً
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * عرض رسالة خطأ
 * @param {string} message - نص الرسالة
 */
function showErrorMessage(message) {
    // إنشاء عنصر رسالة الخطأ
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger alert-dismissible fade show';
    errorAlert.role = 'alert';
    errorAlert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // إضافة رسالة الخطأ إلى الصفحة
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.appendChild(errorAlert);
    } else {
        // إذا لم يكن هناك حاوية للتنبيهات، إنشاء واحدة
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'alert-container';
        container.appendChild(errorAlert);
        document.body.appendChild(container);
    }
    
    // إزالة رسالة الخطأ بعد 5 ثوانٍ
    setTimeout(() => {
        errorAlert.remove();
    }, 5000);
}

/**
 * إنشاء واجهة إدارة الإعدادات
 */
function initializeSettingsUI() {
    // إنشاء واجهة إدارة رابط Google Sheets
    const sheetsUrlContainer = document.getElementById('sheetsUrlContainer');
    if (sheetsUrlContainer) {
        window.HR.SecureSheets.createSheetsUrlManagementUI(sheetsUrlContainer);
    }
    
    // إنشاء واجهة إدارة المستخدمين
    const userManagementContainer = document.getElementById('userManagementContainer');
    if (userManagementContainer) {
        window.HR.Auth.createUserManagementUI(userManagementContainer);
    }
    
    // إنشاء واجهة إدارة الحقول
    const fieldManagementContainer = document.getElementById('fieldManagementContainer');
    if (fieldManagementContainer) {
        window.HR.DynamicForms.createFieldManagementUI(fieldManagementContainer);
    }
    
    // إنشاء واجهة إدارة الإحصائيات
    const statsManagementContainer = document.getElementById('statsManagementContainer');
    if (statsManagementContainer) {
        window.HR.DynamicForms.createStatsManagementUI(statsManagementContainer);
    }
}

/**
 * فتح نموذج إضافة/تعديل موظف
 * @param {string} mode - وضع النموذج (add/edit)
 * @param {string} employeeId - معرف الموظف (في حالة التعديل)
 */
window.HR.openEmployeeForm = function(mode, employeeId) {
    // التحقق من صلاحية المستخدم
    if (mode === 'add' && !window.HR.Auth.canPerformAction('add_employee')) {
        showErrorMessage('ليس لديك صلاحية لإضافة موظف');
        return;
    }
    
    if (mode === 'edit' && !window.HR.Auth.canPerformAction('edit_employee')) {
        showErrorMessage('ليس لديك صلاحية لتعديل بيانات الموظف');
        return;
    }
    
    // إنشاء النموذج
    const formContainer = document.getElementById('employeeFormContainer');
    formContainer.style.display = 'block';
    
    // إنشاء نموذج الموظف الديناميكي
    window.HR.DynamicForms.createEmployeeForm(mode, employeeId, formContainer);
};

/**
 * إغلاق نموذج الموظف
 */
window.HR.closeEmployeeForm = function() {
    // إخفاء النموذج
    const formContainer = document.getElementById('employeeFormContainer');
    formContainer.style.display = 'none';
    formContainer.innerHTML = '';
};

/**
 * إضافة موظف جديد
 * @param {Object} employee - بيانات الموظف
 * @returns {boolean} - نجاح العملية
 */
window.HR.addEmployee = function(employee) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('add_employee')) {
        showErrorMessage('ليس لديك صلاحية لإضافة موظف');
        return false;
    }
    
    // الحصول على قائمة الموظفين الحالية
    const employees = window.HR.getEmployees();
    
    // إضافة الموظف الجديد
    employees.push(employee);
    
    // حفظ قائمة الموظفين
    window.HR.setEmployees(employees);
    
    // تحديث واجهة المستخدم
    updateEmployeeTable();
    
    // تحديث لوحة المعلومات
    window.HR.refreshDashboard();
    
    return true;
};

/**
 * تحديث بيانات موظف
 * @param {Object} employee - بيانات الموظف
 * @returns {boolean} - نجاح العملية
 */
window.HR.updateEmployee = function(employee) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('edit_employee')) {
        showErrorMessage('ليس لديك صلاحية لتعديل بيانات الموظف');
        return false;
    }
    
    // الحصول على قائمة الموظفين الحالية
    const employees = window.HR.getEmployees();
    
    // البحث عن الموظف
    const index = employees.findIndex(emp => emp.id === employee.id);
    
    // إذا لم يتم العثور على الموظف
    if (index === -1) {
        showErrorMessage('لم يتم العثور على الموظف');
        return false;
    }
    
    // تحديث بيانات الموظف
    employees[index] = employee;
    
    // حفظ قائمة الموظفين
    window.HR.setEmployees(employees);
    
    // تحديث واجهة المستخدم
    updateEmployeeTable();
    
    // تحديث لوحة المعلومات
    window.HR.refreshDashboard();
    
    return true;
};

/**
 * حذف موظف
 * @param {string} employeeId - معرف الموظف
 * @returns {boolean} - نجاح العملية
 */
window.HR.deleteEmployee = function(employeeId) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('delete_employee')) {
        showErrorMessage('ليس لديك صلاحية لحذف الموظف');
        return false;
    }
    
    // الحصول على قائمة الموظفين الحالية
    const employees = window.HR.getEmployees();
    
    // حذف الموظف
    const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
    
    // إذا لم يتغير عدد الموظفين، فلم يتم العثور على الموظف
    if (updatedEmployees.length === employees.length) {
        showErrorMessage('لم يتم العثور على الموظف');
        return false;
    }
    
    // حفظ قائمة الموظفين
    window.HR.setEmployees(updatedEmployees);
    
    // تحديث واجهة المستخدم
    updateEmployeeTable();
    
    // تحديث لوحة المعلومات
    window.HR.refreshDashboard();
    
    return true;
};

/**
 * البحث عن موظف بواسطة المعرف
 * @param {string} employeeId - معرف الموظف
 * @returns {Object|null} - بيانات الموظف أو null إذا لم يتم العثور عليه
 */
window.HR.findEmployeeById = function(employeeId) {
    // الحصول على قائمة الموظفين
    const employees = window.HR.getEmployees();
    
    // البحث عن الموظف
    return employees.find(emp => emp.id === employeeId) || null;
};

/**
 * الحصول على قائمة الموظفين
 * @returns {Array} - قائمة الموظفين
 */
window.HR.getEmployees = function() {
    try {
        // الحصول على البيانات من localStorage
        const employeesJson = localStorage.getItem('hr_employees');
        
        // إذا لم تكن هناك بيانات، إرجاع مصفوفة فارغة
        if (!employeesJson) {
            return [];
        }
        
        // تحويل البيانات من JSON إلى كائنات
        return JSON.parse(employeesJson);
    } catch (error) {
        console.error('Error getting employees:', error);
        return [];
    }
};

/**
 * حفظ قائمة الموظفين
 * @param {Array} employees - قائمة الموظفين
 * @returns {boolean} - نجاح العملية
 */
window.HR.setEmployees = function(employees) {
    try {
        // تحويل البيانات إلى JSON
        const employeesJson = JSON.stringify(employees);
        
        // حفظ البيانات في localStorage
        localStorage.setItem('hr_employees', employeesJson);
        
        return true;
    } catch (error) {
        console.error('Error saving employees:', error);
        return false;
    }
};

/**
 * الحصول على قائمة الأقسام
 * @returns {Array} - قائمة الأقسام
 */
window.HR.getDepartments = function() {
    try {
        // الحصول على البيانات من localStorage
        const departmentsJson = localStorage.getItem('hr_departments');
        
        // إذا لم تكن هناك بيانات، إرجاع القائمة الافتراضية
        if (!departmentsJson) {
            return ['قسم تقنية المعلومات', 'قسم الموارد البشرية', 'قسم المالية', 'قسم المبيعات', 'قسم التسويق'];
        }
        
        // تحويل البيانات من JSON إلى مصفوفة
        return JSON.parse(departmentsJson);
    } catch (error) {
        console.error('Error getting departments:', error);
        return ['قسم تقنية المعلومات', 'قسم الموارد البشرية', 'قسم المالية', 'قسم المبيعات', 'قسم التسويق'];
    }
};

/**
 * إضافة قسم جديد
 * @param {string} department - اسم القسم
 * @returns {boolean} - نجاح العملية
 */
window.HR.addDepartment = function(department) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('manage_departments')) {
        showErrorMessage('ليس لديك صلاحية لإضافة قسم');
        return false;
    }
    
    // الحصول على قائمة الأقسام الحالية
    const departments = window.HR.getDepartments();
    
    // التحقق من عدم وجود القسم بالفعل
    if (departments.includes(department)) {
        showErrorMessage('القسم موجود بالفعل');
        return false;
    }
    
    // إضافة القسم الجديد
    departments.push(department);
    
    // حفظ قائمة الأقسام
    try {
        localStorage.setItem('hr_departments', JSON.stringify(departments));
        return true;
    } catch (error) {
        console.error('Error saving departments:', error);
        return false;
    }
};

/**
 * حذف قسم
 * @param {string} department - اسم القسم
 * @returns {boolean} - نجاح العملية
 */
window.HR.deleteDepartment = function(department) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('manage_departments')) {
        showErrorMessage('ليس لديك صلاحية لحذف قسم');
        return false;
    }
    
    // الحصول على قائمة الأقسام الحالية
    const departments = window.HR.getDepartments();
    
    // حذف القسم
    const updatedDepartments = departments.filter(dept => dept !== department);
    
    // إذا لم يتغير عدد الأقسام، فلم يتم العثور على القسم
    if (updatedDepartments.length === departments.length) {
        showErrorMessage('لم يتم العثور على القسم');
        return false;
    }
    
    // حفظ قائمة الأقسام
    try {
        localStorage.setItem('hr_departments', JSON.stringify(updatedDepartments));
        return true;
    } catch (error) {
        console.error('Error saving departments:', error);
        return false;
    }
};

/**
 * الحصول على قائمة المسميات الوظيفية
 * @returns {Array} - قائمة المسميات الوظيفية
 */
window.HR.getJobTitles = function() {
    try {
        // الحصول على البيانات من localStorage
        const jobTitlesJson = localStorage.getItem('hr_job_titles');
        
        // إذا لم تكن هناك بيانات، إرجاع القائمة الافتراضية
        if (!jobTitlesJson) {
            return ['مدير', 'مطور', 'محلل', 'مصمم', 'مسؤول موارد بشرية', 'محاسب', 'مندوب مبيعات'];
        }
        
        // تحويل البيانات من JSON إلى مصفوفة
        return JSON.parse(jobTitlesJson);
    } catch (error) {
        console.error('Error getting job titles:', error);
        return ['مدير', 'مطور', 'محلل', 'مصمم', 'مسؤول موارد بشرية', 'محاسب', 'مندوب مبيعات'];
    }
};

/**
 * إضافة مسمى وظيفي جديد
 * @param {string} jobTitle - المسمى الوظيفي
 * @returns {boolean} - نجاح العملية
 */
window.HR.addJobTitle = function(jobTitle) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('manage_job_titles')) {
        showErrorMessage('ليس لديك صلاحية لإضافة مسمى وظيفي');
        return false;
    }
    
    // الحصول على قائمة المسميات الوظيفية الحالية
    const jobTitles = window.HR.getJobTitles();
    
    // التحقق من عدم وجود المسمى الوظيفي بالفعل
    if (jobTitles.includes(jobTitle)) {
        showErrorMessage('المسمى الوظيفي موجود بالفعل');
        return false;
    }
    
    // إضافة المسمى الوظيفي الجديد
    jobTitles.push(jobTitle);
    
    // حفظ قائمة المسميات الوظيفية
    try {
        localStorage.setItem('hr_job_titles', JSON.stringify(jobTitles));
        return true;
    } catch (error) {
        console.error('Error saving job titles:', error);
        return false;
    }
};

/**
 * حذف مسمى وظيفي
 * @param {string} jobTitle - المسمى الوظيفي
 * @returns {boolean} - نجاح العملية
 */
window.HR.deleteJobTitle = function(jobTitle) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('manage_job_titles')) {
        showErrorMessage('ليس لديك صلاحية لحذف مسمى وظيفي');
        return false;
    }
    
    // الحصول على قائمة المسميات الوظيفية الحالية
    const jobTitles = window.HR.getJobTitles();
    
    // حذف المسمى الوظيفي
    const updatedJobTitles = jobTitles.filter(title => title !== jobTitle);
    
    // إذا لم يتغير عدد المسميات الوظيفية، فلم يتم العثور على المسمى الوظيفي
    if (updatedJobTitles.length === jobTitles.length) {
        showErrorMessage('لم يتم العثور على المسمى الوظيفي');
        return false;
    }
    
    // حفظ قائمة المسميات الوظيفية
    try {
        localStorage.setItem('hr_job_titles', JSON.stringify(updatedJobTitles));
        return true;
    } catch (error) {
        console.error('Error saving job titles:', error);
        return false;
    }
};

/**
 * الحصول على قائمة المواقع
 * @returns {Array} - قائمة المواقع
 */
window.HR.getLocations = function() {
    try {
        // الحصول على البيانات من localStorage
        const locationsJson = localStorage.getItem('hr_locations');
        
        // إذا لم تكن هناك بيانات، إرجاع القائمة الافتراضية
        if (!locationsJson) {
            return ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'];
        }
        
        // تحويل البيانات من JSON إلى مصفوفة
        return JSON.parse(locationsJson);
    } catch (error) {
        console.error('Error getting locations:', error);
        return ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'];
    }
};

/**
 * إضافة موقع جديد
 * @param {string} location - الموقع
 * @returns {boolean} - نجاح العملية
 */
window.HR.addLocation = function(location) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('manage_locations')) {
        showErrorMessage('ليس لديك صلاحية لإضافة موقع');
        return false;
    }
    
    // الحصول على قائمة المواقع الحالية
    const locations = window.HR.getLocations();
    
    // التحقق من عدم وجود الموقع بالفعل
    if (locations.includes(location)) {
        showErrorMessage('الموقع موجود بالفعل');
        return false;
    }
    
    // إضافة الموقع الجديد
    locations.push(location);
    
    // حفظ قائمة المواقع
    try {
        localStorage.setItem('hr_locations', JSON.stringify(locations));
        return true;
    } catch (error) {
        console.error('Error saving locations:', error);
        return false;
    }
};

/**
 * حذف موقع
 * @param {string} location - الموقع
 * @returns {boolean} - نجاح العملية
 */
window.HR.deleteLocation = function(location) {
    // التحقق من صلاحية المستخدم
    if (!window.HR.Auth.canPerformAction('manage_locations')) {
        showErrorMessage('ليس لديك صلاحية لحذف موقع');
        return false;
    }
    
    // الحصول على قائمة المواقع الحالية
    const locations = window.HR.getLocations();
    
    // حذف الموقع
    const updatedLocations = locations.filter(loc => loc !== location);
    
    // إذا لم يتغير عدد المواقع، فلم يتم العثور على الموقع
    if (updatedLocations.length === locations.length) {
        showErrorMessage('لم يتم العثور على الموقع');
        return false;
    }
    
    // حفظ قائمة المواقع
    try {
        localStorage.setItem('hr_locations', JSON.stringify(updatedLocations));
        return true;
    } catch (error) {
        console.error('Error saving locations:', error);
        return false;
    }
};

// إضافة CSS للنظام
function addSystemStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* مؤشر التحميل */
        .loading-indicator {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
        }
        
        /* حاوية التنبيهات */
        .alert-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        }
        
        /* نموذج الموظف */
        #employeeFormContainer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9998;
            padding: 20px;
            overflow-y: auto;
        }
        
        #employeeFormContainer form {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
        }
    `;
    document.head.appendChild(styleElement);
}

// إضافة الأنماط عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', addSystemStyles);

// تهيئة واجهة الإعدادات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeSettingsUI);

console.log('✅ System Integration Module Loaded');
