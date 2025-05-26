// ===============================
// إصلاح مشاكل نظام إدارة الموارد البشرية
// ===============================

// 1. إصلاح مشكلة أزرار إضافة المدينة/الإدارة/التخصص
// المشكلة: الأزرار لا تعمل عند النقر عليها

// إصلاح دالة إضافة قسم جديد
function addDepartment() {
    const newDepartment = document.getElementById('newDepartment').value.trim();
    
    if (!newDepartment) {
        showNotification('Please enter a department name', 'warning');
        return;
    }
    
    if (departments.includes(newDepartment)) {
        showNotification('This department already exists', 'warning');
        return;
    }
    
    // إضافة القسم إلى المصفوفة المحلية
    departments.push(newDepartment);
    
    // تحديث القوائم المنسدلة
    updateAllDropdowns();
    
    // تحديث قائمة الأقسام في الإعدادات
    updateSettingsLists();
    
    // حفظ في Google Sheets
    saveSettingsToSheets('department', newDepartment)
        .then(success => {
            if (success) {
                showNotification(`Department "${newDepartment}" added successfully`, 'success');
                document.getElementById('newDepartment').value = '';
            }
        });
}

// إصلاح دالة إضافة مسمى وظيفي جديد
function addJobTitle() {
    const newJobTitle = document.getElementById('newJobTitle').value.trim();
    
    if (!newJobTitle) {
        showNotification('Please enter a job title', 'warning');
        return;
    }
    
    if (jobTitles.includes(newJobTitle)) {
        showNotification('This job title already exists', 'warning');
        return;
    }
    
    // إضافة المسمى الوظيفي إلى المصفوفة المحلية
    jobTitles.push(newJobTitle);
    
    // تحديث القوائم المنسدلة
    updateAllDropdowns();
    
    // تحديث قائمة المسميات الوظيفية في الإعدادات
    updateSettingsLists();
    
    // حفظ في Google Sheets
    saveSettingsToSheets('jobTitle', newJobTitle)
        .then(success => {
            if (success) {
                showNotification(`Job title "${newJobTitle}" added successfully`, 'success');
                document.getElementById('newJobTitle').value = '';
            }
        });
}

// إصلاح دالة إضافة موقع جديد
function addLocation() {
    const newLocation = document.getElementById('newLocation').value.trim();
    
    if (!newLocation) {
        showNotification('Please enter a location name', 'warning');
        return;
    }
    
    if (locations.includes(newLocation)) {
        showNotification('This location already exists', 'warning');
        return;
    }
    
    // إضافة الموقع إلى المصفوفة المحلية
    locations.push(newLocation);
    
    // تحديث القوائم المنسدلة
    updateAllDropdowns();
    
    // تحديث قائمة المواقع في الإعدادات
    updateSettingsLists();
    
    // حفظ في Google Sheets
    saveSettingsToSheets('location', newLocation)
        .then(success => {
            if (success) {
                showNotification(`Location "${newLocation}" added successfully`, 'success');
                document.getElementById('newLocation').value = '';
            }
        });
}

