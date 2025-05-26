// ===============================
// تحديث واجهة المستخدم لعرض الحقول الديناميكية
// ===============================

/**
 * تحديث واجهة المستخدم لدعم الحقول الديناميكية
 * 
 * هذا الكود يقوم بتحديث واجهة المستخدم لعرض الحقول الديناميكية
 * المكتشفة من Google Sheets تلقائياً
 */

// تهيئة وحدة واجهة المستخدم الديناميكية
window.HR = window.HR || {};
window.HR.DynamicUI = {};

/**
 * تحديث جدول الموظفين ليعرض الحقول الديناميكية
 * @param {Array} employees - قائمة الموظفين
 * @param {string} tableId - معرف عنصر الجدول
 */
window.HR.DynamicUI.updateEmployeeTable = function(employees, tableId = 'employeeTable') {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID ${tableId} not found`);
        return;
    }
    
    // الحصول على الحقول الديناميكية
    const dynamicFields = window.HR.DynamicData.getDynamicFields();
    
    // إنشاء رأس الجدول
    const thead = table.querySelector('thead') || document.createElement('thead');
    thead.innerHTML = ''; // مسح المحتوى الحالي
    
    const headerRow = document.createElement('tr');
    
    // إضافة الأعمدة الأساسية
    const coreColumns = [
        { id: 'name', label: 'الاسم' },
        { id: 'id', label: 'رقم الموظف' },
        { id: 'department', label: 'القسم' },
        { id: 'jobTitle', label: 'المسمى الوظيفي' },
        { id: 'location', label: 'الموقع' },
        { id: 'status', label: 'الحالة' }
    ];
    
    coreColumns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label;
        th.setAttribute('data-field', column.id);
        headerRow.appendChild(th);
    });
    
    // إضافة الأعمدة الديناميكية
    dynamicFields.forEach(field => {
        // تجاهل الحقول الأساسية التي تمت إضافتها بالفعل
        if (field.isCore) return;
        
        const th = document.createElement('th');
        th.textContent = formatFieldLabel(field.originalName);
        th.setAttribute('data-field', field.normalizedName);
        th.classList.add('dynamic-column');
        headerRow.appendChild(th);
    });
    
    // إضافة عمود الإجراءات
    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'الإجراءات';
    headerRow.appendChild(actionsTh);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // إنشاء جسم الجدول
    const tbody = table.querySelector('tbody') || document.createElement('tbody');
    tbody.innerHTML = ''; // مسح المحتوى الحالي
    
    // إضافة صفوف الموظفين
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', employee.id);
        
        // إضافة الخلايا الأساسية
        coreColumns.forEach(column => {
            const td = document.createElement('td');
            
            if (column.id === 'status') {
                // تنسيق خاص لعمود الحالة
                const statusClass = employee.status === 'active' ? 'status-active' : 'status-inactive';
                const statusText = employee.status === 'active' ? 'نشط' : 'غير نشط';
                td.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
            } else {
                td.textContent = employee[column.id] || '';
            }
            
            row.appendChild(td);
        });
        
        // إضافة الخلايا الديناميكية
        dynamicFields.forEach(field => {
            // تجاهل الحقول الأساسية التي تمت إضافتها بالفعل
            if (field.isCore) return;
            
            const td = document.createElement('td');
            const value = employee.dynamicFields && employee.dynamicFields[field.normalizedName];
            
            // تنسيق القيمة حسب نوع الحقل
            td.textContent = formatDynamicFieldValue(value, field.type);
            td.classList.add('dynamic-cell');
            row.appendChild(td);
        });
        
        // إضافة خلية الإجراءات
        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions-cell';
        actionsTd.innerHTML = `
            <button class="btn btn-sm btn-primary edit-btn" data-id="${employee.id}">
                <i class="fas fa-edit"></i> تعديل
            </button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${employee.id}">
                <i class="fas fa-trash"></i> حذف
            </button>
        `;
        row.appendChild(actionsTd);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // إضافة مستمعي الأحداث للأزرار
    addTableEventListeners(table);
};

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
 * تنسيق قيمة الحقل الديناميكي للعرض
 * @param {any} value - قيمة الحقل
 * @param {string} type - نوع الحقل
 * @returns {string} - القيمة المنسقة للعرض
 */
function formatDynamicFieldValue(value, type) {
    if (value === undefined || value === null || value === '') {
        return '';
    }
    
    const FIELD_TYPES = window.HR.DynamicData.FIELD_TYPES;
    
    switch (type) {
        case FIELD_TYPES.NUMBER:
            // تنسيق الأرقام مع فواصل الآلاف
            return typeof value === 'number' 
                ? value.toLocaleString('ar-SA')
                : value;
                
        case FIELD_TYPES.DATE:
            // تنسيق التاريخ
            try {
                const date = new Date(value);
                if (!isNaN(date)) {
                    return date.toLocaleDateString('ar-SA');
                }
            } catch (e) {}
            return value;
            
        case FIELD_TYPES.BOOLEAN:
            // تنسيق القيم المنطقية
            return value === true || value === 'true' || value === 1 ? 'نعم' : 'لا';
            
        default:
            return String(value);
    }
}

/**
 * إضافة مستمعي الأحداث لأزرار الجدول
 * @param {HTMLElement} table - عنصر الجدول
 */
function addTableEventListeners(table) {
    // أزرار التعديل
    const editButtons = table.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            window.HR.openEmployeeForm('edit', employeeId);
        });
    });
    
    // أزرار الحذف
    const deleteButtons = table.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
                window.HR.deleteEmployee(employeeId);
            }
        });
    });
}

/**
 * إنشاء بطاقات الإحصائيات الديناميكية
 * @param {Array} employees - قائمة الموظفين
 * @param {string} containerId - معرف عنصر الحاوية
 */
window.HR.DynamicUI.createDynamicStatCards = function(employees, containerId = 'dynamicStatsContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return;
    }
    
    // الحصول على الحقول الديناميكية غير الأساسية
    const nonCoreFields = window.HR.DynamicData.getNonCoreFields();
    
    // مسح المحتوى الحالي
    container.innerHTML = '';
    
    // إنشاء بطاقات الإحصائيات للحقول الرقمية
    const numericFields = nonCoreFields.filter(field => 
        field.type === window.HR.DynamicData.FIELD_TYPES.NUMBER);
    
    if (numericFields.length > 0) {
        const row = document.createElement('div');
        row.className = 'row mt-4';
        
        numericFields.forEach(field => {
            // حساب الإحصائيات
            const stats = calculateNumericStats(employees, field.normalizedName);
            
            // إنشاء بطاقة الإحصائيات
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title">${formatFieldLabel(field.originalName)}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <div class="stat-item">
                                    <span class="stat-label">المتوسط:</span>
                                    <span class="stat-value">${stats.average.toLocaleString('ar-SA')}</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <span class="stat-label">المجموع:</span>
                                    <span class="stat-value">${stats.sum.toLocaleString('ar-SA')}</span>
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-6">
                                <div class="stat-item">
                                    <span class="stat-label">الحد الأدنى:</span>
                                    <span class="stat-value">${stats.min.toLocaleString('ar-SA')}</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <span class="stat-label">الحد الأقصى:</span>
                                    <span class="stat-value">${stats.max.toLocaleString('ar-SA')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            row.appendChild(card);
        });
        
        container.appendChild(row);
    }
    
    // إنشاء بطاقات الإحصائيات للحقول النصية
    const textFields = nonCoreFields.filter(field => 
        field.type === window.HR.DynamicData.FIELD_TYPES.TEXT);
    
    if (textFields.length > 0) {
        const row = document.createElement('div');
        row.className = 'row mt-4';
        
        textFields.forEach(field => {
            // حساب الإحصائيات
            const stats = calculateTextStats(employees, field.normalizedName);
            
            // إنشاء بطاقة الإحصائيات
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title">${formatFieldLabel(field.originalName)}</h5>
                    </div>
                    <div class="card-body">
                        <div class="stat-item">
                            <span class="stat-label">القيم الفريدة:</span>
                            <span class="stat-value">${stats.uniqueCount}</span>
                        </div>
                        <div class="mt-3">
                            <h6>أكثر القيم شيوعاً:</h6>
                            <ul class="list-group">
                                ${stats.topValues.map(item => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        ${item.value || 'غير محدد'}
                                        <span class="badge bg-primary rounded-pill">${item.count}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            
            row.appendChild(card);
        });
        
        container.appendChild(row);
    }
    
    // إنشاء بطاقات الإحصائيات للحقول المنطقية
    const booleanFields = nonCoreFields.filter(field => 
        field.type === window.HR.DynamicData.FIELD_TYPES.BOOLEAN);
    
    if (booleanFields.length > 0) {
        const row = document.createElement('div');
        row.className = 'row mt-4';
        
        booleanFields.forEach(field => {
            // حساب الإحصائيات
            const stats = calculateBooleanStats(employees, field.normalizedName);
            
            // إنشاء بطاقة الإحصائيات
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            
            // إنشاء معرف فريد للرسم البياني
            const chartId = `chart-${field.normalizedName}-${Math.random().toString(36).substring(2, 8)}`;
            
            card.innerHTML = `
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title">${formatFieldLabel(field.originalName)}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <div class="stat-item">
                                    <span class="stat-label">نعم:</span>
                                    <span class="stat-value">${stats.trueCount} (${stats.truePercentage}%)</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <span class="stat-label">لا:</span>
                                    <span class="stat-value">${stats.falseCount} (${stats.falsePercentage}%)</span>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <canvas id="${chartId}" width="100" height="100"></canvas>
                        </div>
                    </div>
                </div>
            `;
            
            row.appendChild(card);
            
            // إضافة مهمة لإنشاء الرسم البياني بعد إضافة العنصر للصفحة
            setTimeout(() => {
                createPieChart(chartId, ['نعم', 'لا'], [stats.trueCount, stats.falseCount]);
            }, 0);
        });
        
        container.appendChild(row);
    }
};

/**
 * حساب الإحصائيات للحقول الرقمية
 * @param {Array} employees - قائمة الموظفين
 * @param {string} fieldName - اسم الحقل
 * @returns {Object} - الإحصائيات المحسوبة
 */
function calculateNumericStats(employees, fieldName) {
    // استخراج القيم الرقمية
    const values = employees
        .map(emp => emp.dynamicFields && emp.dynamicFields[fieldName])
        .filter(val => val !== undefined && val !== null && val !== '' && !isNaN(val))
        .map(val => typeof val === 'number' ? val : parseFloat(val));
    
    if (values.length === 0) {
        return { min: 0, max: 0, average: 0, sum: 0 };
    }
    
    // حساب الإحصائيات
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
        min,
        max,
        average,
        sum
    };
}

/**
 * حساب الإحصائيات للحقول النصية
 * @param {Array} employees - قائمة الموظفين
 * @param {string} fieldName - اسم الحقل
 * @returns {Object} - الإحصائيات المحسوبة
 */
function calculateTextStats(employees, fieldName) {
    // استخراج القيم النصية
    const values = employees
        .map(emp => emp.dynamicFields && emp.dynamicFields[fieldName])
        .filter(val => val !== undefined && val !== null)
        .map(val => String(val).trim());
    
    // حساب تكرار كل قيمة
    const valueCounts = {};
    values.forEach(val => {
        const value = val || 'غير محدد';
        valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    // تحويل إلى مصفوفة وترتيبها حسب التكرار
    const valueCountArray = Object.entries(valueCounts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    
    // الحصول على أكثر 5 قيم شيوعاً
    const topValues = valueCountArray.slice(0, 5);
    
    return {
        uniqueCount: Object.keys(valueCounts).length,
        topValues
    };
}

/**
 * حساب الإحصائيات للحقول المنطقية
 * @param {Array} employees - قائمة الموظفين
 * @param {string} fieldName - اسم الحقل
 * @returns {Object} - الإحصائيات المحسوبة
 */
function calculateBooleanStats(employees, fieldName) {
    // استخراج القيم المنطقية
    const values = employees
        .map(emp => emp.dynamicFields && emp.dynamicFields[fieldName])
        .filter(val => val !== undefined && val !== null);
    
    // حساب عدد القيم الصحيحة والخاطئة
    const trueCount = values.filter(val => 
        val === true || val === 'true' || val === 1 || val === '1' || 
        val === 'yes' || val === 'نعم').length;
    
    const falseCount = values.length - trueCount;
    
    // حساب النسب المئوية
    const total = values.length || 1; // تجنب القسمة على صفر
    const truePercentage = Math.round((trueCount / total) * 100);
    const falsePercentage = Math.round((falseCount / total) * 100);
    
    return {
        trueCount,
        falseCount,
        truePercentage,
        falsePercentage
    };
}

/**
 * إنشاء رسم بياني دائري
 * @param {string} chartId - معرف عنصر الرسم البياني
 * @param {Array} labels - تسميات البيانات
 * @param {Array} data - قيم البيانات
 */
function createPieChart(chartId, labels, data) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    // التحقق من وجود Chart.js
    if (typeof Chart === 'undefined') {
        // تحميل Chart.js إذا لم يكن موجوداً
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => createPieChart(chartId, labels, data);
        document.head.appendChild(script);
        return;
    }
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Tajawal, sans-serif'
                        }
                    }
                }
            }
        }
    });
}

// إضافة CSS للعناصر الديناميكية
function addDynamicStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .dynamic-column {
            background-color: rgba(0, 123, 255, 0.05);
        }
        
        .dynamic-cell {
            background-color: rgba(0, 123, 255, 0.02);
        }
        
        .stat-item {
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-weight: bold;
            color: #555;
        }
        
        .stat-value {
            font-size: 1.1em;
            color: #007bff;
        }
    `;
    document.head.appendChild(styleElement);
}

// إضافة الأنماط عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', addDynamicStyles);

console.log('✅ Dynamic UI Renderer Loaded');
