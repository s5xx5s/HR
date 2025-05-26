// ===============================
// تحديث الإحصائيات والرسوم البيانية للحقول الديناميكية
// ===============================

/**
 * تحديث الإحصائيات والرسوم البيانية للحقول الديناميكية
 * 
 * هذا الكود يقوم بتحديث الإحصائيات ولوحة البيانات بحيث تدعم الحقول الديناميكية
 * وتخصيص الإحصائيات من الإعدادات
 */

// تهيئة وحدة الإحصائيات الديناميكية
window.HR = window.HR || {};
window.HR.DynamicStats = {};

/**
 * إنشاء لوحة المعلومات الديناميكية
 * @param {Array} employees - قائمة الموظفين
 * @param {HTMLElement} container - عنصر الحاوية
 */
window.HR.DynamicStats.createDynamicDashboard = function(employees, container) {
    if (!container) {
        console.error('Dashboard container not provided');
        return;
    }
    
    // مسح المحتوى الحالي
    container.innerHTML = '';
    
    // إنشاء العنوان
    const title = document.createElement('h3');
    title.className = 'mb-4 text-center';
    title.textContent = 'لوحة المعلومات';
    container.appendChild(title);
    
    // إنشاء صف البطاقات الرئيسية
    const mainStatsRow = document.createElement('div');
    mainStatsRow.className = 'row mb-4';
    
    // إضافة البطاقات الرئيسية
    mainStatsRow.appendChild(createStatCard('إجمالي الموظفين', employees.length, 'fa-users', 'primary'));
    
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    mainStatsRow.appendChild(createStatCard('الموظفين النشطين', activeEmployees, 'fa-user-check', 'success'));
    
    const inactiveEmployees = employees.filter(emp => emp.status !== 'active').length;
    mainStatsRow.appendChild(createStatCard('الموظفين غير النشطين', inactiveEmployees, 'fa-user-times', 'danger'));
    
    container.appendChild(mainStatsRow);
    
    // إنشاء صف الرسوم البيانية الرئيسية
    const mainChartsRow = document.createElement('div');
    mainChartsRow.className = 'row mb-4';
    
    // إضافة رسم بياني توزيع الأقسام
    const departmentChartCol = document.createElement('div');
    departmentChartCol.className = 'col-md-6 mb-4';
    departmentChartCol.appendChild(createChartCard('توزيع الموظفين حسب القسم', 'departmentChart'));
    mainChartsRow.appendChild(departmentChartCol);
    
    // إضافة رسم بياني توزيع المواقع
    const locationChartCol = document.createElement('div');
    locationChartCol.className = 'col-md-6 mb-4';
    locationChartCol.appendChild(createChartCard('توزيع الموظفين حسب الموقع', 'locationChart'));
    mainChartsRow.appendChild(locationChartCol);
    
    container.appendChild(mainChartsRow);
    
    // إنشاء رسوم بيانية للحقول الديناميكية
    createDynamicFieldsCharts(employees, container);
    
    // تهيئة الرسوم البيانية بعد إضافتها للصفحة
    setTimeout(() => {
        initializeCharts(employees);
    }, 0);
};

/**
 * إنشاء بطاقة إحصائية
 * @param {string} title - عنوان البطاقة
 * @param {number} value - قيمة الإحصائية
 * @param {string} icon - أيقونة البطاقة
 * @param {string} color - لون البطاقة
 * @returns {HTMLElement} - عنصر البطاقة
 */
function createStatCard(title, value, icon, color) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    const card = document.createElement('div');
    card.className = `card border-${color} h-100`;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body text-center';
    
    const iconElement = document.createElement('div');
    iconElement.className = 'mb-3';
    iconElement.innerHTML = `<i class="fas ${icon} fa-3x text-${color}"></i>`;
    
    const valueElement = document.createElement('h2');
    valueElement.className = `text-${color}`;
    valueElement.textContent = value;
    
    const titleElement = document.createElement('div');
    titleElement.className = 'text-muted';
    titleElement.textContent = title;
    
    cardBody.appendChild(iconElement);
    cardBody.appendChild(valueElement);
    cardBody.appendChild(titleElement);
    
    card.appendChild(cardBody);
    col.appendChild(card);
    
    return col;
}

