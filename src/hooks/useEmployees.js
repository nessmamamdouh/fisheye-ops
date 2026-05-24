function mapRow(row, i) {
  const pkg = parseFloat(row["Total Package"]) || 0;
  const project = row["Project Name"] || "";
  
  // 1. تاريخ اليوم (بدقة)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. معالجة التاريخ الظاهر في الصورة (MM/DD/YY)
  let rawDate = row["End Date"] ? row["End Date"].toString().trim() : "";
  let endDate = null;

  if (rawDate) {
    // تقطيع التاريخ بناءً على الفاصلة /
    const parts = rawDate.split('/');
    if (parts.length === 3) {
      let month = parseInt(parts[0]);
      let day = parseInt(parts[1]);
      let year = parseInt(parts[2]);

      // تصحيح السنة لو مكتوبة رقمين (مثلاً 26 تصبح 2026)
      if (year < 100) year += 2000;

      // إنشاء التاريخ (الترتيب في JS: Year, Month Index (0-11), Day)
      endDate = new Date(year, month - 1, day);
    }
  }

  // التأكد من صحة التاريخ
  const isValidDate = endDate instanceof Date && !isNaN(endDate);
  if (isValidDate) endDate.setHours(0, 0, 0, 0);

  // 3. القاعدة: Active = عقده لسه منتهىش (تاريخه اليوم أو في المستقبل)
  const isActiveByContract = isValidDate && endDate >= today;

  // 4. قاعدة الرواتب (صلة + بدون PO)
  const isSela = project.toLowerCase().includes("sela") || project.toLowerCase().includes("صلة");
  const hasNoPO = !row["PO Numbers"] || String(row["PO Numbers"]).trim() === "";
  const isEligibleForSalary = isActiveByContract || (isSela && hasNoPO);

  return {
    _id: i,
    name: row["Candidate Name"] || "Unknown",
    project,
    endDate: rawDate,
    totalPackage: pkg,
    monthlySalary: isEligibleForSalary ? pkg : 0,
    // بنبعت الحالة "Active" ككلمة عشان الـ App.jsx يقرأها
    status: isActiveByContract ? "Active" : "Expired",
    isEligibleForSalary
  };
}