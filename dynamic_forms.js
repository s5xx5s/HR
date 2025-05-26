// ===============================
// تحديث نماذج إضافة وتعديل الموظفين لدعم الحقول الديناميكية
// ===============================

/**
 * تحديث نماذج إضافة وتعديل الموظفين لدعم الحقول الديناميكية
 * 
 * هذا الكود يقوم بتحديث نماذج إضافة وتعديل الموظفين لتشمل الحقول الديناميكية
 * المكتشفة من Google Sheets تلقائياً، مع إمكانية تخصيصها من خلال الإعدادات
 */

// تهيئة وحدة نماذج الموظفين الديناميكية
window.HR = window.HR || {};
window.HR.DynamicForms = {};

// إعدادات تخصيص الحقول (تُخزن في localStorage)
window.HR.DynamicForms.fieldSettings = {
    // استرجاع إعدادات الحقول من localStorage أو استخدام الإعدادات الافتراضية
    getFieldSettings: function() {
        try {
            const storedSettings = localStorage.getItem('hr_field_settings');
            return storedSettings ? JSON.parse(storedSettings) : { hiddenFields: [] };
        } catch (e) {
            console.error('Error loading field settings:', e);
            return { hiddenFields: [] };
        }
    },
    
    // حفظ إعدادات الحقول في localStorage
    saveFieldSettings: function(settings) {
        try {
            localStorage.setItem('hr_field_settings', JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Error saving field settings:', e);
            return false;
        }
    },
    
    // التحقق مما إذا كان الحقل مخفياً
    isFieldHidden: function(fieldName) {
        const settings = this.getFieldSettings();
        return settings.hiddenFields.includes(fieldName);
    },
    
    // إخفاء حقل
    hideField: function(fieldName) {
        const settings = this.getFieldSettings();
        if (!settings.hiddenFields.includes(fieldName)) {
            settings.hiddenFields.push(fieldName);
            this.saveFieldSettings(settings);
        }
    },
    
    // إظهار حقل
    showField: function(fieldName) {
        const settings = this.getFieldSettings();
        settings.hiddenFields = settings.hiddenFields.filter(f => f !== fieldName);
        this.saveFieldSettings(settings);
    },
    
    // الحصول على قائمة الحقول المخفية
    getHiddenFields: function() {
        return this.getFieldSettings().hiddenFields;
    }
};

/**
 * إنشاء نموذج الموظف الديناميكي
 * @param {string} mode - وضع النموذج (add/edit)
 * @param {string} employeeId - معرف الموظف (في حالة التعديل)
 * @param {HTMLElement} container - عنصر الحاوية للنموذج
 */
window.HR.DynamicForms.createEmployeeForm = function(mode, employeeId, container) {
    if (!container) {
        console.error('Form container not provided');
        return;
    }
    
    // الحصول على بيانات الموظف (في حالة التعديل)
    let employee = null;
    if (mode === 'edit' && employeeId) {
        employee = window.HR.findEmployeeById(employeeId);
        if (!employee) {
            console.error(`Employee with ID ${employeeId} not found`);
            return;
        }
    }
    
    // الحصول على الحقول الديناميكية
    const dynamicFields = window.HR.DynamicData.getDynamicFields();
    
    // الحصول على قائمة الحقول المخفية
    const hiddenFields = window.HR.DynamicForms.fieldSettings.getHiddenFields();
    
    // إنشاء النموذج
    const form = document.createElement('form');
    form.id = 'employeeForm';
    form.className = 'needs-validation';
    form.noValidate = true;
    
    // إضافة حقل مخفي لمعرف الموظف (في حالة التعديل)
    if (mode === 'edit' && employee) {
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = employee.id;
        form.appendChild(idInput);
    }
    
    // إنشاء الأقسام الرئيسية للنموذج
    const basicInfoSection = createFormSection('معلومات أساسية');
    const jobInfoSection = createFormSection('معلومات الوظيفة');
    const dynamicInfoSection = createFormSection('معلومات إضافية');
    
    // إضافة الحقول الأساسية
    
    // قسم المعلومات الأساسية
    basicInfoSection.appendChild(createFormRow([
        createFormField('name', 'الاسم', 'text', employee?.name || '', true),
        createFormField('id', 'رقم الموظف', 'text', employee?.id || generateEmployeeId(), true)
    ]));
    
    basicInfoSection.appendChild(createFormRow([
        createFormField('email', 'البريد الإلكتروني', 'email', employee?.email || '', true),
        createFormField('nationality', 'الجنسية', 'text', employee?.nationality || '', false)
    ]));
    
    // قسم معلومات الوظيفة
    jobInfoSection.appendChild(createFormRow([
        createDepartmentSelect('department', 'القسم', employee?.department || '', true),
        createJobTitleSelect('jobTitle', 'المسمى الوظيفي', employee?.jobTitle || '', true)
    ]));
    
    jobInfoSection.appendChild(createFormRow([
        createLocationSelect('location', 'الموقع', employee?.location || '', true),
        createStatusSelect('status', 'الحالة', employee?.status || 'active', true)
    ]));
    
    jobInfoSection.appendChild(createFormRow([
        createFormField('startDate', 'تاريخ البدء', 'date', employee?.startDate || '', true),
        createFormField('endDate', 'تاريخ الانتهاء', 'date', employee?.endDate || '', false)
    ]));
    
    // إضافة حقل الملاحظات
    const notesRow = createFormRow([
        createFormField('notes', 'ملاحظات', 'textarea', employee?.notes || '', false)
    ]);
    jobInfoSection.appendChild(notesRow);
    
    // إضافة الحقول الديناميكية
    let dynamicFieldsAdded = 0;
    
    // تجميع الحقول الديناميكية في صفوف من عنصرين
    const dynamicFieldPairs = [];
    let currentPair = [];
    
    dynamicFields.forEach(field => {
        // تجاهل الحقول الأساسية التي تمت إضافتها بالفعل
        if (field.isCore) return;
        
        // تجاهل الحقول المخفية
        if (hiddenFields.includes(field.normalizedName)) return;
        
        // الحصول على قيمة الحقل (إذا كانت موجودة)
        const fieldValue = employee?.dynamicFields?.[field.normalizedName] || '';
        
        // إنشاء عنصر الحقل المناسب حسب نوع البيانات
        const formField = createDynamicFormField(field, fieldValue);
        
        // إضافة الحقل إلى الزوج الحالي
        currentPair.push(formField);
        
        // إذا اكتمل الزوج، أضفه إلى القائمة وابدأ زوجاً جديداً
        if (currentPair.length === 2) {
            dynamicFieldPairs.push([...currentPair]);
            currentPair = [];
        }
        
        dynamicFieldsAdded++;
    });
    
    // إذا كان هناك عنصر متبقي في الزوج الحالي، أضفه إلى القائمة
    if (currentPair.length > 0) {
        dynamicFieldPairs.push([...currentPair]);
    }
    
    // إضافة أزواج الحقول الديناميكية إلى القسم
    dynamicFieldPairs.forEach(pair => {
        dynamicInfoSection.appendChild(createFormRow(pair));
    });
    
    // إضافة الأقسام إلى النموذج
    form.appendChild(basicInfoSection);
    form.appendChild(jobInfoSection);
    
    // إضافة قسم المعلومات الإضافية فقط إذا كانت هناك حقول ديناميكية
    if (dynamicFieldsAdded > 0) {
        form.appendChild(dynamicInfoSection);
    }
    
    // إضافة أزرار الإجراءات
    const actionsRow = document.createElement('div');
    actionsRow.className = 'row mt-4';
    
    const actionsCol = document.createElement('div');
    actionsCol.className = 'col-12 text-center';
    
    // زر الحفظ
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'btn btn-primary mx-2';
    saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ';
    actionsCol.appendChild(saveButton);
    
    // زر الإلغاء
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary mx-2';
    cancelButton.innerHTML = '<i class="fas fa-times"></i> إلغاء';
    cancelButton.addEventListener('click', function() {
        window.HR.closeEmployeeForm();
    });
    actionsCol.appendChild(cancelButton);
    
    actionsRow.appendChild(actionsCol);
    form.appendChild(actionsRow);
    
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
        const formData = new FormData(form);
        const employeeData = {
            name: formData.get('name'),
            id: formData.get('id'),
            email: formData.get('email'),
            department: formData.get('department'),
            jobTitle: formData.get('jobTitle'),
            location: formData.get('location'),
            nationality: formData.get('nationality'),
            status: formData.get('status'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            notes: formData.get('notes'),
            dynamicFields: {}
        };
        
        // إضافة الحقول الديناميكية
        dynamicFields.forEach(field => {
            if (!field.isCore && !hiddenFields.includes(field.normalizedName)) {
                const fieldName = `dynamic_${field.normalizedName}`;
                let fieldValue = formData.get(fieldName);
                
                // تحويل القيمة حسب نوع الحقل
                if (field.type === window.HR.DynamicData.FIELD_TYPES.NUMBER && fieldValue) {
                    fieldValue = parseFloat(fieldValue);
                } else if (field.type === window.HR.DynamicData.FIELD_TYPES.BOOLEAN) {
                    fieldValue = fieldValue === 'true';
                }
                
                employeeData.dynamicFields[field.normalizedName] = fieldValue;
            }
        });
        
        // حفظ البيانات
        if (mode === 'edit') {
            window.HR.updateEmployee(employeeData);
        } else {
            window.HR.addEmployee(employeeData);
        }
        
        // إغلاق النموذج
        window.HR.closeEmployeeForm();
    });
    
    // إضافة النموذج إلى الحاوية
    container.innerHTML = '';
    container.appendChild(form);
};

