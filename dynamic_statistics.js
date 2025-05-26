/**
 * نظام إدارة الموارد البشرية السحابي - تحديث الإحصائيات والرسوم البيانية
 * 
 * هذا الملف يحتوي على تحديثات لتحسين الإحصائيات والرسوم البيانية الديناميكية
 */

// تحديث دالة تحديث لوحة المعلومات لدعم الإحصائيات الديناميكية
HR.updateDashboard = function() {
  const dashboardContainer = document.getElementById('dashboardContainer');
  if (!dashboardContainer) return;
  
  // إنشاء البطاقات الإحصائية
  const statsRow = document.createElement('div');
  statsRow.className = 'row mb-4';
  
  // إجمالي الموظفين
  const totalEmployees = HR.cache.employees.length;
  statsRow.appendChild(HR.createStatCard('إجمالي الموظفين', totalEmployees, 'fa-users', 'primary'));
  
  // الموظفين النشطين
  const activeEmployees = HR.cache.employees.filter(emp => emp.Status === 'نشط').length;
  statsRow.appendChild(HR.createStatCard('الموظفين النشطين', activeEmployees, 'fa-user-check', 'success'));
  
  // الموظفين غير النشطين
  const inactiveEmployees = HR.cache.employees.filter(emp => emp.Status !== 'نشط').length;
  statsRow.appendChild(HR.createStatCard('الموظفين غير النشطين', inactiveEmployees, 'fa-user-times', 'danger'));
  
  // إضافة البطاقات الإحصائية إلى لوحة المعلومات
  dashboardContainer.innerHTML = '';
  dashboardContainer.appendChild(statsRow);
  
  // إنشاء الرسوم البيانية الأساسية
  const chartsRow1 = document.createElement('div');
  chartsRow1.className = 'row mb-4';
  
  // رسم بياني للأقسام
  const departmentChartCol = document.createElement('div');
  departmentChartCol.className = 'col-md-6 mb-4';
  departmentChartCol.appendChild(HR.createChartCard('توزيع الموظفين حسب القسم', 'departmentChart'));
  chartsRow1.appendChild(departmentChartCol);
  
  // رسم بياني للمواقع
  const locationChartCol = document.createElement('div');
  locationChartCol.className = 'col-md-6 mb-4';
  locationChartCol.appendChild(HR.createChartCard('توزيع الموظفين حسب الموقع', 'locationChart'));
  chartsRow1.appendChild(locationChartCol);
  
  // إضافة الرسوم البيانية الأساسية إلى لوحة المعلومات
  dashboardContainer.appendChild(chartsRow1);
  
  // إنشاء الرسوم البيانية الديناميكية للحقول النصية
  const textFields = HR.getTextFields();
  if (textFields.length > 0) {
    const chartsRow2 = document.createElement('div');
    chartsRow2.className = 'row mb-4';
    
    // إضافة رسم بياني لكل حقل نصي
    textFields.forEach((field, index) => {
      // تحديد عدد الرسوم البيانية في كل صف (2 رسم بياني في كل صف)
      if (index % 2 === 0 && index > 0) {
        dashboardContainer.appendChild(chartsRow2);
        chartsRow2 = document.createElement('div');
        chartsRow2.className = 'row mb-4';
      }
      
      const chartCol = document.createElement('div');
      chartCol.className = 'col-md-6 mb-4';
      chartCol.appendChild(HR.createChartCard(`توزيع الموظفين حسب ${field}`, `${field.replace(/\s+/g, '')}Chart`));
      chartsRow2.appendChild(chartCol);
    });
    
    // إضافة الصف الأخير من الرسوم البيانية
    if (chartsRow2.children.length > 0) {
      dashboardContainer.appendChild(chartsRow2);
    }
  }
  
  // إنشاء الرسوم البيانية الديناميكية للحقول الرقمية
  const numericFields = HR.getNumericFields();
  if (numericFields.length > 0) {
    const chartsRow3 = document.createElement('div');
    chartsRow3.className = 'row mb-4';
    
    // إضافة رسم بياني لكل حقل رقمي
    numericFields.forEach((field, index) => {
      // تحديد عدد الرسوم البيانية في كل صف (2 رسم بياني في كل صف)
      if (index % 2 === 0 && index > 0) {
        dashboardContainer.appendChild(chartsRow3);
        chartsRow3 = document.createElement('div');
        chartsRow3.className = 'row mb-4';
      }
      
      const chartCol = document.createElement('div');
      chartCol.className = 'col-md-6 mb-4';
      chartCol.appendChild(HR.createChartCard(`إحصائيات ${field}`, `${field.replace(/\s+/g, '')}Chart`));
      chartsRow3.appendChild(chartCol);
    });
    
    // إضافة الصف الأخير من الرسوم البيانية
    if (chartsRow3.children.length > 0) {
      dashboardContainer.appendChild(chartsRow3);
    }
  }
  
  // تهيئة الرسوم البيانية
  setTimeout(() => {
    HR.initializeCharts();
  }, 0);
};