/**
 * إنشاء بطاقة رسم بياني
 * @param {string} title - عنوان البطاقة
 * @param {string} chartId - معرف عنصر الرسم البياني
 * @returns {HTMLElement} - عنصر البطاقة
 */
function createChartCard(title, chartId) {
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.textContent = title;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const canvas = document.createElement('canvas');
    canvas.id = chartId;
    
    cardBody.appendChild(canvas);
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    
    return card;
}

/**
 * إنشاء رسوم بيانية للحقول الديناميكية
 * @param {Array} employees - قائمة الموظفين
 * @param {HTMLElement} container - عنصر الحاوية
 */
function createDynamicFieldsCharts(employees, container) {
    // الحصول على الحقول الديناميكية غير الأساسية
    const nonCoreFields = window.HR.DynamicData.getNonCoreFields();
    
    // الحصول على الحقول الممكّنة للإحصائيات
    const enabledFields = window.HR.DynamicForms.getEnabledStatsFields();
    
    // تصفية الحقول حسب الإعدادات
    const filteredFields = nonCoreFields.filter(field => 
        enabledFields.includes(field.normalizedName));
    
    if (filteredFields.length === 0) {
        return;
    }
    
    // إنشاء عنوان قسم الإحصائيات الديناميكية
    const dynamicTitle = document.createElement('h4');
    dynamicTitle.className = 'mt-4 mb-3';
    dynamicTitle.textContent = 'إحصائيات الحقول الديناميكية';
    container.appendChild(dynamicTitle);
    
    // إنشاء صف للرسوم البيانية الديناميكية
    const dynamicChartsRow = document.createElement('div');
    dynamicChartsRow.className = 'row';
    
    // إضافة رسوم بيانية للحقول الديناميكية
    filteredFields.forEach(field => {
        // إنشاء معرف فريد للرسم البياني
        const chartId = `chart-${field.normalizedName}`;
        
        // إنشاء عمود للرسم البياني
        const chartCol = document.createElement('div');
        chartCol.className = 'col-md-6 mb-4';
        
        // إنشاء بطاقة الرسم البياني
        const chartTitle = formatFieldLabel(field.originalName);
        chartCol.appendChild(createChartCard(chartTitle, chartId));
        
        // إضافة العمود إلى الصف
        dynamicChartsRow.appendChild(chartCol);
        
        // إضافة مهمة لتهيئة الرسم البياني
        setTimeout(() => {
            initializeDynamicFieldChart(employees, field, chartId);
        }, 0);
    });
    
    container.appendChild(dynamicChartsRow);
}

/**
 * تهيئة الرسوم البيانية
 * @param {Array} employees - قائمة الموظفين
 */
function initializeCharts(employees) {
    // التحقق من وجود Chart.js
    if (typeof Chart === 'undefined') {
        // تحميل Chart.js إذا لم يكن موجوداً
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => initializeCharts(employees);
        document.head.appendChild(script);
        return;
    }
    
    // تهيئة رسم بياني توزيع الأقسام
    initializeDepartmentChart(employees);
    
    // تهيئة رسم بياني توزيع المواقع
    initializeLocationChart(employees);
}

/**
 * تهيئة رسم بياني توزيع الأقسام
 * @param {Array} employees - قائمة الموظفين
 */