// تحديث قوائم الإعدادات
function updateSettingsLists() {
    // تحديث قائمة الأقسام
    const departmentsList = document.getElementById('departmentsList');
    if (departmentsList) {
        departmentsList.innerHTML = '';
        departments.forEach(dept => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <span>${dept}</span>
                <button class="btn btn-delete" onclick="deleteDepartment('${dept}')">Delete</button>
            `;
            departmentsList.appendChild(item);
        });
        
        if (departments.length === 0) {
            departmentsList.innerHTML = '<div style="color: #718096; padding: 10px;">No departments added yet</div>';
        }
    }
    
    // تحديث قائمة المسميات الوظيفية
    const jobTitlesList = document.getElementById('jobTitlesList');
    if (jobTitlesList) {
        jobTitlesList.innerHTML = '';
        jobTitles.forEach(title => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <span>${title}</span>
                <button class="btn btn-delete" onclick="deleteJobTitle('${title}')">Delete</button>
            `;
            jobTitlesList.appendChild(item);
        });
        
        if (jobTitles.length === 0) {
            jobTitlesList.innerHTML = '<div style="color: #718096; padding: 10px;">No job titles added yet</div>';
        }
    }
    
    // تحديث قائمة المواقع
    const locationsList = document.getElementById('locationsList');
    if (locationsList) {
        locationsList.innerHTML = '';
        locations.forEach(loc => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <span>${loc}</span>
                <button class="btn btn-delete" onclick="deleteLocation('${loc}')">Delete</button>
            `;
            locationsList.appendChild(item);
        });
        
        if (locations.length === 0) {
            locationsList.innerHTML = '<div style="color: #718096; padding: 10px;">No locations added yet</div>';
        }
    }
}

// إضافة دوال حذف العناصر
function deleteDepartment(dept) {
    if (confirm(`Are you sure you want to delete "${dept}" department?`)) {
        // حذف من المصفوفة المحلية
        departments = departments.filter(d => d !== dept);
        
        // تحديث القوائم المنسدلة
        updateAllDropdowns();
        
        // تحديث قائمة الأقسام في الإعدادات
        updateSettingsLists();
        
        // حفظ في Google Sheets (إذا كان متاحاً)
        if (typeof saveSettingsToSheets === 'function') {
            saveSettingsToSheets('delete_department', dept)
                .then(success => {
                    if (success) {
                        showNotification(`Department "${dept}" deleted successfully`, 'success');
                    }
                });
        } else {
            showNotification(`Department "${dept}" deleted from local data`, 'success');
        }
    }
}

function deleteJobTitle(title) {
    if (confirm(`Are you sure you want to delete "${title}" job title?`)) {
        // حذف من المصفوفة المحلية
        jobTitles = jobTitles.filter(t => t !== title);
        
        // تحديث القوائم المنسدلة
        updateAllDropdowns();
        
        // تحديث قائمة المسميات الوظيفية في الإعدادات
        updateSettingsLists();
        
        // حفظ في Google Sheets (إذا كان متاحاً)
        if (typeof saveSettingsToSheets === 'function') {
            saveSettingsToSheets('delete_jobTitle', title)
                .then(success => {
                    if (success) {
                        showNotification(`Job title "${title}" deleted successfully`, 'success');
                    }
                });
        } else {
            showNotification(`Job title "${title}" deleted from local data`, 'success');
        }
    }
}

function deleteLocation(loc) {
    if (confirm(`Are you sure you want to delete "${loc}" location?`)) {
        // حذف من المصفوفة المحلية
        locations = locations.filter(l => l !== loc);
        
        // تحديث القوائم المنسدلة
        updateAllDropdowns();
        
        // تحديث قائمة المواقع في الإعدادات
        updateSettingsLists();
        
        // حفظ في Google Sheets (إذا كان متاحاً)
        if (typeof saveSettingsToSheets === 'function') {
            saveSettingsToSheets('delete_location', loc)
                .then(success => {
                    if (success) {
                        showNotification(`Location "${loc}" deleted successfully`, 'success');
                    }
                });
        } else {
            showNotification(`Location "${loc}" deleted from local data`, 'success');
        }
    }
}

// 2. إصلاح مشكلة تحديث الصفحة عند إضافة/تعديل بيانات الموظفين
// المشكلة: عند إضافة موظف أو تعديل بياناته، يتم تحديث الصفحة دون تعديل

// إصلاح معالج نموذج الموظف
document.getElementById('employeeFormData').addEventListener('submit', async function(event) {
    // منع السلوك الافتراضي للنموذج (تحديث الصفحة)
    event.preventDefault();
    
    // جمع بيانات الموظف من النموذج
    const employeeData = {
        name: document.getElementById('employeeName').value.trim(),
        id: document.getElementById('employeeId').value.trim() || generateEmployeeId(),
        email: document.getElementById('employeeEmail').value.trim(),
        department: document.getElementById('employeeDepartment').value,
        jobTitle: document.getElementById('employeeJobTitle').value,
        location: document.getElementById('employeeLocation').value.trim(),
        nationality: document.getElementById('employeeNationality').value,
        startDate: document.getElementById('employeeStartDate').value,
        endDate: document.getElementById('employeeEndDate').value,
        status: document.getElementById('employeeStatus').value,
        notes: document.getElementById('employeeNotes').value.trim()
    };
    
    // التحقق من البيانات الإلزامية
    if (!employeeData.name) {
        showNotification('Employee name is required', 'error');
        return;
    }
    
    if (!employeeData.department) {
        showNotification('Department is required', 'error');
        return;
    }
    
    if (!employeeData.jobTitle) {
        showNotification('Job title is required', 'error');
        return;
    }
    
    // تحديد ما إذا كانت عملية إضافة أو تحديث
    const isUpdate = editingIndex >= 0;
    
    // حفظ البيانات في Google Sheets
    const saveSuccess = await saveToGoogleSheets(employeeData, isUpdate);
    
    if (saveSuccess) {
        if (isUpdate) {
            // تحديث البيانات في المصفوفة المحلية
            employees[editingIndex] = employeeData;
            showNotification(`Employee "${employeeData.name}" updated successfully`, 'success');
        } else {
            // إضافة الموظف الجديد إلى المصفوفة المحلية
            employees.push(employeeData);
            showNotification(`Employee "${employeeData.name}" added successfully`, 'success');
        }
        
        // إخفاء النموذج
        hideForm();
        
        // تحديث واجهة المستخدم
        updateInterface();
    }
});

// إنشاء معرف موظف جديد
function generateEmployeeId() {
    return 'EMP' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// 3. إصلاح مشكلة عدم عرض بعض البيانات من Google Sheets
// المشكلة: بعض البيانات في Google Sheets لا تنعكس ولا يمكن قراءتها

// تحسين دالة تحديد حالة الموظف
function determineStatus(row) {
    try {
        // محاولة قراءة الحالة بشكل مباشر
        const status = safeString(row.Status || row.status || '').toLowerCase();
        
        // إذا كانت الحالة محددة بشكل صريح
        if (status === 'active' || status === 'نشط') return 'active';
        if (status === 'inactive' || status === 'غير نشط') return 'inactive';
        
        // تحديد الحالة بناءً على تاريخ انتهاء العقد
        const endDate = safeString(row['End Date'] || row.endDate || '');
        if (endDate) {
            try {
                const contractEndDate = new Date(endDate);
                const today = new Date();
                return contractEndDate >= today ? 'active' : 'inactive';
            } catch (dateError) {
                console.log('Invalid date format:', endDate);
            }
        }
        
        // الافتراضي هو نشط إذا لم يكن هناك تاريخ انتهاء أو تاريخ غير صالح
        return 'active';
    } catch (error) {
        console.error('Error determining status:', error);
        return 'active';
    }
}

// تحسين دالة معالجة النصوص للتعامل مع مختلف أنواع البيانات
function safeString(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    // تحويل إلى نص وإزالة المسافات الزائدة
    return String(value).trim();
}

// دالة مساعدة للوصول الآمن إلى خصائص الكائن
function safeGet(obj, ...keys) {
    for (const key of keys) {
        if (obj && obj[key] !== undefined) {
            return obj[key];
        }
    }
    return '';
}

// تحسين دالة تحميل البيانات من Google Sheets
async function loadFromGoogleSheets() {
    if (isSyncing) return;
    isSyncing = true;
    
    try {
        updateSyncStatus('loading', '🔄 Loading data from Google Sheets...');
        
        let data = null;
        let method = 'unknown';
        
        // طريقة 1: محاولة الاتصال المباشر
        try {
            const response = await fetch(sheetsUrl, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                redirect: 'follow'
            });
            
            if (response.ok) {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                    method = 'direct fetch';
                    console.log('✅ Direct fetch successful');
                } catch (parseError) {
                    console.log('Direct fetch: JSON parse error:', parseError);
                    // محاولة تحليل النص كـ JSON إذا كان يحتوي على بيانات
                    if (text.includes('{') || text.includes('[')) {
                        try {
                            // إزالة أي محتوى غير JSON
                            const jsonStart = text.indexOf('{') !== -1 ? text.indexOf('{') : text.indexOf('[');
                            const jsonEnd = text.lastIndexOf('}') !== -1 ? text.lastIndexOf('}') + 1 : text.lastIndexOf(']') + 1;
                            const jsonText = text.substring(jsonStart, jsonEnd);
                            data = JSON.parse(jsonText);
                            method = 'direct fetch (cleaned)';
                            console.log('✅ Direct fetch successful with JSON cleaning');
                        } catch (cleanError) {
                            console.log('Failed to clean and parse JSON:', cleanError);
                        }
                    }
                }
            } else {
                console.log('Direct fetch failed with status:', response.status);
            }
        } catch (fetchError) {
            console.log('Direct fetch failed:', fetchError.message);
        }
        
        // طريقة 2: استخدام JSONP كحل بديل
        if (!data) {
            try {
                console.log('Trying JSONP fallback...');
                data = await loadWithJSONP(sheetsUrl);
                method = 'JSONP';
                console.log('✅ JSONP successful');
            } catch (jsonpError) {
                console.log('JSONP failed:', jsonpError.message);
            }
        }
        
        if (!data) {
            throw new Error('All connection methods failed');
        }
        
        if (Array.isArray(data) && data.length > 0) {
            // تنظيف وتحويل البيانات من Google Sheets
            employees = data.map(row => {
                // إنشاء معرف إذا كان مفقوداً
                let employeeId = safeString(safeGet(row, 'ID', 'id', 'Id', 'رقم_الموظف'));
                
                if (!employeeId) {
                    employeeId = generateEmployeeId();
                }

                return {
                    name: safeString(safeGet(row, 'Name', 'name', 'الاسم')),
                    id: employeeId,
                    email: safeString(safeGet(row, 'Email', 'email', 'البريد_الإلكتروني')),
                    department: safeString(safeGet(row, 'Department', 'department', 'القسم')),
                    jobTitle: safeString(safeGet(row, 'Job Title', 'Job title', 'jobTitle', 'المسمى_الوظيفي')),
                    location: safeString(safeGet(row, 'Location', 'location', 'الموقع')),
                    nationality: safeString(safeGet(row, 'Nationality', 'nationality', 'الجنسية')),
                    status: determineStatus(row),
                    startDate: safeString(safeGet(row, 'Start Date', 'startDate', 'تاريخ_البدء')),
           
(Content truncated due to size limit. Use line ranges to read in chunks)