/**
 * إنشاء قسم في النموذج
 * @param {string} title - عنوان القسم
 * @returns {HTMLElement} - عنصر القسم
 */
function createFormSection(title) {
    const section = document.createElement('div');
    section.className = 'form-section mb-4';
    
    const sectionTitle = document.createElement('h5');
    sectionTitle.className = 'form-section-title mb-3';
    sectionTitle.textContent = title;
    
    section.appendChild(sectionTitle);
    return section;
}

/**
 * إنشاء صف في النموذج
 * @param {Array} fields - عناصر الحقول في الصف
 * @returns {HTMLElement} - عنصر الصف
 */
function createFormRow(fields) {
    const row = document.createElement('div');
    row.className = 'row mb-3';
    
    fields.forEach(field => {
        const col = document.createElement('div');
        col.className = fields.length > 1 ? 'col-md-6' : 'col-md-12';
        col.appendChild(field);
        row.appendChild(col);
    });
    
    return row;
}

/**
 * إنشاء حقل في النموذج
 * @param {string} name - اسم الحقل
 * @param {string} label - تسمية الحقل
 * @param {string} type - نوع الحقل
 * @param {string} value - قيمة الحقل
 * @param {boolean} required - ما إذا كان الحقل إلزامياً
 * @returns {HTMLElement} - عنصر الحقل
 */
