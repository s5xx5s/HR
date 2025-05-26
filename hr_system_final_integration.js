/**
 * نظام إدارة الموارد البشرية السحابي - اختبار وتكامل
 * 
 * هذا الملف يحتوي على دوال الاختبار والتكامل النهائي للنظام
 */

// دالة لدمج جميع التحديثات في ملف واحد
HR.integrateAllUpdates = function() {
  console.log('جاري دمج جميع التحديثات...');
  
  // تحديث دوال عرض الحقول الديناميكية
  HR.updateEmployeeTable = function() {
    const tableBody = document.querySelector('#employeeTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (HR.cache.employees.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="100%" class="text-center">لا توجد بيانات</td>';
      tableBody.appendChild(emptyRow);
      return;
    }
    
    // تحديد الحقول الرئيسية التي سيتم عرضها دائماً
    const coreFields = ['Name', 'ID', 'Email', 'Department', 'Job Title', 'Location', 'Status'];
    
    // الحصول على جميع الحقول الموجودة في البيانات
    const allFields = new Set();
    HR.cache.employees.forEach(employee => {
      Object.keys(employee).forEach(field => {
        allFields.add(field);
      });
    });
    
    // تحويل مجموعة الحقول إلى مصفوفة وترتيبها
    const fields = Array.from(allFields);
    
    // ترتيب الحقول: الحقول الرئيسية أولاً ثم الحقول الديناميكية
    fields.sort((a, b) => {
      const aIsCore = coreFields.includes(a);
      const bIsCore = coreFields.includes(b);
      
      if (aIsCore && !bIsCore) return -1;
      if (!aIsCore && bIsCore) return 1;
      
      // ترتيب الحقول الرئيسية حسب ترتيبها في المصفوفة
      if (aIsCore && bIsCore) {
        return coreFields.indexOf(a) - coreFields.indexOf(b);
      }
      
      // ترتيب الحقول الديناميكية أبجدياً
      return a.localeCompare(b);
    });
    
    // إنشاء رأس الجدول ديناميكياً
    const tableHead = document.querySelector('#employeeTable thead tr');
    if (tableHead) {
      tableHead.innerHTML = '';
      
      // إضافة الحقول المطلوبة إلى رأس الجدول
      fields.forEach(field => {
        // تخطي حقل ID لأنه سيظهر في الإجراءات
        if (field === 'ID') return;
        
        const th = document.createElement('th');
        th.textContent = field;
        tableHead.appendChild(th);
      });
      
      // إضافة عمود الإجراءات
      const actionsHeader = document.createElement('th');
      actionsHeader.textContent = 'الإجراءات';
      tableHead.appendChild(actionsHeader);
    }
    
    // إنشاء صفوف الجدول
    HR.cache.employees.forEach(employee => {
      const row = document.createElement('tr');
      
      // إضافة خلايا البيانات
      fields.forEach(field => {
        // تخطي حقل ID لأنه سيظهر في الإجراءات
        if (field === 'ID') return;
        
        const cell = document.createElement('td');
        cell.textContent = employee[field] || '';
        row.appendChild(cell);
      });
      
      // إضافة خلية الإجراءات
      const actionsCell = document.createElement('td');
      
      // زر التفاصيل
      const viewButton = document.createElement('button');
      viewButton.className = 'btn btn-sm btn-info me-1';
      viewButton.innerHTML = '<i class="fas fa-eye"></i>';
      viewButton.onclick = () => HR.viewEmployee(employee.ID);
      actionsCell.appendChild(viewButton);
      
      // زر التعديل (للمدير فقط)
      if (HR.auth.isLoggedIn && HR.auth.currentUser.role === 'admin') {
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-primary me-1';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.onclick = () => HR.openEmployeeForm('edit', employee.ID);
        actionsCell.appendChild(editButton);
        
        // زر الحذف (للمدير فقط)
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-danger';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.onclick = () => HR.deleteEmployee(employee.ID);
        actionsCell.appendChild(deleteButton);
      }
      
      row.appendChild(actionsCell);
      tableBody.appendChild(row);
    });
  };
  
  // تحديث دالة عرض تفاصيل موظف
  HR.viewEmployee = function(employeeId) {
    const employee = HR.cache.employees.find(emp => emp.ID === employeeId);
    if (!employee) {
      HR.showMessage('لم يتم العثور على الموظف', 'error');
      return;
    }
    
    // إنشاء نافذة منبثقة لعرض تفاصيل الموظف
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'employeeDetailsModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'employeeDetailsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    // تحديد الحقول التي سيتم عرضها (جميع الحقول ما عدا ID)
    const fields = Object.keys(employee).filter(key => key !== 'ID');
    
    // ترتيب الحقول: الحقول الرئيسية أولاً ثم الحقول الديناميكية
    const coreFields = ['Name', 'Email', 'Department', 'Job Title', 'Location', 'Status'];
    fields.sort((a, b) => {
      const aIsCore = coreFields.includes(a);
      const bIsCore = coreFields.includes(b);
      
      if (aIsCore && !bIsCore) return -1;
      if (!aIsCore && bIsCore) return 1;
      
      // ترتيب الحقول الرئيسية حسب ترتيبها في المصفوفة
      if (aIsCore && bIsCore) {
        return coreFields.indexOf(a) - coreFields.indexOf(b);
      }
      
      // ترتيب الحقول الديناميكية أبجدياً
      return a.localeCompare(b);
    });
    
    // إنشاء محتوى النافذة المنبثقة
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="employeeDetailsModalLabel">تفاصيل الموظف: ${employee.Name}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              ${fields.map(field => `
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-subtitle mb-2 text-muted">${field}</h6>
                      <p class="card-text">${employee[field] || '-'}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
          </div>
        </div>
      </div>
    `;
    
    // إضافة النافذة المنبثقة إلى الصفحة
    document.body.appendChild(modal);
    
    // إنشاء كائن النافذة المنبثقة
    const modalInstance = new bootstrap.Modal(modal);
    
    // عرض النافذة المنبثقة
    modalInstance.show();
    
    // إزالة النافذة المنبثقة من الصفحة عند إغلاقها
    modal.addEventListener('hidden.bs.modal', function() {
      document.body.removeChild(modal);
    });
  };
  
  // تحديث دالة فتح نموذج إضافة/تعديل موظف
  HR.openEmployeeForm = function(mode, employeeId) {
    // التحقق من الصلاحيات
    if (!HR.auth.isLoggedIn || HR.auth.currentUser.role !== 'admin') {
      HR.showMessage('ليس لديك صلاحية لإضافة أو تعديل موظف', 'error');
      return;
    }
    
    // الحصول على بيانات الموظف (في حالة التعديل)
    let employee = null;
    if (mode === 'edit' && employeeId) {
      employee = HR.cache.employees.find(emp => emp.ID === employeeId);
      if (!employee) {
        HR.showMessage('لم يتم العثور على الموظف', 'error');
        return;
      }
    }
    
    // تحديد الحقول الرئيسية التي سيتم عرضها دائماً
    const coreFields = [
      { name: 'Name', label: 'الاسم', type: 'text', required: true },
      { name: 'ID', label: 'الرقم الوظيفي', type: 'text', required: true },
      { name: 'Email', label: 'البريد الإلكتروني', type: 'email', required: false },
      { name: 'Department', label: 'القسم', type: 'select', options: 'departments', required: false },
      { name: 'Job Title', label: 'المسمى الوظيفي', type: 'select', options: 'jobTitles', required: false },
      { name: 'Location', label: 'الموقع', type: 'select', options: 'locations', required: false },
      { name: 'Nationality', label: 'الجنسية', type: 'text', required: false },
      { name: 'Start Date', label: 'تاريخ التعيين', type: 'date', required: false },
      { name: 'End Date', label: 'تاريخ انتهاء العقد', type: 'date', required: false },
      { name: 'Status', label: 'الحالة', type: 'select', options: ['نشط', 'غير نشط', 'إجازة'], required: false },
      { name: 'Notes', label: 'ملاحظات', type: 'textarea', required: false }
    ];
    
    // الحصول على جميع الحقول الديناميكية من البيانات
    const dynamicFields = new Set();
    HR.cache.employees.forEach(emp => {
      Object.keys(emp).forEach(field => {
        // تخطي الحقول الرئيسية
        if (!coreFields.some(coreField => coreField.name === field)) {
          dynamicFields.add(field);
        }
      });
    });
    
    // إنشاء نافذة منبثقة للنموذج
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'employeeFormModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'employeeFormModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    // إنشاء محتوى النافذة المنبثقة
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="employeeFormModalLabel">${mode === 'add' ? 'إضافة موظف جديد' : 'تعديل بيانات الموظف'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="employeeForm">
              <div class="row">
                <!-- الحقول الرئيسية -->
                ${coreFields.map(field => {
                  let fieldHtml = '';
                  
                  if (field.type === 'select' && typeof field.options === 'string') {
                    // قائمة منسدلة من البيانات المرجعية
                    fieldHtml = `
                      <div class="col-md-6 mb-3">
                        <label for="employee${field.name.replace(/\s+/g, '')}" class="form-label">${field.label}</label>
                        <select class="form-select" id="employee${field.name.replace(/\s+/g, '')}" name="${field.name}" ${field.required ? 'required' : ''}>
                          <option value="">اختر ${field.label}</option>
                          ${HR.cache[field.options] ? HR.cache[field.options].map(item => `
                            <option value="${item}" ${employee && employee[field.name] === item ? 'selected' : ''}>${item}</option>
                          `).join('') : ''}
                        </select>
                      </div>
                    `;
                  } else if (field.type === 'select' && Array.isArray(field.options)) {
                    // قائمة منسدلة من قيم ثابتة
                    fieldHtml = `
                      <div class="col-md-6 mb-3">
                        <label for="employee${field.name.replace(/\s+/g, '')}" class="form-label">${field.label}</label>
                        <select class="form-select" id="employee${field.name.replace(/\s+/g, '')}" name="${field.name}" ${field.required ? 'required' : ''}>
                          <option value="">اختر ${field.label}</option>
                          ${field.options.map(option => `
                            <option value="${option}" ${employee && employee[field.name] === option ? 'selected' : ''}>${option}</option>
                          `).join('')}
                        </select>
                      </div>
                    `;
                  } else if (field.type === 'textarea') {
                    // حقل نص متعدد الأسطر
                    fieldHtml = `
                      <div class="col-md-12 mb-3">
                        <label for="employee${field.name.replace(/\s+/g, '')}" class="form-label">${field.label}</label>
                        <textarea class="form-control" id="employee${field.name.replace(/\s+/g, '')}" name="${field.name}" rows="3" ${field.required ? 'required' : ''}>${employee ? employee[field.name] || '' : ''}</textarea>
                      </div>
                    `;
                  } else {
                    // حقل نص عادي
                    fieldHtml = `
                      <div class="col-md-6 mb-3">
                        <label for="employee${field.name.replace(/\s+/g, '')}" class="form-label">${field.label}</label>
                        <input type="${field.type}" class="form-control" id="employee${field.name.replace(/\s+/g, '')}" name="${field.name}" value="${employee ? employee[field.name] || '' : ''}" ${field.required ? 'required' : ''} ${mode === 'edit' && field.name === 'ID' ? 'readonly' : ''}>
                      </div>
                    `;
                  }
                  
                  return fieldHtml;
                }).join('')}
                
                <!-- الحقول الديناميكية -->
                ${Array.from(dynamicFields).map(field => `
                  <div class="col-md-6 mb-3">
                    <label for="employee${field.replace(/\s+/g, '')}" class="form-label">${field}</label>
                    <input type="text" class="form-control" id="employee${field.replace(/\s+/g, '')}" name="${field}" value="${employee ? employee[field] || '' : ''}">
                  </div>
                `).join('')}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
            <button type="button" class="btn btn-primary" onclick="HR.saveEmployee('${mode}')">حفظ</button>
          </div>
        </div>
      </div>
    `;
    
    // إضافة النافذة المنبثقة إلى الصفحة
    document.body.appendChild(modal);
    
    // إنشاء كائن النافذة المنبثقة
    const modalInstance = new bootstrap.Modal(modal);
    
    // عرض النافذة المنبثقة
    modalInstance.show();
    
    // إزالة النافذة المنبثقة من الصفحة عند إغلاقها
    modal.addEventListener('hidden.bs.modal', function() {
      document.body.removeChild(modal);
    });
  };
  
  // تحديث دالة حفظ بيانات الموظف
  HR.saveEmployee = function(mode) {
    // التحقق من الصلاحيات
    if (!HR.auth.isLoggedIn || HR.auth.currentUser.role !== 'admin') {
      HR.showMessage('ليس لديك صلاحية لإضافة أو تعديل موظف', 'error');
      return;
    }
    
    // الحصول على بيانات النموذج
    const form = document.getElementById('employeeForm');
    if (!form) return;
    
    // التحقق من صحة البيانات
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    // جمع بيانات الموظف من جميع حقول النموذج
    const employeeData = {};
    const formElements = form.elements;
    
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      if (element.name) {
        employeeData[element.name] = element.value;
      }
    }
    
    // عرض مؤشر التحميل
    HR.showLoading();
    
    // إرسال البيانات إلى Google Sheets
    const url = new URL(HR.SCRIPT_URL);
    url.searchParams.append('action', mode === 'add' ? 'add' : 'update');
    
    // إضافة بيانات الموظف كمعاملات URL
    Object.keys(employeeData).forEach(key => {
      const paramName = key.toLowerCase().replace(/\s+/g, '');
      url.searchParams.append(paramName, employeeData[key]);
    });
    
    fetch(url.toString())
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // إغلاق النافذة المنبثقة
          const modal = bootstrap.Modal.getInstance(document.getElementById('employeeFormModal'));
          if (modal) {
            modal.hide();
          }
       
(Content truncated due to size limit. Use line ranges to read in chunks)