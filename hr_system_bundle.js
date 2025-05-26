

/**
 * نظام إدارة الموارد البشرية السحابي - اختبار وتكامل
 * 
 * هذا الملف يحتوي على دوال الاختبار والتكامل النهائي للنظام
 */

// دالة لدمج جميع التحديثات في ملف واحد
HR.integrateAllUpdates = function() {
  console.log("جاري دمج جميع التحديثات...");
  
  // تحديث دوال عرض الحقول الديناميكية
  HR.updateEmployeeTable = function() {
    const tableBody = document.querySelector("#employeeTable tbody");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    if (HR.cache.employees.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = "<td colspan=\"100%\" class=\"text-center\">لا توجد بيانات</td>";
      tableBody.appendChild(emptyRow);
      return;
    }
    
    // تحديد الحقول الرئيسية التي سيتم عرضها دائماً
    const coreFields = ["Name", "ID", "Email", "Department", "Job Title", "Location", "Status"];
    
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
    const tableHead = document.querySelector("#employeeTable thead tr");
    if (tableHead) {
      tableHead.innerHTML = "";
      
      // إضافة الحقول المطلوبة إلى رأس الجدول
      fields.forEach(field => {
        // تخطي حقل ID لأنه سيظهر في الإجراءات
        if (field === "ID") return;
        
        const th = document.createElement("th");
        th.textContent = field;
        tableHead.appendChild(th);
      });
      
      // إضافة عمود الإجراءات
      const actionsHeader = document.createElement("th");
      actionsHeader.textContent = "الإجراءات";
      tableHead.appendChild(actionsHeader);
    }
    
    // إنشاء صفوف الجدول
    HR.cache.employees.forEach(employee => {
      const row = document.createElement("tr");
      
      // إضافة خلايا البيانات
      fields.forEach(field => {
        // تخطي حقل ID لأنه سيظهر في الإجراءات
        if (field === "ID") return;
        
        const cell = document.createElement("td");
        cell.textContent = employee[field] || "";
        row.appendChild(cell);
      });
      
      // إضافة خلية الإجراءات
      const actionsCell = document.createElement("td");
      
      // زر التفاصيل
      const viewButton = document.createElement("button");
      viewButton.className = "btn btn-sm btn-info me-1";
      viewButton.innerHTML = "<i class=\"fas fa-eye\"></i>";
      viewButton.onclick = () => HR.viewEmployee(employee.ID);
      actionsCell.appendChild(viewButton);
      
      // زر التعديل (للمدير فقط)
      if (HR.auth.isLoggedIn && HR.auth.currentUser.role === "admin") {
        const editButton = document.createElement("button");
        editButton.className = "btn btn-sm btn-primary me-1";
        editButton.innerHTML = "<i class=\"fas fa-edit\"></i>";
        editButton.onclick = () => HR.openEmployeeForm("edit", employee.ID);
        actionsCell.appendChild(editButton);
        
        // زر الحذف (للمدير فقط)
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-sm btn-danger";
        deleteButton.innerHTML = "<i class=\"fas fa-trash\"></i>";
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
      HR.showMessage("لم يتم العثور على الموظف", "error");
      return;
    }
    
    // إنشاء نافذة منبثقة لعرض تفاصيل الموظف
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "employeeDetailsModal";
    modal.tabIndex = "-1";
    modal.setAttribute("aria-labelledby", "employeeDetailsModalLabel");
    modal.setAttribute("aria-hidden", "true");
    
    // تحديد الحقول التي سيتم عرضها (جميع الحقول ما عدا ID)
    const fields = Object.keys(employee).filter(key => key !== "ID");
    
    // ترتيب الحقول: الحقول الرئيسية أولاً ثم الحقول الديناميكية
    const coreFields = ["Name", "Email", "Department", "Job Title", "Location", "Status"];
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
                      <p class="card-text">${employee[field] || "-"}</p>
                    </div>
                  </div>
                </div>
              `).join("")}
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
    modal.addEventListener("hidden.bs.modal", function() {
      document.body.removeChild(modal);
    });
  };
  
  // تحديث دالة فتح نموذج إضافة/تعديل موظف
  HR.openEmployeeForm = function(mode, employeeId) {
    // التحقق من الصلاحيات
    if (!HR.auth.isLoggedIn || HR.auth.currentUser.role !== "admin") {
      HR.showMessage("ليس لديك صلاحية لإضافة أو تعديل موظف", "error");
      return;
    }
    
    // الحصول على بيانات الموظف (في حالة التعديل)
    let employee = null;
    if (mode === "edit" && employeeId) {
      employee = HR.cache.employees.find(emp => emp.ID === employeeId);
      if (!employee) {
        HR.showMessage("لم يتم العثور على الموظف", "error");
        return;
      }
    }
    
    // تحديد الحقول الرئيسية التي سيتم عرضها دائماً
    const coreFields = [
      { name: "Name", label: "الاسم", type: "text", required: true },
      { name: "ID", label: "الرقم الوظيفي", type: "text", required: true },
      { name: "Email", label: "البريد الإلكتروني", type: "email", required: false },
      { name: "Department", label: "القسم", type: "select", options: "departments", required: false },
      { name: "Job Title", label: "المسمى الوظيفي", type: "select", options: "jobTitles", required: false },
      { name: "Location", label: "الموقع", type: "select", options: "locations", required: false },
      { name: "Nationality", label: "الجنسية", type: "text", required: false },
      { name: "Start Date", label: "تاريخ التعيين", type: "date", required: false },
      { name: "End Date", label: "تاريخ انتهاء العقد", type: "date", required: false },
      { name: "Status", label: "الحالة", type: "select", options: ["نشط", "غير نشط", "إجازة"], required: false },
      { name: "Notes", label: "ملاحظات", type: "textarea", required: false }
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
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "employeeFormModal";
    modal.tabIndex = "-1";
    modal.setAttribute("aria-labelledby", "employeeFormModalLabel");
    modal.setAttribute("aria-hidden", "true");
    
    // إنشاء محتوى النافذة المنبثقة
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="employeeFormModalLabel">${mode === "add" ? "إضافة موظف جديد" : "تعديل بيانات الموظف"}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="employeeForm">
              <div class="row">
                <!-- الحقول الرئيسية -->
                ${coreFields.map(field => {
                  let fieldHtml = "";
                  
                  if (field.type === "select" && typeof field.options === "string") {
                    // قائمة منسدلة من البيانات المرجعية
                    fieldHtml = `
                      <div class="col-md-6 mb-3">
                        <label for="employee${field.name.replace(/\s+/g, "")}" class="form-label">${field.label}</label>
                        <select class="form-select" id="employee${field.name.replace(/\s+/g, "")}" name="${field.name}" ${field.required ? "required" : ""}>
                          <option value="">اختر ${field.label}</option>
                          ${HR.cache[field.options] ? HR.cache[field.options].map(item => `
                            <option value="${item}" ${employee && employee[field.name] === item ? "selected" : ""}>${item}</option>
                          `).join("") : ""}
                        </select>
                      </div>
                    `;
                  } else if (field.type === "select" && Array.isArray(field.options)) {
                    // قائمة منسدلة من قيم ثابتة
                    fieldHtml = `
                      <div class="col-md-6 mb-3">
                        <label for="employee${field.name.replace(/\s+/g, "")}" class="form-label">${field.label}</label>
                        <select class="form-select" id="employee${field.name.replace(/\s+/g, "")}" name="${field.name}" ${field.required ? "required" : ""}>
                          <option value="">اختر ${field.label}</option>
                          ${field.options.map(option => `
                            <option value="${option}" ${employee && employee[field.name] === option ? "selected" : ""}>${option}</option>
                          `).join("")}
                        </select>
                      </div>
                    `;
                  } else if (field.type === "textarea") {
                    // حقل نص متعدد الأسطر
                    fieldHtml = `
                      <div class="col-md-12 mb-3">
                        <label for="employee${field.name.replace(/\s+/g, "")}" class="form-label">${field.label}</label>
                        <textarea class="form-control" id="employee${field.name.replace(/\s+/g, "")}" name="${field.name}" rows="3" ${field.required ? "required" : ""}>${employee ? employee[field.name] || "" : ""}</textarea>
                      </div>
                    `;
                  } else {
                    // حقل نص عادي
                    fieldHtml = `
                      <div class="col-md-6 mb-3">
                        <label for="employee${field.name.replace(/\s+/g, "")}" class="form-label">${field.label}</label>
                        <input type="${field.type}" class="form-control" id="employee${field.name.replace(/\s+/g, "")}" name="${field.name}" value="${employee ? employee[field.name] || "" : ""}" ${field.required ? "required" : ""} ${mode === "edit" && field.name === "ID" ? "readonly" : ""}>
                      </div>
                    `;
                  }
                  
                  return fieldHtml;
                }).join("")}
                
                <!-- الحقول الديناميكية -->
                ${Array.from(dynamicFields).map(field => `
                  <div class="col-md-6 mb-3">
                    <label for="employee${field.replace(/\s+/g, "")}" class="form-label">${field}</label>
                    <input type="text" class="form-control" id="employee${field.replace(/\s+/g, "")}" name="${field}" value="${employee ? employee[field] || "" : ""}">
                  </div>
                `).join("")}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
            <button type="button" class="btn btn-primary" onclick="HR.saveEmployee("${mode}")">حفظ</button>
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
    modal.addEventListener("hidden.bs.modal", function() {
      document.body.removeChild(modal);
    });
  };
  
  // تحديث دالة حفظ بيانات الموظف
  HR.saveEmployee = function(mode) {
    // التحقق من الصلاحيات
    if (!HR.auth.isLoggedIn || HR.auth.currentUser.role !== "admin") {
      HR.showMessage("ليس لديك صلاحية لإضافة أو تعديل موظف", "error");
      return;
    }
    
    // الحصول على بيانات النموذج
    const form = document.getElementById("employeeForm");
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
    url.searchParams.append("action", mode === "add" ? "add" : "update");
    
    // إضافة بيانات الموظف كمعاملات URL
    Object.keys(employeeData).forEach(key => {
      const paramName = key.toLowerCase().replace(/\s+/g, "");
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
          const modal = bootstrap.Modal.getInstance(document.getElementById("employeeFormModal"));
          if (modal) {
            modal.hide();
          }
          
          // تحديث البيانات
          HR.fetchData();
          
          HR.showMessage(`تم ${mode === "add" ? "إضافة" : "تعديل"} الموظف بنجاح`, "success");
        } else {
          HR.showMessage(`فشل ${mode === "add" ? "إضافة" : "تعديل"} الموظف: ${data.error || "خطأ غير معروف"}`, "error");
        }
        
        HR.hideLoading();
      })
      .catch(error => {
        console.error("خطأ في حفظ بيانات الموظف:", error);
        HR.showMessage(`حدث خطأ أثناء حفظ بيانات الموظف: ${error.message}`, "error");
        HR.hideLoading();
      });
  };
  
  // تحديث دالة جلب البيانات
  HR.fetchData = function() {
    // عرض مؤشر التحميل
    HR.showLoading();
    
    // التحقق من وجود رابط Google Apps Script
    if (!HR.SCRIPT_URL || HR.SCRIPT_URL === "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec") {
      HR.hideLoading();
      HR.showMessage("يرجى تعيين رابط Google Apps Script أولاً", "error");
      return;
    }
    
    // جلب البيانات
    fetch(HR.SCRIPT_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("تم جلب البيانات:", data);
        
        // التحقق من وجود بيانات
        if (!Array.isArray(data)) {
          throw new Error("تنسيق البيانات غير صحيح");
        }
        
        // تخزين البيانات في الذاكرة المؤقتة
        HR.cache.employees = data;
        HR.cache.lastFetch = new Date();
        
        // استخراج البيانات المرجعية
        HR.extractReferenceData();
        
        // تحديث واجهة المستخدم
        HR.updateEmployeeTable();
        HR.updateDashboard();
        
        // إخفاء مؤشر التحميل
        HR.hideLoading();
      })
      .catch(error => {
        console.error("خطأ في جلب البيانات:", error);
        HR.showMessage(`حدث خطأ أثناء تحميل البيانات: ${error.message}`, "error");
        HR.hideLoading();
        
        // إظهار نموذج تعيين الرابط إذا كان الخطأ متعلق بالاتصال
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          // التبديل إلى تبويب إعدادات الرابط
          const settingsTab = document.querySelector("[data-bs-target=\"#settingsTab\"]");
          if (settingsTab) {
            settingsTab.click();
          }
          
          const sheetsUrlTab = document.querySelector("[href=\"#sheetsUrlTab\"]");
          if (sheetsUrlTab) {
            sheetsUrlTab.click();
          }
        }
      });
  };
  
  // تحديث دالة تحديث لوحة المعلومات
  HR.updateDashboard = function() {
    const dashboardContainer = document.getElementById("dashboardContainer");
    if (!dashboardContainer) return;
    
    // إنشاء البطاقات الإحصائية
    const statsRow = document.createElement("div");
    statsRow.className = "row mb-4";
    
    // إجمالي الموظفين
    const totalEmployees = HR.cache.employees.length;
    statsRow.appendChild(HR.createStatCard("إجمالي الموظفين", totalEmployees, "fa-users", "primary"));
    
    // الموظفين النشطين
    const activeEmployees = HR.cache.employees.filter(emp => emp.Status === "نشط").length;
    statsRow.appendChild(HR.createStatCard("الموظفين النشطين", activeEmployees, "fa-user-check", "success"));
    
    // الموظفين غير النشطين
    const inactiveEmployees = HR.cache.employees.filter(emp => emp.Status !== "نشط").length;
    statsRow.appendChild(HR.createStatCard("الموظفين غير النشطين", inactiveEmployees, "fa-user-times", "danger"));
    
    // إضافة البطاقات الإحصائية إلى لوحة المعلومات
    dashboardContainer.innerHTML = "";
    dashboardContainer.appendChild(statsRow);
    
    // إنشاء الرسوم البيانية الأساسية
    const chartsRow1 = document.createElement("div");
    chartsRow1.className = "row mb-4";
    
    // رسم بياني للأقسام
    const departmentChartCol = document.createElement("div");
    departmentChartCol.className = "col-md-6 mb-4";
    departmentChartCol.appendChild(HR.createChartCard("توزيع الموظفين حسب القسم", "departmentChart"));
    chartsRow1.appendChild(departmentChartCol);
    
    // رسم بياني للمواقع
    const locationChartCol = document.createElement("div");
    locationChartCol.className = "col-md-6 mb-4";
    locationChartCol.appendChild(HR.createChartCard("توزيع الموظفين حسب الموقع", "locationChart"));
    chartsRow1.appendChild(locationChartCol);
    
    // إضافة الرسوم البيانية الأساسية إلى لوحة المعلومات
    dashboardContainer.appendChild(chartsRow1);
    
    // إنشاء الرسوم البيانية الديناميكية للحقول النصية
    const textFields = HR.getTextFields();
    if (textFields.length > 0) {
      const chartsRow2 = document.createElement("div");
      chartsRow2.className = "row mb-4";
      
      // إضافة رسم بياني لكل حقل نصي
      textFields.forEach((field, index) => {
        // تحديد عدد الرسوم البيانية في كل صف (2 رسم بياني في كل صف)
        if (index % 2 === 0 && index > 0) {
          dashboardContainer.appendChild(chartsRow2);
          chartsRow2 = document.createElement("div");
          chartsRow2.className = "row mb-4";
        }
        
        const chartCol = document.createElement("div");
        chartCol.className = "col-md-6 mb-4";
        chartCol.appendChild(HR.createChartCard(`توزيع الموظفين حسب ${field}`, `${field.replace(/\s+/g, "")}Chart`));
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
      const chartsRow3 = document.createElement("div");
      chartsRow3.className = "row mb-4";
      
      // إضافة رسم بياني لكل حقل رقمي
      numericFields.forEach((field, index) => {
        // تحديد عدد الرسوم البيانية في كل صف (2 رسم بياني في كل صف)
        if (index % 2 === 0 && index > 0) {
          dashboardContainer.appendChild(chartsRow3);
          chartsRow3 = document.createElement("div");
          chartsRow3.className = "row mb-4";
        }
        
        const chartCol = document.createElement("div");
        chartCol.className = "col-md-6 mb-4";
        chartCol.appendChild(HR.createChartCard(`إحصائيات ${field}`, `${field.replace(/\s+/g, "")}Chart`));
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
  
  // إضافة دوال الإحصائيات الديناميكية
  HR.getTextFields = function() {
    // الحقول النصية الأساسية التي نريد عرض رسوم بيانية لها
    const basicTextFields = ["Department", "Job Title", "Location", "Status", "Nationality"];
    
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
  
  HR.getNumericFields = function() {
    // الحقول الرقمية المحتملة
    const numericFields = [];
    
    // التحقق من الحقول الرقمية في البيانات
    if (HR.cache.employees.length > 0) {
      const employee = HR.cache.employees[0];
      
      Object.keys(employee).forEach(field => {
        // تخطي الحقول المعروفة غير الرقمية
        if (["Name", "ID", "Email", "Department", "Job Title", "Location", "Status", "Nationality", "Start Date", "End Date", "Notes"].includes(field)) {
          return;
        }
        
        // التحقق مما إذا كانت جميع القيم رقمية
        const isNumeric = HR.cache.employees.every(emp => {
          const value = emp[field];
          return !value || value === "" || !isNaN(parseFloat(value));
        });
        
        if (isNumeric) {
          numericFields.push(field);
        }
      });
    }
    
    return numericFields;
  };
  
  // تحديث دوال تهيئة الرسوم البيانية
  HR.initializeCharts = function() {
    // التحقق من وجود Chart.js
    if (typeof Chart === "undefined") {
      console.error("Chart.js غير موجود");
      return;
    }
    
    // تهيئة رسم بياني للأقسام
    HR.initializeDepartmentChart();
    
    // تهيئة رسم بياني للمواقع
    HR.initializeLocationChart();
    
    // تهيئة الرسوم البيانية للحقول النصية
    const textFields = HR.getTextFields();
    textFields.forEach(field => {
      if (field !== "Department" && field !== "Location") {
        HR.initializeTextFieldChart(field);
      }
    });
    
    // تهيئة الرسوم البيانية للحقول الرقمية
    const numericFields = HR.getNumericFields();
    numericFields.forEach(field => {
      HR.initializeNumericFieldChart(field);
    });
  };
  
  HR.initializeTextFieldChart = function(field) {
    const canvas = document.getElementById(`${field.replace(/\s+/g, "")}Chart`);
    if (!canvas) return;
    
    // حساب توزيع القيم
    const valueCounts = {};
    HR.cache.employees.forEach(employee => {
      const value = employee[field] || "غير محدد";
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    // تحويل البيانات إلى تنسيق مناسب للرسم البياني
    const labels = Object.keys(valueCounts);
    const data = Object.values(valueCounts);
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
      type: "pie",
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
            position: "right",
            labels: {
              font: {
                family: "Tajawal, sans-serif"
              }
            }
          }
        }
      }
    });
  };
  
  HR.initializeNumericFieldChart = function(field) {
    const canvas = document.getElementById(`${field.replace(/\s+/g, "")}Chart`);
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
      type: "bar",
      data: {
        labels: ["المتوسط", "الحد الأقصى", "الحد الأدنى"],
        datasets: [{
          label: field,
          data: [avg, max, min],
          backgroundColor: [
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 99, 132, 0.5)",
            "rgba(75, 192, 192, 0.5)"
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(75, 192, 192, 1)"
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
  
  HR.initializeDepartmentChart = function() {
    const canvas = document.getElementById("departmentChart");
    if (!canvas) return;
    
    // حساب توزيع الأقسام
    const departmentCounts = {};
    HR.cache.employees.forEach(employee => {
      const department = employee.Department || "غير محدد";
      departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    });
    
    // تحويل البيانات إلى تنسيق مناسب للرسم البياني
    const labels = Object.keys(departmentCounts);
    const data = Object.values(departmentCounts);
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
      type: "pie",
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
            position: "right",
            labels: {
              font: {
                family: "Tajawal, sans-serif"
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || "";
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
  
  HR.initializeLocationChart = function() {
    const canvas = document.getElementById("locationChart");
    if (!canvas) return;
    
    // حساب توزيع المواقع
    const locationCounts = {};
    HR.cache.employees.forEach(employee => {
      const location = employee.Location || "غير محدد";
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    
    // تحويل البيانات إلى تنسيق مناسب للرسم البياني
    const labels = Object.keys(locationCounts);
    const data = Object.values(locationCounts);
    
    // إنشاء الرسم البياني
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "عدد الموظفين",
          data: data,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
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
  
  console.log("تم دمج جميع التحديثات بنجاح");
};

// دالة اختبار النظام
HR.testSystem = function() {
  console.log("بدء اختبار النظام...");
  
  // اختبار تسجيل الدخول
  console.log("اختبار تسجيل الدخول...");
  try {
    // اختبار تسجيل الدخول كمدير
    HR.login("admin", "admin123");
    console.log("تسجيل الدخول كمدير: نجاح");
    
    // اختبار تسجيل الخروج
    HR.logout();
    console.log("تسجيل الخروج: نجاح");
    
    // اختبار تسجيل الدخول كمستخدم عادي
    HR.login("user", "user123");
    console.log("تسجيل الدخول كمستخدم عادي: نجاح");
    
    // اختبار تسجيل الخروج
    HR.logout();
    console.log("تسجيل الخروج: نجاح");
  } catch (error) {
    console.error("فشل اختبار تسجيل الدخول:", error);
  }
  
  // اختبار جلب البيانات
  console.log("اختبار جلب البيانات...");
  try {
    HR.fetchData();
    console.log("جلب البيانات: تم بدء العملية");
  } catch (error) {
    console.error("فشل اختبار جلب البيانات:", error);
  }
  
  console.log("اكتمل اختبار النظام");
};

// دالة تحديث رابط Google Apps Script
HR.updateScriptUrl = function() {
  const scriptUrlInput = document.getElementById("scriptUrlSettingsInput");
  if (!scriptUrlInput) return;
  
  const url = scriptUrlInput.value.trim();
  if (!url) {
    HR.showMessage("يرجى إدخال رابط صحيح", "error");
    return;
  }
  
  // التحقق من صحة الرابط
  if (!url.startsWith("https://script.google.com/macros/s/")) {
    HR.showMessage("يرجى إدخال رابط Google Apps Script صحيح", "error");
    return;
  }
  
  // تخزين الرابط في الجلسة
  sessionStorage.setItem("hr_script_url", url);
  
  // تعيين الرابط في النظام
  HR.SCRIPT_URL = url;
  
  // إعادة تحميل البيانات
  HR.fetchData();
  
  HR.showMessage("تم تحديث الرابط بنجاح", "success");
};

// دالة تحديث النظام بالكامل
HR.updateEntireSystem = function() {
  // دمج جميع التحديثات
  HR.integrateAllUpdates();
  
  // اختبار النظام
  HR.testSystem();
  
  console.log("تم تحديث النظام بالكامل");
};