function createFormField(name, label, type, value, required) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = name;
    labelElement.className = 'form-label';
    labelElement.textContent = label;
    if (required) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'text-danger';
        requiredSpan.textContent = ' *';
        labelElement.appendChild(requiredSpan);
    }
    formGroup.appendChild(labelElement);
    
    let inputElement;
    
    if (type === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.rows = 3;
    } else {
        inputElement = document.createElement('input');
        inputElement.type = type;
    }
    
    inputElement.id = name;
    inputElement.name = name;
    inputElement.className = 'form-control';
    inputElement.value = value;
    inputElement.required = required;
    
    formGroup.appendChild(inputElement);
    
    if (required) {
        const invalidFeedback = document.createElement('div');
        invalidFeedback.className = 'invalid-feedback';
        invalidFeedback.textContent = `يرجى إدخال ${label}`;
        formGroup.appendChild(invalidFeedback);
    }
    
    return formGroup;
}

/**
 * إنشاء حقل ديناميكي في النموذج
 * @param {Object} field - معلومات الحقل الديناميكي
 * @param {string} value - قيمة الحقل
 * @returns {HTMLElement} - عنصر الحقل
 */
function createDynamicFormField(field, value) {
    const fieldName = `dynamic_${field.normalizedName}`;
    const fieldLabel = formatFieldLabel(field.originalName);
    
    // تحديد نوع الحقل المناسب
    let fieldType = 'text';
    let fieldOptions = null;
    
    switch (field.type) {
        case window.HR.DynamicData.FIELD_TYPES.NUMBER:
            fieldType = 'number';
            break;
        case window.HR.DynamicData.FIELD_TYPES.DATE:
            fieldType = 'date';
            break;
        case window.HR.DynamicData.FIELD_TYPES.BOOLEAN:
            fieldType = 'select';
            fieldOptions = [
                { value: 'true', label: 'نعم' },
                { value: 'false', label: 'لا' }
            ];
            break;
    }
    
    // إنشاء الحقل المناسب
    if (fieldType === 'select' && fieldOptions) {
        return createSelectField(fieldName, fieldLabel, fieldOptions, value, false);
    } else {
        return createFormField(fieldName, fieldLabel, fieldType, value, false);
    }
}