function initializeDepartmentChart(employees) {
    const canvas = document.getElementById('departmentChart');
    if (!canvas) return;
    
    // حساب توزيع الأقسام
    const departmentCounts = {};
    employees.forEach(employee => {
        const department = employee.department || 'غير محدد';
        departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    });
    
    // تحويل البيانات إلى تنسيق مناسب للرسم البياني
    const labels = Object.keys(departmentCounts);
    const data = Object.values(departmentCounts);
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateColors(labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
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

/**
 * تهيئة رسم بياني توزيع المواقع
 * @param {Array} employees - قائمة الموظفين
 */
function initializeLocationChart(employees) {
    const canvas = document.getElementById('locationChart');
    if (!canvas) return;
    
    // حساب توزيع المواقع
    const locationCounts = {};
    employees.forEach(employee => {
        const location = employee.location || 'غير محدد';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    
    // تحويل البيانات إلى تنسيق مناسب للرسم البياني
    const labels = Object.keys(locationCounts);
    const data = Object.values(locationCounts);
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد الموظفين',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * تهيئة رسم بياني لحقل ديناميكي
 * @param {Array} employees - قائمة الموظفين
 * @param {Object} field - معلومات الحقل
 * @param {string} chartId - معرف عنصر الرسم البياني
 */
function initializeDynamicFieldChart(employees, field, chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    // التحقق من وجود Chart.js
    if (typeof Chart === 'undefined') {
        // تحميل Chart.js إذا لم يكن موجوداً
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => initializeDynamicFieldChart(employees, field, chartId);
        document.head.appendChild(script);
        return;
    }
    
    // اختيار نوع الرسم البياني حسب نوع الحقل
    switch (field.type) {
        case window.HR.DynamicData.FIELD_TYPES.NUMBER:
            initializeNumberFieldChart(employees, field, canvas);
            break;
        case window.HR.DynamicData.FIELD_TYPES.TEXT:
            initializeTextFieldChart(employees, field, canvas);
            break;
        case window.HR.DynamicData.FIELD_TYPES.BOOLEAN:
            initializeBooleanFieldChart(employees, field, canvas);
            break;
        case window.HR.DynamicData.FIELD_TYPES.DATE:
            initializeDateFieldChart(employees, field, canvas);
            break;
    }
}

/**
 * تهيئة رسم بياني لحقل رقمي
 * @param {Array} employees - قائمة الموظفين
 * @param {Object} field - معلومات الحقل
 * @param {HTMLElement} canvas - عنصر الرسم البياني
 */
function initializeNumberFieldChart(employees, field, canvas) {
    // استخراج القيم الرقمية
    const values = employees
        .map(emp => emp.dynamicFields && emp.dynamicFields[field.normalizedName])
        .filter(val => val !== undefined && val !== null && val !== '' && !isNaN(val))
        .map(val => typeof val === 'number' ? val : parseFloat(val));
    
    if (values.length === 0) {
        showNoDataMessage(canvas);
        return;
    }
    
    // تحليل القيم لإنشاء فئات
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // تحديد عدد الفئات
    const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    
    // حساب عرض الفئة
    const binWidth = (max - min) / binCount;
    
    // إنشاء الفئات
    const bins = Array(binCount).fill(0);
    const binLabels = [];
    
    // إنشاء تسميات الفئات
    for (let i = 0; i < binCount; i++) {
        const binStart = min + i * binWidth;
        const binEnd = binStart + binWidth;
        binLabels.push(`${binStart.toFixed(1)} - ${binEnd.toFixed(1)}`);
    }
    
    // توزيع القيم على الفئات
    values.forEach(value => {
        // تحديد الفئة المناسبة
        const binIndex = Math.min(binCount - 1, Math.floor((value - min) / binWidth));
        bins[binIndex]++;
    });
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: formatFieldLabel(field.originalName),
                data: bins,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * تهيئة رسم بياني لحقل نصي
 * @param {Array} employees - قائمة الموظفين
 * @param {Object} field - معلومات الحقل
 * @param {HTMLElement} canvas - عنصر الرسم البياني
 */
function initializeTextFieldChart(employees, field, canvas) {
    // استخراج القيم النصية
    const values = employees
        .map(emp => emp.dynamicFields && emp.dynamicFields[field.normalizedName])
        .filter(val => val !== undefined && val !== null)
        .map(val => String(val).trim());
    
    if (values.length === 0) {
        showNoDataMessage(canvas);
        return;
    }
    
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
    
    // الحصول على أكثر 10 قيم شيوعاً
    const topValues = valueCountArray.slice(0, 10);
    
    // تحويل البيانات إلى تنسيق مناسب للرسم البياني
    const labels = topValues.map(item => item.value);
    const data = topValues.map(item => item.count);
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateColors(labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
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

/**
 * تهيئة رسم بياني لحقل منطقي
 * @param {Array} employees - قائمة الموظفين
 * @param {Object} field - معلومات الحقل
 * @param {HTMLElement} canvas - عنصر الرسم البياني
 */
function initializeBooleanFieldChart(employees, field, canvas) {
    // استخراج القيم المنطقية
    const values = employees
        .map(emp => emp.dynamicFields && emp.dynamicFields[field.normalizedName])
        .filter(val => val !== undefined && val !== null);
    
    if (values.length === 0) {
        showNoDataMessage(canvas);
        return;
    }
    
    // حساب عدد القيم الصحيحة والخاطئة
    const trueCount = values.filter(val => 
        val === true || val === 'true' || val === 1 || val === '1' || 
        val === 'yes' || val === 'نعم').length;
    
    const falseCount = values.length - trueCount;
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['نعم', 'لا'],
            datasets: [{
                data: [trueCount, falseCount],
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

/**
 * تهيئة رسم بياني لحقل تاريخ
 * @param {Array} employees - قائمة الموظفين
 * @param {Object} field - معلومات الحقل
 * @param {HTMLElement} canvas - عنصر الرسم البياني
 */
function initializeDateFieldChart(employees, field, canvas) {
    // استخراج قيم التاريخ
    const values = employees
        .map(emp => emp.dynamicFields && emp.dynamicFields[field.normalizedName])
        .filter(val => val !== undefined && val !== null && val !== '')
        .map(val => {
            try {
                return new Date(val);
            } catch (e) {
                return null;
            }
        })
        .filter(val => val instanceof Date && !isNaN(val));
    
    if (values.length === 0) {
        showNoDataMessage(canvas);
        return;
    }
    
    // تصنيف التواريخ حسب السنة
    const yearCounts = {};
    values.forEach(date => {
        const year = date.getFullYear();
        yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    // تحويل البيانات إلى تنسيق مناسب للرسم البياني
    const years = Object.keys(yearCounts).sort();
    const counts = years.map(year => yearCounts[year]);
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: formatFieldLabel(field.originalName),
                data: counts,
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

/**
 * عرض رسالة عدم وجود بيانات
 * @param {HTMLElement} canvas - عنصر الرسم البياني
 */
function showNoDataMessage(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.font = '16px Tajawal, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#999';
    ctx.fillText('لا توجد بيانات كافية', canvas.width / 2, canvas.height / 2);
}

/**
 * إنشاء ألوان عشوائية
 * @param {number} count - عدد الألوان المطلوبة
 * @returns {Array} - مصفوفة الألوان
 */
function generateColors(count) {
    const colors = [];
    const baseColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(40, 159, 64, 0.7)',
        'rgba(210, 199, 199, 0.7)'
    ];
    
    // استخدام الألوان الأساسية إذا كان العدد أقل من أو يساوي عدد الألوان الأساسية
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    // استخدام الألوان الأساسية وإنشاء ألوان إضافية
    colors.push(...baseColors);
    
    // إنشاء ألوان إضافية
    for (let i = baseColors.length; i < count; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
    }
    
    return colors;
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
 * تحديث لوحة المعلومات
 */
window.HR.refreshDashboard = function() {
    // الحصول على حاوية لوحة المعلومات
    const dashboardContainer = document.getElementById('dashboardContainer');
    if (!dashboardContainer) {
        console.error('Dashboard container not found');
        return;
    }
    
    // الحصول على قائمة الموظفين
    const employees = window.HR.getEmployees();
    
    // إنشاء لوحة المعلومات الديناميكية
    window.HR.DynamicStats.createDynamicDashboard(employees, dashboardContainer);
};

// إضافة CSS للإحصائيات الديناميكية
function addDynamicStatsStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .card {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        canvas {
            min-height: 250px;
        }
    `;
    document.head.appendChild(styleElement);
}

// إضافة الأنماط عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', addDynamicStatsStyles);

console.log('✅ Dynamic Statistics Module Loaded');
