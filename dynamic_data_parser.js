// ===============================
// منطق قراءة البيانات الديناميكية من Google Sheets
// ===============================

/**
 * تحديث منطق قراءة البيانات ليدعم الحقول الديناميكية
 * 
 * هذا الكود يقوم بقراءة جميع الحقول من Google Sheets تلقائياً
 * ويدعم إضافة حقول جديدة دون الحاجة لتعديل الكود
 */

// تعريف الحقول الأساسية التي لا تدخل في الإحصائيات
const CORE_FIELDS = [
    'name', 'id', 'email', 'الاسم', 'رقم_الموظف', 'البريد_الإلكتروني',
    'Name', 'ID', 'Email'
];

// تعريف الحقول المعروفة مسبقاً (للتوافق مع النظام الحالي)
const KNOWN_FIELDS = {
    // الحقول الإنجليزية
    'name': 'name',
    'id': 'id',
    'email': 'email',
    'department': 'department',
    'jobTitle': 'jobTitle',
    'location': 'location',
    'nationality': 'nationality',
    'status': 'status',
    'startDate': 'startDate',
    'endDate': 'endDate',
    'notes': 'notes',
    
    // الحقول العربية
    'الاسم': 'name',
    'رقم_الموظف': 'id',
    'البريد_الإلكتروني': 'email',
    'القسم': 'department',
    'المسمى_الوظيفي': 'jobTitle',
    'الموقع': 'location',
    'الجنسية': 'nationality',
    'الحالة': 'status',
    'تاريخ_البدء': 'startDate',
    'تاريخ_الانتهاء': 'endDate',
    'ملاحظات': 'notes',
    
    // الحقول بتنسيق مختلف
    'Name': 'name',
    'ID': 'id',
    'Email': 'email',
    'Department': 'department',
    'Job Title': 'jobTitle',
    'Job title': 'jobTitle',
    'Location': 'location',
    'Nationality': 'nationality',
    'Status': 'status',
    'Start Date': 'startDate',
    'End Date': 'endDate',
    'Notes': 'notes',
    'Note': 'notes'
};

// قائمة الحقول الديناميكية المكتشفة
let dynamicFields = [];

// أنواع الحقول الديناميكية
const FIELD_TYPES = {
    TEXT: 'text',
    NUMBER: 'number',
    DATE: 'date',
    BOOLEAN: 'boolean'
};

/**
 * اكتشاف الحقول الديناميكية من البيانات
 * @param {Array} data - البيانات المستلمة من Google Sheets
 * @returns {Array} - قائمة الحقول الديناميكية المكتشفة
 */
function discoverDynamicFields(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    
    // جمع جميع الحقول الموجودة في البيانات
    const allFields = new Set();
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            allFields.add(key);
        });
    });
    
    // استبعاد الحقول المعروفة مسبقاً
    const discoveredFields = [];
    allFields.forEach(field => {
        if (!Object.keys(KNOWN_FIELDS).includes(field)) {
            // تحديد نوع الحقل
            const fieldType = determineFieldType(data, field);
            
            discoveredFields.push({
                originalName: field,
                normalizedName: normalizeFieldName(field),
                type: fieldType,
                isCore: CORE_FIELDS.includes(field)
            });
        }
    });
    
    return discoveredFields;
}

/**
 * تحديد نوع الحقل بناءً على قيمه
 * @param {Array} data - البيانات المستلمة من Google Sheets
 * @param {string} field - اسم الحقل
 * @returns {string} - نوع الحقل
 */
function determineFieldType(data, field) {
    // البحث عن أول قيمة غير فارغة للحقل
    for (const row of data) {
        const value = row[field];
        if (value !== undefined && value !== null && value !== '') {
            // التحقق من نوع القيمة
            if (!isNaN(value) && !isNaN(parseFloat(value))) {
                return FIELD_TYPES.NUMBER;
            }
            
            // التحقق من التاريخ
            if (isValidDate(value)) {
                return FIELD_TYPES.DATE;
            }
            
            // التحقق من القيمة المنطقية
            if (typeof value === 'boolean' || 
                value.toLowerCase() === 'true' || 
                value.toLowerCase() === 'false' ||
                value.toLowerCase() === 'yes' || 
                value.toLowerCase() === 'no' ||
                value.toLowerCase() === 'نعم' || 
                value.toLowerCase() === 'لا') {
                return FIELD_TYPES.BOOLEAN;
            }
            
            // افتراضياً، نوع النص
            return FIELD_TYPES.TEXT;
        }
    }
    
    // إذا لم يتم العثور على قيمة غير فارغة، افتراضياً نوع النص
    return FIELD_TYPES.TEXT;
}

/**
 * التحقق من صحة التاريخ
 * @param {string} value - القيمة المراد التحقق منها
 * @returns {boolean} - ما إذا كانت القيمة تاريخاً صالحاً
 */
function isValidDate(value) {
    // التحقق من تنسيق التاريخ ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return true;
    }
    
    // التحقق من تنسيق التاريخ MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(value)) {
        return true;
    }
    
    // التحقق من تنسيق التاريخ DD/MM/YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}/.test(value)) {
        return true;
    }
    
    // محاولة إنشاء كائن تاريخ
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
}

/**
 * تطبيع اسم الحقل (إزالة المسافات والأحرف الخاصة)
 * @param {string} fieldName - اسم الحقل الأصلي
 * @returns {string} - اسم الحقل المطبع
 */
function normalizeFieldName(fieldName) {
    return fieldName
        .replace(/\s+/g, '_') // استبدال المسافات بشرطة سفلية
        .replace(/[^\w\u0600-\u06FF]/g, '') // إزالة الأحرف الخاصة مع الاحتفاظ بالأحرف العربية
        .toLowerCase(); // تحويل إلى أحرف صغيرة
}