/**
 * إنشاء حقل قائمة منسدلة
 * @param {string} name - اسم الحقل
 * @param {string} label - تسمية الحقل
 * @param {Array} options - خيارات القائمة
 * @param {string} value - القيمة المحددة
 * @param {boolean} required - ما إذا كان الحقل إلزامياً
 * @returns {HTMLElement} - عنصر القائمة المنسدلة
 */
function createSelectField(name, label, options, value, required) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = name;
    labelElement.className = 'form-label';
    labelElement.textContent = label;
    if (required) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'text-danger';
        requiredSpan.textContent = ' *';
        labelElement.appendChild(requiredSpan);
    }
    formGroup.appendChild(labelElement);
    
    const selectElement = document.createElement('select');
    selectElement.id = name;
    selectElement.name = name;
    selectElement.className = 'form-select';
    selectElement.required = required;
    
    // إضافة خيار فارغ إذا لم يكن الحقل إلزامياً
    if (!required) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'اختر...';
        selectElement.appendChild(emptyOption);
    }
    
    // إضافة الخيارات
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        if (option.value === value) {
            optionElement.selected = true;
        }
        selectElement.appendChild(optionElement);
    });
    
    formGroup.appendChild(selectElement);
    
    if (required) {
        const invalidFeedback = document.createElement('div');
        invalidFeedback.className = 'invalid-feedback';
        invalidFeedback.textContent = `يرجى اختيار ${label}`;
        formGroup.appendChild(invalidFeedback);
    }
    
    return formGroup;
}

/**
 * إنشاء قائمة منسدلة للأقسام
 * @param {string} name - اسم الحقل
 * @param {string} label - تسمية الحقل
 * @param {string} value - القيمة المحددة
 * @param {boolean} required - ما إذا كان الحقل إلزامياً
 * @returns {HTMLElement} - عنصر القائمة المنسدلة
 */
function createDepartmentSelect(name, label, value, required) {
    const departments = window.HR.getDepartments();
    const options = departments.map(dept => ({ value: dept, label: dept }));
    return createSelectField(name, label, options, value, required);
}

/**
 * إنشاء قائمة منسدلة للمسميات الوظيفية
 * @param {string} name - اسم الحقل
 * @param {string} label - تسمية الحقل
 * @param {string} value - القيمة المحددة
 * @param {boolean} required - ما إذا كان الحقل إلزامياً
 * @returns {HTMLElement} - عنصر القائمة المنسدلة
 */
function createJobTitleSelect(name, label, value, required) {
    const jobTitles = window.HR.getJobTitles();
    const options = jobTitles.map(title => ({ value: title, label: title }));
    return createSelectField(name, label, options, value, required);
}

/**
 * إنشاء قائمة منسدلة للمواقع
 * @param {string} name - اسم الحقل
 * @param {string} label - تسمية الحقل
 * @param {string} value - القيمة المحددة
 * @param {boolean} required - ما إذا كان الحقل إلزامياً
 * @returns {HTMLElement} - عنصر القائمة المنسدلة
 */