// الحصول على الحقول النصية المناسبة للرسوم البيانية
HR.getTextFields = function() {
  // الحقول النصية الأساسية التي نريد عرض رسوم بيانية لها
  const basicTextFields = ['Department', 'Job Title', 'Location', 'Status', 'Nationality'];
  
  // الحقول النصية الموجودة في البيانات
  const existingFields = new Set();
  
  // التحقق من وجود الحقول في البيانات
  HR.cache.employees.forEach(employee => {
    Object.keys(employee).forEach(field => {
      if (basicTextFields.includes(field) && employee[field]) {
        existingFields.add(field);
      }
    });
  });
  
  return Array.from(existingFields);
};

// الحصول على الحقول الرقمية المناسبة للرسوم البيانية
HR.getNumericFields = function() {
  // الحقول الرقمية المحتملة
  const numericFields = [];
  
  // التحقق من الحقول الرقمية في البيانات
  if (HR.cache.employees.length > 0) {
    const employee = HR.cache.employees[0];
    
    Object.keys(employee).forEach(field => {
      // تخطي الحقول المعروفة غير الرقمية
      if (['Name', 'ID', 'Email', 'Department', 'Job Title', 'Location', 'Status', 'Nationality', 'Start Date', 'End Date', 'Notes'].includes(field)) {
        return;
      }
      
      // التحقق مما إذا كانت جميع القيم رقمية
      const isNumeric = HR.cache.employees.every(emp => {
        const value = emp[field];
        return !value || value === '' || !isNaN(parseFloat(value));
      });
      
      if (isNumeric) {
        numericFields.push(field);
      }
    });
  }
  
  return numericFields;
};

// تهيئة الرسوم البيانية
HR.initializeCharts = function() {
  // التحقق من وجود Chart.js
  if (typeof Chart === 'undefined') {
    console.error('Chart.js غير موجود');
    return;
  }
  
  // تهيئة رسم بياني للأقسام
  HR.initializeDepartmentChart();
  
  // تهيئة رسم بياني للمواقع
  HR.initializeLocationChart();
  
  // تهيئة الرسوم البيانية للحقول النصية
  const textFields = HR.getTextFields();
  textFields.forEach(field => {
    if (field !== 'Department' && field !== 'Location') {
      HR.initializeTextFieldChart(field);
    }
  });
  
  // تهيئة الرسوم البيانية للحقول الرقمية
  const numericFields = HR.getNumericFields();
  numericFields.forEach(field => {
    HR.initializeNumericFieldChart(field);
  });
};

// تهيئة رسم بياني للحقول النصية
HR.initializeTextFieldChart = function(field) {
  const canvas = document.getElementById(`${field.replace(/\s+/g, '')}Chart`);
  if (!canvas) return;
  
  // حساب توزيع القيم
  const valueCounts = {};
  HR.cache.employees.forEach(employee => {
    const value = employee[field] || 'غير محدد';
    valueCounts[value] = (valueCounts[value] || 0) + 1;
  });
  
  // تحويل البيانات إلى تنسيق مناسب للرسم البياني
  const labels = Object.keys(valueCounts);
  const data = Object.values(valueCounts);
  
  // إنشاء الرسم البياني
  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: HR.generateColors(labels.length),
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
};

// تهيئة رسم بياني للحقول الرقمية
HR.initializeNumericFieldChart = function(field) {
  const canvas = document.getElementById(`${field.replace(/\s+/g, '')}Chart`);
  if (!canvas) return;
  
  // جمع القيم الرقمية
  const values = HR.cache.employees
    .map(employee => parseFloat(employee[field]))
    .filter(value => !isNaN(value));
  
  // حساب الإحصائيات
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = values.length > 0 ? sum / values.length : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  
  // إنشاء الرسم البياني
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['المتوسط', 'الحد الأقصى', 'الحد الأدنى'],
      datasets: [{
        label: field,
        data: [avg, max, min],
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(75, 192, 192, 0.5)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
};

// تحديث دالة تهيئة رسم بياني للأقسام
HR.initializeDepartmentChart = function() {
  const canvas = document.getElementById('departmentChart');
  if (!canvas) return;
  
  // حساب توزيع الأقسام
  const departmentCounts = {};
  HR.cache.employees.forEach(employee => {
    const department = employee.Department || 'غير محدد';
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
        backgroundColor: HR.generateColors(labels.length),
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
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
};

// تحديث دالة تهيئة رسم بياني للمواقع
HR.initializeLocationChart = function() {
  const canvas = document.getElementById('locationChart');
  if (!canvas) return;
  
  // حساب توزيع المواقع
  const locationCounts = {};
  HR.cache.employees.forEach(employee => {
    const location = employee.Location || 'غير محدد';
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
};