/**
 * تحويل البيانات من Google Sheets إلى تنسيق موحد مع دعم الحقول الديناميكية
 * @param {Array} data - البيانات المستلمة من Google Sheets
 * @returns {Array} - البيانات المحولة
 */
function transformDataWithDynamicFields(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    
    // اكتشاف الحقول الديناميكية
    dynamicFields = discoverDynamicFields(data);
    console.log('🔍 Discovered dynamic fields:', dynamicFields);
    
    // تحويل البيانات
    return data.map(row => {
        // إنشاء كائن للبيانات الأساسية
        const transformedRow = {
            name: safeGet(row, 'Name', 'name', 'الاسم', ''),
            id: safeGet(row, 'ID', 'id', 'رقم_الموظف', generateEmployeeId()),
            email: safeGet(row, 'Email', 'email', 'البريد_الإلكتروني', ''),
            department: safeGet(row, 'Department', 'department', 'القسم', ''),
            jobTitle: safeGet(row, 'Job Title', 'Job title', 'jobTitle', 'المسمى_الوظيفي', ''),
            location: safeGet(row, 'Location', 'location', 'الموقع', ''),
            nationality: safeGet(row, 'Nationality', 'nationality', 'الجنسية', ''),
            status: determineStatus(row),
            startDate: safeGet(row, 'Start Date', 'startDate', 'تاريخ_البدء', ''),
            endDate: safeGet(row, 'End Date', 'endDate', 'تاريخ_الانتهاء', ''),
            notes: safeGet(row, 'Notes', 'Note', 'notes', 'ملاحظات', '')
        };
        
        // إضافة الحقول الديناميكية
        const dynamicData = {};
        dynamicFields.forEach(field => {
            const value = row[field.originalName] || '';
            dynamicData[field.normalizedName] = formatDynamicValue(value, field.type);
        });
        
        // دمج البيانات الأساسية مع البيانات الديناميكية
        return {
            ...transformedRow,
            dynamicFields: dynamicData
        };
    }).filter(emp => emp.name && emp.name !== ''); // استبعاد السجلات بدون اسم
}

/**
 * تنسيق قيمة الحقل الديناميكي حسب نوعه
 * @param {any} value - القيمة الأصلية
 * @param {string} type - نوع الحقل
 * @returns {any} - القيمة المنسقة
 */
function formatDynamicValue(value, type) {
    if (value === undefined || value === null || value === '') {
        return '';
    }
    
    switch (type) {
        case FIELD_TYPES.NUMBER:
            return parseFloat(value);
        case FIELD_TYPES.DATE:
            return formatDate(value);
        case FIELD_TYPES.BOOLEAN:
            return formatBoolean(value);
        default:
            return String(value).trim();
    }
}

/**
 * تنسيق التاريخ
 * @param {string} value - قيمة التاريخ
 * @returns {string} - التاريخ المنسق
 */
function formatDate(value) {
    try {
        const date = new Date(value);
        if (isNaN(date)) {
            return value;
        }
        return date.toISOString().split('T')[0]; // تنسيق YYYY-MM-DD
    } catch (error) {
        return value;
    }
}

/**
 * تنسيق القيمة المنطقية
 * @param {any} value - القيمة المنطقية
 * @returns {boolean} - القيمة المنطقية المنسقة
 */
function formatBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    
    const strValue = String(value).toLowerCase();
    return strValue === 'true' || strValue === 'yes' || strValue === 'نعم' || strValue === '1';
}

/**
 * الحصول على قيمة آمنة من الكائن
 * @param {Object} obj - الكائن المصدر
 * @param {...string} keys - مفاتيح البحث
 * @returns {string} - القيمة المستردة أو القيمة الافتراضية
 */
function safeGet(obj, ...keys) {
    const defaultValue = keys[keys.length - 1];
    const searchKeys = keys.slice(0, -1);
    
    for (const key of searchKeys) {
        if (obj && obj[key] !== undefined && obj[key] !== null) {
            return String(obj[key]).trim();
        }
    }
    
    return defaultValue;
}

/**
 * إنشاء معرف موظف جديد
 * @returns {string} - معرف الموظف الجديد
 */
function generateEmployeeId() {
    return 'EMP' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

/**
 * تحديد حالة الموظف
 * @param {Object} row - بيانات الموظف
 * @returns {string} - حالة الموظف (نشط/غير نشط)
 */
function determineStatus(row) {
    try {
        // محاولة قراءة الحالة بشكل مباشر
        const status = safeGet(row, 'Status', 'status', 'الحالة', '').toLowerCase();
        
        // إذا كانت الحالة محددة بشكل صريح
        if (status === 'active' || status === 'نشط') return 'active';
        if (status === 'inactive' || status === 'غير نشط') return 'inactive';
        
        // تحديد الحالة بناءً على تاريخ انتهاء العقد
        const endDate = safeGet(row, 'End Date', 'endDate', 'تاريخ_الانتهاء', '');
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

/**
 * الحصول على قائمة الحقول الديناميكية المكتشفة
 * @returns {Array} - قائمة الحقول الديناميكية
 */
function getDynamicFields() {
    return dynamicFields;
}

/**
 * الحصول على الحقول الديناميكية غير الأساسية (للإحصائيات)
 * @returns {Array} - قائمة الحقول الديناميكية غير الأساسية
 */
function getNonCoreFields() {
    return dynamicFields.filter(field => !field.isCore);
}

// تصدير الدوال للاستخدام في أجزاء أخرى من النظام
window.HR = window.HR || {};
window.HR.DynamicData = {
    transformDataWithDynamicFields,
    getDynamicFields,
    getNonCoreFields,
    FIELD_TYPES
};

console.log('✅ Dynamic Data Parser Loaded');