function createLocationSelect(name, label, value, required) {
    const locations = window.HR.getLocations();
    const options = locations.map(loc => ({ value: loc, label: loc }));
    return createSelectField(name, label, options, value, required);
}

/**
 * إنشاء قائمة منسدلة للحالة
 * @param {string} name - اسم الحقل
 * @param {string} label - تسمية الحقل
 * @param {string} value - القيمة المحددة
 * @param {boolean} required - ما إذا كان الحقل إلزامياً
 * @returns {HTMLElement} - عنصر القائمة المنسدلة
 */
function createStatusSelect(name, label, value, required) {
    const options = [
        { value: 'active', label: 'نشط' },
        { value: 'inactive', label: 'غير نشط' }
    ];
    return createSelectField(name, label, options, value, required);
}

/**
 * تنسيق تسمية الحقل للعرض
 * @param {string} fieldName - اسم الحقل الأصلي
 * @returns {string} - تسمية الحقل المنسقة
 */
function formatFieldLabel(fieldName) {
    // استبدال الشرطة السفلية بمسافة
    let label = fieldName.replace(/_/g, ' ');
    
    // تحويل الحرف الأول من كل كلمة إلى حرف كبير (للإنجليزية فقط)
    if (/^[\u0000-\u007F]+$/.test(label)) { // التحقق من أن النص إنجليزي فقط
        label = label.replace(/\b\w/g, char => char.toUpperCase());
    }
    
    return label;
}

/**
 * إنشاء معرف موظف جديد
 * @returns {string} - معرف الموظف الجديد
 */
function generateEmployeeId() {
    return 'EMP' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

/**
 * إنشاء واجهة إدارة الحقول في الإعدادات
 * @param {HTMLElement} container - عنصر الحاوية
 */
window.HR.DynamicForms.createFieldManagementUI = function(container) {
    if (!container) {
        console.error('Field management container not provided');
        return;
    }
    
    // الحصول على الحقول الديناميكية
    const dynamicFields = window.HR.DynamicData.getDynamicFields();
    
    // الحصول على قائمة الحقول المخفية
    const hiddenFields = window.HR.DynamicForms.fieldSettings.getHiddenFields();
    
    // إنشاء العنوان
    const title = document.createElement('h4');
    title.className = 'mt-4 mb-3';
    title.textContent = 'إدارة الحقول الديناميكية';
    container.appendChild(title);
    
    // إنشاء الوصف
    const description = document.createElement('p');
    description.textContent = 'يمكنك تخصيص الحقول الديناميكية التي تظهر في النظام. حدد الحقول التي تريد إظهارها أو إخفاءها.';
    container.appendChild(description);
    
    // إنشاء جدول الحقول
    const table = document.createElement('table');
    table.className = 'table table-striped table-hover';
    
    // إنشاء رأس الجدول
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'اسم الحقل';
    headerRow.appendChild(nameHeader);
    
    const typeHeader = document.createElement('th');
    typeHeader.textContent = 'نوع الحقل';
    headerRow.appendChild(typeHeader);
    
    const visibilityHeader = document.createElement('th');
    visibilityHeader.textContent = 'الحالة';
    headerRow.appendChild(visibilityHeader);
    
    const actionsHeader = document.createElement('th');
    actionsHeader.textContent = 'الإجراءات';
    headerRow.appendChild(actionsHeader);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // إنشاء جسم الجدول
    const tbody = document.createElement('tbody');
    
    // إضافة صفوف الحقول الديناميكية
    dynamicFields.forEach(field => {
        // تجاهل الحقول الأساسية
        if (field.isCore) return;
        
        const row = document.createElement('tr');
        
        // خلية اسم الحقل
        const nameCell = document.createElement('td');
        nameCell.textContent = formatFieldLabel(field.originalName);
        row.appendChild(nameCell);
        
        // خلية نوع الحقل
        const typeCell = document.createElement('td');
        typeCell.textContent = getFieldTypeLabel(field.type);
        row.appendChild(typeCell);
        
        // خلية الحالة
        const visibilityCell = document.createElement('td');
        const isHidden = hiddenFields.includes(field.normalizedName);
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge ${isHidden ? 'bg-danger' : 'bg-success'}`;
        statusBadge.textContent = isHidden ? 'مخفي' : 'ظاهر';
        visibilityCell.appendChild(statusBadge);
        row.appendChild(visibilityCell);
        
        // خلية الإجراءات
        const actionsCell = document.createElement('td');
        const toggleButton = document.createElement('button');
        toggleButton.className = `btn btn-sm ${isHidden ? 'btn-success' : 'btn-danger'}`;
        toggleButton.textContent = isHidden ? 'إظهار' : 'إخفاء';
        toggleButton.addEventListener('click', function() {
            if (isHidden) {
                window.HR.DynamicForms.fieldSettings.showField(field.normalizedName);
            } else {
                window.HR.DynamicForms.fieldSettings.hideField(field.normalizedName);
            }
            
            // تحديث واجهة إدارة الحقول
            window.HR.DynamicForms.createFieldManagementUI(container);
        });
        actionsCell.appendChild(toggleButton);
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // إضافة زر إعادة تعيين الإعدادات
    const resetButton = document.createElement('button');
    resetButton.className = 'btn btn-warning mt-3';
    resetButton.textContent = 'إعادة تعيين جميع الحقول';
    resetButton.addEventListener('click', function() {
        if (confirm('هل أنت متأكد من إعادة تعيين جميع إعدادات الحقول؟')) {
            window.HR.DynamicForms.fieldSettings.saveFieldSettings({ hiddenFields: [] });
            window.HR.DynamicForms.createFieldManagementUI(container);
        }
    });
    container.appendChild(resetButton);
};

/**
 * الحصول على تسمية نوع الحقل
 * @param {string} type - نوع الحقل
 * @returns {string} - تسمية نوع الحقل
 */
function getFieldTypeLabel(type) {
    const FIELD_TYPES = window.HR.DynamicData.FIELD_TYPES;
    
    switch (type) {
        case FIELD_TYPES.TEXT:
            return 'نص';
        case FIELD_TYPES.NUMBER:
            return 'رقم';
        case FIELD_TYPES.DATE:
            return 'تاريخ';
        case FIELD_TYPES.BOOLEAN:
            return 'نعم/لا';
        default:
            return 'غير معروف';
    }
}

/**
 * إنشاء واجهة إدارة الإحصائيات في الإعدادات
 * @param {HTMLElement} container - عنصر الحاوية
 */
window.HR.DynamicForms.createStatsManagementUI = function(container) {
    if (!container) {
        console.error('Stats management container not provided');
        return;
    }
    
    // الحصول على الحقول الديناميكية غير الأساسية
    const nonCoreFields = window.HR.DynamicData.getNonCoreFields();
    
    // الحصول على إعدادات الإحصائيات
    const statsSettings = getStatsSettings();
    
    // إنشاء العنوان
    const title = document.createElement('h4');
    title.className = 'mt-4 mb-3';
    title.textContent = 'إدارة الإحصائيات';
    container.appendChild(title);
    
    // إنشاء الوصف
    const description = document.createElement('p');
    description.textContent = 'يمكنك تخصيص الحقول التي تريد عرض إحصائيات لها في لوحة المعلومات.';
    container.appendChild(description);
    
    // إنشاء جدول الحقول
    const table = document.createElement('table');
    table.className = 'table table-striped table-hover';
    
    // إنشاء رأس الجدول
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'اسم الحقل';
    headerRow.appendChild(nameHeader);
    
    const typeHeader = document.createElement('th');
    typeHeader.textContent = 'نوع الحقل';
    headerRow.appendChild(typeHeader);
    
    const statsHeader = document.createElement('th');
    statsHeader.textContent = 'الإحصائيات';
    headerRow.appendChild(statsHeader);
    
    const actionsHeader = document.createElement('th');
    actionsHeader.textContent = 'الإجراءات';
    headerRow.appendChild(actionsHeader);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // إنشاء جسم الجدول
    const tbody = document.createElement('tbody');
    
    // إضافة صفوف الحقول الديناميكية
    nonCoreFields.forEach(field => {
        const row = document.createElement('tr');
        
        // خلية اسم الحقل
        const nameCell = document.createElement('td');
        nameCell.textContent = formatFieldLabel(field.originalName);
        row.appendChild(nameCell);
        
        // خلية نوع الحقل
        const typeCell = document.createElement('td');
        typeCell.textContent = getFieldTypeLabel(field.type);
        row.appendChild(typeCell);
        
        // خلية الإحصائيات
        const statsCell = document.createElement('td');
        const isEnabled = statsSettings.enabledFields.includes(field.normalizedName);
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge ${isEnabled ? 'bg-success' : 'bg-danger'}`;
        statusBadge.textContent = isEnabled ? 'ممكّنة' : 'معطّلة';
        statsCell.appendChild(statusBadge);
        row.appendChild(statsCell);
        
        // خلية الإجراءات
        const actionsCell = document.createElement('td');
        const toggleButton = document.createElement('button');
        toggleButton.className = `btn btn-sm ${isEnabled ? 'btn-danger' : 'btn-success'}`;
        toggleButton.textContent = isEnabled ? 'تعطيل' : 'تمكين';
        toggleButton.addEventListener('click', function() {
            if (isEnabled) {
                // تعطيل الإحصائيات
                statsSettings.enabledFields = statsSettings.enabledFields.filter(f => f !== field.normalizedName);
            } else {
                // تمكين الإحصائيات
                statsSettings.enabledFields.push(field.normalizedName);
            }
            
            // حفظ الإعدادات
            saveStatsSettings(statsSettings);
            
            // تحديث واجهة إدارة الإحصائيات
            window.HR.DynamicForms.createStatsManagementUI(container);
            
            // تحديث لوحة المعلومات
            window.HR.refreshDashboard();
        });
        actionsCell.appendChild(toggleButton);
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // إضافة زر إعادة تعيين الإعدادات
    const resetButton = document.createElement('button');
    resetButton.className = 'btn btn-warning mt-3';
    resetButton.textContent = 'تمكين جميع الإحصائيات';
    resetButton.addEventListener('click', function() {
        if (confirm('هل أنت متأكد من تمكين جميع الإحصائيات؟')) {
            // تمكين جميع الحقول
            const allFields = nonCoreFields.map(field => field.normalizedName);
            saveStatsSettings({ enabledFields: allFields });
            
            // تحديث واجهة إدارة الإحصائيات
            window.HR.DynamicForms.createStatsManagementUI(container);
            
            // تحديث لوحة المعلومات
            window.HR.refreshDashboard();
        }
    });
    container.appendChild(resetButton);
};

/**
 * الحصول على إعدادات الإحصائيات
 * @returns {Object} - إعدادات الإحصائيات
 */
function getStatsSettings() {
    try {
        const storedSettings = localStorage.getItem('hr_stats_settings');
        return storedSettings ? JSON.parse(storedSettings) : { enabledFields: [] };
    } catch (e) {
        console.error('Error loading stats settings:', e);
        return { enabledFields: [] };
    }
}

/**
 * حفظ إعدادات الإحصائيات
 * @param {Object} settings - إعدادات الإحصائيات
 * @returns {boolean} - نجاح العملية
 */
function saveStatsSettings(settings) {
    try {
        localStorage.setItem('hr_stats_settings', JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('Error saving stats settings:', e);
        return false;
    }
}

/**
 * الحصول على الحقول الممكّنة للإحصائيات
 * @returns {Array} - قائمة الحقول الممكّنة للإحصائيات
 */
window.HR.DynamicForms.getEnabledStatsFields = function() {
    const statsSettings = getStatsSettings();
    return statsSettings.enabledFields;
};

// إضافة CSS للنماذج الديناميكية
function addDynamicFormStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .form-section {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
        }
        
        .form-section-title {
            color: #495057;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
    `;
    document.head.appendChild(styleElement);
}

// إضافة الأنماط عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', addDynamicFormStyles);

console.log('✅ Dynamic Forms Module Loaded');
