-- =====================================================
-- FISHEYE — CSV Data Fix Script
-- Generated from employees_2026-05-25_1539.csv
-- Run in Supabase SQL Editor
-- =====================================================

-- Rajab Yasser Mohammed | EMP-0379 | CTR-0610
UPDATE employees_master
SET "contractId" = 'CTR-0610', name = 'Rajab Yasser Mohammed', email = 'P2.e@hotmail.com', phone = '+966595988727', "idNumber" = '2254669134', position = 'Field Verification & Collection Officer', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-06-01', "endDate" = '2027-06-01', bank = 'Bank Al-Jazira', iban = 'SA7660100007282117515001', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0379'
  AND (
    "contractId" = 'CTR-0610'
    OR (name ILIKE '%Rajab Yasser Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0610' AND name ILIKE '%Rajab Yasser Mohammed%'))
  );

-- Mawaddah Jeelani | EMP-0210 | CTR-0609
UPDATE employees_master
SET "contractId" = 'CTR-0609', name = 'Mawaddah Jeelani', email = 'mawadah.jeelani@gmail.com', phone = '+966568687490', "idNumber" = '1095861009', position = 'Contract Administrator Coordinator', project = 'Hall', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-05-01', "endDate" = '2026-06-30', bank = 'Al-Rajhi bank', iban = 'SA9480000198608016262810', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0210'
  AND (
    "contractId" = 'CTR-0609'
    OR (name ILIKE '%Mawaddah Jeelani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0609' AND name ILIKE '%Mawaddah Jeelani%'))
  );

-- Omar Nasr | EMP-0378 | CTR-0608
UPDATE employees_master
SET "contractId" = 'CTR-0608', name = 'Omar Nasr', email = 'onasri2020@gmail.com', phone = '+966532075156', "idNumber" = '2569703453', position = 'Accountant', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-06-21', "endDate" = '2027-06-20', bank = 'SAB  Bank', iban = 'SA9245000000602029787001', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0378'
  AND (
    "contractId" = 'CTR-0608'
    OR (name ILIKE '%Omar Nasr%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0608' AND name ILIKE '%Omar Nasr%'))
  );

-- IBRAHIM ALI EL SAYED | EMP-0377 | CTR-0607
UPDATE employees_master
SET "contractId" = 'CTR-0607', name = 'IBRAHIM ALI EL SAYED', email = 'ibrahimalyy@outlook.com', phone = '+966538460781', "idNumber" = '2594161982', position = 'Field Verification & Collection Officer', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-06-01', "endDate" = '2027-06-01', bank = 'AL RAJHI BANK', iban = 'SA1780000857608017623584', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0377'
  AND (
    "contractId" = 'CTR-0607'
    OR (name ILIKE '%IBRAHIM ALI EL SAYED%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0607' AND name ILIKE '%IBRAHIM ALI EL SAYED%'))
  );

-- Nasser Alakrash | EMP-0166 | CTR-0606
UPDATE employees_master
SET "contractId" = 'CTR-0606', name = 'Nasser Alakrash', email = 'nasser2020xd@gmail.com', phone = '+966501288772', "idNumber" = '1122298795', position = 'Site Operation Specialist', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-05-01', "endDate" = '2026-06-30', bank = 'Al Rajhi', iban = 'SA2980000653608016006975', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0166'
  AND (
    "contractId" = 'CTR-0606'
    OR (name ILIKE '%Nasser Alakrash%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0606' AND name ILIKE '%Nasser Alakrash%'))
  );

-- Naif Alqahtani | EMP-0165 | CTR-0605
UPDATE employees_master
SET "contractId" = 'CTR-0605', name = 'Naif Alqahtani', email = 'naif087@gmail.com', phone = '+966500954044', "idNumber" = '1098666314', position = 'Site Operation Specialist', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-05-01', "endDate" = '2026-06-30', bank = 'Al Rajhi', iban = 'SA0780000435608010104375', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0165'
  AND (
    "contractId" = 'CTR-0605'
    OR (name ILIKE '%Naif Alqahtani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0605' AND name ILIKE '%Naif Alqahtani%'))
  );

-- Ahmed Aljaser | EMP-0170 | CTR-0604
UPDATE employees_master
SET "contractId" = 'CTR-0604', name = 'Ahmed Aljaser', email = 'abugaser59@gmail.com', phone = '+966590908092', "idNumber" = '1112783426', position = 'Site Operation Specialist', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-05-01', "endDate" = '2026-06-30', bank = 'Al Rajhi', iban = 'SA97 8000 0318 6080 1008 5519', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0170'
  AND (
    "contractId" = 'CTR-0604'
    OR (name ILIKE '%Ahmed Aljaser%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0604' AND name ILIKE '%Ahmed Aljaser%'))
  );

-- Othman Alothman | EMP-0167 | CTR-0603
UPDATE employees_master
SET "contractId" = 'CTR-0603', name = 'Othman Alothman', email = 'othmanfahad.biz@gmail.com', phone = '+966563697179', position = 'Site Operation Specialist', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Pending', "startDate" = '2026-05-01', "endDate" = '2026-06-30', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0167'
  AND (
    "contractId" = 'CTR-0603'
    OR (name ILIKE '%Othman Alothman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0603' AND name ILIKE '%Othman Alothman%'))
  );

-- Sabah Alkhulaiwi | EMP-0376 | CTR-0602
UPDATE employees_master
SET "contractId" = 'CTR-0602', name = 'Sabah Alkhulaiwi', email = 'sabahfahad054@gmail.com', phone = '+966593816391', position = 'Asset Development Analyst', project = 'RECC', status = 'new', "workflowStatus" = 'Docs Requested', "startDate" = '2026-06-01', "endDate" = '2026-08-31', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0376'
  AND (
    "contractId" = 'CTR-0602'
    OR (name ILIKE '%Sabah Alkhulaiwi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0602' AND name ILIKE '%Sabah Alkhulaiwi%'))
  );

-- Abdulrahman Alasmari | EMP-0006 | CTR-0601
UPDATE employees_master
SET "contractId" = 'CTR-0601', name = 'Abdulrahman Alasmari', email = 'dhdh199@hotmail.com', phone = '+966 545323977', "idNumber" = '1103842363', position = 'project coordinator', project = 'irqah', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-04-25', "endDate" = '2026-07-24', bank = 'Al Rajhi', iban = 'SA2480000487608010601310', "requesterName" = 'Tahani', "poNumbers" = 'PO-36028'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0601'
    OR (name ILIKE '%Abdulrahman Alasmari%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0601' AND name ILIKE '%Abdulrahman Alasmari%'))
  );

-- Abdul Rahman Hazzazi | EMP-0375 | CTR-0600
UPDATE employees_master
SET "contractId" = 'CTR-0600', name = 'Abdul Rahman Hazzazi', email = 'Yesby10@hotmail.com', phone = '+966537783772', "idNumber" = '1104534688', position = 'Site Manager', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Docs Received', "startDate" = '2026-03-01', "endDate" = '2026-04-30', bank = 'Al Ahly', iban = 'SA2710000011100042999804H', "requesterName" = 'Tahani', "poNumbers" = 'PO-36043'
WHERE "employeeId" = 'EMP-0375'
  AND (
    "contractId" = 'CTR-0600'
    OR (name ILIKE '%Abdul Rahman Hazzazi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0600' AND name ILIKE '%Abdul Rahman Hazzazi%'))
  );

-- Ali Baqalb | EMP-0049 | CTR-0599
UPDATE employees_master
SET "contractId" = 'CTR-0599', name = 'Ali Baqalb', email = 'alibaqalb@gmail.com', "idNumber" = '2095055790', position = 'construction engineer', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-04-30', bank = 'SNB', iban = 'SA7910000020756218000101', "requesterName" = 'Tahani', "poNumbers" = 'PO-36043'
WHERE "employeeId" = 'EMP-0049'
  AND (
    "contractId" = 'CTR-0599'
    OR (name ILIKE '%Ali Baqalb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0599' AND name ILIKE '%Ali Baqalb%'))
  );

-- Salem Bawazeer | EMP-0051 | CTR-0598
UPDATE employees_master
SET "contractId" = 'CTR-0598', name = 'Salem Bawazeer', email = 'samb9_9@hotmail.com', "idNumber" = '2061397382', position = 'construction engineer', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-04-30', bank = 'Alinma', iban = 'SA7205000068202581208000', "requesterName" = 'Tahani', "poNumbers" = 'PO-36043'
WHERE "employeeId" = 'EMP-0051'
  AND (
    "contractId" = 'CTR-0598'
    OR (name ILIKE '%Salem Bawazeer%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0598' AND name ILIKE '%Salem Bawazeer%'))
  );

-- MUSTAFA IBRAHIM ABU-SAMRAH | EMP-0016 | CTR-0597
UPDATE employees_master
SET "contractId" = 'CTR-0597', name = 'MUSTAFA IBRAHIM ABU-SAMRAH', email = 'mustsam1@yahoo.com', phone = '+966545677444', "idNumber" = '2328763426', position = 'Production Consultant', project = 'RS-25 Theatres - #1662', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-03-23', "endDate" = '2026-04-30', bank = 'Alrajhi', iban = 'SA2080000463608010165694', "requesterName" = 'Rahaf Hashim'
WHERE "employeeId" = 'EMP-0016'
  AND (
    "contractId" = 'CTR-0597'
    OR (name ILIKE '%MUSTAFA IBRAHIM ABU-SAMRAH%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0597' AND name ILIKE '%MUSTAFA IBRAHIM ABU-SAMRAH%'))
  );

-- Abrar Abu Sham | EMP-0006 | CTR-0596
UPDATE employees_master
SET "contractId" = 'CTR-0596', name = 'Abrar Abu Sham', email = 'Abrar.Abusham@gmail.com', phone = '+966 562002655', "idNumber" = '1115575415', position = 'Event Specialist', project = 'U 17 PL women', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-23', "endDate" = '2026-09-22', bank = 'SNB', iban = 'SA4210000011100469011506', "requesterName" = 'SULTANA ALJUHANI', "poNumbers" = 'PO-35987'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0596'
    OR (name ILIKE '%Abrar Abu Sham%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0596' AND name ILIKE '%Abrar Abu Sham%'))
  );

-- Taif Tahlawi | EMP-0006 | CTR-0595
UPDATE employees_master
SET "contractId" = 'CTR-0595', name = 'Taif Tahlawi', email = 'teif.tahlawi@hotmail.com', "idNumber" = '1113345746', position = 'Event Specialist', project = 'U 17 PL women', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-04-23', "endDate" = '2026-09-22', bank = 'SNB', iban = 'SA9810000011100159651502', "requesterName" = 'SULTANA ALJUHANI', "poNumbers" = 'PO-35987'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0595'
    OR (name ILIKE '%Taif Tahlawi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0595' AND name ILIKE '%Taif Tahlawi%'))
  );

-- Toheed Ahmed Abdul Hameed | EMP-0332 | CTR-0552
UPDATE employees_master
SET "contractId" = 'CTR-0552', name = 'Toheed Ahmed Abdul Hameed', email = 'nm4860850@gmail.com', phone = '+966535131025', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0332'
  AND (
    "contractId" = 'CTR-0552'
    OR (name ILIKE '%Toheed Ahmed Abdul Hameed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0552' AND name ILIKE '%Toheed Ahmed Abdul Hameed%'))
  );

-- Muhammad Qayyum Muhammad Yaqoob | EMP-0338 | CTR-0558
UPDATE employees_master
SET "contractId" = 'CTR-0558', name = 'Muhammad Qayyum Muhammad Yaqoob', email = 'muhammadqayyum3838@gmail.co', phone = '+966561673838', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0338'
  AND (
    "contractId" = 'CTR-0558'
    OR (name ILIKE '%Muhammad Qayyum Muhammad Yaqoob%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0558' AND name ILIKE '%Muhammad Qayyum Muhammad Yaqoob%'))
  );

-- Kazim Ali Abdul Jabbar | EMP-0337 | CTR-0557
UPDATE employees_master
SET "contractId" = 'CTR-0557', name = 'Kazim Ali Abdul Jabbar', email = 'rai7700kazim@gmail.com', phone = '+966539840791', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0337'
  AND (
    "contractId" = 'CTR-0557'
    OR (name ILIKE '%Kazim Ali Abdul Jabbar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0557' AND name ILIKE '%Kazim Ali Abdul Jabbar%'))
  );

-- Zain Noor Noor Ahmad | EMP-0336 | CTR-0556
UPDATE employees_master
SET "contractId" = 'CTR-0556', name = 'Zain Noor Noor Ahmad', email = 'zaninoor4@gmail.com', phone = '+966582521041', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0336'
  AND (
    "contractId" = 'CTR-0556'
    OR (name ILIKE '%Zain Noor Noor Ahmad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0556' AND name ILIKE '%Zain Noor Noor Ahmad%'))
  );

-- Umar Farman Hashmi Faman Ali Shah | EMP-0335 | CTR-0555
UPDATE employees_master
SET "contractId" = 'CTR-0555', name = 'Umar Farman Hashmi Faman Ali Shah', email = 'syedu67678@gmail.com', phone = '+966547890025', position = 'Work and unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0335'
  AND (
    "contractId" = 'CTR-0555'
    OR (name ILIKE '%Umar Farman Hashmi Faman Ali Shah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0555' AND name ILIKE '%Umar Farman Hashmi Faman Ali Shah%'))
  );

-- Manzoor Khan Faqir Jan | EMP-0334 | CTR-0554
UPDATE employees_master
SET "contractId" = 'CTR-0554', name = 'Manzoor Khan Faqir Jan', email = 'manzoorkhanz519@gmail.com', phone = '+966508873749', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0334'
  AND (
    "contractId" = 'CTR-0554'
    OR (name ILIKE '%Manzoor Khan Faqir Jan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0554' AND name ILIKE '%Manzoor Khan Faqir Jan%'))
  );

-- Raja Jahanzaib Khan Raja Nazir Khan | EMP-0333 | CTR-0553
UPDATE employees_master
SET "contractId" = 'CTR-0553', name = 'Raja Jahanzaib Khan Raja Nazir Khan', email = 'jahanzaikhan122@gmail.com', phone = '+966581510588', position = 'Load and unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0333'
  AND (
    "contractId" = 'CTR-0553'
    OR (name ILIKE '%Raja Jahanzaib Khan Raja Nazir Khan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0553' AND name ILIKE '%Raja Jahanzaib Khan Raja Nazir Khan%'))
  );

-- Jamshed Ali Ghulam Rasool | EMP-0331 | CTR-0551
UPDATE employees_master
SET "contractId" = 'CTR-0551', name = 'Jamshed Ali Ghulam Rasool', email = 'ajamshed505@gmail.com', phone = '+966551682196', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0331'
  AND (
    "contractId" = 'CTR-0551'
    OR (name ILIKE '%Jamshed Ali Ghulam Rasool%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0551' AND name ILIKE '%Jamshed Ali Ghulam Rasool%'))
  );

-- Umar Farooq Muhammad Ishfaq | EMP-0330 | CTR-0550
UPDATE employees_master
SET "contractId" = 'CTR-0550', name = 'Umar Farooq Muhammad Ishfaq', email = 'umar05212@gmail.com', phone = '+966574487144', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0330'
  AND (
    "contractId" = 'CTR-0550'
    OR (name ILIKE '%Umar Farooq Muhammad Ishfaq%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0550' AND name ILIKE '%Umar Farooq Muhammad Ishfaq%'))
  );

-- Muhamamd Rehman Zulfiqar Ali | EMP-0365 | CTR-0585
UPDATE employees_master
SET "contractId" = 'CTR-0585', name = 'Muhamamd Rehman Zulfiqar Ali', email = 'muhammadrehman1935@gmail.com', phone = '+966582849840', position = 'Load and unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-15', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0365'
  AND (
    "contractId" = 'CTR-0585'
    OR (name ILIKE '%Muhamamd Rehman Zulfiqar Ali%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0585' AND name ILIKE '%Muhamamd Rehman Zulfiqar Ali%'))
  );

-- Nouman Ashraf Muhammad Ashraf | EMP-0367 | CTR-0587
UPDATE employees_master
SET "contractId" = 'CTR-0587', name = 'Nouman Ashraf Muhammad Ashraf', email = 'rananomi2457@gmail.com', phone = '+966552858659', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0367'
  AND (
    "contractId" = 'CTR-0587'
    OR (name ILIKE '%Nouman Ashraf Muhammad Ashraf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0587' AND name ILIKE '%Nouman Ashraf Muhammad Ashraf%'))
  );

-- Muhammad Ayub Muhammad Farooq Ahmed | EMP-0364 | CTR-0584
UPDATE employees_master
SET "contractId" = 'CTR-0584', name = 'Muhammad Ayub Muhammad Farooq Ahmed', email = 'ayubm783@gmail.com', phone = '+966599795781', position = 'Construction worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-15', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0364'
  AND (
    "contractId" = 'CTR-0584'
    OR (name ILIKE '%Muhammad Ayub Muhammad Farooq Ahmed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0584' AND name ILIKE '%Muhammad Ayub Muhammad Farooq Ahmed%'))
  );

-- Shahid Mulazim Mulazim Hussian | EMP-0369 | CTR-0589
UPDATE employees_master
SET "contractId" = 'CTR-0589', name = 'Shahid Mulazim Mulazim Hussian', email = 'rajashahidali78600@gmail.com', phone = '+966598867234', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-15', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0369'
  AND (
    "contractId" = 'CTR-0589'
    OR (name ILIKE '%Shahid Mulazim Mulazim Hussian%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0589' AND name ILIKE '%Shahid Mulazim Mulazim Hussian%'))
  );

-- Muhammad Shoaib Muhammad Amin | EMP-0366 | CTR-0586
UPDATE employees_master
SET "contractId" = 'CTR-0586', name = 'Muhammad Shoaib Muhammad Amin', email = 'shoaibamin020@gmail.com', phone = '+966535314853', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-18', "endDate" = '2027-04-17', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0366'
  AND (
    "contractId" = 'CTR-0586'
    OR (name ILIKE '%Muhammad Shoaib Muhammad Amin%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0586' AND name ILIKE '%Muhammad Shoaib Muhammad Amin%'))
  );

-- Siyab Gul Mukhatiar Gul | EMP-0370 | CTR-0590
UPDATE employees_master
SET "contractId" = 'CTR-0590', name = 'Siyab Gul Mukhatiar Gul', email = 'gul56568@gmail.com', phone = '+966535159376', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-15', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0370'
  AND (
    "contractId" = 'CTR-0590'
    OR (name ILIKE '%Siyab Gul Mukhatiar Gul%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0590' AND name ILIKE '%Siyab Gul Mukhatiar Gul%'))
  );

-- Obaid Ahmed Muhammad Parwez | EMP-0368 | CTR-0588
UPDATE employees_master
SET "contractId" = 'CTR-0588', name = 'Obaid Ahmed Muhammad Parwez', email = 'obaidahmed807@gmail.com', phone = '+966572952252', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0368'
  AND (
    "contractId" = 'CTR-0588'
    OR (name ILIKE '%Obaid Ahmed Muhammad Parwez%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0588' AND name ILIKE '%Obaid Ahmed Muhammad Parwez%'))
  );

-- Muhammad Qasim Aurangzaib Khan | EMP-0362 | CTR-0582
UPDATE employees_master
SET "contractId" = 'CTR-0582', name = 'Muhammad Qasim Aurangzaib Khan', email = 'muhammadqasimq284@gmail.com', phone = '+966545108500', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0362'
  AND (
    "contractId" = 'CTR-0582'
    OR (name ILIKE '%Muhammad Qasim Aurangzaib Khan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0582' AND name ILIKE '%Muhammad Qasim Aurangzaib Khan%'))
  );

-- Waqas Bashah Mujahid | EMP-0372 | CTR-0592
UPDATE employees_master
SET "contractId" = 'CTR-0592', name = 'Waqas Bashah Mujahid', email = 'bachawaqas243@gmail.com', phone = '+966535036219', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-15', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0372'
  AND (
    "contractId" = 'CTR-0592'
    OR (name ILIKE '%Waqas Bashah Mujahid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0592' AND name ILIKE '%Waqas Bashah Mujahid%'))
  );

-- Muhammad Nabeel Muhammad Akram | EMP-0361 | CTR-0581
UPDATE employees_master
SET "contractId" = 'CTR-0581', name = 'Muhammad Nabeel Muhammad Akram', email = 'm.nabeel81075@gmail.com', phone = '+966598584542', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0361'
  AND (
    "contractId" = 'CTR-0581'
    OR (name ILIKE '%Muhammad Nabeel Muhammad Akram%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0581' AND name ILIKE '%Muhammad Nabeel Muhammad Akram%'))
  );

-- Muhammad Farooq Ashiq Hussain | EMP-0360 | CTR-0580
UPDATE employees_master
SET "contractId" = 'CTR-0580', name = 'Muhammad Farooq Ashiq Hussain', email = 'mf806071@gmail.com', phone = '+966596871435', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0360'
  AND (
    "contractId" = 'CTR-0580'
    OR (name ILIKE '%Muhammad Farooq Ashiq Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0580' AND name ILIKE '%Muhammad Farooq Ashiq Hussain%'))
  );

-- Muhammad Azhar Iqbal Javed Iqbal | EMP-0359 | CTR-0579
UPDATE employees_master
SET "contractId" = 'CTR-0579', name = 'Muhammad Azhar Iqbal Javed Iqbal', email = 'chazhardon8811@gmail.com', phone = '+966574813317', position = 'Load and unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0359'
  AND (
    "contractId" = 'CTR-0579'
    OR (name ILIKE '%Muhammad Azhar Iqbal Javed Iqbal%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0579' AND name ILIKE '%Muhammad Azhar Iqbal Javed Iqbal%'))
  );

-- Monir Hossain Mozaffar Hossain | EMP-0363 | CTR-0583
UPDATE employees_master
SET "contractId" = 'CTR-0583', name = 'Monir Hossain Mozaffar Hossain', email = 'muneerhussain9018@gmail.com', phone = '+966562938726', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0363'
  AND (
    "contractId" = 'CTR-0583'
    OR (name ILIKE '%Monir Hossain Mozaffar Hossain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0583' AND name ILIKE '%Monir Hossain Mozaffar Hossain%'))
  );

-- Ishfaq Ahmed Muhammad Ishfaq | EMP-0358 | CTR-0578
UPDATE employees_master
SET "contractId" = 'CTR-0578', name = 'Ishfaq Ahmed Muhammad Ishfaq', email = 'ishfaqahmed.ia80@gmail.com', phone = '+96658006995', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0358'
  AND (
    "contractId" = 'CTR-0578'
    OR (name ILIKE '%Ishfaq Ahmed Muhammad Ishfaq%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0578' AND name ILIKE '%Ishfaq Ahmed Muhammad Ishfaq%'))
  );

-- Yasir Ali Saeed Ullah | EMP-0373 | CTR-0593
UPDATE employees_master
SET "contractId" = 'CTR-0593', name = 'Yasir Ali Saeed Ullah', email = 'yasirali80578@gmail.com', phone = '+966583379147', position = 'Construction worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-15', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0373'
  AND (
    "contractId" = 'CTR-0593'
    OR (name ILIKE '%Yasir Ali Saeed Ullah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0593' AND name ILIKE '%Yasir Ali Saeed Ullah%'))
  );

-- Husnain Rana Muhammad Sarwar | EMP-0357 | CTR-0577
UPDATE employees_master
SET "contractId" = 'CTR-0577', name = 'Husnain Rana Muhammad Sarwar', email = 'husnainrana367@gmail.com', phone = '+966558170311', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0357'
  AND (
    "contractId" = 'CTR-0577'
    OR (name ILIKE '%Husnain Rana Muhammad Sarwar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0577' AND name ILIKE '%Husnain Rana Muhammad Sarwar%'))
  );

-- Hassan Akhtar Muhammad Akhtar | EMP-0356 | CTR-0576
UPDATE employees_master
SET "contractId" = 'CTR-0576', name = 'Hassan Akhtar Muhammad Akhtar', email = 'hassanakhterhassanakhter715@gmail.com', phone = '+966544321738', position = 'Load and Unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0356'
  AND (
    "contractId" = 'CTR-0576'
    OR (name ILIKE '%Hassan Akhtar Muhammad Akhtar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0576' AND name ILIKE '%Hassan Akhtar Muhammad Akhtar%'))
  );

-- Haris Mehmood Muhammad Faraz | EMP-0355 | CTR-0575
UPDATE employees_master
SET "contractId" = 'CTR-0575', name = 'Haris Mehmood Muhammad Faraz', email = 'harissatti293@gmail.com', phone = '+966542008721', position = 'Load and Unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0355'
  AND (
    "contractId" = 'CTR-0575'
    OR (name ILIKE '%Haris Mehmood Muhammad Faraz%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0575' AND name ILIKE '%Haris Mehmood Muhammad Faraz%'))
  );

-- Haider Ali Sher Alam | EMP-0354 | CTR-0574
UPDATE employees_master
SET "contractId" = 'CTR-0574', name = 'Haider Ali Sher Alam', email = 'haiderali5205200@gmail.com', phone = '+966531203932', position = 'Load and Unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0354'
  AND (
    "contractId" = 'CTR-0574'
    OR (name ILIKE '%Haider Ali Sher Alam%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0574' AND name ILIKE '%Haider Ali Sher Alam%'))
  );

-- Usman Zaheer Zaheer Akhtar | EMP-0371 | CTR-0591
UPDATE employees_master
SET "contractId" = 'CTR-0591', name = 'Usman Zaheer Zaheer Akhtar', email = 'usmanzaheer581@gmail.com', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-15', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0371'
  AND (
    "contractId" = 'CTR-0591'
    OR (name ILIKE '%Usman Zaheer Zaheer Akhtar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0591' AND name ILIKE '%Usman Zaheer Zaheer Akhtar%'))
  );

-- Azhar Shabbir Shabbir Ahmed | EMP-0353 | CTR-0573
UPDATE employees_master
SET "contractId" = 'CTR-0573', name = 'Azhar Shabbir Shabbir Ahmed', email = 'azharshabbir9659@gmail.com', phone = '+966544547765', position = 'Load and Unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0353'
  AND (
    "contractId" = 'CTR-0573'
    OR (name ILIKE '%Azhar Shabbir Shabbir Ahmed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0573' AND name ILIKE '%Azhar Shabbir Shabbir Ahmed%'))
  );

-- Atif Mehmood Allah Rakha | EMP-0352 | CTR-0572
UPDATE employees_master
SET "contractId" = 'CTR-0572', name = 'Atif Mehmood Allah Rakha', email = 'atifbabu86868@gmail.com', phone = '+966538509424', position = 'Load and Unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0352'
  AND (
    "contractId" = 'CTR-0572'
    OR (name ILIKE '%Atif Mehmood Allah Rakha%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0572' AND name ILIKE '%Atif Mehmood Allah Rakha%'))
  );

-- Anam Ur Rehman Muhammad Yaqoob | EMP-0351 | CTR-0571
UPDATE employees_master
SET "contractId" = 'CTR-0571', name = 'Anam Ur Rehman Muhammad Yaqoob', email = 'anaamyaqoob@gmail.com', phone = '+966568837940', position = 'Load and Unload Worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0351'
  AND (
    "contractId" = 'CTR-0571'
    OR (name ILIKE '%Anam Ur Rehman Muhammad Yaqoob%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0571' AND name ILIKE '%Anam Ur Rehman Muhammad Yaqoob%'))
  );

-- Ali Hamza Muhammad Arif | EMP-0350 | CTR-0570
UPDATE employees_master
SET "contractId" = 'CTR-0570', name = 'Ali Hamza Muhammad Arif', email = 'alihamza37366@gmail.com', phone = '+966549325294', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0350'
  AND (
    "contractId" = 'CTR-0570'
    OR (name ILIKE '%Ali Hamza Muhammad Arif%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0570' AND name ILIKE '%Ali Hamza Muhammad Arif%'))
  );

-- Adnan Ali Muhammad Arif | EMP-0349 | CTR-0569
UPDATE employees_master
SET "contractId" = 'CTR-0569', name = 'Adnan Ali Muhammad Arif', email = 'adnansanwal3515@gmail.com', phone = '+966549322638', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-15', "endDate" = '2026-10-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0349'
  AND (
    "contractId" = 'CTR-0569'
    OR (name ILIKE '%Adnan Ali Muhammad Arif%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0569' AND name ILIKE '%Adnan Ali Muhammad Arif%'))
  );

-- Haroon Elahi Qayyum Ellahi | EMP-0348 | CTR-0568
UPDATE employees_master
SET "contractId" = 'CTR-0568', name = 'Haroon Elahi Qayyum Ellahi', email = 'haroonelahi590@gmail.com', phone = '+966574108577', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0348'
  AND (
    "contractId" = 'CTR-0568'
    OR (name ILIKE '%Haroon Elahi Qayyum Ellahi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0568' AND name ILIKE '%Haroon Elahi Qayyum Ellahi%'))
  );

-- Shahid Imran Elahi Bukhsh | EMP-0347 | CTR-0567
UPDATE employees_master
SET "contractId" = 'CTR-0567', name = 'Shahid Imran Elahi Bukhsh', email = 'shahidimransanjok@gmail.com', phone = '+966574267300', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0347'
  AND (
    "contractId" = 'CTR-0567'
    OR (name ILIKE '%Shahid Imran Elahi Bukhsh%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0567' AND name ILIKE '%Shahid Imran Elahi Bukhsh%'))
  );

-- Muhammad Bilal Jahangir Muhammad | EMP-0346 | CTR-0566
UPDATE employees_master
SET "contractId" = 'CTR-0566', name = 'Muhammad Bilal Jahangir Muhammad', email = 'bilaljhangeer12345@gmail.com', phone = '+966574241727', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0346'
  AND (
    "contractId" = 'CTR-0566'
    OR (name ILIKE '%Muhammad Bilal Jahangir Muhammad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0566' AND name ILIKE '%Muhammad Bilal Jahangir Muhammad%'))
  );

-- Yasir Sawar Muhammad Sarwar | EMP-0374 | CTR-0594
UPDATE employees_master
SET "contractId" = 'CTR-0594', name = 'Yasir Sawar Muhammad Sarwar', email = 'yasirabbsi60@gmail.com', phone = '+966572821520', position = 'Construction worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-16', "endDate" = '2027-04-14', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0374'
  AND (
    "contractId" = 'CTR-0594'
    OR (name ILIKE '%Yasir Sawar Muhammad Sarwar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0594' AND name ILIKE '%Yasir Sawar Muhammad Sarwar%'))
  );

-- Muhammad Tayyab Ghulam Ghous | EMP-0345 | CTR-0565
UPDATE employees_master
SET "contractId" = 'CTR-0565', name = 'Muhammad Tayyab Ghulam Ghous', email = 'muhammadumair321654@gmail.co', phone = '+966595495281', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0345'
  AND (
    "contractId" = 'CTR-0565'
    OR (name ILIKE '%Muhammad Tayyab Ghulam Ghous%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0565' AND name ILIKE '%Muhammad Tayyab Ghulam Ghous%'))
  );

-- Muhammad Sohail Talib Hussain | EMP-0344 | CTR-0564
UPDATE employees_master
SET "contractId" = 'CTR-0564', name = 'Muhammad Sohail Talib Hussain', email = 'sohail.mz312@gmail.com', phone = '+966541323639', position = 'Load and Unload woker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0344'
  AND (
    "contractId" = 'CTR-0564'
    OR (name ILIKE '%Muhammad Sohail Talib Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0564' AND name ILIKE '%Muhammad Sohail Talib Hussain%'))
  );

-- Waris Khan Feroz Khan | EMP-0343 | CTR-0563
UPDATE employees_master
SET "contractId" = 'CTR-0563', name = 'Waris Khan Feroz Khan', email = 'wk5661167@gmail.com', phone = '+966574252905', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0343'
  AND (
    "contractId" = 'CTR-0563'
    OR (name ILIKE '%Waris Khan Feroz Khan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0563' AND name ILIKE '%Waris Khan Feroz Khan%'))
  );

-- Zohaib Akhtar Tahir Nadeem Akhtar | EMP-0342 | CTR-0562
UPDATE employees_master
SET "contractId" = 'CTR-0562', name = 'Zohaib Akhtar Tahir Nadeem Akhtar', email = 'zohaibakhtar366@gmail.com', phone = '+966547890622', position = 'Load and unload work', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0342'
  AND (
    "contractId" = 'CTR-0562'
    OR (name ILIKE '%Zohaib Akhtar Tahir Nadeem Akhtar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0562' AND name ILIKE '%Zohaib Akhtar Tahir Nadeem Akhtar%'))
  );

-- Muhammad Yasir Muhammad Arif | EMP-0341 | CTR-0561
UPDATE employees_master
SET "contractId" = 'CTR-0561', name = 'Muhammad Yasir Muhammad Arif', email = 'malikyaasir0014@gmail.com', phone = '+966535235476', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0341'
  AND (
    "contractId" = 'CTR-0561'
    OR (name ILIKE '%Muhammad Yasir Muhammad Arif%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0561' AND name ILIKE '%Muhammad Yasir Muhammad Arif%'))
  );

-- Muhammad Usman Abdulaziz | EMP-0340 | CTR-0560
UPDATE employees_master
SET "contractId" = 'CTR-0560', name = 'Muhammad Usman Abdulaziz', email = 'usman2750097@gmail.com', phone = '+966598086017', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0340'
  AND (
    "contractId" = 'CTR-0560'
    OR (name ILIKE '%Muhammad Usman Abdulaziz%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0560' AND name ILIKE '%Muhammad Usman Abdulaziz%'))
  );

-- Muhammad Iftikhar Muhammad Ilyas | EMP-0339 | CTR-0559
UPDATE employees_master
SET "contractId" = 'CTR-0559', name = 'Muhammad Iftikhar Muhammad Ilyas', email = 'miftkhar13101@gmail.com', phone = '+966592122931', position = 'Load and unload worker', project = 'Riva Engineering', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2026-04-12', "endDate" = '2026-10-11', "requesterName" = 'Mohamed Jamal'
WHERE "employeeId" = 'EMP-0339'
  AND (
    "contractId" = 'CTR-0559'
    OR (name ILIKE '%Muhammad Iftikhar Muhammad Ilyas%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0559' AND name ILIKE '%Muhammad Iftikhar Muhammad Ilyas%'))
  );

-- Razan Aljabri | EMP-0171 | CTR-0549
UPDATE employees_master
SET "contractId" = 'CTR-0549', name = 'Razan Aljabri', email = 'razanaljabri@gmail.com', phone = '+966544082479', "idNumber" = '1123182394', position = 'destination coordinator', project = 'Planning & Development', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-05-01', "endDate" = '2026-08-31', bank = 'Saudi National Bank', iban = 'SA4810000015675030000106', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0171'
  AND (
    "contractId" = 'CTR-0549'
    OR (name ILIKE '%Razan Aljabri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0549' AND name ILIKE '%Razan Aljabri%'))
  );

-- Mohamed Sayed Mohamed Elshrkawy | EMP-0329 | CTR-0548
UPDATE employees_master
SET "contractId" = 'CTR-0548', name = 'Mohamed Sayed Mohamed Elshrkawy', email = 'mohamedelshrkawii234@gmail.com', phone = '+966 56 979 7413', "idNumber" = '2606505333', position = 'Junior Accountant', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-06-01', "endDate" = '2027-06-01', bank = 'Al Rajhi', iban = 'SA8080000859608016747507', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0329'
  AND (
    "contractId" = 'CTR-0548'
    OR (name ILIKE '%Mohamed Sayed Mohamed Elshrkawy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0548' AND name ILIKE '%Mohamed Sayed Mohamed Elshrkawy%'))
  );

-- FARDEEN AHMED | EMP-0328 | CTR-0547
UPDATE employees_master
SET "contractId" = 'CTR-0547', name = 'FARDEEN AHMED', email = 'meetfardeenahmed@gmail.com', phone = '+966503679565', "idNumber" = '2515758163', position = 'Junior Accountant', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-05-10', "endDate" = '2027-05-09', bank = 'Al Rajhi Bank', iban = 'SA7080000991608016529142', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0328'
  AND (
    "contractId" = 'CTR-0547'
    OR (name ILIKE '%FARDEEN AHMED%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0547' AND name ILIKE '%FARDEEN AHMED%'))
  );

-- ABDULRAHMAN SURKATI | EMP-0327 | CTR-0546
UPDATE employees_master
SET "contractId" = 'CTR-0546', name = 'ABDULRAHMAN SURKATI', email = 'soorka18@gmail.com', phone = '+966 56 638 2988', "idNumber" = '2116746187', position = 'Junior Accountant', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-06-01', "endDate" = '2027-05-31', bank = 'Al Ahli bank SNB', iban = 'SA9810000011100311113801', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0327'
  AND (
    "contractId" = 'CTR-0546'
    OR (name ILIKE '%ABDULRAHMAN SURKATI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0546' AND name ILIKE '%ABDULRAHMAN SURKATI%'))
  );

-- AHMED MOHAMED IBRAHIM MANSY | EMP-0326 | CTR-0545
UPDATE employees_master
SET "contractId" = 'CTR-0545', name = 'AHMED MOHAMED IBRAHIM MANSY', email = 'Ahmedeldesouky2007@gmail.com', phone = '+966 53 943 0397', "idNumber" = '2578836559', position = 'Accountant', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-06-01', "endDate" = '2027-06-01', bank = 'Al Rajhi bank', iban = 'SA5180000539608018889493', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0326'
  AND (
    "contractId" = 'CTR-0545'
    OR (name ILIKE '%AHMED MOHAMED IBRAHIM MANSY%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0545' AND name ILIKE '%AHMED MOHAMED IBRAHIM MANSY%'))
  );

-- Majed Hassan | EMP-0325 | CTR-0544
UPDATE employees_master
SET "contractId" = 'CTR-0544', name = 'Majed Hassan', email = 'm.aladawi@projects.sela.sa', phone = '+966 55 646 0752', "idNumber" = '1107391607', position = 'POS Operator', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-05-01', "endDate" = '2026-05-31', bank = 'AL Rajhi Bank', iban = 'SA2480000857608010535959', "requesterName" = 'Tahani', "poNumbers" = 'PO-35920'
WHERE "employeeId" = 'EMP-0325'
  AND (
    "contractId" = 'CTR-0544'
    OR (name ILIKE '%Majed Hassan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0544' AND name ILIKE '%Majed Hassan%'))
  );

-- Mortadh Alnakhli | EMP-0321 | CTR-0540
UPDATE employees_master
SET "contractId" = 'CTR-0540', name = 'Mortadh Alnakhli', email = 'mortadha.125329@gmail.com', phone = '+996547949820', "idNumber" = '1102408190', position = 'Operation & Reporting specialist', project = 'via riyadh', status = 'active', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-05-01', "endDate" = '2026-12-31', bank = 'Saudi National Bank', iban = 'SA1110000011100011157902', "requesterName" = 'Banan'
WHERE "employeeId" = 'EMP-0321'
  AND (
    "contractId" = 'CTR-0540'
    OR (name ILIKE '%Mortadh Alnakhli%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0540' AND name ILIKE '%Mortadh Alnakhli%'))
  );

-- Abdullah Bin Hesn | EMP-0322 | CTR-0541
UPDATE employees_master
SET "contractId" = 'CTR-0541', name = 'Abdullah Bin Hesn', email = 'aboodbanhesn@gmai.com', phone = '+966531319514', position = 'Operation & Reporting specialist', project = 'via riyadh', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2026-05-01', "endDate" = '2026-12-31', "requesterName" = 'Banan'
WHERE "employeeId" = 'EMP-0322'
  AND (
    "contractId" = 'CTR-0541'
    OR (name ILIKE '%Abdullah Bin Hesn%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0541' AND name ILIKE '%Abdullah Bin Hesn%'))
  );

-- Enas Afana | EMP-0320 | CTR-0539
UPDATE employees_master
SET "contractId" = 'CTR-0539', name = 'Enas Afana', email = 'e.abed1991@gmail.com', phone = '+966569443372', "idNumber" = '2017322955', position = 'Reporting senior specialist', project = 'JYC', status = 'active', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-05-01', "endDate" = '2026-12-31', bank = 'Al Rajhi Bank', iban = 'SA3080000355608017782989', "requesterName" = 'Banan'
WHERE "employeeId" = 'EMP-0320'
  AND (
    "contractId" = 'CTR-0539'
    OR (name ILIKE '%Enas Afana%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0539' AND name ILIKE '%Enas Afana%'))
  );

-- Abdulmajeed Aseeri | EMP-0324 | CTR-0543
UPDATE employees_master
SET "contractId" = 'CTR-0543', name = 'Abdulmajeed Aseeri', email = 'mjoode_11@outlook.com', phone = '+966531293312', position = 'Operation & Reporting specialist', project = 'JYC', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2026-05-01', "endDate" = '2026-12-31', "requesterName" = 'Banan'
WHERE "employeeId" = 'EMP-0324'
  AND (
    "contractId" = 'CTR-0543'
    OR (name ILIKE '%Abdulmajeed Aseeri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0543' AND name ILIKE '%Abdulmajeed Aseeri%'))
  );

-- Abdulrauof Aseri | EMP-0323 | CTR-0542
UPDATE employees_master
SET "contractId" = 'CTR-0542', name = 'Abdulrauof Aseri', email = 'abdulraouf7788@gmail.com', phone = '+966570927677', position = 'Operation & Reporting specialist', project = 'JYC', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2026-05-01', "endDate" = '2026-12-31', "requesterName" = 'Banan'
WHERE "employeeId" = 'EMP-0323'
  AND (
    "contractId" = 'CTR-0542'
    OR (name ILIKE '%Abdulrauof Aseri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0542' AND name ILIKE '%Abdulrauof Aseri%'))
  );

-- Ahmad Wahba | EMP-0006 | CTR-0538
UPDATE employees_master
SET "contractId" = 'CTR-0538', name = 'Ahmad Wahba', email = 'wahba.strategy@gmail.com', phone = '+966533224400', "idNumber" = '2126600440', position = 'Marketing Strategy Lead', project = 'ROS - #1630', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'SNB', iban = 'SA9410000012294384000108', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-36063'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0538'
    OR (name ILIKE '%Ahmad Wahba%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0538' AND name ILIKE '%Ahmad Wahba%'))
  );

-- Gouda Badran | EMP-0006 | CTR-0537
UPDATE employees_master
SET "contractId" = 'CTR-0537', name = 'Gouda Badran', email = 'gsbadran1@gmail.com', position = 'visualization specialist', project = 'RS-25 Theatres - #1662', status = 'renewal', "workflowStatus" = 'Pending', "startDate" = '2026-04-01', "endDate" = '2026-04-10', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-36083'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0537'
    OR (name ILIKE '%Gouda Badran%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0537' AND name ILIKE '%Gouda Badran%'))
  );

-- Mohammed Ehab | EMP-0005 | CTR-0536
UPDATE employees_master
SET "contractId" = 'CTR-0536', name = 'Mohammed Ehab', email = 'mohamedehab2000.me@gmail.com', phone = '+20 12 34508044', "idNumber" = 'A40735481', position = 'visualization specialist', project = 'RS-25 Theatres - #1662', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-01', "endDate" = '2026-04-30', iban = 'EG600002011301130203000000855', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-36083'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0536'
    OR (name ILIKE '%Mohammed Ehab%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0536' AND name ILIKE '%Mohammed Ehab%'))
  );

-- Islam Nagi | EMP-0130 | CTR-0535
UPDATE employees_master
SET "contractId" = 'CTR-0535', name = 'Islam Nagi', email = 'number-ones@hotmail.com', phone = '+966 50 680 6257', position = 'art director', project = 'RS-25 Theatres - #1662', status = 'renewal', "workflowStatus" = 'Pending', "startDate" = '2026-04-01', "endDate" = '2026-04-30', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-36083'
WHERE "employeeId" = 'EMP-0130'
  AND (
    "contractId" = 'CTR-0535'
    OR (name ILIKE '%Islam Nagi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0535' AND name ILIKE '%Islam Nagi%'))
  );

-- Salahaddin Younis | EMP-0181 | CTR-0534
UPDATE employees_master
SET "contractId" = 'CTR-0534', name = 'Salahaddin Younis', email = 'sala71992@gmail.com', phone = '+966 53 805 7670', "idNumber" = '2095549859', position = 'Architect', project = 'RS-25 Theatres - #1662', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'Alinma bank', iban = 'SA6405000068200441354000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-36083'
WHERE "employeeId" = 'EMP-0181'
  AND (
    "contractId" = 'CTR-0534'
    OR (name ILIKE '%Salahaddin Younis%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0534' AND name ILIKE '%Salahaddin Younis%'))
  );

-- Bushra Jubarah | EMP-0127 | CTR-0533
UPDATE employees_master
SET "contractId" = 'CTR-0533', name = 'Bushra Jubarah', email = 'bushra@bushrajubarah.com', phone = '‪+966 50 102 9093‬', "idNumber" = '2057095495', position = 'Visual & Motion Art Lead', project = 'RS-25 Theatres - #1662', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-04-10', bank = 'alrajhi bank', iban = 'SA4980000243608016026921', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-36083'
WHERE "employeeId" = 'EMP-0127'
  AND (
    "contractId" = 'CTR-0533'
    OR (name ILIKE '%Bushra Jubarah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0533' AND name ILIKE '%Bushra Jubarah%'))
  );

-- Ahmed Ibrahim Algendy | EMP-0182 | CTR-0532
UPDATE employees_master
SET "contractId" = 'CTR-0532', name = 'Ahmed Ibrahim Algendy', email = 'ahmed.ibrahim.gendy@gmail.com', phone = '+20 112 184 7767', "idNumber" = 'A34917668', position = 'Senior Motion Graphic Designer', project = 'RS-25 Theatres - #1662', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'Bank Misr', iban = 'EG880002044704470202000001501', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-36083'
WHERE "employeeId" = 'EMP-0182'
  AND (
    "contractId" = 'CTR-0532'
    OR (name ILIKE '%Ahmed Ibrahim Algendy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0532' AND name ILIKE '%Ahmed Ibrahim Algendy%'))
  );

-- Ahmed Aljaser | EMP-0170 | CTR-0531
UPDATE employees_master
SET "contractId" = 'CTR-0531', name = 'Ahmed Aljaser', email = 'abugaser59@gmail.com', phone = '+966590908092', "idNumber" = '1112783426', position = 'security supervisor', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'Al Rajhi', iban = 'SA97 8000 0318 6080 1008 5519', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0170'
  AND (
    "contractId" = 'CTR-0531'
    OR (name ILIKE '%Ahmed Aljaser%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0531' AND name ILIKE '%Ahmed Aljaser%'))
  );

-- Musallam Yahya | EMP-0318 | CTR-0529
UPDATE employees_master
SET "contractId" = 'CTR-0529', name = 'Musallam Yahya', email = 'musallamdiab@gmail.com', phone = '+966541979101', "idNumber" = '2147711424', position = 'Accountant', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-05-03', "endDate" = '2027-05-02', bank = 'Alrajhi', iban = 'SA1080000856608015255893', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0318'
  AND (
    "contractId" = 'CTR-0529'
    OR (name ILIKE '%Musallam Yahya%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0529' AND name ILIKE '%Musallam Yahya%'))
  );

-- Abdelmomen Murtada | EMP-0317 | CTR-0528
UPDATE employees_master
SET "contractId" = 'CTR-0528', name = 'Abdelmomen Murtada', email = 'momenmurtada@gmail.com', phone = '+966 593 530 857', "idNumber" = '2514984786', position = 'Accountant', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-06-01', "endDate" = '2027-06-01', bank = 'SNB', iban = 'SA5610000011100263511710', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0317'
  AND (
    "contractId" = 'CTR-0528'
    OR (name ILIKE '%Abdelmomen Murtada%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0528' AND name ILIKE '%Abdelmomen Murtada%'))
  );

-- Riyadh Ziyad Salamah Abu Yusuf | EMP-0316 | CTR-0527
UPDATE employees_master
SET "contractId" = 'CTR-0527', name = 'Riyadh Ziyad Salamah Abu Yusuf', email = 'Riyadh2019010@gmail.com', phone = '+966555036371', "idNumber" = '2147748343', position = 'Electrical Engineer', project = 'Ala Khotah', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-06-30', bank = 'AL RAJHI BANK', iban = 'SA4680000609608016100146', "requesterName" = 'Tahani', "poNumbers" = 'PO-36032'
WHERE "employeeId" = 'EMP-0316'
  AND (
    "contractId" = 'CTR-0527'
    OR (name ILIKE '%Riyadh Ziyad Salamah Abu Yusuf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0527' AND name ILIKE '%Riyadh Ziyad Salamah Abu Yusuf%'))
  );

-- WAEL ABOUZEID | EMP-0315 | CTR-0526
UPDATE employees_master
SET "contractId" = 'CTR-0526', name = 'WAEL ABOUZEID', email = 'wael.abouzeid@gmail.com', phone = '+966 551293322', position = 'CEO', project = 'CEO', status = 'transfer', "workflowStatus" = 'Pending', "startDate" = '2026-04-01', "endDate" = '2027-03-31', "requesterName" = 'Nessma'
WHERE "employeeId" = 'EMP-0315'
  AND (
    "contractId" = 'CTR-0526'
    OR (name ILIKE '%WAEL ABOUZEID%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0526' AND name ILIKE '%WAEL ABOUZEID%'))
  );

-- Ahmed alshanqeeti | EMP-0199 | CTR-0525
UPDATE employees_master
SET "contractId" = 'CTR-0525', name = 'Ahmed alshanqeeti', email = 'Alshanqeeti.ahmed@gmail.com', phone = '+966 581230128', "idNumber" = '1105745853', position = 'Site Manager', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-05', "endDate" = '2026-05-31', bank = 'Alinma Bank', iban = 'SA0405000068202166632000', "requesterName" = 'Tahani', "poNumbers" = 'PO-35753'
WHERE "employeeId" = 'EMP-0199'
  AND (
    "contractId" = 'CTR-0525'
    OR (name ILIKE '%Ahmed alshanqeeti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0525' AND name ILIKE '%Ahmed alshanqeeti%'))
  );

-- Khalid alzahrani | EMP-0200 | CTR-0524
UPDATE employees_master
SET "contractId" = 'CTR-0524', name = 'Khalid alzahrani', email = 'kahlid1441@gmail.com', phone = '+966593870531', "idNumber" = '1098091836', position = 'Site Manager', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-05', "endDate" = '2026-05-31', bank = 'Alinma', iban = 'SA1205000068200384485000', "requesterName" = 'Tahani', "poNumbers" = 'PO-35753'
WHERE "employeeId" = 'EMP-0200'
  AND (
    "contractId" = 'CTR-0524'
    OR (name ILIKE '%Khalid alzahrani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0524' AND name ILIKE '%Khalid alzahrani%'))
  );

-- Ibrahim alalkami | EMP-0201 | CTR-0523
UPDATE employees_master
SET "contractId" = 'CTR-0523', name = 'Ibrahim alalkami', email = 'IbrahimAlalkami11@gmail.com', phone = '+966 548700655', "idNumber" = '1083942555', position = 'Site Manager', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-05', "endDate" = '2026-05-31', bank = 'alahli', iban = 'SA2110000043500000046401', "requesterName" = 'Tahani', "poNumbers" = 'PO-35753'
WHERE "employeeId" = 'EMP-0201'
  AND (
    "contractId" = 'CTR-0523'
    OR (name ILIKE '%Ibrahim alalkami%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0523' AND name ILIKE '%Ibrahim alalkami%'))
  );

-- Saleh Baqalb | EMP-0048 | CTR-0522
UPDATE employees_master
SET "contractId" = 'CTR-0522', name = 'Saleh Baqalb', email = 'sabagalb@gmail.com', "idNumber" = '2159198973', position = 'site manager', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'Alinma', iban = 'SA7805000068204832458000', "requesterName" = 'Tahani', "poNumbers" = 'PO-35753'
WHERE "employeeId" = 'EMP-0048'
  AND (
    "contractId" = 'CTR-0522'
    OR (name ILIKE '%Saleh Baqalb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0522' AND name ILIKE '%Saleh Baqalb%'))
  );

-- Abdulaziz Saleh | EMP-0050 | CTR-0521
UPDATE employees_master
SET "contractId" = 'CTR-0521', name = 'Abdulaziz Saleh', email = 'az.s.a@hotmail.com', "idNumber" = '2118011739', position = 'site manager', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'SNB', iban = 'SA1310000022500000031202', "requesterName" = 'Tahani', "poNumbers" = 'PO-35753'
WHERE "employeeId" = 'EMP-0050'
  AND (
    "contractId" = 'CTR-0521'
    OR (name ILIKE '%Abdulaziz Saleh%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0521' AND name ILIKE '%Abdulaziz Saleh%'))
  );

-- Faisal Alotaibi | EMP-0045 | CTR-0520
UPDATE employees_master
SET "contractId" = 'CTR-0520', name = 'Faisal Alotaibi', email = 'Faisal.k.alotaibi@hotmail.com', phone = '+966 55 529 9045', "idNumber" = '1099610758', position = 'Zone Manager', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'Al Rajhi', iban = 'SA0580000647608016009259', "requesterName" = 'Tahani', "poNumbers" = 'PO-35753'
WHERE "employeeId" = 'EMP-0045'
  AND (
    "contractId" = 'CTR-0520'
    OR (name ILIKE '%Faisal Alotaibi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0520' AND name ILIKE '%Faisal Alotaibi%'))
  );

-- MUHAMMAD AHMED KHAN | EMP-0314 | CTR-0519
UPDATE employees_master
SET "contractId" = 'CTR-0519', name = 'MUHAMMAD AHMED KHAN', email = 'akahmedkhan42@gmail.com', phone = '+966550130279', "idNumber" = '2580575898', position = 'Business Development Specialist', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-05-03', "endDate" = '2027-05-02', bank = 'Saudi National Bank (SNB-AlAhli)', iban = 'SA6010000011100505230109', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0314'
  AND (
    "contractId" = 'CTR-0519'
    OR (name ILIKE '%MUHAMMAD AHMED KHAN%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0519' AND name ILIKE '%MUHAMMAD AHMED KHAN%'))
  );

-- Nawaf Al. Ibrahim | EMP-0067 | CTR-0518
UPDATE employees_master
SET "contractId" = 'CTR-0518', name = 'Nawaf Al. Ibrahim', email = 'nawaf.saaed.20@gmail.com', phone = '+966509571527', "idNumber" = '1166306991', position = 'leasing assistant manager', project = 'RECC', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'SNB', iban = '‏SA6310000052900002048904', "requesterName" = 'Tahani', "poNumbers" = 'PO-35648'
WHERE "employeeId" = 'EMP-0067'
  AND (
    "contractId" = 'CTR-0518'
    OR (name ILIKE '%Nawaf Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0518' AND name ILIKE '%Nawaf Al. Ibrahim%'))
  );

-- Ammar Hussain | EMP-0065 | CTR-0517
UPDATE employees_master
SET "contractId" = 'CTR-0517', name = 'Ammar Hussain', email = 'ammar.hussain999@gmail.com', "idNumber" = '1078680814', position = 'leasing assistant manager', project = 'RECC', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'SNB', iban = 'SA5810000042197015000101', "requesterName" = 'Tahani', "poNumbers" = 'PO-35648'
WHERE "employeeId" = 'EMP-0065'
  AND (
    "contractId" = 'CTR-0517'
    OR (name ILIKE '%Ammar Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0517' AND name ILIKE '%Ammar Hussain%'))
  );

-- Mohammed Al qhtani | EMP-0066 | CTR-0516
UPDATE employees_master
SET "contractId" = 'CTR-0516', name = 'Mohammed Al qhtani', email = 'alhgdore999@gmail.com', phone = '+966583239262', "idNumber" = '1115054916', position = 'leasing assistant manager', project = 'RECC', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'Al Rajhi', iban = 'SA7780000528608010964578', "requesterName" = 'Tahani', "poNumbers" = 'PO-35648'
WHERE "employeeId" = 'EMP-0066'
  AND (
    "contractId" = 'CTR-0516'
    OR (name ILIKE '%Mohammed Al qhtani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0516' AND name ILIKE '%Mohammed Al qhtani%'))
  );

-- Salma Al. Ibrahim | EMP-0068 | CTR-0515
UPDATE employees_master
SET "contractId" = 'CTR-0515', name = 'Salma Al. Ibrahim', email = 'salbrahim06@gmail.com', phone = '+966 501370606', "idNumber" = '1095904007', position = 'leasing assistant manager', project = 'RECC', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'Urpay', iban = 'SA0980204892254222121010', "requesterName" = 'Tahani', "poNumbers" = 'PO-35648'
WHERE "employeeId" = 'EMP-0068'
  AND (
    "contractId" = 'CTR-0515'
    OR (name ILIKE '%Salma Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0515' AND name ILIKE '%Salma Al. Ibrahim%'))
  );

-- Weam Mohammed Iskandar | EMP-0005 | CTR-0514
UPDATE employees_master
SET "contractId" = 'CTR-0514', name = 'Weam Mohammed Iskandar', email = 'weameskander55@gmail.com', "idNumber" = '1082429224', position = 'Leasing Assistant Manager', project = 'RECC', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-04-01', "endDate" = '2026-04-30', bank = 'SNB', iban = 'SA9710000011100515402609', "requesterName" = 'Tahani', "poNumbers" = 'PO-35648'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0514'
    OR (name ILIKE '%Weam Mohammed Iskandar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0514' AND name ILIKE '%Weam Mohammed Iskandar%'))
  );

-- Omar El Mozayen | EMP-0313 | CTR-0513
UPDATE employees_master
SET "contractId" = 'CTR-0513', name = 'Omar El Mozayen', email = 'mozayen18@gmail.com', phone = '+966541896325', "idNumber" = '2136131642', position = 'Business Development Executive', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-06-01', "endDate" = '2027-06-01', bank = 'Saudi national bank', iban = 'SA1010000011100182237305', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0313'
  AND (
    "contractId" = 'CTR-0513'
    OR (name ILIKE '%Omar El Mozayen%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0513' AND name ILIKE '%Omar El Mozayen%'))
  );

-- Ahmed Badawi | EMP-0312 | CTR-0512
UPDATE employees_master
SET "contractId" = 'CTR-0512', name = 'Ahmed Badawi', email = 'ahmedjoe200@gmail.com', phone = '+966544456736', "idNumber" = '2342043607', position = 'Business Development Executive', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-26', "endDate" = '2027-04-25', bank = 'Al Rajhi Bank', iban = 'SA 86 8000 0509 60801007 7234', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0312'
  AND (
    "contractId" = 'CTR-0512'
    OR (name ILIKE '%Ahmed Badawi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0512' AND name ILIKE '%Ahmed Badawi%'))
  );

-- Mohammed hisham ahmed | EMP-0311 | CTR-0511
UPDATE employees_master
SET "contractId" = 'CTR-0511', name = 'Mohammed hisham ahmed', email = 'Mudz.hii7@gmail.com', phone = '+966542210203', position = 'Videographer', project = 'Masar alhijra', status = 'new', "workflowStatus" = 'Docs Requested', "startDate" = '2026-02-16', "endDate" = '2026-03-31', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0311'
  AND (
    "contractId" = 'CTR-0511'
    OR (name ILIKE '%Mohammed hisham ahmed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0511' AND name ILIKE '%Mohammed hisham ahmed%'))
  );

-- IYAS IBRAHIM GHULAM | EMP-0310 | CTR-0510
UPDATE employees_master
SET "contractId" = 'CTR-0510', name = 'IYAS IBRAHIM GHULAM', email = 'e2000542@gmail.com', phone = '+966577096602', position = 'Videographer', project = 'Masar alhijra', status = 'new', "workflowStatus" = 'Docs Requested', "startDate" = '2026-02-16', "endDate" = '2026-03-31', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0310'
  AND (
    "contractId" = 'CTR-0510'
    OR (name ILIKE '%IYAS IBRAHIM GHULAM%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0510' AND name ILIKE '%IYAS IBRAHIM GHULAM%'))
  );

-- Ahmed Al Wadaf | EMP-0309 | CTR-0509
UPDATE employees_master
SET "contractId" = 'CTR-0509', name = 'Ahmed Al Wadaf', email = 'Ahmdinst@gmail.com', phone = '+966570260076', position = 'Videographer', project = 'Masar alhijra', status = 'new', "workflowStatus" = 'Docs Requested', "startDate" = '2026-02-16', "endDate" = '2026-03-31', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0309'
  AND (
    "contractId" = 'CTR-0509'
    OR (name ILIKE '%Ahmed Al Wadaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0509' AND name ILIKE '%Ahmed Al Wadaf%'))
  );

-- MAGDY MOUSTAFA | EMP-0308 | CTR-0508
UPDATE employees_master
SET "contractId" = 'CTR-0508', name = 'MAGDY MOUSTAFA', email = 'magdymawad26@gmail.com', phone = '+966 56 324 6397', "idNumber" = '2463087011', position = 'Senior Sales Supervisor', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-08', "endDate" = '2027-04-07', bank = 'Alrajhibank', iban = 'SA2480000449608016117466', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0308'
  AND (
    "contractId" = 'CTR-0508'
    OR (name ILIKE '%MAGDY MOUSTAFA%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0508' AND name ILIKE '%MAGDY MOUSTAFA%'))
  );

-- Mohaned Mahgoub Mahgoub Khalafallah | EMP-0307 | CTR-0507
UPDATE employees_master
SET "contractId" = 'CTR-0507', name = 'Mohaned Mahgoub Mahgoub Khalafallah', email = 'mohanedwork98@gmail.com', phone = '+9660531527696', "idNumber" = '2570229472', position = 'Field Visit & Collection Officer', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-03-25', "endDate" = '2027-03-24', bank = 'RAJHI bank', iban = 'SA7980000644608017608771', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0307'
  AND (
    "contractId" = 'CTR-0507'
    OR (name ILIKE '%Mohaned Mahgoub Mahgoub Khalafallah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0507' AND name ILIKE '%Mohaned Mahgoub Mahgoub Khalafallah%'))
  );

-- Moataz Elsayed Abdulkhalek Mousa | EMP-0306 | CTR-0506
UPDATE employees_master
SET "contractId" = 'CTR-0506', name = 'Moataz Elsayed Abdulkhalek Mousa', email = 'Moataz.abdulkhalek@hotmail.com', phone = '+966553312839', "idNumber" = '2626399816', position = 'Business Development Executive', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-03-25', "endDate" = '2027-03-24', bank = 'Al-Rajhi Bank', iban = 'SA5380000867608013305354', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0306'
  AND (
    "contractId" = 'CTR-0506'
    OR (name ILIKE '%Moataz Elsayed Abdulkhalek Mousa%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0506' AND name ILIKE '%Moataz Elsayed Abdulkhalek Mousa%'))
  );

-- Abu Baker Osman Ahmed Sinada | EMP-0305 | CTR-0505
UPDATE employees_master
SET "contractId" = 'CTR-0505', name = 'Abu Baker Osman Ahmed Sinada', email = 'a.osinada@gmail.com', phone = '+966563565609', "idNumber" = '2338233089', position = 'Accountant/Field Verification & Collection Officer', project = 'SILQFI', status = 'transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-20', "endDate" = '2027-04-19', bank = 'National Commercial Bank', iban = 'SA7910000011100212909209', "requesterName" = 'Rida kaeen'
WHERE "employeeId" = 'EMP-0305'
  AND (
    "contractId" = 'CTR-0505'
    OR (name ILIKE '%Abu Baker Osman Ahmed Sinada%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0505' AND name ILIKE '%Abu Baker Osman Ahmed Sinada%'))
  );

-- Abdulrahman Hamza Mohamed | EMP-0056 | CTR-0504
UPDATE employees_master
SET "contractId" = 'CTR-0504', name = 'Abdulrahman Hamza Mohamed', email = 'Abdulrhmansh59@gmail.com', phone = '+966542307742', "idNumber" = '1096667785', position = 'Vedio Grapher', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-16', "endDate" = '2026-03-31', bank = 'SNB', iban = 'SA4410000011100056928407', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0056'
  AND (
    "contractId" = 'CTR-0504'
    OR (name ILIKE '%Abdulrahman Hamza Mohamed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0504' AND name ILIKE '%Abdulrahman Hamza Mohamed%'))
  );

-- Razan Saleh Alghamdi | EMP-0304 | CTR-0503
UPDATE employees_master
SET "contractId" = 'CTR-0503', name = 'Razan Saleh Alghamdi', email = 'Razansaghamdi@gmail.com', "idNumber" = '1131876771', position = 'Asset Management Development analyst', project = 'RECC', status = 'new', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-05', "endDate" = '2026-09-29', bank = 'AlRajhi bank', iban = 'SA0480000445608016008222', "requesterName" = 'Tahani', "poNumbers" = 'PO-35667'
WHERE "employeeId" = 'EMP-0304'
  AND (
    "contractId" = 'CTR-0503'
    OR (name ILIKE '%Razan Saleh Alghamdi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0503' AND name ILIKE '%Razan Saleh Alghamdi%'))
  );

-- Mohammed Shaya A Almalki | EMP-0294 | CTR-0490
UPDATE employees_master
SET "contractId" = 'CTR-0490', name = 'Mohammed Shaya A Almalki', email = 'moohhaa12345678@gmail.com', phone = '+9665507333828', "idNumber" = '1106298936', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'SNB BANK', iban = 'SA4410000000400000637805', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0294'
  AND (
    "contractId" = 'CTR-0490'
    OR (name ILIKE '%Mohammed Shaya A Almalki%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0490' AND name ILIKE '%Mohammed Shaya A Almalki%'))
  );

-- Alhanouf Abdullah A Alateeq | EMP-0286 | CTR-0482
UPDATE employees_master
SET "contractId" = 'CTR-0482', name = 'Alhanouf Abdullah A Alateeq', email = 'hanoo1133@hotmail.com', phone = '+966530461221', "idNumber" = '1097207102', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi Bank', iban = 'SA8480000552608010471656', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0286'
  AND (
    "contractId" = 'CTR-0482'
    OR (name ILIKE '%Alhanouf Abdullah A Alateeq%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0482' AND name ILIKE '%Alhanouf Abdullah A Alateeq%'))
  );

-- Alfallatah Hasan Muath O | EMP-0288 | CTR-0484
UPDATE employees_master
SET "contractId" = 'CTR-0484', name = 'Alfallatah Hasan Muath O', email = 'f1515.hsn@gmail.com', phone = '+966564677847', "idNumber" = '1110766522', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'بنك ساب الاول', iban = 'SA5645000000076368786001', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0288'
  AND (
    "contractId" = 'CTR-0484'
    OR (name ILIKE '%Alfallatah Hasan Muath O%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0484' AND name ILIKE '%Alfallatah Hasan Muath O%'))
  );

-- Majed Mohammed A Sukbumi | EMP-0292 | CTR-0488
UPDATE employees_master
SET "contractId" = 'CTR-0488', name = 'Majed Mohammed A Sukbumi', email = '30.majed.sk@gmail.com', phone = '+9665565903561', "idNumber" = '1094761226', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Majed mohammed sukbumi', iban = 'SA3015000677752312120001', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0292'
  AND (
    "contractId" = 'CTR-0488'
    OR (name ILIKE '%Majed Mohammed A Sukbumi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0488' AND name ILIKE '%Majed Mohammed A Sukbumi%'))
  );

-- Oqab Matar B Aljahdali | EMP-0297 | CTR-0493
UPDATE employees_master
SET "contractId" = 'CTR-0493', name = 'Oqab Matar B Aljahdali', email = 'e.mattar1416@gmail.com', phone = '+9665583513217', "idNumber" = '1092823838', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'SNB BANK', iban = 'SA8210000000368490000105', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0297'
  AND (
    "contractId" = 'CTR-0493'
    OR (name ILIKE '%Oqab Matar B Aljahdali%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0493' AND name ILIKE '%Oqab Matar B Aljahdali%'))
  );

-- Waled Aliy | EMP-0291 | CTR-0487
UPDATE employees_master
SET "contractId" = 'CTR-0487', name = 'Waled Aliy', email = 'waloodi12035@gmail.com', phone = '+9665596812595', "idNumber" = '2228532350', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'BANK Alahli', iban = 'SA4010000011100227499002', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0291'
  AND (
    "contractId" = 'CTR-0487'
    OR (name ILIKE '%Waled Aliy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0487' AND name ILIKE '%Waled Aliy%'))
  );

-- Maha Rashed B Alharbi | EMP-0293 | CTR-0489
UPDATE employees_master
SET "contractId" = 'CTR-0489', name = 'Maha Rashed B Alharbi', email = 'mrrh.1993@gmail.com', phone = '+9665594000683', "idNumber" = '1082600097', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'بنك الاهلي', iban = 'SA1110000010100003370307', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0293'
  AND (
    "contractId" = 'CTR-0489'
    OR (name ILIKE '%Maha Rashed B Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0489' AND name ILIKE '%Maha Rashed B Alharbi%'))
  );

-- Shaima Mahdi H Alyami | EMP-0300 | CTR-0496
UPDATE employees_master
SET "contractId" = 'CTR-0496', name = 'Shaima Mahdi H Alyami', email = 'shaimaaly72@gmail.com', phone = '+9665533998969', "idNumber" = '1121762114', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Bank Alrajhi', iban = 'SA8180000620608016135147', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0300'
  AND (
    "contractId" = 'CTR-0496'
    OR (name ILIKE '%Shaima Mahdi H Alyami%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0496' AND name ILIKE '%Shaima Mahdi H Alyami%'))
  );

-- Ahmed Mohammed A Khoj | EMP-0299 | CTR-0495
UPDATE employees_master
SET "contractId" = 'CTR-0495', name = 'Ahmed Mohammed A Khoj', email = 'Khoj9880@gmail.com', phone = '+9665553539880', "idNumber" = '1014154775', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alinma Bank', iban = 'SA8805000068201095915000', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0299'
  AND (
    "contractId" = 'CTR-0495'
    OR (name ILIKE '%Ahmed Mohammed A Khoj%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0495' AND name ILIKE '%Ahmed Mohammed A Khoj%'))
  );

-- Abdulrahman Hamdi M Alrasheedi | EMP-0289 | CTR-0485
UPDATE employees_master
SET "contractId" = 'CTR-0485', name = 'Abdulrahman Hamdi M Alrasheedi', email = 'tma700253@gmail.com', phone = '+966506277361', "idNumber" = '1113211179', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'SAB Mobile', iban = 'SA1045000000030415277001', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0289'
  AND (
    "contractId" = 'CTR-0485'
    OR (name ILIKE '%Abdulrahman Hamdi M Alrasheedi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0485' AND name ILIKE '%Abdulrahman Hamdi M Alrasheedi%'))
  );

-- Khalid Mohammed S Albalawi | EMP-0295 | CTR-0491
UPDATE employees_master
SET "contractId" = 'CTR-0491', name = 'Khalid Mohammed S Albalawi', email = 'khaled6142@gmail.com', phone = '+9665502161152', "idNumber" = '1103015838', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al Rajhi', iban = 'SA6980000224608010165801', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0295'
  AND (
    "contractId" = 'CTR-0491'
    OR (name ILIKE '%Khalid Mohammed S Albalawi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0491' AND name ILIKE '%Khalid Mohammed S Albalawi%'))
  );

-- Majed Jarallah Alobaid | EMP-0302 | CTR-0498
UPDATE employees_master
SET "contractId" = 'CTR-0498', name = 'Majed Jarallah Alobaid', email = 'ninetym9@gmail.com', phone = '+9665562612215', "idNumber" = '1040492470', position = 'Project Manager', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi bank', iban = 'SA7680000500608011187932', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0302'
  AND (
    "contractId" = 'CTR-0498'
    OR (name ILIKE '%Majed Jarallah Alobaid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0498' AND name ILIKE '%Majed Jarallah Alobaid%'))
  );

-- Shatha Ahmed M Abuhozah | EMP-0283 | CTR-0479
UPDATE employees_master
SET "contractId" = 'CTR-0479', name = 'Shatha Ahmed M Abuhozah', email = 'abuhozah.shatha@gmail.com', phone = '+966558209565', "idNumber" = '1078276563', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al Rajhi Bank', iban = 'SA8080000518608016009024', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0283'
  AND (
    "contractId" = 'CTR-0479'
    OR (name ILIKE '%Shatha Ahmed M Abuhozah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0479' AND name ILIKE '%Shatha Ahmed M Abuhozah%'))
  );

-- Muath Ghali A Alrehaili | EMP-0285 | CTR-0481
UPDATE employees_master
SET "contractId" = 'CTR-0481', name = 'Muath Ghali A Alrehaili', email = 'moath1518@gmail.com', phone = '+966580642058', "idNumber" = '1082655604', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al RAJHI BANK', iban = 'SA1980000294608010249725', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0285'
  AND (
    "contractId" = 'CTR-0481'
    OR (name ILIKE '%Muath Ghali A Alrehaili%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0481' AND name ILIKE '%Muath Ghali A Alrehaili%'))
  );

-- Latifh Najeeb M Alsayyaf | EMP-0296 | CTR-0492
UPDATE employees_master
SET "contractId" = 'CTR-0492', name = 'Latifh Najeeb M Alsayyaf', email = 'latifah_00@outlook.com', phone = '+9665569812826', "idNumber" = '1100771565', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al Rajhi Bnk', iban = 'SA1380000512608016085996', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0296'
  AND (
    "contractId" = 'CTR-0492'
    OR (name ILIKE '%Latifh Najeeb M Alsayyaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0492' AND name ILIKE '%Latifh Najeeb M Alsayyaf%'))
  );

-- Abdullah Ahmed A Fadhel | EMP-0284 | CTR-0480
UPDATE employees_master
SET "contractId" = 'CTR-0480', name = 'Abdullah Ahmed A Fadhel', email = 'abdullah.a.fadul@gmail.com', phone = '+966599777995', "idNumber" = '1065815605', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'بنك الاول', iban = 'S7445000000262049174150', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0284'
  AND (
    "contractId" = 'CTR-0480'
    OR (name ILIKE '%Abdullah Ahmed A Fadhel%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0480' AND name ILIKE '%Abdullah Ahmed A Fadhel%'))
  );

-- Dalal Abdallaha A Alhudaib | EMP-0298 | CTR-0494
UPDATE employees_master
SET "contractId" = 'CTR-0494', name = 'Dalal Abdallaha A Alhudaib', email = 'dalal.hu.89@gmail.com', phone = '+9665564276368', "idNumber" = '1063600389', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'AlRajhi', iban = 'SA6880000148608010301151', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0298'
  AND (
    "contractId" = 'CTR-0494'
    OR (name ILIKE '%Dalal Abdallaha A Alhudaib%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0494' AND name ILIKE '%Dalal Abdallaha A Alhudaib%'))
  );

-- Bashayr Abaas Alshareef | EMP-0282 | CTR-0478
UPDATE employees_master
SET "contractId" = 'CTR-0478', name = 'Bashayr Abaas Alshareef', email = 'besh2020@outlook.com', phone = '+966500660501', "idNumber" = '1102593090', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhibank', iban = 'SA9280000458608010570981', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0282'
  AND (
    "contractId" = 'CTR-0478'
    OR (name ILIKE '%Bashayr Abaas Alshareef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0478' AND name ILIKE '%Bashayr Abaas Alshareef%'))
  );

-- Meshal Abdulmajeed A Altaiel | EMP-0290 | CTR-0486
UPDATE employees_master
SET "contractId" = 'CTR-0486', name = 'Meshal Abdulmajeed A Altaiel', email = 'meshal24002@gmail.com', phone = '+966582293003', "idNumber" = '1114151788', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'STC BANK', iban = 'SA3978000000001037515497', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0290'
  AND (
    "contractId" = 'CTR-0486'
    OR (name ILIKE '%Meshal Abdulmajeed A Altaiel%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0486' AND name ILIKE '%Meshal Abdulmajeed A Altaiel%'))
  );

-- Bashayer Saud M Alanzi | EMP-0287 | CTR-0483
UPDATE employees_master
SET "contractId" = 'CTR-0483', name = 'Bashayer Saud M Alanzi', email = 'b.saud2@hotmail.com', phone = '+966533009845', "idNumber" = '1080208968', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alarabi bank', iban = 'SA5030400108036202730019', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0287'
  AND (
    "contractId" = 'CTR-0483'
    OR (name ILIKE '%Bashayer Saud M Alanzi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0483' AND name ILIKE '%Bashayer Saud M Alanzi%'))
  );

-- Renad Hussain Y Laqwar | EMP-0301 | CTR-0497
UPDATE employees_master
SET "contractId" = 'CTR-0497', name = 'Renad Hussain Y Laqwar', email = 'renada1313@gmail.com', phone = '+9665544088540', "idNumber" = '1119072336', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'الأهلي', iban = 'SA9610000082500005122603', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0301'
  AND (
    "contractId" = 'CTR-0497'
    OR (name ILIKE '%Renad Hussain Y Laqwar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0497' AND name ILIKE '%Renad Hussain Y Laqwar%'))
  );

-- Abdulaziz Saleh Alzahrani | EMP-0244 | CTR-0440
UPDATE employees_master
SET "contractId" = 'CTR-0440', name = 'Abdulaziz Saleh Alzahrani', email = 'zezoas1z@icloud.com', phone = '+966551073889', "idNumber" = '1084466786', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'BANK SNB', iban = 'SA7810000001374537000109', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0244'
  AND (
    "contractId" = 'CTR-0440'
    OR (name ILIKE '%Abdulaziz Saleh Alzahrani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0440' AND name ILIKE '%Abdulaziz Saleh Alzahrani%'))
  );

-- Ashwaq Ali S Alharbi | EMP-0267 | CTR-0463
UPDATE employees_master
SET "contractId" = 'CTR-0463', name = 'Ashwaq Ali S Alharbi', email = 'ashwagali1418@gmail.com', phone = '+966596205036', "idNumber" = '1099879049', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'ASHWAG ALI SALAH ALHARBI', iban = 'SA0880000333608010398517', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0267'
  AND (
    "contractId" = 'CTR-0463'
    OR (name ILIKE '%Ashwaq Ali S Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0463' AND name ILIKE '%Ashwaq Ali S Alharbi%'))
  );

-- Mahmoud Yousuf Mohammad Ilyas | EMP-0237 | CTR-0433
UPDATE employees_master
SET "contractId" = 'CTR-0433', name = 'Mahmoud Yousuf Mohammad Ilyas', email = 'moh94.y@hotmail.com', phone = '+966592399001', "idNumber" = '2184718621', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al Rajhi Bank', iban = 'SA5480000563608016066606', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0237'
  AND (
    "contractId" = 'CTR-0433'
    OR (name ILIKE '%Mahmoud Yousuf Mohammad Ilyas%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0433' AND name ILIKE '%Mahmoud Yousuf Mohammad Ilyas%'))
  );

-- Younus Muhammadilyas - Mohammadibrahim | EMP-0238 | CTR-0434
UPDATE employees_master
SET "contractId" = 'CTR-0434', name = 'Younus Muhammadilyas - Mohammadibrahim', email = 'Younus.d@hotmail.com', phone = '+966599585035', "idNumber" = '2004439275', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al alhli bank', iban = 'SA2310000001370694000100', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0238'
  AND (
    "contractId" = 'CTR-0434'
    OR (name ILIKE '%Younus Muhammadilyas - Mohammadibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0434' AND name ILIKE '%Younus Muhammadilyas - Mohammadibrahim%'))
  );

-- Nour Junaid F Binfaidh | EMP-0243 | CTR-0439
UPDATE employees_master
SET "contractId" = 'CTR-0439', name = 'Nour Junaid F Binfaidh', email = 'nour-junaid1994@hotmail.com', phone = '+966545103300', "idNumber" = '1086556436', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'SNB', iban = 'SA7510000032700000073905', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0243'
  AND (
    "contractId" = 'CTR-0439'
    OR (name ILIKE '%Nour Junaid F Binfaidh%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0439' AND name ILIKE '%Nour Junaid F Binfaidh%'))
  );

-- Fawziah Saud Alshahrani | EMP-0247 | CTR-0443
UPDATE employees_master
SET "contractId" = 'CTR-0443', name = 'Fawziah Saud Alshahrani', email = 'zfaw013@gmail.com', phone = '+966537658638', "idNumber" = '1112205669', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'الراجحي', iban = 'SA8380000688608010217718', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0247'
  AND (
    "contractId" = 'CTR-0443'
    OR (name ILIKE '%Fawziah Saud Alshahrani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0443' AND name ILIKE '%Fawziah Saud Alshahrani%'))
  );

-- Intisar Hassan M Almutairi | EMP-0269 | CTR-0465
UPDATE employees_master
SET "contractId" = 'CTR-0465', name = 'Intisar Hassan M Almutairi', email = 'entisar.almutairi@gmail.com', phone = '+966500131543', "idNumber" = '1082477165', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'الراجحي', iban = 'SA5280000412608016222699', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0269'
  AND (
    "contractId" = 'CTR-0465'
    OR (name ILIKE '%Intisar Hassan M Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0465' AND name ILIKE '%Intisar Hassan M Almutairi%'))
  );

-- Fatimah Tuwaym S Altuwaym | EMP-0274 | CTR-0470
UPDATE employees_master
SET "contractId" = 'CTR-0470', name = 'Fatimah Tuwaym S Altuwaym', email = 'f.tweem@gmail.com', phone = '+966508177078', "idNumber" = '1082821362', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alinma', iban = 'SA1405000068202039362000', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0274'
  AND (
    "contractId" = 'CTR-0470'
    OR (name ILIKE '%Fatimah Tuwaym S Altuwaym%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0470' AND name ILIKE '%Fatimah Tuwaym S Altuwaym%'))
  );

-- Faisal Fahad Alraddadi | EMP-0248 | CTR-0444
UPDATE employees_master
SET "contractId" = 'CTR-0444', name = 'Faisal Fahad Alraddadi', email = 'ffaaiissaall1409@gmail.com', phone = '+966558256680', "idNumber" = '1059754992', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'alrajhi bank', iban = 'SA7180000419608010174154', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0248'
  AND (
    "contractId" = 'CTR-0444'
    OR (name ILIKE '%Faisal Fahad Alraddadi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0444' AND name ILIKE '%Faisal Fahad Alraddadi%'))
  );

-- Ahmed Abdullah Alsharqi | EMP-0242 | CTR-0438
UPDATE employees_master
SET "contractId" = 'CTR-0438', name = 'Ahmed Abdullah Alsharqi', email = 'daddas99@gmail.com', phone = '+966596059936', "idNumber" = '1105224057', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'بنك ساب', iban = 'SA5245000000864181623001', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0242'
  AND (
    "contractId" = 'CTR-0438'
    OR (name ILIKE '%Ahmed Abdullah Alsharqi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0438' AND name ILIKE '%Ahmed Abdullah Alsharqi%'))
  );

-- Reham Awadh Alshehri | EMP-0231 | CTR-0427
UPDATE employees_master
SET "contractId" = 'CTR-0427', name = 'Reham Awadh Alshehri', email = 'passjon1010@gmail.com', phone = '+9665549359288', "idNumber" = '1119624391', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi', iban = '204000010006080951477', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0231'
  AND (
    "contractId" = 'CTR-0427'
    OR (name ILIKE '%Reham Awadh Alshehri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0427' AND name ILIKE '%Reham Awadh Alshehri%'))
  );

-- Omer Ahmed Mohamed Balshrf | EMP-0265 | CTR-0461
UPDATE employees_master
SET "contractId" = 'CTR-0461', name = 'Omer Ahmed Mohamed Balshrf', email = 'omar900952@gmail.com', phone = '+966553329290', "idNumber" = '1002864468', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'OMAR AHMED MOHAMMED BALSHARF', iban = 'SA2610000032855771000103', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0265'
  AND (
    "contractId" = 'CTR-0461'
    OR (name ILIKE '%Omer Ahmed Mohamed Balshrf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0461' AND name ILIKE '%Omer Ahmed Mohamed Balshrf%'))
  );

-- Sajir Mahmoud Mohammed Alnajjar | EMP-0256 | CTR-0452
UPDATE employees_master
SET "contractId" = 'CTR-0452', name = 'Sajir Mahmoud Mohammed Alnajjar', email = 'sajiralnajjar@gmail.com', phone = '+966599930792', "idNumber" = '1099051615', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Bank Sab', iban = 'SA4145000000076324854001', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0256'
  AND (
    "contractId" = 'CTR-0452'
    OR (name ILIKE '%Sajir Mahmoud Mohammed Alnajjar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0452' AND name ILIKE '%Sajir Mahmoud Mohammed Alnajjar%'))
  );

-- Alanud Athman Alnajdi | EMP-0246 | CTR-0442
UPDATE employees_master
SET "contractId" = 'CTR-0442', name = 'Alanud Athman Alnajdi', email = 'iiialanoud9@gmail.com', phone = '+966531034529', "idNumber" = '1115003145', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi', iban = 'SA4980000513608010639912', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0246'
  AND (
    "contractId" = 'CTR-0442'
    OR (name ILIKE '%Alanud Athman Alnajdi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0442' AND name ILIKE '%Alanud Athman Alnajdi%'))
  );

-- Abdullah Osman Abosuliman | EMP-0252 | CTR-0448
UPDATE employees_master
SET "contractId" = 'CTR-0448', name = 'Abdullah Osman Abosuliman', email = 'abdallahabusliman@gmail.com', phone = '+966594994090', "idNumber" = '1114270562', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alinma', iban = 'SA8505000068206092639000', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0252'
  AND (
    "contractId" = 'CTR-0448'
    OR (name ILIKE '%Abdullah Osman Abosuliman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0448' AND name ILIKE '%Abdullah Osman Abosuliman%'))
  );

-- Shahad Abdullah Alhuwayfi | EMP-0259 | CTR-0455
UPDATE employees_master
SET "contractId" = 'CTR-0455', name = 'Shahad Abdullah Alhuwayfi', email = 'sh.alhuwayfi@gmail.com', phone = '+966540704462', "idNumber" = '1111327126', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi Bank', iban = 'SA988000010560801622075', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0259'
  AND (
    "contractId" = 'CTR-0455'
    OR (name ILIKE '%Shahad Abdullah Alhuwayfi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0455' AND name ILIKE '%Shahad Abdullah Alhuwayfi%'))
  );

-- Ghadah Abdulaziz Almutairi | EMP-0234 | CTR-0430
UPDATE employees_master
SET "contractId" = 'CTR-0430', name = 'Ghadah Abdulaziz Almutairi', email = 'galmutairi25@gmail.com', phone = '+966545566163', "idNumber" = '1095554638', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'الاهلي', iban = 'SA6410000032050193000103', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0234'
  AND (
    "contractId" = 'CTR-0430'
    OR (name ILIKE '%Ghadah Abdulaziz Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0430' AND name ILIKE '%Ghadah Abdulaziz Almutairi%'))
  );

-- Ghada Saleem Aljohani | EMP-0261 | CTR-0457
UPDATE employees_master
SET "contractId" = 'CTR-0457', name = 'Ghada Saleem Aljohani', email = 'ghaddd3321@gmail.com', phone = '+9665548685903', "idNumber" = '1104198757', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi bank', iban = 'SA9880000351608016124914', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0261'
  AND (
    "contractId" = 'CTR-0457'
    OR (name ILIKE '%Ghada Saleem Aljohani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0457' AND name ILIKE '%Ghada Saleem Aljohani%'))
  );

-- Mohammed Adil Mowafi | EMP-0260 | CTR-0456
UPDATE employees_master
SET "contractId" = 'CTR-0456', name = 'Mohammed Adil Mowafi', email = 'mohammedmoafi@gmail.com', phone = '+966505538492', "idNumber" = '1109025666', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alahli bank', iban = 'SA4710000011100126278406', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0260'
  AND (
    "contractId" = 'CTR-0456'
    OR (name ILIKE '%Mohammed Adil Mowafi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0456' AND name ILIKE '%Mohammed Adil Mowafi%'))
  );

-- Shahad Mushel Alotaibi | EMP-0250 | CTR-0446
UPDATE employees_master
SET "contractId" = 'CTR-0446', name = 'Shahad Mushel Alotaibi', email = 'shahad.m.alotaibi18@gmail.com', phone = '+966542039353', "idNumber" = '1102102082', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Shahad Alotaibi', iban = 'SA3005000068203715687000', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0250'
  AND (
    "contractId" = 'CTR-0446'
    OR (name ILIKE '%Shahad Mushel Alotaibi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0446' AND name ILIKE '%Shahad Mushel Alotaibi%'))
  );

-- Nehal Abdullah I Aljindan | EMP-0279 | CTR-0475
UPDATE employees_master
SET "contractId" = 'CTR-0475', name = 'Nehal Abdullah I Aljindan', email = 'nehal.a.aljindan@outlook.com', phone = '+966541045558', "idNumber" = '1097146003', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alinma Bank', iban = 'SA9005000068204905841000', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0279'
  AND (
    "contractId" = 'CTR-0475'
    OR (name ILIKE '%Nehal Abdullah I Aljindan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0475' AND name ILIKE '%Nehal Abdullah I Aljindan%'))
  );

-- Alanoud Hamoud Alharthi | EMP-0280 | CTR-0476
UPDATE employees_master
SET "contractId" = 'CTR-0476', name = 'Alanoud Hamoud Alharthi', email = 'alanoudalmshari@gmail.com', phone = '+966553385287', "idNumber" = '1095407092', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alinma bank', iban = 'SA6405000068204492352002', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0280'
  AND (
    "contractId" = 'CTR-0476'
    OR (name ILIKE '%Alanoud Hamoud Alharthi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0476' AND name ILIKE '%Alanoud Hamoud Alharthi%'))
  );

-- Khulud Abdulelah M Alhaidari | EMP-0254 | CTR-0450
UPDATE employees_master
SET "contractId" = 'CTR-0450', name = 'Khulud Abdulelah M Alhaidari', email = 'kokoalhidary@gmail.com', phone = '+966564483820', "idNumber" = '1000405355', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'AlRajhi Bank', iban = 'SA4480000432608016123679', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0254'
  AND (
    "contractId" = 'CTR-0450'
    OR (name ILIKE '%Khulud Abdulelah M Alhaidari%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0450' AND name ILIKE '%Khulud Abdulelah M Alhaidari%'))
  );

-- Bshayr Mohammed A Alshareef | EMP-0245 | CTR-0441
UPDATE employees_master
SET "contractId" = 'CTR-0441', name = 'Bshayr Mohammed A Alshareef', email = 'bashair-5@hotmail.com', phone = '+966543863771', "idNumber" = '1102990635', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'SNB', iban = '‏SA2210000017500000063106', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0245'
  AND (
    "contractId" = 'CTR-0441'
    OR (name ILIKE '%Bshayr Mohammed A Alshareef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0441' AND name ILIKE '%Bshayr Mohammed A Alshareef%'))
  );

-- Amirah Abdullah Almutairi | EMP-0240 | CTR-0436
UPDATE employees_master
SET "contractId" = 'CTR-0436', name = 'Amirah Abdullah Almutairi', email = 'am1994.era@gmail.com', phone = '+966532964858', "idNumber" = '1084171139', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'مصرف الراجحي', iban = '545000010006080034496', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0240'
  AND (
    "contractId" = 'CTR-0436'
    OR (name ILIKE '%Amirah Abdullah Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0436' AND name ILIKE '%Amirah Abdullah Almutairi%'))
  );

-- Amnah Ahmed H Jaafari | EMP-0272 | CTR-0468
UPDATE employees_master
SET "contractId" = 'CTR-0468', name = 'Amnah Ahmed H Jaafari', email = 'amonh1421@hotmail.com', phone = '+966548062484', "idNumber" = '1117652782', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'AL RAJHI', iban = 'SA4780000119608016212704', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0272'
  AND (
    "contractId" = 'CTR-0468'
    OR (name ILIKE '%Amnah Ahmed H Jaafari%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0468' AND name ILIKE '%Amnah Ahmed H Jaafari%'))
  );

-- Norah Mousa Q Salaqi | EMP-0255 | CTR-0451
UPDATE employees_master
SET "contractId" = 'CTR-0451', name = 'Norah Mousa Q Salaqi', email = 'nourah.alsalaqi@gmail.com', phone = '+966562279201', "idNumber" = '1111874457', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Riyad Bank', iban = 'SA1320000003473271639940', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0255'
  AND (
    "contractId" = 'CTR-0451'
    OR (name ILIKE '%Norah Mousa Q Salaqi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0451' AND name ILIKE '%Norah Mousa Q Salaqi%'))
  );

-- Rannya Talal H Alharbi | EMP-0241 | CTR-0437
UPDATE employees_master
SET "contractId" = 'CTR-0437', name = 'Rannya Talal H Alharbi', email = 'raniath66@gmail.com', phone = '+966544291045', "idNumber" = '1109261915', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi bank', iban = 'SA8780000471608016020463', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0241'
  AND (
    "contractId" = 'CTR-0437'
    OR (name ILIKE '%Rannya Talal H Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0437' AND name ILIKE '%Rannya Talal H Alharbi%'))
  );

-- Khalid Waleed Alatram | EMP-0266 | CTR-0462
UPDATE employees_master
SET "contractId" = 'CTR-0462', name = 'Khalid Waleed Alatram', email = 'ala6ram.2@hotmail.com', phone = '+966570141266', "idNumber" = '1079380174', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Bank alahli', iban = 'SA1910000033750227000104', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0266'
  AND (
    "contractId" = 'CTR-0462'
    OR (name ILIKE '%Khalid Waleed Alatram%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0462' AND name ILIKE '%Khalid Waleed Alatram%'))
  );

-- Zaylaeeyyah Ali Suawk | EMP-0232 | CTR-0428
UPDATE employees_master
SET "contractId" = 'CTR-0428', name = 'Zaylaeeyyah Ali Suawk', email = 'zailiah2702@icloud.com', phone = '+966501774004', "idNumber" = '1110175401', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al RajhI Bank', iban = 'SA6280000119608018574481', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0232'
  AND (
    "contractId" = 'CTR-0428'
    OR (name ILIKE '%Zaylaeeyyah Ali Suawk%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0428' AND name ILIKE '%Zaylaeeyyah Ali Suawk%'))
  );

-- Azzam Turki M Allahyani | EMP-0275 | CTR-0471
UPDATE employees_master
SET "contractId" = 'CTR-0471', name = 'Azzam Turki M Allahyani', email = 'azzamturke@gmail.com', phone = '+966544452072', "idNumber" = '1116120658', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'BANK SNB', iban = 'SA6710000011100032541902', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0275'
  AND (
    "contractId" = 'CTR-0471'
    OR (name ILIKE '%Azzam Turki M Allahyani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0471' AND name ILIKE '%Azzam Turki M Allahyani%'))
  );

-- Bashayer Abdullah Shokri | EMP-0263 | CTR-0459
UPDATE employees_master
SET "contractId" = 'CTR-0459', name = 'Bashayer Abdullah Shokri', email = 'bashayershokri@gmail.com', phone = '+9665546151429', "idNumber" = '1102028824', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Saudi National Bank', iban = 'SA8510000032700000245900', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0263'
  AND (
    "contractId" = 'CTR-0459'
    OR (name ILIKE '%Bashayer Abdullah Shokri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0459' AND name ILIKE '%Bashayer Abdullah Shokri%'))
  );

-- Abdulmajeed Omar B Alzuwayhiri | EMP-0277 | CTR-0473
UPDATE employees_master
SET "contractId" = 'CTR-0473', name = 'Abdulmajeed Omar B Alzuwayhiri', email = 'abdulmajeed1omar@icloud.com', phone = '+966546969660', "idNumber" = '1121050361', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'الاهلي', iban = 'SA6910000011100167279910', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0277'
  AND (
    "contractId" = 'CTR-0473'
    OR (name ILIKE '%Abdulmajeed Omar B Alzuwayhiri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0473' AND name ILIKE '%Abdulmajeed Omar B Alzuwayhiri%'))
  );

-- Rana Saud Alluhaibi | EMP-0262 | CTR-0458
UPDATE employees_master
SET "contractId" = 'CTR-0458', name = 'Rana Saud Alluhaibi', email = 'ranaalluhaibi@gmail.com', phone = '+9665591137257', "idNumber" = '1077886248', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi', iban = 'SA1980000333608019051398', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0262'
  AND (
    "contractId" = 'CTR-0458'
    OR (name ILIKE '%Rana Saud Alluhaibi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0458' AND name ILIKE '%Rana Saud Alluhaibi%'))
  );

-- Shahad Bandar Alharbi | EMP-0233 | CTR-0429
UPDATE employees_master
SET "contractId" = 'CTR-0429', name = 'Shahad Bandar Alharbi', email = 'shahadalharbi487@gmail.com', phone = '+966555928369', "idNumber" = '1119690178', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'مصرف الراجحي', iban = '077010110006087489093', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0233'
  AND (
    "contractId" = 'CTR-0429'
    OR (name ILIKE '%Shahad Bandar Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0429' AND name ILIKE '%Shahad Bandar Alharbi%'))
  );

-- Alanoud Abdullah Alharbi | EMP-0264 | CTR-0460
UPDATE employees_master
SET "contractId" = 'CTR-0460', name = 'Alanoud Abdullah Alharbi', email = 'allanoud.abdullah@hotmail.com', phone = '+966557108321', "idNumber" = '1106982596', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Saudi National Bank (SNB)', iban = 'SA7510000011100383104608', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0264'
  AND (
    "contractId" = 'CTR-0460'
    OR (name ILIKE '%Alanoud Abdullah Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0460' AND name ILIKE '%Alanoud Abdullah Alharbi%'))
  );

-- Ahmed Muhammediltas | EMP-0235 | CTR-0431
UPDATE employees_master
SET "contractId" = 'CTR-0431', name = 'Ahmed Muhammediltas', email = 'a.i.d90@hotmail.com', phone = '+966560655575', "idNumber" = '2050051925', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al Rajhi bank', iban = 'SA5080000330608010990290', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0235'
  AND (
    "contractId" = 'CTR-0431'
    OR (name ILIKE '%Ahmed Muhammediltas%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0431' AND name ILIKE '%Ahmed Muhammediltas%'))
  );

-- Sarah Khater Alzahrani | EMP-0257 | CTR-0453
UPDATE employees_master
SET "contractId" = 'CTR-0453', name = 'Sarah Khater Alzahrani', email = 'sarz1936@gmail.com', phone = '+966538859568', "idNumber" = '1097223976', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'SNB Alahli', iban = '10000031356397000108', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0257'
  AND (
    "contractId" = 'CTR-0453'
    OR (name ILIKE '%Sarah Khater Alzahrani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0453' AND name ILIKE '%Sarah Khater Alzahrani%'))
  );

-- Batool Mohammed Ismail M Omar | EMP-0271 | CTR-0467
UPDATE employees_master
SET "contractId" = 'CTR-0467', name = 'Batool Mohammed Ismail M Omar', email = 'batool.66099@gmail.com', phone = '+966595408327', "idNumber" = '1106006099', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'SNB', iban = 'SA8510000032700000983003', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0271'
  AND (
    "contractId" = 'CTR-0467'
    OR (name ILIKE '%Batool Mohammed Ismail M Omar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0467' AND name ILIKE '%Batool Mohammed Ismail M Omar%'))
  );

-- ADEL ABDULLAHA ALHIDARI | EMP-0273 | CTR-0469
UPDATE employees_master
SET "contractId" = 'CTR-0469', name = 'ADEL ABDULLAHA ALHIDARI', email = 'adelalhedaryy@gmail.com', phone = '+966559929233', "idNumber" = '1069275780', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi', iban = 'SA5980000370608010176917', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0273'
  AND (
    "contractId" = 'CTR-0469'
    OR (name ILIKE '%ADEL ABDULLAHA ALHIDARI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0469' AND name ILIKE '%ADEL ABDULLAHA ALHIDARI%'))
  );

-- Abdulrahman Mohammad A Alsuwaihiri | EMP-0276 | CTR-0472
UPDATE employees_master
SET "contractId" = 'CTR-0472', name = 'Abdulrahman Mohammad A Alsuwaihiri', email = 'abdulrahman.2m3@gmail.com', phone = '+966551864773', "idNumber" = '1123725804', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'بنك الاهلي', iban = 'SA2010000001600000976610', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0276'
  AND (
    "contractId" = 'CTR-0472'
    OR (name ILIKE '%Abdulrahman Mohammad A Alsuwaihiri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0472' AND name ILIKE '%Abdulrahman Mohammad A Alsuwaihiri%'))
  );

-- Norah Khalid Almalki | EMP-0236 | CTR-0432
UPDATE employees_master
SET "contractId" = 'CTR-0432', name = 'Norah Khalid Almalki', email = 'nourak.malki@gmail.com', phone = '+966550272528', "idNumber" = '1110534144', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al Rajhi Bank', iban = 'SA5680000665608016027811', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0236'
  AND (
    "contractId" = 'CTR-0432'
    OR (name ILIKE '%Norah Khalid Almalki%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0432' AND name ILIKE '%Norah Khalid Almalki%'))
  );

-- Muhannad Abdulghani Maghrabi | EMP-0258 | CTR-0454
UPDATE employees_master
SET "contractId" = 'CTR-0454', name = 'Muhannad Abdulghani Maghrabi', email = 'muhnd94@outlook.com', phone = '+966503774159', "idNumber" = '1085032249', position = 'Marketing', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Al ahli bank', iban = 'SA5810000001379300000102', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0258'
  AND (
    "contractId" = 'CTR-0454'
    OR (name ILIKE '%Muhannad Abdulghani Maghrabi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0454' AND name ILIKE '%Muhannad Abdulghani Maghrabi%'))
  );

-- Ghaday Mohammed Y Alrehaili | EMP-0239 | CTR-0435
UPDATE employees_master
SET "contractId" = 'CTR-0435', name = 'Ghaday Mohammed Y Alrehaili', email = 'ighadi101@gmail.com', phone = '+966566256642', "idNumber" = '1102301908', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'SNB', iban = 'SA7910000011100332232304', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0239'
  AND (
    "contractId" = 'CTR-0435'
    OR (name ILIKE '%Ghaday Mohammed Y Alrehaili%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0435' AND name ILIKE '%Ghaday Mohammed Y Alrehaili%'))
  );

-- Rawan Mohamed A Al Oufi | EMP-0268 | CTR-0464
UPDATE employees_master
SET "contractId" = 'CTR-0464', name = 'Rawan Mohamed A Al Oufi', email = 'ronta_m@hotmail.com', phone = '+966599649822', "idNumber" = '1091316735', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'بنك الراجحي', iban = 'SA6280000333608016258285', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0268'
  AND (
    "contractId" = 'CTR-0464'
    OR (name ILIKE '%Rawan Mohamed A Al Oufi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0464' AND name ILIKE '%Rawan Mohamed A Al Oufi%'))
  );

-- Randa Sami Alanazi | EMP-0253 | CTR-0449
UPDATE employees_master
SET "contractId" = 'CTR-0449', name = 'Randa Sami Alanazi', email = 'randaal3n@gmail.com', phone = '+966531641326', "idNumber" = '1085446399', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alriyadh bank', iban = 'SA1520000003134545659940', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0253'
  AND (
    "contractId" = 'CTR-0449'
    OR (name ILIKE '%Randa Sami Alanazi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0449' AND name ILIKE '%Randa Sami Alanazi%'))
  );

-- Shouq Mohammed H Alhumaid | EMP-0270 | CTR-0466
UPDATE employees_master
SET "contractId" = 'CTR-0466', name = 'Shouq Mohammed H Alhumaid', email = 'shooq2375@gmail.com', phone = '+966553020866', "idNumber" = '1113734907', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'Alrajhi bank', iban = 'SA2680000272608016013469', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0270'
  AND (
    "contractId" = 'CTR-0466'
    OR (name ILIKE '%Shouq Mohammed H Alhumaid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0466' AND name ILIKE '%Shouq Mohammed H Alhumaid%'))
  );

-- Azzah Mohammed Alsheri | EMP-0251 | CTR-0447
UPDATE employees_master
SET "contractId" = 'CTR-0447', name = 'Azzah Mohammed Alsheri', email = 'shehri.azza@gmail.com', phone = '+966592153035', "idNumber" = '1107613653', position = 'Customer Service Agent', project = 'SPL', status = 'Transfer', "workflowStatus" = 'Docs Received +', "startDate" = '2026-04-15', "endDate" = '2027-04-14', bank = 'INMA', iban = 'SA1405000068202207463000', "requesterName" = 'Jamila'
WHERE "employeeId" = 'EMP-0251'
  AND (
    "contractId" = 'CTR-0447'
    OR (name ILIKE '%Azzah Mohammed Alsheri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0447' AND name ILIKE '%Azzah Mohammed Alsheri%'))
  );

-- Abdulaziz Alagha | EMP-0228 | CTR-0423
UPDATE employees_master
SET "contractId" = 'CTR-0423', name = 'Abdulaziz Alagha', email = 'roro0alagha@gmail.com', phone = '+966591661338', "idNumber" = '2170504571', position = 'Videographer/Editor', project = 'no specific project', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-06', "endDate" = '2026-12-31', bank = 'SNB', iban = 'SA8710000011400001528008', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-35517'
WHERE "employeeId" = 'EMP-0228'
  AND (
    "contractId" = 'CTR-0423'
    OR (name ILIKE '%Abdulaziz Alagha%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0423' AND name ILIKE '%Abdulaziz Alagha%'))
  );

-- Feras Zuhair | EMP-0227 | CTR-0422
UPDATE employees_master
SET "contractId" = 'CTR-0422', name = 'Feras Zuhair', email = 'FerasZuhair11@Gmail.com', phone = '+966530392172', "idNumber" = '2160705576', position = '3D Generalist', project = 'no specific project', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-06', "endDate" = '2026-12-31', bank = 'Al ahli bank', iban = 'SA8310000011100297345406', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-35517'
WHERE "employeeId" = 'EMP-0227'
  AND (
    "contractId" = 'CTR-0422'
    OR (name ILIKE '%Feras Zuhair%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0422' AND name ILIKE '%Feras Zuhair%'))
  );

-- Mohammed Radwa | EMP-0169 | CTR-0421
UPDATE employees_master
SET "contractId" = 'CTR-0421', name = 'Mohammed Radwa', email = 'mohamedradwi@gmail.com', phone = '+966536088078', "idNumber" = '1098964263', position = 'CRM Agent', project = 'JYC', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-07-31', bank = 'saudi national bank ( al ahli )', iban = 'SA9510000010100011545410', "requesterName" = 'Tahani', "poNumbers" = 'PO-35492'
WHERE "employeeId" = 'EMP-0169'
  AND (
    "contractId" = 'CTR-0421'
    OR (name ILIKE '%Mohammed Radwa%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0421' AND name ILIKE '%Mohammed Radwa%'))
  );

-- Manea Alsugoor | EMP-0054 | CTR-0420
UPDATE employees_master
SET "contractId" = 'CTR-0420', name = 'Manea Alsugoor', email = 'alsagoor.mana@gmail.com', phone = '+966503923626', "idNumber" = '1089595563', position = 'civil engineer', project = 'irqah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-07', "endDate" = '2026-07-06', bank = 'SNB', iban = 'SA5010000011100335803202', "requesterName" = 'Tahani', "poNumbers" = 'PO-35410'
WHERE "employeeId" = 'EMP-0054'
  AND (
    "contractId" = 'CTR-0420'
    OR (name ILIKE '%Manea Alsugoor%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0420' AND name ILIKE '%Manea Alsugoor%'))
  );

-- Gouda Badran | EMP-0006 | CTR-0419
UPDATE employees_master
SET "contractId" = 'CTR-0419', name = 'Gouda Badran', email = 'gsbadran1@gmail.com', position = 'visualization specialist', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Docs Requested', "startDate" = '2026-03-01', "endDate" = '2026-03-31', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35463'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0419'
    OR (name ILIKE '%Gouda Badran%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0419' AND name ILIKE '%Gouda Badran%'))
  );

-- Abdulrahman Mohammed | EMP-0006 | CTR-0418
UPDATE employees_master
SET "contractId" = 'CTR-0418', name = 'Abdulrahman Mohammed', email = 'abdalrahmanmohamadmohamad@gmail.com', "idNumber" = '29809250100216', position = 'visualization specialist', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-03-01', "endDate" = '2026-03-31', iban = 'EG600010015100000100063876857', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35463'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0418'
    OR (name ILIKE '%Abdulrahman Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0418' AND name ILIKE '%Abdulrahman Mohammed%'))
  );

-- Mohammed Ehab | EMP-0005 | CTR-0417
UPDATE employees_master
SET "contractId" = 'CTR-0417', name = 'Mohammed Ehab', email = 'mohamedehab2000.me@gmail.com', phone = '+20 12 34508044', "idNumber" = 'A40735481', position = 'visualization specialist', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-03-01', "endDate" = '2026-03-31', iban = 'EG600002011301130203000000855', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35463'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0417'
    OR (name ILIKE '%Mohammed Ehab%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0417' AND name ILIKE '%Mohammed Ehab%'))
  );

-- Islam Nagi | EMP-0130 | CTR-0416
UPDATE employees_master
SET "contractId" = 'CTR-0416', name = 'Islam Nagi', email = 'number-ones@hotmail.com', phone = '+966 50 680 6257', position = 'art director', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Docs Requested', "startDate" = '2026-03-01', "endDate" = '2026-03-31', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35463'
WHERE "employeeId" = 'EMP-0130'
  AND (
    "contractId" = 'CTR-0416'
    OR (name ILIKE '%Islam Nagi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0416' AND name ILIKE '%Islam Nagi%'))
  );

-- Salahaddin Younis | EMP-0181 | CTR-0415
UPDATE employees_master
SET "contractId" = 'CTR-0415', name = 'Salahaddin Younis', email = 'sala71992@gmail.com', phone = '+966 53 805 7670', "idNumber" = '2095549859', position = 'Architect', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'Alinma bank', iban = 'SA6405000068200441354000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35463'
WHERE "employeeId" = 'EMP-0181'
  AND (
    "contractId" = 'CTR-0415'
    OR (name ILIKE '%Salahaddin Younis%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0415' AND name ILIKE '%Salahaddin Younis%'))
  );

-- Bushra Jubarah | EMP-0127 | CTR-0414
UPDATE employees_master
SET "contractId" = 'CTR-0414', name = 'Bushra Jubarah', email = 'bushra@bushrajubarah.com', phone = '‪+966 50 102 9093‬', "idNumber" = '2057095495', position = 'Visual & Motion Art Lead', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'alrajhi bank', iban = 'SA4980000243608016026921', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35463'
WHERE "employeeId" = 'EMP-0127'
  AND (
    "contractId" = 'CTR-0414'
    OR (name ILIKE '%Bushra Jubarah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0414' AND name ILIKE '%Bushra Jubarah%'))
  );

-- AHMED KHOJA | EMP-0226 | CTR-0413
UPDATE employees_master
SET "contractId" = 'CTR-0413', name = 'AHMED KHOJA', email = 'ahmed.aj.khoja@gmail.com', phone = '+966594179123', "idNumber" = '1115550327', position = 'Events Associate', project = 'JYC', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-11', "endDate" = '2026-06-10', bank = 'SNB AlAhli', iban = 'SA1410000014300000286704', "requesterName" = 'Tahani', "poNumbers" = 'PO-35422'
WHERE "employeeId" = 'EMP-0226'
  AND (
    "contractId" = 'CTR-0413'
    OR (name ILIKE '%AHMED KHOJA%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0413' AND name ILIKE '%AHMED KHOJA%'))
  );

-- AHMED A. MUFTI | EMP-0041 | CTR-0412
UPDATE employees_master
SET "contractId" = 'CTR-0412', name = 'AHMED A. MUFTI', email = 'Ahmed_mufti7@hotmail.com', phone = '+966 54 477 7987', "idNumber" = '1104001100', position = 'Client Relations', project = 'Riyadh Metro', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-28', "endDate" = '2026-06-27', bank = 'SAB', iban = 'SA6845000000853135234001', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35817'
WHERE "employeeId" = 'EMP-0041'
  AND (
    "contractId" = 'CTR-0412'
    OR (name ILIKE '%AHMED A. MUFTI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0412' AND name ILIKE '%AHMED A. MUFTI%'))
  );

-- Saleh Bakarman | EMP-0225 | CTR-0411
UPDATE employees_master
SET "contractId" = 'CTR-0411', name = 'Saleh Bakarman', email = 'S.bakarman@gmail.com', phone = '+966 53 5919 894', "idNumber" = '2162319848', position = 'CIVIL ENGINEER', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'البنك الأهلي السعودي', iban = 'SA9510000011100236503007', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0225'
  AND (
    "contractId" = 'CTR-0411'
    OR (name ILIKE '%Saleh Bakarman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0411' AND name ILIKE '%Saleh Bakarman%'))
  );

-- Manar Katebah | EMP-0224 | CTR-0410
UPDATE employees_master
SET "contractId" = 'CTR-0410', name = 'Manar Katebah', email = 'm.katebah@gmail.com', phone = '+966 547600761', "idNumber" = '2029059488', position = 'Senior Research Design & Quality Specialist for cultural impact', project = 'alderiyah project', status = 'new', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-03-08', "endDate" = '2026-04-07', bank = 'Saudi National Bank', iban = 'SA6910000013664152000109', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-35406'
WHERE "employeeId" = 'EMP-0224'
  AND (
    "contractId" = 'CTR-0410'
    OR (name ILIKE '%Manar Katebah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0410' AND name ILIKE '%Manar Katebah%'))
  );

-- Vail Edib | EMP-0223 | CTR-0409
UPDATE employees_master
SET "contractId" = 'CTR-0409', name = 'Vail Edib', email = 'vailmhdedib@gmail.com', phone = '+966544740860', "idNumber" = '2550654632', position = 'Senior Consultant for Cultural Impact Analysis', project = 'alderiyah project', status = 'new', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-03-08', "endDate" = '2026-04-07', bank = 'SNB', iban = 'SA77 1000 0011 1003 9423 2800', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-35406'
WHERE "employeeId" = 'EMP-0223'
  AND (
    "contractId" = 'CTR-0409'
    OR (name ILIKE '%Vail Edib%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0409' AND name ILIKE '%Vail Edib%'))
  );

-- Mohamad Charaf | EMP-0222 | CTR-0408
UPDATE employees_master
SET "contractId" = 'CTR-0408', name = 'Mohamad Charaf', email = 'mmcharaf@gmail.com', phone = '+966598011640', "idNumber" = '2094473648', position = 'Lead Researcher – Cultural Impact', project = 'alderiyah project', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-08', "endDate" = '2026-04-07', bank = 'The Saudi National Bank', iban = 'SA9110000011100140074700', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-35406'
WHERE "employeeId" = 'EMP-0222'
  AND (
    "contractId" = 'CTR-0408'
    OR (name ILIKE '%Mohamad Charaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0408' AND name ILIKE '%Mohamad Charaf%'))
  );

-- Amal Alshehri | EMP-0062 | CTR-0407
UPDATE employees_master
SET "contractId" = 'CTR-0407', name = 'Amal Alshehri', email = 'Amal-alshehri88@hotmail.com', phone = '+966-552926131', "idNumber" = '1008366492', position = 'Daily operational data analysis', project = 'alderiyah project', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'SNB', iban = 'SA8810000011100108072708', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-35406'
WHERE "employeeId" = 'EMP-0062'
  AND (
    "contractId" = 'CTR-0407'
    OR (name ILIKE '%Amal Alshehri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0407' AND name ILIKE '%Amal Alshehri%'))
  );

-- Shwetha Hundet | EMP-0221 | CTR-0406
UPDATE employees_master
SET "contractId" = 'CTR-0406', name = 'Shwetha Hundet', email = 'shwetahundet@gmail.com', phone = '+96650 633 20 54', position = 'Project Management Specialist', project = 'Saudi Fransi bank', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2026-02-26', "endDate" = '2027-02-25', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0221'
  AND (
    "contractId" = 'CTR-0406'
    OR (name ILIKE '%Shwetha Hundet%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0406' AND name ILIKE '%Shwetha Hundet%'))
  );

-- YOUSEF EMAD KHOSHAIM | EMP-0220 | CTR-0405
UPDATE employees_master
SET "contractId" = 'CTR-0405', name = 'YOUSEF EMAD KHOSHAIM', email = 'Yousefkhoshaim99@gmail.com', phone = '+966 535442381', "idNumber" = '1110095443', position = 'SECURITY SUPERVISIOR', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-14', "endDate" = '2026-06-13', bank = 'SNB', iban = 'SA6710000014656722000109', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0220'
  AND (
    "contractId" = 'CTR-0405'
    OR (name ILIKE '%YOUSEF EMAD KHOSHAIM%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0405' AND name ILIKE '%YOUSEF EMAD KHOSHAIM%'))
  );

-- HAMZAH abdullah AL-AMRI | EMP-0219 | CTR-0404
UPDATE employees_master
SET "contractId" = 'CTR-0404', name = 'HAMZAH abdullah AL-AMRI', email = 'Karemihamza@gmail.com', phone = '+966 55 009 2121', "idNumber" = '1097714560', position = 'SECURITY SUPERVISIOR', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-14', "endDate" = '2026-06-13', bank = 'STC Bank', iban = 'SA5578000000001288946678', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0219'
  AND (
    "contractId" = 'CTR-0404'
    OR (name ILIKE '%HAMZAH abdullah AL-AMRI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0404' AND name ILIKE '%HAMZAH abdullah AL-AMRI%'))
  );

-- Mamdouh Al-Harbi | EMP-0218 | CTR-0403
UPDATE employees_master
SET "contractId" = 'CTR-0403', name = 'Mamdouh Al-Harbi', email = 'mamdoh.ammash@gmail.com', phone = '+966554550577', "idNumber" = '1071902686', position = 'Project Manager', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-05-31', bank = 'alrajhi bank', iban = 'SA0480000105608010000358', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0218'
  AND (
    "contractId" = 'CTR-0403'
    OR (name ILIKE '%Mamdouh Al-Harbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0403' AND name ILIKE '%Mamdouh Al-Harbi%'))
  );

-- Khaled Eid Khaled Al-Anzi | EMP-0217 | CTR-0402
UPDATE employees_master
SET "contractId" = 'CTR-0402', name = 'Khaled Eid Khaled Al-Anzi', email = 'alanzi10200@gmail.com', phone = '+96656085 2177', "idNumber" = '1111462196', position = 'Project Coordinator', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-05-31', bank = 'Al Rahji Bank', iban = 'SA2180000634608010056343', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0217'
  AND (
    "contractId" = 'CTR-0402'
    OR (name ILIKE '%Khaled Eid Khaled Al-Anzi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0402' AND name ILIKE '%Khaled Eid Khaled Al-Anzi%'))
  );

-- Osama Khalaf | EMP-0004 | CTR-0401
UPDATE employees_master
SET "contractId" = 'CTR-0401', name = 'Osama Khalaf', email = 'osamah883@gmail.com', phone = '‪+966 50 150 8619‬', "idNumber" = '1081936955', position = 'construction engineer - Civil', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-05-31', bank = 'Al Rajhi', iban = 'SA1480000103608010289920', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0004'
  AND (
    "contractId" = 'CTR-0401'
    OR (name ILIKE '%Osama Khalaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0401' AND name ILIKE '%Osama Khalaf%'))
  );

-- Abdulhadi Alrashidi | EMP-0004 | CTR-0400
UPDATE employees_master
SET "contractId" = 'CTR-0400', name = 'Abdulhadi Alrashidi', email = 'aboodeattaq@gmail.com', phone = '+966 53 603 4104', "idNumber" = '1085307302', position = 'Safety Inspector', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-03-01', "endDate" = '2026-05-31', bank = 'AlRajhi', iban = 'SA7780000248608010153205', "requesterName" = 'Tahani', "poNumbers" = 'PO-35338'
WHERE "employeeId" = 'EMP-0004'
  AND (
    "contractId" = 'CTR-0400'
    OR (name ILIKE '%Abdulhadi Alrashidi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0400' AND name ILIKE '%Abdulhadi Alrashidi%'))
  );

-- AEDH Almutairi | EMP-0006 | CTR-0399
UPDATE employees_master
SET "contractId" = 'CTR-0399', name = 'AEDH Almutairi', email = 'aaid556@gmail.com', phone = '+966 56 893 4000', "idNumber" = '1088885742', position = 'construction supervisor', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-06-30', bank = 'Al Rajhi', iban = 'SA6280000286608010404551', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0399'
    OR (name ILIKE '%AEDH Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0399' AND name ILIKE '%AEDH Almutairi%'))
  );

-- Reham shahin | EMP-0054 | CTR-0398
UPDATE employees_master
SET "contractId" = 'CTR-0398', name = 'Reham shahin', email = 'rehamshahin48@gmail.com', phone = '+966501135566', "idNumber" = '2070405267', position = 'Project Control Specialist', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-06-30', bank = 'ANB', iban = 'SA9130400108086375920014', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0054'
  AND (
    "contractId" = 'CTR-0398'
    OR (name ILIKE '%Reham shahin%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0398' AND name ILIKE '%Reham shahin%'))
  );

-- Badr Mohamed | EMP-0006 | CTR-0397
UPDATE employees_master
SET "contractId" = 'CTR-0397', name = 'Badr Mohamed', email = 'badr.allakhmi@gmail.com', phone = '‪+966 59 782 3834‬', "idNumber" = '1115103549', position = 'Civil Engineer', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-01', "endDate" = '2026-06-30', bank = 'D360', iban = 'SA7636036036069344604555', "requesterName" = 'Tahani', "poNumbers" = 'PO-35343'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0397'
    OR (name ILIKE '%Badr Mohamed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0397' AND name ILIKE '%Badr Mohamed%'))
  );

-- Ahmed Saied Morsy Badr | EMP-0216 | CTR-0396
UPDATE employees_master
SET "contractId" = 'CTR-0396', name = 'Ahmed Saied Morsy Badr', email = 'Ahmedmorsy662@gmail.com', phone = '+966 568 288 997', "idNumber" = '2448775961', position = 'Audio / Light Operator', project = 'Event - AVL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-14', "endDate" = '2026-05-13', bank = 'SNB', iban = 'SA3810000050800000027106', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35337'
WHERE "employeeId" = 'EMP-0216'
  AND (
    "contractId" = 'CTR-0396'
    OR (name ILIKE '%Ahmed Saied Morsy Badr%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0396' AND name ILIKE '%Ahmed Saied Morsy Badr%'))
  );

-- Mohammed Hussain | EMP-0215 | CTR-0395
UPDATE employees_master
SET "contractId" = 'CTR-0395', name = 'Mohammed Hussain', email = 'muhammad.fakeeh77@gmail.com', phone = '+966572285347', "idNumber" = '2171775360', position = 'Office Coordinator', project = 'Women''s football season', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-10', "endDate" = '2026-09-09', bank = 'Alrajhi', iban = 'SA7780000648608016479915', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35123'
WHERE "employeeId" = 'EMP-0215'
  AND (
    "contractId" = 'CTR-0395'
    OR (name ILIKE '%Mohammed Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0395' AND name ILIKE '%Mohammed Hussain%'))
  );

-- Ahmad Wahba | EMP-0006 | CTR-0394
UPDATE employees_master
SET "contractId" = 'CTR-0394', name = 'Ahmad Wahba', email = 'wahba.strategy@gmail.com', phone = '+966533224400', "idNumber" = '2126600440', position = 'Marketing Strategy Lead', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'SNB', iban = 'SA9410000012294384000108', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35079'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0394'
    OR (name ILIKE '%Ahmad Wahba%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0394' AND name ILIKE '%Ahmad Wahba%'))
  );

-- Basil Maruf | EMP-0214 | CTR-0393
UPDATE employees_master
SET "contractId" = 'CTR-0393', name = 'Basil Maruf', email = 'bmaaroof@yahoo.com', phone = '+966591453343', position = 'Architect', project = 'Liv Golf 2026', status = 'new', "workflowStatus" = 'Docs Requested', "startDate" = '2026-03-01', "endDate" = '2026-03-31', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35125'
WHERE "employeeId" = 'EMP-0214'
  AND (
    "contractId" = 'CTR-0393'
    OR (name ILIKE '%Basil Maruf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0393' AND name ILIKE '%Basil Maruf%'))
  );

-- Mamduh Aldalbahy | EMP-0070 | CTR-0392
UPDATE employees_master
SET "contractId" = 'CTR-0392', name = 'Mamduh Aldalbahy', email = 'Mr.mmdoo7@gmail.com', phone = '+966566640626', "idNumber" = '1073033241', position = 'Security supervisor', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-04-30', bank = 'البنك السعودي للاستثمار', iban = 'SA3265000000240268684001', "requesterName" = 'Tahani', "poNumbers" = 'PO-34979'
WHERE "employeeId" = 'EMP-0070'
  AND (
    "contractId" = 'CTR-0392'
    OR (name ILIKE '%Mamduh Aldalbahy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0392' AND name ILIKE '%Mamduh Aldalbahy%'))
  );

-- Omar Mahbub | EMP-0069 | CTR-0391
UPDATE employees_master
SET "contractId" = 'CTR-0391', name = 'Omar Mahbub', email = 'Omahboob707@gmail.com', phone = '+966567614707', "idNumber" = '1026960540', position = 'Security supervisor', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-04-30', bank = 'SNB', iban = 'SA7610000011753571000100', "requesterName" = 'Tahani', "poNumbers" = 'PO-34979'
WHERE "employeeId" = 'EMP-0069'
  AND (
    "contractId" = 'CTR-0391'
    OR (name ILIKE '%Omar Mahbub%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0391' AND name ILIKE '%Omar Mahbub%'))
  );

-- Sara Jan | EMP-0006 | CTR-0390
UPDATE employees_master
SET "contractId" = 'CTR-0390', name = 'Sara Jan', email = 'sarah.hjan@gmail.com', phone = '+966 59 225 1201', "idNumber" = '1083071520', position = 'Barnding Manager', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'Al Rajhi', iban = 'SA2680000694608017379372', "requesterName" = 'Mohamed Mahmoud'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0390'
    OR (name ILIKE '%Sara Jan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0390' AND name ILIKE '%Sara Jan%'))
  );

-- Mohammad Mustafa Nazer | EMP-0187 | CTR-0389
UPDATE employees_master
SET "contractId" = 'CTR-0389', name = 'Mohammad Mustafa Nazer', email = 'mohammadnazer97@gmail.com', phone = '+966 55 590 0315', "idNumber" = '1099006221', position = 'Operation Manager', project = 'WWL Toy Town', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-05-31', bank = 'Ahli bank', iban = 'SA8910000011100144498809', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35055'
WHERE "employeeId" = 'EMP-0187'
  AND (
    "contractId" = 'CTR-0389'
    OR (name ILIKE '%Mohammad Mustafa Nazer%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0389' AND name ILIKE '%Mohammad Mustafa Nazer%'))
  );

-- Devireddy Ramesh Kumar Reddy | EMP-0213 | CTR-0388
UPDATE employees_master
SET "contractId" = 'CTR-0388', name = 'Devireddy Ramesh Kumar Reddy', email = 'ramesh.devireddy@c5i.ai', phone = '+966597295991', position = 'HLS - Analytics', project = 'C5i', status = 'transfer', "workflowStatus" = 'Pending', "startDate" = '2026-02-01', "endDate" = '2027-01-31', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0213'
  AND (
    "contractId" = 'CTR-0388'
    OR (name ILIKE '%Devireddy Ramesh Kumar Reddy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0388' AND name ILIKE '%Devireddy Ramesh Kumar Reddy%'))
  );

-- Yasser babhair | EMP-0037 | CTR-0387
UPDATE employees_master
SET "contractId" = 'CTR-0387', name = 'Yasser babhair', email = 'Babhairyasser@gmail.com', phone = '+966 580080498', "idNumber" = '2194172843', position = 'Site Operation', project = 'WWL Toy Town', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-14', "endDate" = '2026-06-04', bank = 'SNB', iban = 'SA8510000011100199629510', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35056'
WHERE "employeeId" = 'EMP-0037'
  AND (
    "contractId" = 'CTR-0387'
    OR (name ILIKE '%Yasser babhair%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0387' AND name ILIKE '%Yasser babhair%'))
  );

-- Hossam Abaalari | EMP-0036 | CTR-0386
UPDATE employees_master
SET "contractId" = 'CTR-0386', name = 'Hossam Abaalari', email = 'hoabaalari@gmail.com', phone = '+966545691612', "idNumber" = '1108089929', position = 'Site Manager', project = 'WWL Toy Town', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-14', "endDate" = '2026-06-04', bank = 'SNB', iban = 'SA5610000013500000104501', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35056'
WHERE "employeeId" = 'EMP-0036'
  AND (
    "contractId" = 'CTR-0386'
    OR (name ILIKE '%Hossam Abaalari%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0386' AND name ILIKE '%Hossam Abaalari%'))
  );

-- Ramzi Dakheel | EMP-0212 | CTR-0385
UPDATE employees_master
SET "contractId" = 'CTR-0385', name = 'Ramzi Dakheel', email = 'ramzidakheel@gmail.com', phone = '+966560875546', "idNumber" = '1124609478', position = 'Cybersecurity Specialist', project = 'no specific project', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-04-20', "endDate" = '2026-12-31', bank = 'Al Rajhi Bank', iban = 'SA5780000858608014287275', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-35067'
WHERE "employeeId" = 'EMP-0212'
  AND (
    "contractId" = 'CTR-0385'
    OR (name ILIKE '%Ramzi Dakheel%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0385' AND name ILIKE '%Ramzi Dakheel%'))
  );

-- Ahmed Ibrahim Algendy | EMP-0182 | CTR-0383
UPDATE employees_master
SET "contractId" = 'CTR-0383', name = 'Ahmed Ibrahim Algendy', email = 'ahmed.ibrahim.gendy@gmail.com', phone = '+20 112 184 7767', "idNumber" = 'A34917668', position = 'Senior Motion Graphic Designer', project = 'Liv Golf 2026', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-03-31', bank = 'Bank Misr', iban = 'EG880002044704470202000001501', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35125'
WHERE "employeeId" = 'EMP-0182'
  AND (
    "contractId" = 'CTR-0383'
    OR (name ILIKE '%Ahmed Ibrahim Algendy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0383' AND name ILIKE '%Ahmed Ibrahim Algendy%'))
  );

-- Mawaddah Jeelani | EMP-0210 | CTR-0382
UPDATE employees_master
SET "contractId" = 'CTR-0382', name = 'Mawaddah Jeelani', email = 'mawadah.jeelani@gmail.com', phone = '+966568687490', "idNumber" = '1095861009', position = 'Contract Administrator Coordinator', project = 'Hall', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-04-30', bank = 'Al-Rajhi bank', iban = 'SA9480000198608016262810', "requesterName" = 'Tahani', "poNumbers" = 'PO-34986'
WHERE "employeeId" = 'EMP-0210'
  AND (
    "contractId" = 'CTR-0382'
    OR (name ILIKE '%Mawaddah Jeelani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0382' AND name ILIKE '%Mawaddah Jeelani%'))
  );

-- Majed Abdulrahim | EMP-0209 | CTR-0381
UPDATE employees_master
SET "contractId" = 'CTR-0381', name = 'Majed Abdulrahim', email = 'majed.khojah2000@gmail.com', phone = '+966531252928', "idNumber" = '1196099186', position = 'POS Operation', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-03', "endDate" = '2026-06-02', bank = 'Al Rajhi Bank', iban = '‏SA7580000856608015746222', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-34765'
WHERE "employeeId" = 'EMP-0209'
  AND (
    "contractId" = 'CTR-0381'
    OR (name ILIKE '%Majed Abdulrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0381' AND name ILIKE '%Majed Abdulrahim%'))
  );

-- Belal Assaf | EMP-0208 | CTR-0380
UPDATE employees_master
SET "contractId" = 'CTR-0380', name = 'Belal Assaf', email = 'Belalassaf15@gmail.com', phone = '+966556211926', "idNumber" = '2182429312', position = 'POS Operation', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-03', "endDate" = '2026-06-02', bank = 'Alahli', iban = 'SA4710000013272143000108', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-34765'
WHERE "employeeId" = 'EMP-0208'
  AND (
    "contractId" = 'CTR-0380'
    OR (name ILIKE '%Belal Assaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0380' AND name ILIKE '%Belal Assaf%'))
  );

-- Naif Alqahtani | EMP-0165 | CTR-0379
UPDATE employees_master
SET "contractId" = 'CTR-0379', name = 'Naif Alqahtani', email = 'naif087@gmail.com', phone = '+966500954044', "idNumber" = '1098666314', position = 'security supervisor', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-04-30', bank = 'Al Rajhi', iban = 'SA0780000435608010104375', "requesterName" = 'Tahani', "poNumbers" = 'PO-34954'
WHERE "employeeId" = 'EMP-0165'
  AND (
    "contractId" = 'CTR-0379'
    OR (name ILIKE '%Naif Alqahtani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0379' AND name ILIKE '%Naif Alqahtani%'))
  );

-- Othman Alothman | EMP-0167 | CTR-0378
UPDATE employees_master
SET "contractId" = 'CTR-0378', name = 'Othman Alothman', email = 'othmanfahad.biz@gmail.com', phone = '+966563697179', "idNumber" = '1104210941', position = 'security supervisor', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-04-30', bank = 'Al Rajhi', iban = 'SA5480000282608016154667', "requesterName" = 'Tahani', "poNumbers" = 'PO-34954'
WHERE "employeeId" = 'EMP-0167'
  AND (
    "contractId" = 'CTR-0378'
    OR (name ILIKE '%Othman Alothman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0378' AND name ILIKE '%Othman Alothman%'))
  );

-- Ahmed Aljaser | EMP-0170 | CTR-0377
UPDATE employees_master
SET "contractId" = 'CTR-0377', name = 'Ahmed Aljaser', email = 'abugaser59@gmail.com', phone = '+966590908092', "idNumber" = '1112783426', position = 'security supervisor', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-03-30', bank = 'Al Rajhi', iban = 'SA97 8000 0318 6080 1008 5519', "requesterName" = 'Tahani', "poNumbers" = 'PO-34954'
WHERE "employeeId" = 'EMP-0170'
  AND (
    "contractId" = 'CTR-0377'
    OR (name ILIKE '%Ahmed Aljaser%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0377' AND name ILIKE '%Ahmed Aljaser%'))
  );

-- Marzooq Yahya Mohammed | EMP-0006 | CTR-0376
UPDATE employees_master
SET "contractId" = 'CTR-0376', name = 'Marzooq Yahya Mohammed', email = 'marzouqbinyahya@gmail.com', "idNumber" = '2598941058', position = 'Site Operation Specialist', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-02-01', "endDate" = '2026-02-28', bank = 'Alinma', iban = 'SA0805000068206517778000', "requesterName" = 'Tahani', "poNumbers" = 'PO-34954'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0376'
    OR (name ILIKE '%Marzooq Yahya Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0376' AND name ILIKE '%Marzooq Yahya Mohammed%'))
  );

-- Mohammed Saad Almowlad | EMP-0006 | CTR-0375
UPDATE employees_master
SET "contractId" = 'CTR-0375', name = 'Mohammed Saad Almowlad', email = 'moh.almowlad9@gmail.com', "idNumber" = '1101163747', position = 'Site Operation Specialist', project = 'boulevard city', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-02-28', bank = 'Alinma', iban = 'SA4105000068205416653000', "requesterName" = 'Tahani', "poNumbers" = 'PO-34954'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0375'
    OR (name ILIKE '%Mohammed Saad Almowlad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0375' AND name ILIKE '%Mohammed Saad Almowlad%'))
  );

-- Sara Jan | EMP-0006 | CTR-0374
UPDATE employees_master
SET "contractId" = 'CTR-0374', name = 'Sara Jan', email = 'sarah.hjan@gmail.com', phone = '+966 59 225 1201', "idNumber" = '1083071520', position = 'Barnding Manager', project = 'Formula E', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-03-01', "endDate" = '2026-03-31', iban = 'SA2680000694608017379372', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34786'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0374'
    OR (name ILIKE '%Sara Jan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0374' AND name ILIKE '%Sara Jan%'))
  );

-- Fatmah Alahmri | EMP-0031 | CTR-0373
UPDATE employees_master
SET "contractId" = 'CTR-0373', name = 'Fatmah Alahmri', email = 'Fatima.alahmari@outlook.sa', phone = '+966542841111', "idNumber" = '1095623680', position = 'Stadiums coordinator', project = 'Italian SuperCup 25-26', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2025-12-22', bank = 'ALINMA Bank', iban = 'SA0805000068203924095000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35140'
WHERE "employeeId" = 'EMP-0031'
  AND (
    "contractId" = 'CTR-0373'
    OR (name ILIKE '%Fatmah Alahmri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0373' AND name ILIKE '%Fatmah Alahmri%'))
  );

-- Amina Alharbi | EMP-0030 | CTR-0372
UPDATE employees_master
SET "contractId" = 'CTR-0372', name = 'Amina Alharbi', email = 'bebebebe20302030@gmail.com', phone = '+966 568730085', "idNumber" = '1090229624', position = 'Stadiums coordinator', project = 'Italian SuperCup 25-26', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2025-12-22', bank = 'Al Rajhi Bank', iban = 'SA6880000440608010109526', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35140'
WHERE "employeeId" = 'EMP-0030'
  AND (
    "contractId" = 'CTR-0372'
    OR (name ILIKE '%Amina Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0372' AND name ILIKE '%Amina Alharbi%'))
  );

-- Amer Salmin Al-Sumahi | EMP-0029 | CTR-0371
UPDATE employees_master
SET "contractId" = 'CTR-0371', name = 'Amer Salmin Al-Sumahi', email = 'Aalsumahi@gmail.com', phone = '+966 542959953', "idNumber" = '1063591018', position = 'Stadiums coordinator', project = 'Italian SuperCup 25-26', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2025-12-22', bank = 'Alahli', iban = 'SA6610000020251557000107', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35140'
WHERE "employeeId" = 'EMP-0029'
  AND (
    "contractId" = 'CTR-0371'
    OR (name ILIKE '%Amer Salmin Al-Sumahi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0371' AND name ILIKE '%Amer Salmin Al-Sumahi%'))
  );

-- Abdulelah Alqurashi | EMP-0032 | CTR-0370
UPDATE employees_master
SET "contractId" = 'CTR-0370', name = 'Abdulelah Alqurashi', email = 'abdulellah.h.q@gmail.com', phone = '+966547373130', "idNumber" = '1109295475', position = 'Stadiums coordinator', project = 'Italian SuperCup 25-26', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2025-12-22', bank = 'SNB', iban = 'SA2710000011100216490609', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-35140'
WHERE "employeeId" = 'EMP-0032'
  AND (
    "contractId" = 'CTR-0370'
    OR (name ILIKE '%Abdulelah Alqurashi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0370' AND name ILIKE '%Abdulelah Alqurashi%'))
  );

-- Mohammed Althobaiti | EMP-0064 | CTR-0369
UPDATE employees_master
SET "contractId" = 'CTR-0369', name = 'Mohammed Althobaiti', email = 'Mohammed.althebaiti@gmail.com', phone = '+966566663039', "idNumber" = '1119583779', position = 'Contract Vendor Associate', project = 'JYC', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-06-30', bank = 'SNB', iban = 'SA3310000050800000211302', "requesterName" = 'Tahani', "poNumbers" = 'PO-34775'
WHERE "employeeId" = 'EMP-0064'
  AND (
    "contractId" = 'CTR-0369'
    OR (name ILIKE '%Mohammed Althobaiti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0369' AND name ILIKE '%Mohammed Althobaiti%'))
  );

-- Obaid Alamri | EMP-0071 | CTR-0368
UPDATE employees_master
SET "contractId" = 'CTR-0368', name = 'Obaid Alamri', email = 'obaidaalamri@hotmail.com', phone = '+966560092706', "idNumber" = '1119104139', position = 'Contract Administrator Coordinator', project = 'JSD', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-06-30', bank = 'SNB', iban = 'SA6510000014600001054108', "requesterName" = 'Tahani', "poNumbers" = 'PO-34931'
WHERE "employeeId" = 'EMP-0071'
  AND (
    "contractId" = 'CTR-0368'
    OR (name ILIKE '%Obaid Alamri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0368' AND name ILIKE '%Obaid Alamri%'))
  );

-- Meshal Alshareef | EMP-0006 | CTR-0367
UPDATE employees_master
SET "contractId" = 'CTR-0367', name = 'Meshal Alshareef', email = 'alsharef_meshal@hotmail.com', phone = '+966 58 112 0200', "idNumber" = '1109718971', position = 'Contract Tenant Associate', project = 'blvd hall', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-06-30', bank = 'Al Rajhi', iban = 'SA0480000991608017477341', "requesterName" = 'Tahani', "poNumbers" = 'PO-34769'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0367'
    OR (name ILIKE '%Meshal Alshareef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0367' AND name ILIKE '%Meshal Alshareef%'))
  );

-- Hasihm Wael Alhashmi | EMP-0207 | CTR-0366
UPDATE employees_master
SET "contractId" = 'CTR-0366', name = 'Hasihm Wael Alhashmi', email = 'Hashim.wail@hotmail.com', phone = '+966590108040', "idNumber" = '1102789987', position = 'Site Manager', project = 'Ala Khotah', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-06-30', bank = 'Al rajhi bank', iban = '‏SA4580000370608016009294', "requesterName" = 'Tahani', "poNumbers" = 'PO-34611'
WHERE "employeeId" = 'EMP-0207'
  AND (
    "contractId" = 'CTR-0366'
    OR (name ILIKE '%Hasihm Wael Alhashmi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0366' AND name ILIKE '%Hasihm Wael Alhashmi%'))
  );

-- Hassan Alharbi | EMP-0043 | CTR-0365
UPDATE employees_master
SET "contractId" = 'CTR-0365', name = 'Hassan Alharbi', email = 'Hw202820@gmail.com', phone = '+966541235100', "idNumber" = '1002028999', position = 'site manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-06-30', bank = 'Al Rajhi', iban = 'SA8980000443608016202926', "requesterName" = 'Tahani', "poNumbers" = 'PO-34611'
WHERE "employeeId" = 'EMP-0043'
  AND (
    "contractId" = 'CTR-0365'
    OR (name ILIKE '%Hassan Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0365' AND name ILIKE '%Hassan Alharbi%'))
  );

-- Abdulaziz Awad AL Jomaa | EMP-0005 | CTR-0364
UPDATE employees_master
SET "contractId" = 'CTR-0364', name = 'Abdulaziz Awad AL Jomaa', email = 'Rt1610096@gmail.com', phone = '+966 0508347454', "idNumber" = '1108036979', position = 'Site Manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-06-30', bank = 'Al Rajhi', iban = 'SA8680000296608016023023', "requesterName" = 'Tahani', "poNumbers" = 'PO-34611'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0364'
    OR (name ILIKE '%Abdulaziz Awad AL Jomaa%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0364' AND name ILIKE '%Abdulaziz Awad AL Jomaa%'))
  );

-- Mohamed Faisal Obaid | EMP-0054 | CTR-0363
UPDATE employees_master
SET "contractId" = 'CTR-0363', name = 'Mohamed Faisal Obaid', email = 'fobaid172@gmail.com', phone = '+966591675895', "idNumber" = '2217726385', position = 'Engineer', project = 'irqah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-24', "endDate" = '2026-05-23', bank = 'Alinma', iban = 'SA0205000068204996744000', "requesterName" = 'Tahani', "poNumbers" = 'PO-34993'
WHERE "employeeId" = 'EMP-0054'
  AND (
    "contractId" = 'CTR-0363'
    OR (name ILIKE '%Mohamed Faisal Obaid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0363' AND name ILIKE '%Mohamed Faisal Obaid%'))
  );

-- Ahmed Mohammed | EMP-0206 | CTR-0362
UPDATE employees_master
SET "contractId" = 'CTR-0362', name = 'Ahmed Mohammed', email = 'hmada2803@gmail.com', phone = '+966592160035', "idNumber" = '2228666778', position = 'Photographer/ Crew Assist', project = 'Corporate', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-10', "endDate" = '2026-05-09', bank = 'Alrajhi bank', iban = 'SA2980000991608016660830', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-34579'
WHERE "employeeId" = 'EMP-0206'
  AND (
    "contractId" = 'CTR-0362'
    OR (name ILIKE '%Ahmed Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0362' AND name ILIKE '%Ahmed Mohammed%'))
  );

-- LATIFAH ALZAHRANI | EMP-0205 | CTR-0361
UPDATE employees_master
SET "contractId" = 'CTR-0361', name = 'LATIFAH ALZAHRANI', email = 'Latifa.alzahrani98@gmail.com', phone = '+966563751419', "idNumber" = '1100736584', position = 'Videographer', project = 'Corporate', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-10', "endDate" = '2026-05-09', bank = 'Alinma Bank', iban = 'SA6305000068206213013001', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-34579'
WHERE "employeeId" = 'EMP-0205'
  AND (
    "contractId" = 'CTR-0361'
    OR (name ILIKE '%LATIFAH ALZAHRANI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0361' AND name ILIKE '%LATIFAH ALZAHRANI%'))
  );

-- Saad Abdullah Almogren | EMP-0204 | CTR-0360
UPDATE employees_master
SET "contractId" = 'CTR-0360', name = 'Saad Abdullah Almogren', email = 'Saadalm1190@gmail.com', phone = '+966559304787', "idNumber" = '1127716452', position = 'Protocol Assistant', project = 'alderiyah project', status = 'new', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-02-01', "endDate" = '2026-03-31', bank = 'Alinma', iban = 'SA1305000068203121902000', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-34469'
WHERE "employeeId" = 'EMP-0204'
  AND (
    "contractId" = 'CTR-0360'
    OR (name ILIKE '%Saad Abdullah Almogren%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0360' AND name ILIKE '%Saad Abdullah Almogren%'))
  );

-- Turki M AlMisfer | EMP-0203 | CTR-0359
UPDATE employees_master
SET "contractId" = 'CTR-0359', name = 'Turki M AlMisfer', email = 'TurkiMalmesfr@gmail.com', phone = '+966 58 105 5581', "idNumber" = '1113338725', position = 'Protocol Assistant', project = 'alderiyah project', status = 'new', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-02-01', "endDate" = '2026-03-31', bank = 'Barq', iban = 'SA7730100991103917683411', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-34469'
WHERE "employeeId" = 'EMP-0203'
  AND (
    "contractId" = 'CTR-0359'
    OR (name ILIKE '%Turki M AlMisfer%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0359' AND name ILIKE '%Turki M AlMisfer%'))
  );

-- Osman Fadil | EMP-0202 | CTR-0358
UPDATE employees_master
SET "contractId" = 'CTR-0358', name = 'Osman Fadil', email = 'OSMANFADIL87@GMAIL.COM', phone = '+966 563942952', "idNumber" = '2531831317', position = 'Electrical Engineer', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-15', "endDate" = '2026-05-14', bank = 'SNB', iban = 'SA3110000071200004611402', "requesterName" = 'Tahani', "poNumbers" = 'PO-34426'
WHERE "employeeId" = 'EMP-0202'
  AND (
    "contractId" = 'CTR-0358'
    OR (name ILIKE '%Osman Fadil%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0358' AND name ILIKE '%Osman Fadil%'))
  );

-- Ibrahim alalkami | EMP-0201 | CTR-0357
UPDATE employees_master
SET "contractId" = 'CTR-0357', name = 'Ibrahim alalkami', email = 'IbrahimAlalkami11@gmail.com', phone = '+966 548700655', "idNumber" = '1083942555', position = 'Site Manager', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-05', "endDate" = '2026-03-04', bank = 'alahli', iban = 'SA2110000043500000046401', "requesterName" = 'Tahani', "poNumbers" = 'PO-34426'
WHERE "employeeId" = 'EMP-0201'
  AND (
    "contractId" = 'CTR-0357'
    OR (name ILIKE '%Ibrahim alalkami%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0357' AND name ILIKE '%Ibrahim alalkami%'))
  );

-- Khalid alzahrani | EMP-0200 | CTR-0356
UPDATE employees_master
SET "contractId" = 'CTR-0356', name = 'Khalid alzahrani', email = 'kahlid1441@gmail.com', phone = '+966593870531', "idNumber" = '1098091836', position = 'Site Manager', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-05', "endDate" = '2026-03-04', bank = 'Alinma', iban = 'SA1205000068200384485000', "requesterName" = 'Tahani', "poNumbers" = 'PO-34426'
WHERE "employeeId" = 'EMP-0200'
  AND (
    "contractId" = 'CTR-0356'
    OR (name ILIKE '%Khalid alzahrani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0356' AND name ILIKE '%Khalid alzahrani%'))
  );

-- Ahmed alshanqeeti | EMP-0199 | CTR-0355
UPDATE employees_master
SET "contractId" = 'CTR-0355', name = 'Ahmed alshanqeeti', email = 'Alshanqeeti.ahmed@gmail.com', phone = '+966 581230128', "idNumber" = '1105745853', position = 'Site Manager', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-05', "endDate" = '2026-03-04', bank = 'Alinma Bank', iban = 'SA0405000068202166632000', "requesterName" = 'Tahani', "poNumbers" = 'PO-34426'
WHERE "employeeId" = 'EMP-0199'
  AND (
    "contractId" = 'CTR-0355'
    OR (name ILIKE '%Ahmed alshanqeeti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0355' AND name ILIKE '%Ahmed alshanqeeti%'))
  );

-- Ahmed Basyoni | EMP-0198 | CTR-0354
UPDATE employees_master
SET "contractId" = 'CTR-0354', name = 'Ahmed Basyoni', email = 'basyouni727@gmail.com', phone = '+966 570 841 804', "idNumber" = '2341784144', position = 'Senior Mechanical Infrastructure Engineer', project = 'Masar Bader', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-05', "endDate" = '2026-07-04', bank = 'Al Rajhi Bank', iban = 'SA9080000202608012005837', "requesterName" = 'Tahani', "poNumbers" = 'PO-34426'
WHERE "employeeId" = 'EMP-0198'
  AND (
    "contractId" = 'CTR-0354'
    OR (name ILIKE '%Ahmed Basyoni%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0354' AND name ILIKE '%Ahmed Basyoni%'))
  );

-- Ammar Hussain | EMP-0065 | CTR-0353
UPDATE employees_master
SET "contractId" = 'CTR-0353', name = 'Ammar Hussain', email = 'ammar.hussain999@gmail.com', "idNumber" = '1078680814', position = 'leasing assistant manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-03-31', bank = 'SNB', iban = 'SA5810000042197015000101', "requesterName" = 'Tahani', "poNumbers" = 'PO-35071'
WHERE "employeeId" = 'EMP-0065'
  AND (
    "contractId" = 'CTR-0353'
    OR (name ILIKE '%Ammar Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0353' AND name ILIKE '%Ammar Hussain%'))
  );

-- Mohammed Al qhtani | EMP-0066 | CTR-0352
UPDATE employees_master
SET "contractId" = 'CTR-0352', name = 'Mohammed Al qhtani', email = 'alhgdore999@gmail.com', phone = '+966583239262', "idNumber" = '1115054916', position = 'leasing assistant manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-03-31', bank = 'Al Rajhi', iban = 'SA7780000528608010964578', "requesterName" = 'Tahani', "poNumbers" = 'PO-35071'
WHERE "employeeId" = 'EMP-0066'
  AND (
    "contractId" = 'CTR-0352'
    OR (name ILIKE '%Mohammed Al qhtani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0352' AND name ILIKE '%Mohammed Al qhtani%'))
  );

-- Salma Al. Ibrahim | EMP-0068 | CTR-0351
UPDATE employees_master
SET "contractId" = 'CTR-0351', name = 'Salma Al. Ibrahim', email = 'salbrahim06@gmail.com', phone = '+966 501370606', "idNumber" = '1095904007', position = 'leasing assistant manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-03-31', bank = 'Urpay', iban = 'SA0980204892254222121010', "requesterName" = 'Tahani', "poNumbers" = 'PO-35071'
WHERE "employeeId" = 'EMP-0068'
  AND (
    "contractId" = 'CTR-0351'
    OR (name ILIKE '%Salma Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0351' AND name ILIKE '%Salma Al. Ibrahim%'))
  );

-- Nawaf Al. Ibrahim | EMP-0067 | CTR-0350
UPDATE employees_master
SET "contractId" = 'CTR-0350', name = 'Nawaf Al. Ibrahim', email = 'nawaf.saaed.20@gmail.com', phone = '+966509571527', "idNumber" = '1166306991', position = 'leasing assistant manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-03-31', bank = 'SNB', iban = '‏SA6310000052900002048904', "requesterName" = 'Tahani', "poNumbers" = 'PO-35071'
WHERE "employeeId" = 'EMP-0067'
  AND (
    "contractId" = 'CTR-0350'
    OR (name ILIKE '%Nawaf Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0350' AND name ILIKE '%Nawaf Al. Ibrahim%'))
  );

-- Weam Mohammed Iskandar | EMP-0005 | CTR-0349
UPDATE employees_master
SET "contractId" = 'CTR-0349', name = 'Weam Mohammed Iskandar', email = 'weameskander55@gmail.com', "idNumber" = '1082429224', position = 'Leasing Assistant Manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-03-31', bank = 'SNB', iban = 'SA9710000011100515402609', "requesterName" = 'Tahani', "poNumbers" = 'PO-35071'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0349'
    OR (name ILIKE '%Weam Mohammed Iskandar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0349' AND name ILIKE '%Weam Mohammed Iskandar%'))
  );

-- Abdulrahman Hamza Mohamed | EMP-0056 | CTR-0348
UPDATE employees_master
SET "contractId" = 'CTR-0348', name = 'Abdulrahman Hamza Mohamed', email = 'Abdulrhmansh59@gmail.com', phone = '+966542307742', "idNumber" = '1096667785', position = 'Vedio Grapher', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-02-15', bank = 'SNB', iban = 'SA4410000011100056928407', "requesterName" = 'Tahani', "poNumbers" = 'PO-34425'
WHERE "employeeId" = 'EMP-0056'
  AND (
    "contractId" = 'CTR-0348'
    OR (name ILIKE '%Abdulrahman Hamza Mohamed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0348' AND name ILIKE '%Abdulrahman Hamza Mohamed%'))
  );

-- GUNASEHARAN AGNI SAMY | EMP-0197 | CTR-0347
UPDATE employees_master
SET "contractId" = 'CTR-0347', name = 'GUNASEHARAN AGNI SAMY', email = 'gunaseharan@maveric-systems.com', phone = '+966545169875', position = 'Business Consulting Specialist', project = 'Maveric', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2026-01-01', "endDate" = '2026-12-31', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0197'
  AND (
    "contractId" = 'CTR-0347'
    OR (name ILIKE '%GUNASEHARAN AGNI SAMY%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0347' AND name ILIKE '%GUNASEHARAN AGNI SAMY%'))
  );

-- Ajesh Rajan | EMP-0196 | CTR-0346
UPDATE employees_master
SET "contractId" = 'CTR-0346', name = 'Ajesh Rajan', email = 'ajeshyesh@gmail.com', phone = '+966576921305', position = 'Senior Project Manager', project = 'Maveric', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2026-01-01', "endDate" = '2026-12-31', "requesterName" = 'Ahmed Talaat'
WHERE "employeeId" = 'EMP-0196'
  AND (
    "contractId" = 'CTR-0346'
    OR (name ILIKE '%Ajesh Rajan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0346' AND name ILIKE '%Ajesh Rajan%'))
  );

-- Naveed Ahmed Vellore Thathamiya | EMP-0195 | CTR-0345
UPDATE employees_master
SET "contractId" = 'CTR-0345', name = 'Naveed Ahmed Vellore Thathamiya', email = 'naveedahmedvt@maveric-systems.com', phone = '+966502042696', position = 'Systems Tester', project = 'Maveric', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2026-01-01', "endDate" = '2026-12-31', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0195'
  AND (
    "contractId" = 'CTR-0345'
    OR (name ILIKE '%Naveed Ahmed Vellore Thathamiya%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0345' AND name ILIKE '%Naveed Ahmed Vellore Thathamiya%'))
  );

-- Nijguna SOMANATH RAJAMATHI | EMP-0194 | CTR-0344
UPDATE employees_master
SET "contractId" = 'CTR-0344', name = 'Nijguna SOMANATH RAJAMATHI', email = 'nijgunap@maveric-systems.com', phone = '+966540781293', position = 'Senior business Analyst', project = 'Maveric', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2026-01-01', "endDate" = '2026-12-31', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0194'
  AND (
    "contractId" = 'CTR-0344'
    OR (name ILIKE '%Nijguna SOMANATH RAJAMATHI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0344' AND name ILIKE '%Nijguna SOMANATH RAJAMATHI%'))
  );

-- RAJENDRAN VENGADESAN | EMP-0193 | CTR-0343
UPDATE employees_master
SET "contractId" = 'CTR-0343', name = 'RAJENDRAN VENGADESAN', email = 'rvengadesan88@gmail.com', phone = '+91 9361997028', position = 'Senior Project Manager', project = 'Maveric', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2025-12-27', "endDate" = '2026-12-26', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0193'
  AND (
    "contractId" = 'CTR-0343'
    OR (name ILIKE '%RAJENDRAN VENGADESAN%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0343' AND name ILIKE '%RAJENDRAN VENGADESAN%'))
  );

-- Sandeep Kaushik | EMP-0192 | CTR-0342
UPDATE employees_master
SET "contractId" = 'CTR-0342', name = 'Sandeep Kaushik', email = 'sandeep.kaushik@c5i.ai', phone = '+966561043659', position = 'Project Manager', project = 'C5i', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2025-12-04', "endDate" = '2026-12-03', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0192'
  AND (
    "contractId" = 'CTR-0342'
    OR (name ILIKE '%Sandeep Kaushik%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0342' AND name ILIKE '%Sandeep Kaushik%'))
  );

-- IBRAHIM ANWAR AL RAYYIS | EMP-0191 | CTR-0341
UPDATE employees_master
SET "contractId" = 'CTR-0341', name = 'IBRAHIM ANWAR AL RAYYIS', email = 'ibrahimalrayyis@gmail.com', phone = '‪+966 53 423 5424‬', "idNumber" = '1073990879', position = 'Purchasing Specilaist', project = 'Merwas', status = 'new', "workflowStatus" = 'Docs Received', "startDate" = '2026-02-08', "endDate" = '2026-08-07', bank = 'Al Rajhi', iban = 'SA1880000109608016100430', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-34680'
WHERE "employeeId" = 'EMP-0191'
  AND (
    "contractId" = 'CTR-0341'
    OR (name ILIKE '%IBRAHIM ANWAR AL RAYYIS%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0341' AND name ILIKE '%IBRAHIM ANWAR AL RAYYIS%'))
  );

-- Badr Mohamed | EMP-0006 | CTR-0340
UPDATE employees_master
SET "contractId" = 'CTR-0340', name = 'Badr Mohamed', email = 'badr.allakhmi@gmail.com', phone = '‪+966 59 782 3834‬', "idNumber" = '1115103549', position = 'Civil Engineer', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-03-31', bank = 'D360', iban = 'SA7636036036069344604555', "requesterName" = 'Tahani', "poNumbers" = 'PO-34508'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0340'
    OR (name ILIKE '%Badr Mohamed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0340' AND name ILIKE '%Badr Mohamed%'))
  );

-- Abdulrahman Alasmari | EMP-0006 | CTR-0339
UPDATE employees_master
SET "contractId" = 'CTR-0339', name = 'Abdulrahman Alasmari', email = 'dhdh199@hotmail.com', phone = '+966 545323977', "idNumber" = '1103842363', position = 'project coordinator', project = 'irqah', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-01-25', "endDate" = '2026-04-24', bank = 'Al Rajhi', iban = 'SA2480000487608010601310', "requesterName" = 'Tahani', "poNumbers" = 'PO-34317'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0339'
    OR (name ILIKE '%Abdulrahman Alasmari%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0339' AND name ILIKE '%Abdulrahman Alasmari%'))
  );

-- Mohamed El Habbash | EMP-0128 | CTR-0338
UPDATE employees_master
SET "contractId" = 'CTR-0338', name = 'Mohamed El Habbash', email = 'shmohammed269@gmail.com', phone = '+966544410585', "idNumber" = '2084121322', position = 'Project Manager', project = 'WDS 2025 - 2026', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-07-31', bank = 'Alinma', iban = 'SA0505000068202513484000', "requesterName" = 'Tahani', "poNumbers" = 'PO-34319'
WHERE "employeeId" = 'EMP-0128'
  AND (
    "contractId" = 'CTR-0338'
    OR (name ILIKE '%Mohamed El Habbash%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0338' AND name ILIKE '%Mohamed El Habbash%'))
  );

-- Mohamed El Habbash | EMP-0128 | CTR-0337
UPDATE employees_master
SET "contractId" = 'CTR-0337', name = 'Mohamed El Habbash', email = 'shmohammed269@gmail.com', phone = '+966544410585', "idNumber" = '2084121322', position = 'Project Manager', project = 'WDS 2025 - 2026', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2025-11-01', "endDate" = '2026-01-31', bank = 'Alinma', iban = 'SA0505000068202513484000', "requesterName" = 'Tahani'
WHERE "employeeId" = 'EMP-0128'
  AND (
    "contractId" = 'CTR-0337'
    OR (name ILIKE '%Mohamed El Habbash%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0337' AND name ILIKE '%Mohamed El Habbash%'))
  );

-- Ammar Jaber | EMP-0190 | CTR-0336
UPDATE employees_master
SET "contractId" = 'CTR-0336', name = 'Ammar Jaber', email = 'amjaber@gmail.com', phone = '+966504336050', "idNumber" = '2026040960', position = 'Commercial Manager', project = 'Ala Khotah', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-07-31', bank = 'SAB', iban = 'SA2745000000262033574001', "requesterName" = 'Tahani', "poNumbers" = 'PO-34596'
WHERE "employeeId" = 'EMP-0190'
  AND (
    "contractId" = 'CTR-0336'
    OR (name ILIKE '%Ammar Jaber%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0336' AND name ILIKE '%Ammar Jaber%'))
  );

-- Rahaf AlGhamdi | EMP-0189 | CTR-0335
UPDATE employees_master
SET "contractId" = 'CTR-0335', name = 'Rahaf AlGhamdi', email = 'rahafalghamdi652@gmail.com', phone = '+966535253378', "idNumber" = '1117385078', position = 'Commercial budget associate', project = 'no specific project', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-01', "endDate" = '2026-12-31', bank = 'SNB', iban = 'SA7310000011100061728803', "requesterName" = 'Tahani', "poNumbers" = 'PO-34866'
WHERE "employeeId" = 'EMP-0189'
  AND (
    "contractId" = 'CTR-0335'
    OR (name ILIKE '%Rahaf AlGhamdi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0335' AND name ILIKE '%Rahaf AlGhamdi%'))
  );

-- Ibrahim Yasser Saber Elsayed | EMP-0188 | CTR-0334
UPDATE employees_master
SET "contractId" = 'CTR-0334', name = 'Ibrahim Yasser Saber Elsayed', email = 'ibrahim.yasser@augnito.ai', phone = '(+966)547423556', position = 'Medical Representative', project = 'Maveric', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2026-01-05', "endDate" = '2027-01-04', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0188'
  AND (
    "contractId" = 'CTR-0334'
    OR (name ILIKE '%Ibrahim Yasser Saber Elsayed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0334' AND name ILIKE '%Ibrahim Yasser Saber Elsayed%'))
  );

-- Mohammad Mustafa Nazer | EMP-0187 | CTR-0333
UPDATE employees_master
SET "contractId" = 'CTR-0333', name = 'Mohammad Mustafa Nazer', email = 'mohammadnazer97@gmail.com', phone = '+966 55 590 0315', "idNumber" = '1099006221', position = 'Operation Manager', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA8910000011100144498809', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34159'
WHERE "employeeId" = 'EMP-0187'
  AND (
    "contractId" = 'CTR-0333'
    OR (name ILIKE '%Mohammad Mustafa Nazer%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0333' AND name ILIKE '%Mohammad Mustafa Nazer%'))
  );

-- Graham Weakley | EMP-0028 | CTR-0332
UPDATE employees_master
SET "contractId" = 'CTR-0332', name = 'Graham Weakley', email = 'tiger.weakley@gmail.com', phone = '+44 79 46 081802', "idNumber" = '4610852255', position = 'Production/operations manager', project = 'Italian SuperCup 25-26', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-12-19', "endDate" = '2025-12-25', iban = 'GB09REVO00997018920055', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34969'
WHERE "employeeId" = 'EMP-0028'
  AND (
    "contractId" = 'CTR-0332'
    OR (name ILIKE '%Graham Weakley%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0332' AND name ILIKE '%Graham Weakley%'))
  );

-- Atif Javed | EMP-0003 | CTR-0331
UPDATE employees_master
SET "contractId" = 'CTR-0331', name = 'Atif Javed', email = 'atifjav@hotmail.com', phone = '+92 306 1717869', "idNumber" = '33303-9966269-5', position = 'Site manager', project = 'Beast land', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-01-01', "endDate" = '2026-01-06', iban = 'PK13UNIL0109000335707564', "requesterName" = 'Tahani', "poNumbers" = 'PO-33995'
WHERE "employeeId" = 'EMP-0003'
  AND (
    "contractId" = 'CTR-0331'
    OR (name ILIKE '%Atif Javed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0331' AND name ILIKE '%Atif Javed%'))
  );

-- Abdulwahab Alabbasi | EMP-0134 | CTR-0330
UPDATE employees_master
SET "contractId" = 'CTR-0330', name = 'Abdulwahab Alabbasi', email = 'a.h.alabbasii@gmail.com', phone = '+966564543639', "idNumber" = '1099765883', position = 'Mechanical Engineer', project = 'Winter Wonderland', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'Al Ahli Bank', iban = 'SA8210000011100130696708', "requesterName" = 'Tahani', "poNumbers" = 'PO-34279'
WHERE "employeeId" = 'EMP-0134'
  AND (
    "contractId" = 'CTR-0330'
    OR (name ILIKE '%Abdulwahab Alabbasi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0330' AND name ILIKE '%Abdulwahab Alabbasi%'))
  );

-- Wahban Mubarak | EMP-0006 | CTR-0329
UPDATE employees_master
SET "contractId" = 'CTR-0329', name = 'Wahban Mubarak', email = 'heebow@hotmail.com', phone = '+966 505156850', "idNumber" = '1082067321', position = 'safety inspector', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-02-28', iban = 'SA9210000033547980000105', "requesterName" = 'Tahani', "poNumbers" = 'PO-33891'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0329'
    OR (name ILIKE '%Wahban Mubarak%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0329' AND name ILIKE '%Wahban Mubarak%'))
  );

-- Abdulhadi Alrashidi | EMP-0004 | CTR-0328
UPDATE employees_master
SET "contractId" = 'CTR-0328', name = 'Abdulhadi Alrashidi', email = 'aboodeattaq@gmail.com', phone = '+966 53 603 4104', position = 'Safety Inspector', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-02-28', "requesterName" = 'Tahani', "poNumbers" = 'PO-33891'
WHERE "employeeId" = 'EMP-0004'
  AND (
    "contractId" = 'CTR-0328'
    OR (name ILIKE '%Abdulhadi Alrashidi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0328' AND name ILIKE '%Abdulhadi Alrashidi%'))
  );

-- Masad Alarifi | EMP-0186 | CTR-0327
UPDATE employees_master
SET "contractId" = 'CTR-0327', name = 'Masad Alarifi', email = 'masad878@hotmail.com', phone = '+966532303878', "idNumber" = '2043478185', position = 'Stadium coordinator', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-02', "endDate" = '2026-01-25', bank = 'SNB الاهلي', iban = 'SA4210000073000000314402', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34243'
WHERE "employeeId" = 'EMP-0186'
  AND (
    "contractId" = 'CTR-0327'
    OR (name ILIKE '%Masad Alarifi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0327' AND name ILIKE '%Masad Alarifi%'))
  );

-- Murat Aksay | EMP-0185 | CTR-0326
UPDATE employees_master
SET "contractId" = 'CTR-0326', name = 'Murat Aksay', email = 'aksay.murat@gmail.com', phone = '+905306870136', "idNumber" = 'U23892240', position = 'Senior stage manager', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-04', "endDate" = '2026-01-11', bank = 'QNB BANK ANONIM SIRKETI', iban = 'TR160011100000000152508373', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34318'
WHERE "employeeId" = 'EMP-0185'
  AND (
    "contractId" = 'CTR-0326'
    OR (name ILIKE '%Murat Aksay%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0326' AND name ILIKE '%Murat Aksay%'))
  );

-- Luisa Cassab | EMP-0184 | CTR-0325
UPDATE employees_master
SET "contractId" = 'CTR-0325', name = 'Luisa Cassab', email = 'lucassab@gmail.com', phone = '+5511993553809', "idNumber" = 'Passport Number: GL038762', position = 'Senior production stage manager', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-01-03', "endDate" = '2026-01-12', bank = 'Community Federal Savings Bank (Wise)', iban = '8313958757(CHECKING)', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34318'
WHERE "employeeId" = 'EMP-0184'
  AND (
    "contractId" = 'CTR-0325'
    OR (name ILIKE '%Luisa Cassab%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0325' AND name ILIKE '%Luisa Cassab%'))
  );

-- Clifford Marais | EMP-0183 | CTR-0324
UPDATE employees_master
SET "contractId" = 'CTR-0324', name = 'Clifford Marais', email = 'cliffmarais1@gmail.com', phone = '07754057144', "idNumber" = 'SL717636A', position = 'Technical director', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-02', "endDate" = '2026-01-12', bank = 'Lloyds', iban = 'GB82LOYD30984510021062', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34318'
WHERE "employeeId" = 'EMP-0183'
  AND (
    "contractId" = 'CTR-0324'
    OR (name ILIKE '%Clifford Marais%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0324' AND name ILIKE '%Clifford Marais%'))
  );

-- Graham Weakley | EMP-0028 | CTR-0323
UPDATE employees_master
SET "contractId" = 'CTR-0323', name = 'Graham Weakley', email = 'tiger.weakley@gmail.com', phone = '+44 79 46 081802', "idNumber" = '4610852255', position = 'Production/operations manager', project = 'Spanish Super Cup', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-26', "endDate" = '2026-01-13', iban = 'GB09REVO00997018920055', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34318'
WHERE "employeeId" = 'EMP-0028'
  AND (
    "contractId" = 'CTR-0323'
    OR (name ILIKE '%Graham Weakley%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0323' AND name ILIKE '%Graham Weakley%'))
  );

-- Louis-Xavier Ambroise | EMP-0023 | CTR-0322
UPDATE employees_master
SET "contractId" = 'CTR-0322', name = 'Louis-Xavier Ambroise', email = 'lx.ambroise@gmail.com', phone = '+966553755770', "idNumber" = '2616943128', position = 'Creative producer', project = 'Spanish Super Cup', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Al Rajhi', iban = 'SA5180000866608013361797', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34318'
WHERE "employeeId" = 'EMP-0023'
  AND (
    "contractId" = 'CTR-0322'
    OR (name ILIKE '%Louis-Xavier Ambroise%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0322' AND name ILIKE '%Louis-Xavier Ambroise%'))
  );

-- Lynn Soueid | EMP-0022 | CTR-0321
UPDATE employees_master
SET "contractId" = 'CTR-0321', name = 'Lynn Soueid', email = 'lynn.soueid@gmail.com', phone = '+971-505868144', "idNumber" = 'PE511440', position = 'Creative director', project = 'Spanish Super Cup', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Emirates NBD', iban = 'AE380260000215131039401', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34318'
WHERE "employeeId" = 'EMP-0022'
  AND (
    "contractId" = 'CTR-0321'
    OR (name ILIKE '%Lynn Soueid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0321' AND name ILIKE '%Lynn Soueid%'))
  );

-- Roberto Vittorelli | EMP-0021 | CTR-0320
UPDATE employees_master
SET "contractId" = 'CTR-0320', name = 'Roberto Vittorelli', email = 'roberto.vittorelli@ftst.org', phone = '+966 56 712 8743', "idNumber" = '2562905162', position = 'Project director', project = 'Spanish Super Cup', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Al Rajhi', iban = 'SA5480000857608014237909', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34318'
WHERE "employeeId" = 'EMP-0021'
  AND (
    "contractId" = 'CTR-0320'
    OR (name ILIKE '%Roberto Vittorelli%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0320' AND name ILIKE '%Roberto Vittorelli%'))
  );

-- Gouda Badran | EMP-0006 | CTR-0319
UPDATE employees_master
SET "contractId" = 'CTR-0319', name = 'Gouda Badran', email = 'gsbadran1@gmail.com', position = 'visualization specialist', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Docs Requested', "startDate" = '2026-01-01', "endDate" = '2026-02-28', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33999'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0319'
    OR (name ILIKE '%Gouda Badran%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0319' AND name ILIKE '%Gouda Badran%'))
  );

-- Abdulrahman Mohammed | EMP-0006 | CTR-0318
UPDATE employees_master
SET "contractId" = 'CTR-0318', name = 'Abdulrahman Mohammed', email = 'abdalrahmanmohamadmohamad@gmail.com', "idNumber" = '29809250100216', position = 'visualization specialist', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-01-01', "endDate" = '2026-02-28', iban = 'EG600010015100000100063876857', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33999'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0318'
    OR (name ILIKE '%Abdulrahman Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0318' AND name ILIKE '%Abdulrahman Mohammed%'))
  );

-- Mohammed Ehab | EMP-0005 | CTR-0317
UPDATE employees_master
SET "contractId" = 'CTR-0317', name = 'Mohammed Ehab', email = 'mohamedehab2000.me@gmail.com', phone = '+20 12 34508044', "idNumber" = 'A40735481', position = 'visualization specialist', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', iban = 'EG600002011301130203000000855', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33999'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0317'
    OR (name ILIKE '%Mohammed Ehab%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0317' AND name ILIKE '%Mohammed Ehab%'))
  );

-- Islam Nagi | EMP-0130 | CTR-0316
UPDATE employees_master
SET "contractId" = 'CTR-0316', name = 'Islam Nagi', email = 'number-ones@hotmail.com', phone = '+966 50 680 6257', position = 'art director', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Docs Requested', "startDate" = '2026-01-01', "endDate" = '2026-02-28', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33999'
WHERE "employeeId" = 'EMP-0130'
  AND (
    "contractId" = 'CTR-0316'
    OR (name ILIKE '%Islam Nagi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0316' AND name ILIKE '%Islam Nagi%'))
  );

-- Ahmed Ibrahim Algendy | EMP-0182 | CTR-0315
UPDATE employees_master
SET "contractId" = 'CTR-0315', name = 'Ahmed Ibrahim Algendy', email = 'ahmed.ibrahim.gendy@gmail.com', phone = '+20 112 184 7767', "idNumber" = 'A34917668', position = 'Senior Motion Graphic Designer', project = 'Winter Wonderland', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-28', bank = 'Bank Misr', iban = 'EG880002044704470202000001501', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34273'
WHERE "employeeId" = 'EMP-0182'
  AND (
    "contractId" = 'CTR-0315'
    OR (name ILIKE '%Ahmed Ibrahim Algendy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0315' AND name ILIKE '%Ahmed Ibrahim Algendy%'))
  );

-- Salahaddin Younis | EMP-0181 | CTR-0314
UPDATE employees_master
SET "contractId" = 'CTR-0314', name = 'Salahaddin Younis', email = 'sala71992@gmail.com', phone = '+966 53 805 7670', "idNumber" = '2095549859', position = 'Architect', project = 'Winter Wonderland', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-10-28', "endDate" = '2026-02-28', bank = 'Alinma bank', iban = 'SA6405000068200441354000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34273'
WHERE "employeeId" = 'EMP-0181'
  AND (
    "contractId" = 'CTR-0314'
    OR (name ILIKE '%Salahaddin Younis%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0314' AND name ILIKE '%Salahaddin Younis%'))
  );

-- Bushra Jubarah | EMP-0127 | CTR-0313
UPDATE employees_master
SET "contractId" = 'CTR-0313', name = 'Bushra Jubarah', email = 'bushra@bushrajubarah.com', phone = '‪+966 50 102 9093‬', "idNumber" = '2057095495', position = 'Visual & Motion Art Lead', project = 'Winter Wonderland', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-14', "endDate" = '2026-02-28', bank = 'alrajhi bank', iban = 'SA4980000243608016026921', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34273'
WHERE "employeeId" = 'EMP-0127'
  AND (
    "contractId" = 'CTR-0313'
    OR (name ILIKE '%Bushra Jubarah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0313' AND name ILIKE '%Bushra Jubarah%'))
  );

-- Lama Alrifai | EMP-0180 | CTR-0312
UPDATE employees_master
SET "contractId" = 'CTR-0312', name = 'Lama Alrifai', email = 'lamaalrifai3@gmail.com', phone = '+966 597797224', "idNumber" = '2419551482', position = 'Head of production', project = 'Riyadh Metro', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-03-31', bank = 'Alinma', iban = 'SA9805000068201939809000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34026'
WHERE "employeeId" = 'EMP-0180'
  AND (
    "contractId" = 'CTR-0312'
    OR (name ILIKE '%Lama Alrifai%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0312' AND name ILIKE '%Lama Alrifai%'))
  );

-- Mohammed Abdulrahim Mohammed Bakarman | EMP-0073 | CTR-0310
UPDATE employees_master
SET "contractId" = 'CTR-0310', name = 'Mohammed Abdulrahim Mohammed Bakarman', email = 'mohd2003m@gmail.com', phone = '+966507002063', "idNumber" = '2093742175', position = 'Zone Manager', project = 'Riyadh zoo', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-15', "endDate" = '2026-02-14', bank = 'Alinma', iban = 'SA2305000068201974386000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33819'
WHERE "employeeId" = 'EMP-0073'
  AND (
    "contractId" = 'CTR-0310'
    OR (name ILIKE '%Mohammed Abdulrahim Mohammed Bakarman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0310' AND name ILIKE '%Mohammed Abdulrahim Mohammed Bakarman%'))
  );

-- AHMED A. MUFTI | EMP-0041 | CTR-0309
UPDATE employees_master
SET "contractId" = 'CTR-0309', name = 'AHMED A. MUFTI', email = 'Ahmed_mufti7@hotmail.com', phone = '+966 54 477 7987', "idNumber" = '1104001100', position = 'Client Relations', project = 'Riyadh Metro', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-28', "endDate" = '2026-03-27', bank = 'SAB', iban = 'SA6845000000853135234001', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33179'
WHERE "employeeId" = 'EMP-0041'
  AND (
    "contractId" = 'CTR-0309'
    OR (name ILIKE '%AHMED A. MUFTI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0309' AND name ILIKE '%AHMED A. MUFTI%'))
  );

-- Ahmed Qasim | EMP-0178 | CTR-0308
UPDATE employees_master
SET "contractId" = 'CTR-0308', name = 'Ahmed Qasim', email = 'ahmedkas9em@gmail.com', phone = '+9665538388363', "idNumber" = '2119246565', position = 'Zone Supervisor', project = 'Beast land', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-28', "endDate" = '2026-02-25', bank = 'SNB', iban = 'SA2210000011100340598610', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33740'
WHERE "employeeId" = 'EMP-0178'
  AND (
    "contractId" = 'CTR-0308'
    OR (name ILIKE '%Ahmed Qasim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0308' AND name ILIKE '%Ahmed Qasim%'))
  );

-- Hisham Lutfi | EMP-0177 | CTR-0307
UPDATE employees_master
SET "contractId" = 'CTR-0307', name = 'Hisham Lutfi', email = 'hisham@hamah-sa.com', phone = '+9665598885099', "idNumber" = '2379612787', position = 'Zone Supervisor', project = 'Beast land', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-28', "endDate" = '2026-02-25', bank = 'Al Rajhi Bank', iban = 'SA6680000536608010186727', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33740'
WHERE "employeeId" = 'EMP-0177'
  AND (
    "contractId" = 'CTR-0307'
    OR (name ILIKE '%Hisham Lutfi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0307' AND name ILIKE '%Hisham Lutfi%'))
  );

-- Abdulaziz Alsuwaidany | EMP-0176 | CTR-0306
UPDATE employees_master
SET "contractId" = 'CTR-0306', name = 'Abdulaziz Alsuwaidany', email = 'aa.alsuwaydani@gmail.com', phone = '+9665558099722', "idNumber" = '1102291273', position = 'Zone Supervisor', project = 'Beast land', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-28', "endDate" = '2026-02-25', bank = 'Al rajhi bank', iban = 'SA6480000585608016001888', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33740'
WHERE "employeeId" = 'EMP-0176'
  AND (
    "contractId" = 'CTR-0306'
    OR (name ILIKE '%Abdulaziz Alsuwaidany%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0306' AND name ILIKE '%Abdulaziz Alsuwaidany%'))
  );

-- Fahad Albqumi | EMP-0072 | CTR-0305
UPDATE employees_master
SET "contractId" = 'CTR-0305', name = 'Fahad Albqumi', email = 'Fahad@gmail.com', position = 'safety inspector', project = 'Masar alhijra', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2025-12-04', "endDate" = '2025-12-12', "requesterName" = 'Tahani', "poNumbers" = 'PO-33923'
WHERE "employeeId" = 'EMP-0072'
  AND (
    "contractId" = 'CTR-0305'
    OR (name ILIKE '%Fahad Albqumi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0305' AND name ILIKE '%Fahad Albqumi%'))
  );

-- Nasser Alakrash | EMP-0166 | CTR-0294
UPDATE employees_master
SET "contractId" = 'CTR-0294', name = 'Nasser Alakrash', email = 'nasser2020xd@gmail.com', phone = '+966501288772', "idNumber" = '1122298795', position = 'Site Operation Specialist', project = 'boulevard city', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Al Rajhi', iban = 'SA2980000653608016006975', "requesterName" = 'Tahani', "poNumbers" = 'PO-33802'
WHERE "employeeId" = 'EMP-0166'
  AND (
    "contractId" = 'CTR-0294'
    OR (name ILIKE '%Nasser Alakrash%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0294' AND name ILIKE '%Nasser Alakrash%'))
  );

-- Othman Alothman | EMP-0167 | CTR-0295
UPDATE employees_master
SET "contractId" = 'CTR-0295', name = 'Othman Alothman', email = 'othmanfahad.biz@gmail.com', phone = '+966563697179', "idNumber" = '1104210941', position = 'security supervisor', project = 'boulevard city', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Al Rajhi', iban = 'SA5480000282608016154667', "requesterName" = 'Tahani', "poNumbers" = 'PO-33802'
WHERE "employeeId" = 'EMP-0167'
  AND (
    "contractId" = 'CTR-0295'
    OR (name ILIKE '%Othman Alothman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0295' AND name ILIKE '%Othman Alothman%'))
  );

-- Mohammed Radwa | EMP-0169 | CTR-0297
UPDATE employees_master
SET "contractId" = 'CTR-0297', name = 'Mohammed Radwa', email = 'mohamedradwi@gmail.com', phone = '+966536088078', "idNumber" = '1098964263', position = 'CRM Agent', project = 'JYC', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'saudi national bank ( al ahli )', iban = 'SA9510000010100011545410', "requesterName" = 'Tahani', "poNumbers" = 'PO-33778'
WHERE "employeeId" = 'EMP-0169'
  AND (
    "contractId" = 'CTR-0297'
    OR (name ILIKE '%Mohammed Radwa%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0297' AND name ILIKE '%Mohammed Radwa%'))
  );

-- Muwaffaq Alyahya | EMP-0172 | CTR-0301
UPDATE employees_master
SET "contractId" = 'CTR-0301', name = 'Muwaffaq Alyahya', email = 'imwafaq3@gmail.com', phone = '+966568494118', "idNumber" = '1077024097', position = 'security supervisor', project = 'arena', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'AlrajhiBank', iban = 'SA3780000510608010017344', "requesterName" = 'Tahani', "poNumbers" = 'PO-33859'
WHERE "employeeId" = 'EMP-0172'
  AND (
    "contractId" = 'CTR-0301'
    OR (name ILIKE '%Muwaffaq Alyahya%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0301' AND name ILIKE '%Muwaffaq Alyahya%'))
  );

-- Ali Alzahrani | EMP-0168 | CTR-0296
UPDATE employees_master
SET "contractId" = 'CTR-0296', name = 'Ali Alzahrani', email = 'eooeoom@gmail.com', phone = '+966559091169', "idNumber" = '1087793558', position = 'Operation Supervisor', project = 'via riyadh', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Al Rajhi Bank', iban = 'SA3080000347608010655829', "requesterName" = 'Tahani', "poNumbers" = 'PO-33894'
WHERE "employeeId" = 'EMP-0168'
  AND (
    "contractId" = 'CTR-0296'
    OR (name ILIKE '%Ali Alzahrani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0296' AND name ILIKE '%Ali Alzahrani%'))
  );

-- Ali Almutauwah | EMP-0174 | CTR-0303
UPDATE employees_master
SET "contractId" = 'CTR-0303', name = 'Ali Almutauwah', email = 'ali.almutauwah@gmail.com', phone = '+966551764677', "idNumber" = '1099941831', position = 'Facility Manager', project = 'RECC', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA5210000014900000104503', "requesterName" = 'Tahani', "poNumbers" = 'PO-33857'
WHERE "employeeId" = 'EMP-0174'
  AND (
    "contractId" = 'CTR-0303'
    OR (name ILIKE '%Ali Almutauwah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0303' AND name ILIKE '%Ali Almutauwah%'))
  );

-- Mohammed Alkaied | EMP-0175 | CTR-0304
UPDATE employees_master
SET "contractId" = 'CTR-0304', name = 'Mohammed Alkaied', email = 'm.alkaeid@gmail.com', phone = '+966552604888', position = 'Operation Supervisor', project = 'via riyadh', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2026-01-01', "endDate" = '2026-01-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-33894'
WHERE "employeeId" = 'EMP-0175'
  AND (
    "contractId" = 'CTR-0304'
    OR (name ILIKE '%Mohammed Alkaied%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0304' AND name ILIKE '%Mohammed Alkaied%'))
  );

-- Obaid Alamri | EMP-0071 | CTR-0300
UPDATE employees_master
SET "contractId" = 'CTR-0300', name = 'Obaid Alamri', email = 'obaidaalamri@hotmail.com', phone = '+966560092706', "idNumber" = '1119104139', position = 'Administrative Support Coordinator', project = 'JSD', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA6510000014600001054108', "requesterName" = 'Tahani', "poNumbers" = 'PO-34125'
WHERE "employeeId" = 'EMP-0071'
  AND (
    "contractId" = 'CTR-0300'
    OR (name ILIKE '%Obaid Alamri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0300' AND name ILIKE '%Obaid Alamri%'))
  );

-- Razan Aljabri | EMP-0171 | CTR-0299
UPDATE employees_master
SET "contractId" = 'CTR-0299', name = 'Razan Aljabri', email = 'razanaljabri@gmail.com', phone = '+966544082479', "idNumber" = '1123182394', position = 'destination coordinator', project = 'via riyadh', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Saudi National Bank', iban = 'SA4810000015675030000106', "requesterName" = 'Tahani', "poNumbers" = 'PO-33894'
WHERE "employeeId" = 'EMP-0171'
  AND (
    "contractId" = 'CTR-0299'
    OR (name ILIKE '%Razan Aljabri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0299' AND name ILIKE '%Razan Aljabri%'))
  );

-- Naif Alqahtani | EMP-0165 | CTR-0293
UPDATE employees_master
SET "contractId" = 'CTR-0293', name = 'Naif Alqahtani', email = 'naif087@gmail.com', phone = '+966500954044', "idNumber" = '1098666314', position = 'security supervisor', project = 'boulevard city', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Alrajhi bank', iban = 'SA0780000435608010104375', "requesterName" = 'Tahani', "poNumbers" = 'PO-33802'
WHERE "employeeId" = 'EMP-0165'
  AND (
    "contractId" = 'CTR-0293'
    OR (name ILIKE '%Naif Alqahtani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0293' AND name ILIKE '%Naif Alqahtani%'))
  );

-- Ahmed Aljaser | EMP-0170 | CTR-0298
UPDATE employees_master
SET "contractId" = 'CTR-0298', name = 'Ahmed Aljaser', email = 'abugaser59@gmail.com', phone = '+966590908092', "idNumber" = '1112783426', position = 'security supervisor', project = 'boulevard city', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Urpay', iban = 'SA0380202931171222121013', "requesterName" = 'Tahani', "poNumbers" = 'PO-33802'
WHERE "employeeId" = 'EMP-0170'
  AND (
    "contractId" = 'CTR-0298'
    OR (name ILIKE '%Ahmed Aljaser%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0298' AND name ILIKE '%Ahmed Aljaser%'))
  );

-- Jluwi Alosaimi | EMP-0173 | CTR-0302
UPDATE employees_master
SET "contractId" = 'CTR-0302', name = 'Jluwi Alosaimi', email = 'aboasel12@icloud.com', phone = '+966550759591', "idNumber" = '1005661077', position = 'security supervisor', project = 'arena', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA9110000020650135000104', "requesterName" = 'Tahani', "poNumbers" = 'PO-33859'
WHERE "employeeId" = 'EMP-0173'
  AND (
    "contractId" = 'CTR-0302'
    OR (name ILIKE '%Jluwi Alosaimi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0302' AND name ILIKE '%Jluwi Alosaimi%'))
  );

-- Meshal Alshareef | EMP-0006 | CTR-0292
UPDATE employees_master
SET "contractId" = 'CTR-0292', name = 'Meshal Alshareef', email = 'alsharef_meshal@hotmail.com', phone = '+966 58 112 0200', "idNumber" = '1109718971', position = 'Administrative Support Coordinator', project = 'blvd hall', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', iban = 'SA0480000991608017477341', "requesterName" = 'Tahani', "poNumbers" = 'PO-34284'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0292'
    OR (name ILIKE '%Meshal Alshareef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0292' AND name ILIKE '%Meshal Alshareef%'))
  );

-- Weam Mohammed Iskandar | EMP-0005 | CTR-0291
UPDATE employees_master
SET "contractId" = 'CTR-0291', name = 'Weam Mohammed Iskandar', email = 'weameskander55@gmail.com', "idNumber" = '1082429224', position = 'Leasing Assistant Manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA9710000011100515402609', "requesterName" = 'Tahani', "poNumbers" = 'PO-34156'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0291'
    OR (name ILIKE '%Weam Mohammed Iskandar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0291' AND name ILIKE '%Weam Mohammed Iskandar%'))
  );

-- Mamduh Aldalbahy | EMP-0070 | CTR-0290
UPDATE employees_master
SET "contractId" = 'CTR-0290', name = 'Mamduh Aldalbahy', email = 'Mr.mmdoo7@gmail.com', phone = '+966566640626', "idNumber" = '1073033241', position = 'Security supervisor', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'البنك السعودي الاستثماري', iban = 'SA3265000000240268684001', "requesterName" = 'Tahani', "poNumbers" = 'PO-34156'
WHERE "employeeId" = 'EMP-0070'
  AND (
    "contractId" = 'CTR-0290'
    OR (name ILIKE '%Mamduh Aldalbahy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0290' AND name ILIKE '%Mamduh Aldalbahy%'))
  );

-- Omar Mahbub | EMP-0069 | CTR-0289
UPDATE employees_master
SET "contractId" = 'CTR-0289', name = 'Omar Mahbub', email = 'Omahboob707@gmail.com', phone = '+966567614707', "idNumber" = '1026960540', position = 'Security supervisor', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA7610000011753571000100', "requesterName" = 'Tahani', "poNumbers" = 'PO-34156'
WHERE "employeeId" = 'EMP-0069'
  AND (
    "contractId" = 'CTR-0289'
    OR (name ILIKE '%Omar Mahbub%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0289' AND name ILIKE '%Omar Mahbub%'))
  );

-- Salma Al. Ibrahim | EMP-0068 | CTR-0288
UPDATE employees_master
SET "contractId" = 'CTR-0288', name = 'Salma Al. Ibrahim', email = 'salbrahim06@gmail.com', phone = '+966 501370606', "idNumber" = '1095904007', position = 'leasing assistant manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Alinma', iban = 'SA6005000068200838358000', "requesterName" = 'Tahani', "poNumbers" = 'PO-34156'
WHERE "employeeId" = 'EMP-0068'
  AND (
    "contractId" = 'CTR-0288'
    OR (name ILIKE '%Salma Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0288' AND name ILIKE '%Salma Al. Ibrahim%'))
  );

-- Nawaf Al. Ibrahim | EMP-0067 | CTR-0287
UPDATE employees_master
SET "contractId" = 'CTR-0287', name = 'Nawaf Al. Ibrahim', email = 'nawaf.saaed.20@gmail.com', phone = '+966509571527', "idNumber" = '1166306991', position = 'leasing assistant manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = '‏SA6310000052900002048904', "requesterName" = 'Tahani', "poNumbers" = 'PO-34156'
WHERE "employeeId" = 'EMP-0067'
  AND (
    "contractId" = 'CTR-0287'
    OR (name ILIKE '%Nawaf Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0287' AND name ILIKE '%Nawaf Al. Ibrahim%'))
  );

-- Mohammed Al qhtani | EMP-0066 | CTR-0286
UPDATE employees_master
SET "contractId" = 'CTR-0286', name = 'Mohammed Al qhtani', email = 'alhgdore999@gmail.com', phone = '+966583239262', "idNumber" = '1115054916', position = 'leasing assistant manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Al Rajhi', iban = 'SA7780000528608010964578', "requesterName" = 'Tahani', "poNumbers" = 'PO-34156'
WHERE "employeeId" = 'EMP-0066'
  AND (
    "contractId" = 'CTR-0286'
    OR (name ILIKE '%Mohammed Al qhtani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0286' AND name ILIKE '%Mohammed Al qhtani%'))
  );

-- Ammar Hussain | EMP-0065 | CTR-0285
UPDATE employees_master
SET "contractId" = 'CTR-0285', name = 'Ammar Hussain', email = 'ammar.hussain999@gmail.com', "idNumber" = '1078680814', position = 'leasing assistant manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Al Ahli Bank', iban = 'SA5810000042197015000101', "requesterName" = 'Tahani', "poNumbers" = 'PO-34156'
WHERE "employeeId" = 'EMP-0065'
  AND (
    "contractId" = 'CTR-0285'
    OR (name ILIKE '%Ammar Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0285' AND name ILIKE '%Ammar Hussain%'))
  );

-- Mohammed Althobaiti | EMP-0064 | CTR-0284
UPDATE employees_master
SET "contractId" = 'CTR-0284', name = 'Mohammed Althobaiti', email = 'Mohammed.althebaiti@gmail.com', phone = '+966566663039', "idNumber" = '1119583779', position = 'leasing coordinator', project = 'JYC', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA3310000050800000211302', "requesterName" = 'Tahani', "poNumbers" = 'PO-33778'
WHERE "employeeId" = 'EMP-0064'
  AND (
    "contractId" = 'CTR-0284'
    OR (name ILIKE '%Mohammed Althobaiti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0284' AND name ILIKE '%Mohammed Althobaiti%'))
  );

-- Riyadh Qumqomji | EMP-0063 | CTR-0283
UPDATE employees_master
SET "contractId" = 'CTR-0283', name = 'Riyadh Qumqomji', email = 'riyadh1999b@gmail.com', phone = '+966 50 161 1858', "idNumber" = '1119465050', position = 'Guest relation officer', project = 'JYC', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-14', bank = 'SNB', iban = 'SA5510000089100000619204', "requesterName" = 'Tahani', "poNumbers" = 'PO-34217'
WHERE "employeeId" = 'EMP-0063'
  AND (
    "contractId" = 'CTR-0283'
    OR (name ILIKE '%Riyadh Qumqomji%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0283' AND name ILIKE '%Riyadh Qumqomji%'))
  );

-- Amal Alshehri | EMP-0062 | CTR-0282
UPDATE employees_master
SET "contractId" = 'CTR-0282', name = 'Amal Alshehri', email = 'Amal-alshehri88@hotmail.com', phone = '+966-552926131', "idNumber" = '1008366492', position = 'Daily operational data analysis', project = 'alderiyah project', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-11', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA8810000011100108072708', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-33886'
WHERE "employeeId" = 'EMP-0062'
  AND (
    "contractId" = 'CTR-0282'
    OR (name ILIKE '%Amal Alshehri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0282' AND name ILIKE '%Amal Alshehri%'))
  );

-- Saad Alshehri | EMP-0061 | CTR-0281
UPDATE employees_master
SET "contractId" = 'CTR-0281', name = 'Saad Alshehri', email = 'saed0910@gmail.com', phone = '+966508872256', "idNumber" = '1109835486', position = 'site manager', project = 'alderiyah project', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-15', "endDate" = '2026-02-28', bank = 'Al Rajhi', iban = 'SA7780000295608010172389', "requesterName" = 'Tahani', "poNumbers" = 'PO-33812'
WHERE "employeeId" = 'EMP-0061'
  AND (
    "contractId" = 'CTR-0281'
    OR (name ILIKE '%Saad Alshehri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0281' AND name ILIKE '%Saad Alshehri%'))
  );

-- HANOUF FAZIA ALLAHYANY | EMP-0060 | CTR-0279
UPDATE employees_master
SET "contractId" = 'CTR-0279', name = 'HANOUF FAZIA ALLAHYANY', email = 'Haaams_05@hotmail.com', phone = '+996564799462', "idNumber" = '1049432287', position = 'Experience Services Supervisor', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-19', bank = 'Al Rajhi', iban = 'SA7280000857608011435449', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-33077'
WHERE "employeeId" = 'EMP-0060'
  AND (
    "contractId" = 'CTR-0279'
    OR (name ILIKE '%HANOUF FAZIA ALLAHYANY%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0279' AND name ILIKE '%HANOUF FAZIA ALLAHYANY%'))
  );

-- Alaa farouk Mohamed | EMP-0001 | CTR-0278
UPDATE employees_master
SET "contractId" = 'CTR-0278', name = 'Alaa farouk Mohamed', email = 'alaa@growthery.net', phone = '+971509449355', "idNumber" = '12345678', position = 'software engineer', project = 'test 1', status = 'new', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-01-31', "requesterName" = 'AT', "poNumbers" = '21212'
WHERE "employeeId" = 'EMP-0001'
  AND (
    "contractId" = 'CTR-0278'
    OR (name ILIKE '%Alaa farouk Mohamed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0278' AND name ILIKE '%Alaa farouk Mohamed%'))
  );

-- Awadh Olayan Al-Sahli | EMP-0059 | CTR-0277
UPDATE employees_master
SET "contractId" = 'CTR-0277', name = 'Awadh Olayan Al-Sahli', email = 'Aalsehli17@gmail.com', phone = '+966 543 013 567', "idNumber" = '1128431424', position = 'Commercial Data Entry', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-12-21', "endDate" = '2026-04-20', bank = 'Al Rajhi', iban = 'SA8280000206608016042048', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33756'
WHERE "employeeId" = 'EMP-0059'
  AND (
    "contractId" = 'CTR-0277'
    OR (name ILIKE '%Awadh Olayan Al-Sahli%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0277' AND name ILIKE '%Awadh Olayan Al-Sahli%'))
  );

-- Anwar Aljizani | EMP-0039 | CTR-0275
UPDATE employees_master
SET "contractId" = 'CTR-0275', name = 'Anwar Aljizani', email = 'anwarhussin09@gmail.com', phone = '+966567612348', "idNumber" = '1049959073', position = 'Operation Specialist', project = 'Hajj Expo', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-17', "endDate" = '2026-05-16', bank = 'SNB', iban = 'SA8610000010854051000100', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34032'
WHERE "employeeId" = 'EMP-0039'
  AND (
    "contractId" = 'CTR-0275'
    OR (name ILIKE '%Anwar Aljizani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0275' AND name ILIKE '%Anwar Aljizani%'))
  );

-- Yousef Mohsen | EMP-0058 | CTR-0273
UPDATE employees_master
SET "contractId" = 'CTR-0273', name = 'Yousef Mohsen', email = 'Yousifamm@gmail.com', phone = '+966506060366', "idNumber" = '1125544260', position = 'Stadium coordinator', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA9310000016900000697402', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34495'
WHERE "employeeId" = 'EMP-0058'
  AND (
    "contractId" = 'CTR-0273'
    OR (name ILIKE '%Yousef Mohsen%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0273' AND name ILIKE '%Yousef Mohsen%'))
  );

-- Abdulhady Kenaid | EMP-0006 | CTR-0272
UPDATE employees_master
SET "contractId" = 'CTR-0272', name = 'Abdulhady Kenaid', email = 'abdulhady.kenaid@gmail.com', phone = '+966566576920', "idNumber" = '1120910243', position = 'Experince Site Manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-06-30', bank = 'SNB', iban = 'SA7010000014300000030004', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33669'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0272'
    OR (name ILIKE '%Abdulhady Kenaid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0272' AND name ILIKE '%Abdulhady Kenaid%'))
  );

-- Mohammed Nasser Al Asiri | EMP-0006 | CTR-0271
UPDATE employees_master
SET "contractId" = 'CTR-0271', name = 'Mohammed Nasser Al Asiri', email = 'mohammednasser.ala@hotmail.com', phone = '+966 54 141 5837', "idNumber" = '1082023126', position = 'Experience Site Manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-06-30', bank = 'Al Rajhi', iban = 'SA7580000446608012000503', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33669'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0271'
    OR (name ILIKE '%Mohammed Nasser Al Asiri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0271' AND name ILIKE '%Mohammed Nasser Al Asiri%'))
  );

-- Mohammed Duwide | EMP-0006 | CTR-0270
UPDATE employees_master
SET "contractId" = 'CTR-0270', name = 'Mohammed Duwide', email = 'm_y_d@live.com', phone = '+966 561343598', "idNumber" = '1078264247', position = 'Experince Site Manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-06-30', bank = 'SNB', iban = 'SA5010000032871300000107', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33669'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0270'
    OR (name ILIKE '%Mohammed Duwide%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0270' AND name ILIKE '%Mohammed Duwide%'))
  );

-- Ahmed Mihi | EMP-0006 | CTR-0269
UPDATE employees_master
SET "contractId" = 'CTR-0269', name = 'Ahmed Mihi', email = 'ahmedmihi41@gmail.com', phone = '+966 565565492', "idNumber" = '1109140838', position = 'Experince Site Manager', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-03-01', "endDate" = '2026-06-30', bank = 'SNB', iban = 'SA0310000015400000226707', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33669'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0269'
    OR (name ILIKE '%Ahmed Mihi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0269' AND name ILIKE '%Ahmed Mihi%'))
  );

-- Saleh Aldossary | EMP-0057 | CTR-0268
UPDATE employees_master
SET "contractId" = 'CTR-0268', name = 'Saleh Aldossary', email = 'aldossary993@gmail.com', phone = '+966569672422', "idNumber" = '1076623345', position = 'Project Manager', project = 'Camel Festival', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-15', bank = 'Al Rajhi', iban = 'SA2480000375608016010586', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33450'
WHERE "employeeId" = 'EMP-0057'
  AND (
    "contractId" = 'CTR-0268'
    OR (name ILIKE '%Saleh Aldossary%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0268' AND name ILIKE '%Saleh Aldossary%'))
  );

-- Abdulrahman Hamza Mohamed | EMP-0056 | CTR-0267
UPDATE employees_master
SET "contractId" = 'CTR-0267', name = 'Abdulrahman Hamza Mohamed', email = 'Abdulrhmansh59@gmail.com', phone = '+966542307742', "idNumber" = '1096667785', position = 'Vedio Grapher', project = 'Masar alhijra', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'ALAHLI  SNB', iban = 'SA4410000011100056928407', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0056'
  AND (
    "contractId" = 'CTR-0267'
    OR (name ILIKE '%Abdulrahman Hamza Mohamed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0267' AND name ILIKE '%Abdulrahman Hamza Mohamed%'))
  );

-- Mahesh Nagraj | EMP-0055 | CTR-0263
UPDATE employees_master
SET "contractId" = 'CTR-0263', name = 'Mahesh Nagraj', email = 'maheshmhz16@gmail.com', phone = '+966531454083', position = 'Senior Tehnical Consultant', project = 'Maveric', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-08-05', "endDate" = '2026-08-04', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0263'
    OR (name ILIKE '%Mahesh Nagraj%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0263' AND name ILIKE '%Mahesh Nagraj%'))
  );

-- Nasreen Bevi | EMP-0055 | CTR-0264
UPDATE employees_master
SET "contractId" = 'CTR-0264', name = 'Nasreen Bevi', email = 'nazreenmohideen21@gmail.com', phone = '+91 9884028330', position = 'Business Analyst', project = 'C5i', status = 'new', "workflowStatus" = 'Pending', "startDate" = '2025-11-15', "endDate" = '2026-11-14', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0264'
    OR (name ILIKE '%Nasreen Bevi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0264' AND name ILIKE '%Nasreen Bevi%'))
  );

-- Prakash Chandra | EMP-0055 | CTR-0261
UPDATE employees_master
SET "contractId" = 'CTR-0261', name = 'Prakash Chandra', email = 'prakashc2501@gmail.com', phone = '+966599469284', position = 'Oracle Alliance and Pre Sales Leader', project = 'Maveric', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-03', "endDate" = '2026-10-02', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0261'
    OR (name ILIKE '%Prakash Chandra%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0261' AND name ILIKE '%Prakash Chandra%'))
  );

-- Lakhsmy Ravikumar | EMP-0055 | CTR-0257
UPDATE employees_master
SET "contractId" = 'CTR-0257', name = 'Lakhsmy Ravikumar', email = 'lakshmyrk@maveric-systems.com', phone = '+966506548980', position = 'Program developer', project = 'Maveric', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-08-04', "endDate" = '2026-08-03', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0257'
    OR (name ILIKE '%Lakhsmy Ravikumar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0257' AND name ILIKE '%Lakhsmy Ravikumar%'))
  );

-- Sathish Kumar | EMP-0055 | CTR-0266
UPDATE employees_master
SET "contractId" = 'CTR-0266', name = 'Sathish Kumar', email = 'sathishkumarr@maveric-systems.com', phone = '+966500215340', position = 'Engineering Technologist', project = 'Maveric', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2025-08-05', "endDate" = '2026-08-04', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0266'
    OR (name ILIKE '%Sathish Kumar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0266' AND name ILIKE '%Sathish Kumar%'))
  );

-- Sureandaran Arumugam | EMP-0055 | CTR-0258
UPDATE employees_master
SET "contractId" = 'CTR-0258', name = 'Sureandaran Arumugam', email = 'surendarism@gmail.com', phone = '+966566936919', position = 'Sales representitive', project = 'Maveric', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-08-04', "endDate" = '2026-08-03', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0258'
    OR (name ILIKE '%Sureandaran Arumugam%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0258' AND name ILIKE '%Sureandaran Arumugam%'))
  );

-- Syed Suhail | EMP-0055 | CTR-0265
UPDATE employees_master
SET "contractId" = 'CTR-0265', name = 'Syed Suhail', email = 'suhailsyed008@gmail.com', phone = '+966546791031', position = 'Application tester', project = 'Maveric', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-06-01', "endDate" = '2026-06-30', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0265'
    OR (name ILIKE '%Syed Suhail%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0265' AND name ILIKE '%Syed Suhail%'))
  );

-- Muhammad Sayed | EMP-0055 | CTR-0260
UPDATE employees_master
SET "contractId" = 'CTR-0260', name = 'Muhammad Sayed', email = 'm_kasem@hotmail.com', phone = '+966502952544', position = 'Oracle Alliance and Pre Sales Leader', project = 'Inspiring minds', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-19', "endDate" = '2026-09-18', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0260'
    OR (name ILIKE '%Muhammad Sayed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0260' AND name ILIKE '%Muhammad Sayed%'))
  );

-- Amima Shoaib | EMP-0055 | CTR-0262
UPDATE employees_master
SET "contractId" = 'CTR-0262', name = 'Amima Shoaib', email = 'amimashoeb89@gmail.com', phone = '+966566229861', position = 'Business Consultant', project = 'Maveric', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-12-01', "endDate" = '2026-11-30', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0262'
    OR (name ILIKE '%Amima Shoaib%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0262' AND name ILIKE '%Amima Shoaib%'))
  );

-- Vinayak Ramesh | EMP-0055 | CTR-0259
UPDATE employees_master
SET "contractId" = 'CTR-0259', name = 'Vinayak Ramesh', email = 'vinayakrn@gmail.com', phone = '+966540019695', position = 'Key Account Manager', project = 'Saudi Fransi bank', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-09-28', "endDate" = '2026-09-27', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0259'
    OR (name ILIKE '%Vinayak Ramesh%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0259' AND name ILIKE '%Vinayak Ramesh%'))
  );

-- Jayabharathi Sellan | EMP-0055 | CTR-0256
UPDATE employees_master
SET "contractId" = 'CTR-0256', name = 'Jayabharathi Sellan', email = 'jayabharathis@maveric-systems.com', phone = '+966544026753', position = 'Allied Engineering Specialist', project = 'Maveric', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-08-05', "endDate" = '2026-08-04', "requesterName" = 'Jihaz'
WHERE "employeeId" = 'EMP-0055'
  AND (
    "contractId" = 'CTR-0256'
    OR (name ILIKE '%Jayabharathi Sellan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0256' AND name ILIKE '%Jayabharathi Sellan%'))
  );

-- Manea Alsugoor | EMP-0054 | CTR-0253
UPDATE employees_master
SET "contractId" = 'CTR-0253', name = 'Manea Alsugoor', email = 'alsagoor.mana@gmail.com', phone = '+966503923626', "idNumber" = '1089595563', position = 'civil engineer', project = 'Masar Bader', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-21', "endDate" = '2026-03-20', bank = 'SNB', iban = 'SA5010000011100335803202', "requesterName" = 'Tahani', "poNumbers" = 'PO-33426'
WHERE "employeeId" = 'EMP-0054'
  AND (
    "contractId" = 'CTR-0253'
    OR (name ILIKE '%Manea Alsugoor%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0253' AND name ILIKE '%Manea Alsugoor%'))
  );

-- Mohammed Alshammari | EMP-0054 | CTR-0254
UPDATE employees_master
SET "contractId" = 'CTR-0254', name = 'Mohammed Alshammari', email = 'm7mad.fa@hotmail.com', phone = '+966555191580', "idNumber" = '1094241286', position = 'safety inspector', project = 'irqah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-28', "endDate" = '2026-03-27', bank = 'Bank AlJAzira', iban = 'SA8860100011880073251001', "requesterName" = 'Tahani', "poNumbers" = 'PO-33444'
WHERE "employeeId" = 'EMP-0054'
  AND (
    "contractId" = 'CTR-0254'
    OR (name ILIKE '%Mohammed Alshammari%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0254' AND name ILIKE '%Mohammed Alshammari%'))
  );

-- Reham shahin | EMP-0054 | CTR-0251
UPDATE employees_master
SET "contractId" = 'CTR-0251', name = 'Reham shahin', email = 'rehamshahin48@gmail.com', phone = '+966501135566', "idNumber" = '2070405267', position = 'Project Control Specialist', project = 'Masar Bader', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-03-31', bank = 'ANB', iban = 'SA9130400108086375920014', "requesterName" = 'Tahani', "poNumbers" = 'PO-33426'
WHERE "employeeId" = 'EMP-0054'
  AND (
    "contractId" = 'CTR-0251'
    OR (name ILIKE '%Reham shahin%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0251' AND name ILIKE '%Reham shahin%'))
  );

-- Mohamed Faisal Obaid | EMP-0054 | CTR-0252
UPDATE employees_master
SET "contractId" = 'CTR-0252', name = 'Mohamed Faisal Obaid', email = 'fobaid172@gmail.com', phone = '+966591675895', "idNumber" = '2217726385', position = 'Engineer', project = 'irqah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-24', "endDate" = '2026-02-23', iban = 'SA0205000068204996744000', "requesterName" = 'Tahani', "poNumbers" = 'PO-33444'
WHERE "employeeId" = 'EMP-0054'
  AND (
    "contractId" = 'CTR-0252'
    OR (name ILIKE '%Mohamed Faisal Obaid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0252' AND name ILIKE '%Mohamed Faisal Obaid%'))
  );

-- Najwa Abdullah | EMP-0005 | CTR-0244
UPDATE employees_master
SET "contractId" = 'CTR-0244', name = 'Najwa Abdullah', email = 'najwa.gdesign@gmail.com', phone = '‪+966 56 692 9909‬', "idNumber" = '2085199954', position = 'Graphic Designer', project = 'Promenade', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-14', "endDate" = '2026-01-13', bank = 'Al Rajhi', iban = 'SA1680000443608016165925', "requesterName" = 'Tahani', "poNumbers" = 'PO-33376'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0244'
    OR (name ILIKE '%Najwa Abdullah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0244' AND name ILIKE '%Najwa Abdullah%'))
  );

-- AEDH Almutairi | EMP-0006 | CTR-0221
UPDATE employees_master
SET "contractId" = 'CTR-0221', name = 'AEDH Almutairi', email = 'aaid556@gmail.com', phone = '+966 56 893 4000', "idNumber" = '1088885742', position = 'construction supervisor', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-03-31', bank = 'Al Rajhi', iban = 'SA6280000286608010404551', "requesterName" = 'Tahani', "poNumbers" = 'PO-33426'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0221'
    OR (name ILIKE '%AEDH Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0221' AND name ILIKE '%AEDH Almutairi%'))
  );

-- Ahmed Alghamdi | EMP-0053 | CTR-0220
UPDATE employees_master
SET "contractId" = 'CTR-0220', name = 'Ahmed Alghamdi', email = 'at_010@icloud.com', phone = '‪+966 56 873 0112‬', "idNumber" = '1110847116', position = 'Zone Manager', project = 'Masar Bader', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-03-31', bank = 'SNB', iban = 'SA3910000035200000527806', "requesterName" = 'Tahani', "poNumbers" = 'PO-33426'
WHERE "employeeId" = 'EMP-0053'
  AND (
    "contractId" = 'CTR-0220'
    OR (name ILIKE '%Ahmed Alghamdi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0220' AND name ILIKE '%Ahmed Alghamdi%'))
  );

-- Wahban Mubarak | EMP-0006 | CTR-0219
UPDATE employees_master
SET "contractId" = 'CTR-0219', name = 'Wahban Mubarak', email = 'heebow@hotmail.com', phone = '+966 505156850', "idNumber" = '1082067321', position = 'safety inspector', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA9210000033547980000105', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0219'
    OR (name ILIKE '%Wahban Mubarak%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0219' AND name ILIKE '%Wahban Mubarak%'))
  );

-- Osama Khalaf | EMP-0004 | CTR-0218
UPDATE employees_master
SET "contractId" = 'CTR-0218', name = 'Osama Khalaf', email = 'osamah883@gmail.com', phone = '‪+966 50 150 8619‬', "idNumber" = '1081936955', position = 'construction engineer - Civil', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'Al Rajhi', iban = 'SA1480000103608010289920', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0004'
  AND (
    "contractId" = 'CTR-0218'
    OR (name ILIKE '%Osama Khalaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0218' AND name ILIKE '%Osama Khalaf%'))
  );

-- Mohammed Alhashel | EMP-0052 | CTR-0217
UPDATE employees_master
SET "contractId" = 'CTR-0217', name = 'Mohammed Alhashel', email = 'mohammed.alhashel1@gmail.com', "idNumber" = '1074834308', position = 'construction engineer - Civil', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA2210000012800000471905', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0052'
  AND (
    "contractId" = 'CTR-0217'
    OR (name ILIKE '%Mohammed Alhashel%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0217' AND name ILIKE '%Mohammed Alhashel%'))
  );

-- Salem Bawazeer | EMP-0051 | CTR-0216
UPDATE employees_master
SET "contractId" = 'CTR-0216', name = 'Salem Bawazeer', email = 'samb9_9@hotmail.com', "idNumber" = '2061397382', position = 'construction engineer', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'Alinma', iban = 'SA7205000068202581208000', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0051'
  AND (
    "contractId" = 'CTR-0216'
    OR (name ILIKE '%Salem Bawazeer%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0216' AND name ILIKE '%Salem Bawazeer%'))
  );

-- Abdulaziz Saleh | EMP-0050 | CTR-0215
UPDATE employees_master
SET "contractId" = 'CTR-0215', name = 'Abdulaziz Saleh', email = 'az.s.a@hotmail.com', "idNumber" = '2118011739', position = 'site manager', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA1310000022500000031202', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0050'
  AND (
    "contractId" = 'CTR-0215'
    OR (name ILIKE '%Abdulaziz Saleh%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0215' AND name ILIKE '%Abdulaziz Saleh%'))
  );

-- Ali Baqalb | EMP-0049 | CTR-0214
UPDATE employees_master
SET "contractId" = 'CTR-0214', name = 'Ali Baqalb', email = 'alibaqalb@gmail.com', "idNumber" = '2095055790', position = 'construction engineer', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA7910000020756218000101', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0049'
  AND (
    "contractId" = 'CTR-0214'
    OR (name ILIKE '%Ali Baqalb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0214' AND name ILIKE '%Ali Baqalb%'))
  );

-- Saleh Baqalb | EMP-0048 | CTR-0213
UPDATE employees_master
SET "contractId" = 'CTR-0213', name = 'Saleh Baqalb', email = 'sabagalb@gmail.com', "idNumber" = '2159198973', position = 'site manager', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'Alinma', iban = 'SA7805000068204832458000', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0048'
  AND (
    "contractId" = 'CTR-0213'
    OR (name ILIKE '%Saleh Baqalb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0213' AND name ILIKE '%Saleh Baqalb%'))
  );

-- Tariq Afqi | EMP-0005 | CTR-0212
UPDATE employees_master
SET "contractId" = 'CTR-0212', name = 'Tariq Afqi', email = 'afqi.tariq@gmail.com', phone = '+966 55 332 0200', "idNumber" = '1093688826', position = 'Construction civil Engineer', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA2210000016848600000107', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0212'
    OR (name ILIKE '%Tariq Afqi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0212' AND name ILIKE '%Tariq Afqi%'))
  );

-- Abdulaziz Abaalkhail | EMP-0047 | CTR-0211
UPDATE employees_master
SET "contractId" = 'CTR-0211', name = 'Abdulaziz Abaalkhail', email = 'eng.c.abdulaziz@gmail.com', "idNumber" = '1095855191', position = 'Construction civil Engineer', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA2310000011100403228000', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0047'
  AND (
    "contractId" = 'CTR-0211'
    OR (name ILIKE '%Abdulaziz Abaalkhail%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0211' AND name ILIKE '%Abdulaziz Abaalkhail%'))
  );

-- Abdulhadi Alrashidi | EMP-0004 | CTR-0210
UPDATE employees_master
SET "contractId" = 'CTR-0210', name = 'Abdulhadi Alrashidi', email = 'aboodeattaq@gmail.com', phone = '+966 53 603 4104', "idNumber" = '1085307302', position = 'Safety Inspector', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'AlRajhi', iban = 'SA7780000248608010153205', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0004'
  AND (
    "contractId" = 'CTR-0210'
    OR (name ILIKE '%Abdulhadi Alrashidi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0210' AND name ILIKE '%Abdulhadi Alrashidi%'))
  );

-- Abdulaziz Otaif | EMP-0046 | CTR-0209
UPDATE employees_master
SET "contractId" = 'CTR-0209', name = 'Abdulaziz Otaif', email = 'ot.azyz@gmail.com', phone = '+966 567822205', "idNumber" = '1093633293', position = 'Zone Manager', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'Riyadh Bank', iban = 'SA4720000009323145019940', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0046'
  AND (
    "contractId" = 'CTR-0209'
    OR (name ILIKE '%Abdulaziz Otaif%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0209' AND name ILIKE '%Abdulaziz Otaif%'))
  );

-- Faisal Alotaibi | EMP-0045 | CTR-0208
UPDATE employees_master
SET "contractId" = 'CTR-0208', name = 'Faisal Alotaibi', email = 'Faisal.k.alotaibi@hotmail.com', phone = '+966 55 529 9045', "idNumber" = '1099610758', position = 'Zone Manager', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'Al Rajhi', iban = 'SA0580000647608016009259', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0045'
  AND (
    "contractId" = 'CTR-0208'
    OR (name ILIKE '%Faisal Alotaibi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0208' AND name ILIKE '%Faisal Alotaibi%'))
  );

-- Ahmed Sulaiman | EMP-0044 | CTR-0207
UPDATE employees_master
SET "contractId" = 'CTR-0207', name = 'Ahmed Sulaiman', email = 'ahmedsuliman11986@gmail.com', phone = '+966 540301987', "idNumber" = '2529061067', position = 'Zone Manager', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA9410000011100401704210', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0044'
  AND (
    "contractId" = 'CTR-0207'
    OR (name ILIKE '%Ahmed Sulaiman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0207' AND name ILIKE '%Ahmed Sulaiman%'))
  );

-- Abdulaziz Awad AL Jomaa | EMP-0005 | CTR-0206
UPDATE employees_master
SET "contractId" = 'CTR-0206', name = 'Abdulaziz Awad AL Jomaa', email = 'Rt1610096@gmail.com', phone = '+966 0508347454', "idNumber" = '1108036979', position = 'Site Manager', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'Al Rajhi', iban = 'SA8680000296608016023023', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0206'
    OR (name ILIKE '%Abdulaziz Awad AL Jomaa%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0206' AND name ILIKE '%Abdulaziz Awad AL Jomaa%'))
  );

-- Hassan Alharbi | EMP-0043 | CTR-0205
UPDATE employees_master
SET "contractId" = 'CTR-0205', name = 'Hassan Alharbi', email = 'Hw202820@gmail.com', phone = '+966541235100', "idNumber" = '1002028999', position = 'site manager', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-10', "endDate" = '2026-01-31', bank = 'Al Rajhi', iban = 'SA8980000443608016202926', "requesterName" = 'Tahani', "poNumbers" = 'PO-33371'
WHERE "employeeId" = 'EMP-0043'
  AND (
    "contractId" = 'CTR-0205'
    OR (name ILIKE '%Hassan Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0205' AND name ILIKE '%Hassan Alharbi%'))
  );

-- Mohammed Alamri | EMP-0006 | CTR-0204
UPDATE employees_master
SET "contractId" = 'CTR-0204', name = 'Mohammed Alamri', email = 'eng.amri44@gmail.com', phone = '+966 504444304', "idNumber" = '1021315716', position = 'Finishing Engineer', project = 'irqah', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2026-01-01', "endDate" = '2026-03-31', bank = 'Al Rajhi', iban = 'SA3780000653608166013839', "requesterName" = 'Tahani', "poNumbers" = 'PO-33444'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0204'
    OR (name ILIKE '%Mohammed Alamri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0204' AND name ILIKE '%Mohammed Alamri%'))
  );

-- Yousef Mahdali | EMP-0006 | CTR-0203
UPDATE employees_master
SET "contractId" = 'CTR-0203', name = 'Yousef Mahdali', email = 'yousefmahdali@hotmail.com', phone = '+966540807390', "idNumber" = '1119479994', position = 'Stadiums Coordinator', project = 'Spanish Super Cup', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA2610000014300000344009', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33382'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0203'
    OR (name ILIKE '%Yousef Mahdali%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0203' AND name ILIKE '%Yousef Mahdali%'))
  );

-- Sara Thabit | EMP-0006 | CTR-0202
UPDATE employees_master
SET "contractId" = 'CTR-0202', name = 'Sara Thabit', email = 'sarathabit888@gmail.com', phone = '+966 56 775 7643', position = 'Facilities Coordinator', project = 'Spanish Super Cup', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA0510000013300000937010', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33382'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0202'
    OR (name ILIKE '%Sara Thabit%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0202' AND name ILIKE '%Sara Thabit%'))
  );

-- Samah Alasiri | EMP-0006 | CTR-0201
UPDATE employees_master
SET "contractId" = 'CTR-0201', name = 'Samah Alasiri', email = 'samah.abdo.a@gmail.com', phone = '+966 548011008', "idNumber" = '1001861325', position = 'Operation Coordinator', project = 'Spanish Super Cup', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-01', "endDate" = '2026-01-31', bank = 'SNB', iban = 'SA7010000013392803000104', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33382'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0201'
    OR (name ILIKE '%Samah Alasiri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0201' AND name ILIKE '%Samah Alasiri%'))
  );

-- Rawan Jamal | EMP-0006 | CTR-0200
UPDATE employees_master
SET "contractId" = 'CTR-0200', name = 'Rawan Jamal', email = 'rjfalamoudi@gmail.com', phone = '+966-55-999-5775', "idNumber" = '1092541505', position = 'Guest Management Coordinator', project = 'Spanish Super Cup', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-11', "endDate" = '2026-02-10', bank = 'SNB', iban = 'SA3710000012200000932706', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33382'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0200'
    OR (name ILIKE '%Rawan Jamal%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0200' AND name ILIKE '%Rawan Jamal%'))
  );

-- Mohammed Saad Almowlad | EMP-0006 | CTR-0199
UPDATE employees_master
SET "contractId" = 'CTR-0199', name = 'Mohammed Saad Almowlad', email = 'moh.almowlad9@gmail.com', "idNumber" = '1101163747', position = 'Site Operation Specialist', project = 'Blvd World', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2026-01-31', iban = 'SA4105000068205416653000', "requesterName" = 'Tahani', "poNumbers" = 'PO-33261'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0199'
    OR (name ILIKE '%Mohammed Saad Almowlad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0199' AND name ILIKE '%Mohammed Saad Almowlad%'))
  );

-- Marzooq Yahya Mohammed | EMP-0006 | CTR-0198
UPDATE employees_master
SET "contractId" = 'CTR-0198', name = 'Marzooq Yahya Mohammed', email = 'marzouqbinyahya@gmail.com', "idNumber" = '2598941058', position = 'Site Operation Specialist', project = 'Blvd World', status = 'renewal', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-12-12', "endDate" = '2026-01-31', bank = 'Alinma', iban = 'SA0805000068206517778000', "requesterName" = 'Tahani', "poNumbers" = 'PO-33261'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0198'
    OR (name ILIKE '%Marzooq Yahya Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0198' AND name ILIKE '%Marzooq Yahya Mohammed%'))
  );

-- Muhammad Safik | EMP-0042 | CTR-0197
UPDATE employees_master
SET "contractId" = 'CTR-0197', name = 'Muhammad Safik', email = 'safikash07@gmail.com', phone = '+966 548768208', "idNumber" = '2407339270', position = 'Technical Coordinator - Stores', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2026-02-28', bank = 'Al rajhi', iban = '116000010006086065733', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33899'
WHERE "employeeId" = 'EMP-0042'
  AND (
    "contractId" = 'CTR-0197'
    OR (name ILIKE '%Muhammad Safik%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0197' AND name ILIKE '%Muhammad Safik%'))
  );

-- AHMED A. MUFTI | EMP-0041 | CTR-0196
UPDATE employees_master
SET "contractId" = 'CTR-0196', name = 'AHMED A. MUFTI', email = 'Ahmed_mufti7@hotmail.com', phone = '+966 54 477 7987', "idNumber" = '1104001100', position = 'Assistant Operations Manage', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-27', iban = 'SA6845000000853135234001', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33181'
WHERE "employeeId" = 'EMP-0041'
  AND (
    "contractId" = 'CTR-0196'
    OR (name ILIKE '%AHMED A. MUFTI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0196' AND name ILIKE '%AHMED A. MUFTI%'))
  );

-- Aseel Alassiri | EMP-0040 | CTR-0195
UPDATE employees_master
SET "contractId" = 'CTR-0195', name = 'Aseel Alassiri', email = 'akalassiri@hotmail.com', phone = '+966 544020105', "idNumber" = '1116175157', position = 'Assistant Operations Manager', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-28', bank = 'Al Rajhi', iban = 'SA0780000380608010544401', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33181'
WHERE "employeeId" = 'EMP-0040'
  AND (
    "contractId" = 'CTR-0195'
    OR (name ILIKE '%Aseel Alassiri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0195' AND name ILIKE '%Aseel Alassiri%'))
  );

-- Anwar Aljizani | EMP-0039 | CTR-0194
UPDATE employees_master
SET "contractId" = 'CTR-0194', name = 'Anwar Aljizani', email = 'anwarhussin09@gmail.com', phone = '+966567612348', "idNumber" = '1049959073', position = 'Assistant Operations Manager', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-16', bank = 'SNB', iban = 'SA8610000010854051000100', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33181'
WHERE "employeeId" = 'EMP-0039'
  AND (
    "contractId" = 'CTR-0194'
    OR (name ILIKE '%Anwar Aljizani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0194' AND name ILIKE '%Anwar Aljizani%'))
  );

-- Omar Alfarsi | EMP-0038 | CTR-0193
UPDATE employees_master
SET "contractId" = 'CTR-0193', name = 'Omar Alfarsi', email = 'O_farsi@hotmail.com', phone = '+966 568808000', "idNumber" = '1061923221', position = 'Assistant Operations Manager', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA3610000012261299000107', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33181'
WHERE "employeeId" = 'EMP-0038'
  AND (
    "contractId" = 'CTR-0193'
    OR (name ILIKE '%Omar Alfarsi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0193' AND name ILIKE '%Omar Alfarsi%'))
  );

-- Yasser babhair | EMP-0037 | CTR-0192
UPDATE employees_master
SET "contractId" = 'CTR-0192', name = 'Yasser babhair', email = 'Babhairyasser@gmail.com', phone = '+966 580080498', "idNumber" = '2194172843', position = 'Site Operation', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-13', bank = 'SNB', iban = 'SA8510000011100199629510', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33181'
WHERE "employeeId" = 'EMP-0037'
  AND (
    "contractId" = 'CTR-0192'
    OR (name ILIKE '%Yasser babhair%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0192' AND name ILIKE '%Yasser babhair%'))
  );

-- Hossam Abaalari | EMP-0036 | CTR-0191
UPDATE employees_master
SET "contractId" = 'CTR-0191', name = 'Hossam Abaalari', email = 'hoabaalari@gmail.com', phone = '+966545691612', "idNumber" = '1108089929', position = 'Site Manager', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-13', bank = 'SNB', iban = 'SA5610000013500000104501', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33181'
WHERE "employeeId" = 'EMP-0036'
  AND (
    "contractId" = 'CTR-0191'
    OR (name ILIKE '%Hossam Abaalari%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0191' AND name ILIKE '%Hossam Abaalari%'))
  );

-- Ahmad Wahba | EMP-0006 | CTR-0189
UPDATE employees_master
SET "contractId" = 'CTR-0189', name = 'Ahmad Wahba', email = 'wahba.strategy@gmail.com', phone = '+966533224400', "idNumber" = '2126600440', position = 'Marketing Strategy Lead', project = 'WWL', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-02-16', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA9410000012294384000108', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34663'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0189'
    OR (name ILIKE '%Ahmad Wahba%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0189' AND name ILIKE '%Ahmad Wahba%'))
  );

-- Arwa Abushal | EMP-0035 | CTR-0188
UPDATE employees_master
SET "contractId" = 'CTR-0188', name = 'Arwa Abushal', email = 'arabushal@gmail.com', phone = '+966 540060720', "idNumber" = '1099366658', position = 'Senior Copywriter', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-21', "endDate" = '2026-02-15', bank = 'Al Rajhi', iban = 'SA9680000425608016005529', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34663'
WHERE "employeeId" = 'EMP-0035'
  AND (
    "contractId" = 'CTR-0188'
    OR (name ILIKE '%Arwa Abushal%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0188' AND name ILIKE '%Arwa Abushal%'))
  );

-- Shahd Eskandrani | EMP-0034 | CTR-0187
UPDATE employees_master
SET "contractId" = 'CTR-0187', name = 'Shahd Eskandrani', email = 'shahdskn@gmail.com', phone = '+966 541179222', "idNumber" = '1094217898', position = 'Senior Graphic Designer', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-21', "endDate" = '2026-02-15', bank = 'Al Rajhi', iban = 'SA3480000648608016010918', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34663'
WHERE "employeeId" = 'EMP-0034'
  AND (
    "contractId" = 'CTR-0187'
    OR (name ILIKE '%Shahd Eskandrani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0187' AND name ILIKE '%Shahd Eskandrani%'))
  );

-- Ahmad Bajri | EMP-0033 | CTR-0186
UPDATE employees_master
SET "contractId" = 'CTR-0186', name = 'Ahmad Bajri', email = 'ahmad.m.bajri@gmail.com', phone = '+966 59 992 32 24', "idNumber" = '2155804848', position = 'Animator & Video Editor', project = 'WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-21', "endDate" = '2026-02-15', bank = 'Alinma', iban = 'SA1905000068202135583000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34663'
WHERE "employeeId" = 'EMP-0033'
  AND (
    "contractId" = 'CTR-0186'
    OR (name ILIKE '%Ahmad Bajri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0186' AND name ILIKE '%Ahmad Bajri%'))
  );

-- Abdulelah Alqurashi | EMP-0032 | CTR-0185
UPDATE employees_master
SET "contractId" = 'CTR-0185', name = 'Abdulelah Alqurashi', email = 'abdulellah.h.q@gmail.com', phone = '+966547373130', "idNumber" = '1109295475', position = 'Stadiums coordinator', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2025-12-22', bank = 'SNB', iban = 'SA2710000011100216490609', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0032'
  AND (
    "contractId" = 'CTR-0185'
    OR (name ILIKE '%Abdulelah Alqurashi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0185' AND name ILIKE '%Abdulelah Alqurashi%'))
  );

-- Fatmah Alahmri | EMP-0031 | CTR-0184
UPDATE employees_master
SET "contractId" = 'CTR-0184', name = 'Fatmah Alahmri', email = 'Fatima.alahmari@outlook.sa', phone = '+966542841111', "idNumber" = '1095623680', position = 'Stadiums coordinator', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2025-12-22', bank = 'ALINMA Bank', iban = 'SA0805000068203924095000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0031'
  AND (
    "contractId" = 'CTR-0184'
    OR (name ILIKE '%Fatmah Alahmri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0184' AND name ILIKE '%Fatmah Alahmri%'))
  );

-- Amina Alharbi | EMP-0030 | CTR-0183
UPDATE employees_master
SET "contractId" = 'CTR-0183', name = 'Amina Alharbi', email = 'bebebebe20302030@gmail.com', phone = '+966 568730085', "idNumber" = '1090229624', position = 'Stadiums coordinator', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2025-12-22', bank = 'Al Rajhi Bank', iban = 'SA6880000440608010109526', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0030'
  AND (
    "contractId" = 'CTR-0183'
    OR (name ILIKE '%Amina Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0183' AND name ILIKE '%Amina Alharbi%'))
  );

-- Amer Salmin Al-Sumahi | EMP-0029 | CTR-0182
UPDATE employees_master
SET "contractId" = 'CTR-0182', name = 'Amer Salmin Al-Sumahi', email = 'Aalsumahi@gmail.com', phone = '+966 542959953', "idNumber" = '1063591018', position = 'Stadiums coordinator', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2025-12-22', bank = 'Alahli', iban = 'SA6610000020251557000107', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0029'
  AND (
    "contractId" = 'CTR-0182'
    OR (name ILIKE '%Amer Salmin Al-Sumahi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0182' AND name ILIKE '%Amer Salmin Al-Sumahi%'))
  );

-- Graham Weakley | EMP-0028 | CTR-0181
UPDATE employees_master
SET "contractId" = 'CTR-0181', name = 'Graham Weakley', email = 'tiger.weakley@gmail.com', phone = '+44 79 46 081802', "idNumber" = '4610852255', position = 'Production/operations manager', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-10', "endDate" = '2025-12-18', iban = 'GB09REVO00997018920055', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0028'
  AND (
    "contractId" = 'CTR-0181'
    OR (name ILIKE '%Graham Weakley%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0181' AND name ILIKE '%Graham Weakley%'))
  );

-- Quentin Deniaud | EMP-0027 | CTR-0180
UPDATE employees_master
SET "contractId" = 'CTR-0180', name = 'Quentin Deniaud', email = 'contact@themusicdesk.studio', phone = '0033650618469', "idNumber" = '17AR17664', position = 'Music composer', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', bank = 'BoursoBank', iban = 'FR7640618804930004020614068', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0027'
  AND (
    "contractId" = 'CTR-0180'
    OR (name ILIKE '%Quentin Deniaud%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0180' AND name ILIKE '%Quentin Deniaud%'))
  );

-- Christian Mardo | EMP-0026 | CTR-0179
UPDATE employees_master
SET "contractId" = 'CTR-0179', name = 'Christian Mardo', email = 'christianmardo.a@gmail.com', phone = '+1 (514) 651 8685', "idNumber" = 'LR3128687', position = 'Set designer', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', bank = 'Royal Bank of Canada (RBC)', iban = '029310035037304', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0026'
  AND (
    "contractId" = 'CTR-0179'
    OR (name ILIKE '%Christian Mardo%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0179' AND name ILIKE '%Christian Mardo%'))
  );

-- Christine Chehaze | EMP-0025 | CTR-0178
UPDATE employees_master
SET "contractId" = 'CTR-0178', name = 'Christine Chehaze', email = 'christinechehade@outlook.com', phone = '+1 514 576 7597', "idNumber" = '11-2040-9991', position = 'Graphic designer', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', bank = 'Royal Bank of Canada (RBC)', iban = '044970034001087', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0025'
  AND (
    "contractId" = 'CTR-0178'
    OR (name ILIKE '%Christine Chehaze%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0178' AND name ILIKE '%Christine Chehaze%'))
  );

-- Ronald Khoury | EMP-0024 | CTR-0177
UPDATE employees_master
SET "contractId" = 'CTR-0177', name = 'Ronald Khoury', email = 'ronald.elk@outlook.com', phone = '+961 71 770 122', "idNumber" = 'LR2379293', position = 'Graphic designer', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'LB64001900000011266862001840', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0024'
  AND (
    "contractId" = 'CTR-0177'
    OR (name ILIKE '%Ronald Khoury%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0177' AND name ILIKE '%Ronald Khoury%'))
  );

-- Louis-Xavier Ambroise | EMP-0023 | CTR-0176
UPDATE employees_master
SET "contractId" = 'CTR-0176', name = 'Louis-Xavier Ambroise', email = 'lx.ambroise@gmail.com', phone = '+966-55-375-5770', "idNumber" = '2616943128', position = 'Creative producer', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA5180000866608013361797', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0023'
  AND (
    "contractId" = 'CTR-0176'
    OR (name ILIKE '%Louis-Xavier Ambroise%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0176' AND name ILIKE '%Louis-Xavier Ambroise%'))
  );

-- Lynn Soueid | EMP-0022 | CTR-0175
UPDATE employees_master
SET "contractId" = 'CTR-0175', name = 'Lynn Soueid', email = 'lynn.soueid@gmail.com', phone = '+971-505868144', "idNumber" = 'PE511440', position = 'Creative director', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', bank = 'Emirates NBD', iban = 'AE380260000215131039401', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0022'
  AND (
    "contractId" = 'CTR-0175'
    OR (name ILIKE '%Lynn Soueid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0175' AND name ILIKE '%Lynn Soueid%'))
  );

-- Roberto Vittorelli | EMP-0021 | CTR-0174
UPDATE employees_master
SET "contractId" = 'CTR-0174', name = 'Roberto Vittorelli', email = 'roberto.vittorelli@ftst.org', phone = '+966 56 712 8743', "idNumber" = '2562905162', position = 'Project director', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA5480000857608014237909', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0021'
  AND (
    "contractId" = 'CTR-0174'
    OR (name ILIKE '%Roberto Vittorelli%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0174' AND name ILIKE '%Roberto Vittorelli%'))
  );

-- Ahmed Abdullah | EMP-0020 | CTR-0173
UPDATE employees_master
SET "contractId" = 'CTR-0173', name = 'Ahmed Abdullah', email = 'inacilmi@gmail.com', phone = '+971 55-551-8905', "idNumber" = 'P01076907', position = 'Stage manager lead', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-15', "endDate" = '2025-12-22', iban = 'AE940359356493329313001', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0020'
  AND (
    "contractId" = 'CTR-0173'
    OR (name ILIKE '%Ahmed Abdullah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0173' AND name ILIKE '%Ahmed Abdullah%'))
  );

-- Fares Charbel | EMP-0019 | CTR-0172
UPDATE employees_master
SET "contractId" = 'CTR-0172', name = 'Fares Charbel', email = 'charbel.e.fares@gmail.com', phone = '00961 3 981440', "idNumber" = 'LR2577580', position = 'Stage manager 2', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-15', "endDate" = '2025-12-22', bank = 'Bank of Beirut', iban = 'LB34007500000001140Z07560000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0019'
  AND (
    "contractId" = 'CTR-0172'
    OR (name ILIKE '%Fares Charbel%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0172' AND name ILIKE '%Fares Charbel%'))
  );

-- Imad Hanna | EMP-0018 | CTR-0171
UPDATE employees_master
SET "contractId" = 'CTR-0171', name = 'Imad Hanna', email = 'Imadhanna123@outlook.com', phone = '+961 71 017 564', "idNumber" = 'LR2231150', position = 'Stage manager 1', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-15', "endDate" = '2025-12-22', bank = 'CREDIT LIBANAIS', iban = 'LB120053001RUSD00391A2247003', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0018'
  AND (
    "contractId" = 'CTR-0171'
    OR (name ILIKE '%Imad Hanna%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0171' AND name ILIKE '%Imad Hanna%'))
  );

-- Sabine Soueid | EMP-0017 | CTR-0170
UPDATE employees_master
SET "contractId" = 'CTR-0170', name = 'Sabine Soueid', email = 'Sabinesoueidy@gmail.com', phone = '(+966) 53 937 8199', "idNumber" = 'LR2654868', position = 'Show caller', project = 'Italian SuperCup 25-26', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-13', "endDate" = '2025-12-22', iban = 'AE790200000031016454050', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34034'
WHERE "employeeId" = 'EMP-0017'
  AND (
    "contractId" = 'CTR-0170'
    OR (name ILIKE '%Sabine Soueid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0170' AND name ILIKE '%Sabine Soueid%'))
  );

-- MUSTAFA IBRAHIM ABU-SAMRAH | EMP-0016 | CTR-0169
UPDATE employees_master
SET "contractId" = 'CTR-0169', name = 'MUSTAFA IBRAHIM ABU-SAMRAH', email = 'mustsam1@yahoo.com', phone = '+966545677444', "idNumber" = '2328763426', position = 'Production Consultant', project = 'BLVD', status = 'new', "workflowStatus" = 'Docs Received', "startDate" = '2025-12-22', "endDate" = '2026-03-21', bank = 'Alrajhi', iban = 'SA2080000463608010165694', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33448'
WHERE "employeeId" = 'EMP-0016'
  AND (
    "contractId" = 'CTR-0169'
    OR (name ILIKE '%MUSTAFA IBRAHIM ABU-SAMRAH%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0169' AND name ILIKE '%MUSTAFA IBRAHIM ABU-SAMRAH%'))
  );

-- Barend James | EMP-0015 | CTR-0167
UPDATE employees_master
SET "contractId" = 'CTR-0167', name = 'Barend James', email = 'benniejames1993@gmail.com', phone = '+27 81 372 1914', "idNumber" = '9301095064088', position = 'Ride Operator', project = 'Winter Wonderland', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2026-02-24', bank = 'FIRST NATIONAL BANK', iban = '62774101142', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33273'
WHERE "employeeId" = 'EMP-0015'
  AND (
    "contractId" = 'CTR-0167'
    OR (name ILIKE '%Barend James%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0167' AND name ILIKE '%Barend James%'))
  );

-- FARMAN ULLAH | EMP-0014 | CTR-0166
UPDATE employees_master
SET "contractId" = 'CTR-0166', name = 'FARMAN ULLAH', email = 'farmanafri3@gmail.com', phone = '+974 3105 5452', "idNumber" = '1730124628895', position = 'Ride Operator', project = 'Winter Wonderland', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-03', "endDate" = '2026-02-25', bank = 'MUSLIM COMMERCIAL BANK', iban = 'PK36MUCB1667516261003544', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33273'
WHERE "employeeId" = 'EMP-0014'
  AND (
    "contractId" = 'CTR-0166'
    OR (name ILIKE '%FARMAN ULLAH%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0166' AND name ILIKE '%FARMAN ULLAH%'))
  );

-- Fayaz Ahmad | EMP-0013 | CTR-0165
UPDATE employees_master
SET "contractId" = 'CTR-0165', name = 'Fayaz Ahmad', email = 'Fayazjaan24@gmail.com', phone = '+974 71252613', "idNumber" = '6154983583', position = 'Ride Operator', project = 'Winter Wonderland', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-03', "endDate" = '2026-02-25', bank = 'Alrajhi', iban = 'SA608000085860817409942', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33273'
WHERE "employeeId" = 'EMP-0013'
  AND (
    "contractId" = 'CTR-0165'
    OR (name ILIKE '%Fayaz Ahmad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0165' AND name ILIKE '%Fayaz Ahmad%'))
  );

-- Zohaib Ejaz | EMP-0012 | CTR-0164
UPDATE employees_master
SET "contractId" = 'CTR-0164', name = 'Zohaib Ejaz', email = 'ezohaib67@gmail.com', phone = '+97470577562', "idNumber" = '6154983985', position = 'Ride Operator', project = 'Winter Wonderland', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-03', "endDate" = '2026-02-25', bank = 'Qatar Islamic Bank', iban = 'QA82QISB000000000153208550013', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-33273'
WHERE "employeeId" = 'EMP-0012'
  AND (
    "contractId" = 'CTR-0164'
    OR (name ILIKE '%Zohaib Ejaz%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0164' AND name ILIKE '%Zohaib Ejaz%'))
  );

-- Fahad abusariya | EMP-0011 | CTR-0162
UPDATE employees_master
SET "contractId" = 'CTR-0162', name = 'Fahad abusariya', email = 'arch.fahed94@gmail.com', phone = '+966552745974', "idNumber" = '2110563547', position = 'Architect', project = 'Riyadh Comedy Festival', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA9305000068202035066000', "requesterName" = 'Tahani', "poNumbers" = 'PO-33266'
WHERE "employeeId" = 'EMP-0011'
  AND (
    "contractId" = 'CTR-0162'
    OR (name ILIKE '%Fahad abusariya%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0162' AND name ILIKE '%Fahad abusariya%'))
  );

-- Noura Bader | EMP-0010 | CTR-0161
UPDATE employees_master
SET "contractId" = 'CTR-0161', name = 'Noura Bader', email = 'Graphicsofnoura@gmail.com', phone = '+996543717177', "idNumber" = '1114097957', position = 'Graphic Designer', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-15', "endDate" = '2026-01-14', bank = 'Riyadh Bank', iban = 'SA6620000001140030639940', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34497'
WHERE "employeeId" = 'EMP-0010'
  AND (
    "contractId" = 'CTR-0161'
    OR (name ILIKE '%Noura Bader%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0161' AND name ILIKE '%Noura Bader%'))
  );

-- Mahmoud Alkhateeb | EMP-0009 | CTR-0160
UPDATE employees_master
SET "contractId" = 'CTR-0160', name = 'Mahmoud Alkhateeb', email = 'm247.alkhateeb@gmail.com', phone = '+966545427393', "idNumber" = '1098580622', position = 'Creative Coordinator', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-12-15', "endDate" = '2026-01-14', bank = 'Alinma', iban = 'SA6405000068204951854000', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34497'
WHERE "employeeId" = 'EMP-0009'
  AND (
    "contractId" = 'CTR-0160'
    OR (name ILIKE '%Mahmoud Alkhateeb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0160' AND name ILIKE '%Mahmoud Alkhateeb%'))
  );

-- Feryal Mourad | EMP-0008 | CTR-0159
UPDATE employees_master
SET "contractId" = 'CTR-0159', name = 'Feryal Mourad', email = 'feryallem@gmail.com', phone = '+966 556606557', "idNumber" = '2151335797', position = 'Graphic Designer', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-15', "endDate" = '2026-01-14', bank = 'Arab national Bank', iban = 'SA7530100991100381382286', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34497'
WHERE "employeeId" = 'EMP-0008'
  AND (
    "contractId" = 'CTR-0159'
    OR (name ILIKE '%Feryal Mourad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0159' AND name ILIKE '%Feryal Mourad%'))
  );

-- BASHAIR ALOQAYLI | EMP-0007 | CTR-0158
UPDATE employees_master
SET "contractId" = 'CTR-0158', name = 'BASHAIR ALOQAYLI', email = 'bashair.m.alaqily@gmail.com', phone = '+966 549095906', "idNumber" = '1103659577', position = 'Graphic Designer', project = 'Spanish Super Cup', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-15', "endDate" = '2026-01-14', bank = 'Al Rajhi', iban = 'SA2180000538608016001811', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34497'
WHERE "employeeId" = 'EMP-0007'
  AND (
    "contractId" = 'CTR-0158'
    OR (name ILIKE '%BASHAIR ALOQAYLI%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0158' AND name ILIKE '%BASHAIR ALOQAYLI%'))
  );

-- Omama Al-Sadiq | EMP-0006 | CTR-0110
UPDATE employees_master
SET "contractId" = 'CTR-0110', name = 'Omama Al-Sadiq', email = 'omaaaaamaaaaa@gmail.com', phone = '+966 506012777', "idNumber" = '1076729399', position = 'Project Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2025-12-24', iban = 'SA0310000012054481000109', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0110'
    OR (name ILIKE '%Omama Al-Sadiq%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0110' AND name ILIKE '%Omama Al-Sadiq%'))
  );

-- Gouda Badran | EMP-0006 | CTR-0130
UPDATE employees_master
SET "contractId" = 'CTR-0130', name = 'Gouda Badran', email = 'gsbadran1@gmail.com', position = 'visualization specialist', project = 'Masar Badr', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2025-11-19', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32265'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0130'
    OR (name ILIKE '%Gouda Badran%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0130' AND name ILIKE '%Gouda Badran%'))
  );

-- Abdulrahman Mohammed | EMP-0006 | CTR-0150
UPDATE employees_master
SET "contractId" = 'CTR-0150', name = 'Abdulrahman Mohammed', email = 'abdalrahmanmohamadmohamad@gmail.com', "idNumber" = '29809250100216', position = 'visualization specialist', project = 'Masar Badr', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-19', "endDate" = '2025-12-31', iban = 'EG600010015100000100063876857', "requesterName" = 'Tahani', "poNumbers" = 'PO-32265'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0150'
    OR (name ILIKE '%Abdulrahman Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0150' AND name ILIKE '%Abdulrahman Mohammed%'))
  );

-- Eman Mohammed | EMP-0006 | CTR-0138
UPDATE employees_master
SET "contractId" = 'CTR-0138', name = 'Eman Mohammed', email = 'eman_bakhsh5@hotmail.com', phone = '+966 556040741', "idNumber" = '2137081333', position = 'Copywritter & Community Manager', project = 'JS - WWL', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2025-12-01', "endDate" = '2026-02-15', bank = 'ANB', iban = 'SA0530100991105551640395', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0138'
    OR (name ILIKE '%Eman Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0138' AND name ILIKE '%Eman Mohammed%'))
  );

-- Abdullah Alkatheri | EMP-0006 | CTR-0135
UPDATE employees_master
SET "contractId" = 'CTR-0135', name = 'Abdullah Alkatheri', email = 'abdullahalk.me@gmail.com', phone = '+966501277388', "idNumber" = '2553484631', position = 'Monteer', project = 'JS - WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2026-02-15', bank = 'Riyadh Bank', iban = 'SA4720000001172593919940', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0135'
    OR (name ILIKE '%Abdullah Alkatheri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0135' AND name ILIKE '%Abdullah Alkatheri%'))
  );

-- Omar Hasan Salem | EMP-0006 | CTR-0136
UPDATE employees_master
SET "contractId" = 'CTR-0136', name = 'Omar Hasan Salem', email = 'Omar113300@gmail.com', phone = '+966592730005', "idNumber" = '2121307462', position = 'Photographer', project = 'JS - WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2026-02-15', bank = 'SNB', iban = 'SA4210000011100245284207', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0136'
    OR (name ILIKE '%Omar Hasan Salem%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0136' AND name ILIKE '%Omar Hasan Salem%'))
  );

-- Wahban Mubarak | EMP-0006 | CTR-0134
UPDATE employees_master
SET "contractId" = 'CTR-0134', name = 'Wahban Mubarak', email = 'heebow@hotmail.com', phone = '+966 505156850', position = 'safety inspector', project = 'irqah', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2025-11-18', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32264'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0134'
    OR (name ILIKE '%Wahban Mubarak%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0134' AND name ILIKE '%Wahban Mubarak%'))
  );

-- Ahmed Tapsoba | EMP-0006 | CTR-0131
UPDATE employees_master
SET "contractId" = 'CTR-0131', name = 'Ahmed Tapsoba', email = 'a.h.m2013a.h.m@icloud.com', phone = '+966592792940', "idNumber" = '21811954930', position = 'supervisor', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-20', "endDate" = '2026-04-30', bank = 'SNB', iban = 'SA7210000011100332107106', "requesterName" = 'Tahani', "poNumbers" = 'PO-32679'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0131'
    OR (name ILIKE '%Ahmed Tapsoba%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0131' AND name ILIKE '%Ahmed Tapsoba%'))
  );

-- Ibrahim Alshaikhi | EMP-0006 | CTR-0152
UPDATE employees_master
SET "contractId" = 'CTR-0152', name = 'Ibrahim Alshaikhi', email = 'beeboo130@gmail.com', phone = '+966 556660552', "idNumber" = '1062308158', position = 'Collection Assistant Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-05-31', bank = 'SNB', iban = 'SA3810000012962288000105', "requesterName" = 'Tahani', "poNumbers" = 'PO-32679'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0152'
    OR (name ILIKE '%Ibrahim Alshaikhi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0152' AND name ILIKE '%Ibrahim Alshaikhi%'))
  );

-- Mohammad Bakkar | EMP-0164 | CTR-0129
UPDATE employees_master
SET "contractId" = 'CTR-0129', name = 'Mohammad Bakkar', email = 'bakkars.3d@gmail.com', phone = '+966 54 876 4871', position = 'Experince Site Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-09', "endDate" = '2025-12-31', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32782'
WHERE "employeeId" = 'EMP-0164'
  AND (
    "contractId" = 'CTR-0129'
    OR (name ILIKE '%Mohammad Bakkar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0129' AND name ILIKE '%Mohammad Bakkar%'))
  );

-- Ahmad Wahba | EMP-0006 | CTR-0151
UPDATE employees_master
SET "contractId" = 'CTR-0151', name = 'Ahmad Wahba', email = 'wahba.strategy@gmail.com', phone = '+966533224400', "idNumber" = '2126600440', position = 'Marketing Strategy Lead', project = 'JS - WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-15', bank = 'SNB', iban = 'SA9410000012294384000108', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0151'
    OR (name ILIKE '%Ahmad Wahba%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0151' AND name ILIKE '%Ahmad Wahba%'))
  );

-- Ayedh Almutairi | EMP-0006 | CTR-0118
UPDATE employees_master
SET "contractId" = 'CTR-0118', name = 'Ayedh Almutairi', email = 'aaid556@gmail.com', phone = '+966 56 893 4000', "idNumber" = '1088885742', position = 'construction supervisor', project = 'Masar Badr', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2025-12-31', iban = 'SA6280000286608010404551', "requesterName" = 'Tahani', "poNumbers" = 'PO-32807'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0118'
    OR (name ILIKE '%Ayedh Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0118' AND name ILIKE '%Ayedh Almutairi%'))
  );

-- Marzooq Yahya Mohammed | EMP-0006 | CTR-0109
UPDATE employees_master
SET "contractId" = 'CTR-0109', name = 'Marzooq Yahya Mohammed', email = 'marzouqbinyahya@gmail.com', "idNumber" = '2598941058', position = 'Site Operation Specialist', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-10-12', "endDate" = '2025-12-11', bank = 'Alinma', iban = 'SA0805000068206517778000', "requesterName" = 'Tahani', "poNumbers" = 'PO-32279'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0109'
    OR (name ILIKE '%Marzooq Yahya Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0109' AND name ILIKE '%Marzooq Yahya Mohammed%'))
  );

-- Sara Thabit | EMP-0006 | CTR-0156
UPDATE employees_master
SET "contractId" = 'CTR-0156', name = 'Sara Thabit', email = 'sarathabit888@gmail.com', phone = '+966 56 775 7643', "idNumber" = '1002549051', position = 'Facilities Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', bank = 'SNB', iban = 'SA0510000013300000937010', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0156'
    OR (name ILIKE '%Sara Thabit%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0156' AND name ILIKE '%Sara Thabit%'))
  );

-- Rawan Jamal | EMP-0006 | CTR-0147
UPDATE employees_master
SET "contractId" = 'CTR-0147', name = 'Rawan Jamal', email = 'rjfalamoudi@gmail.com', phone = '+966-55-999-5775', "idNumber" = '1092541505', position = 'Guest Management Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-11', "endDate" = '2026-01-10', bank = 'SNB', iban = 'SA3710000012200000932706', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0147'
    OR (name ILIKE '%Rawan Jamal%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0147' AND name ILIKE '%Rawan Jamal%'))
  );

-- Lama Alqadi | EMP-0006 | CTR-0146
UPDATE employees_master
SET "contractId" = 'CTR-0146', name = 'Lama Alqadi', email = 'lama@qadi1.com', phone = '+966 555056365', "idNumber" = '1071075319', position = 'Data Visualization And Analysis', project = 'WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-10', "endDate" = '2026-02-17', bank = 'SNB', iban = 'SA5110000011479304000100', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-33077'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0146'
    OR (name ILIKE '%Lama Alqadi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0146' AND name ILIKE '%Lama Alqadi%'))
  );

-- Azouf Sultan Alsakrani | EMP-0006 | CTR-0140
UPDATE employees_master
SET "contractId" = 'CTR-0140', name = 'Azouf Sultan Alsakrani', email = 'Azoufskk@gmail.com', phone = '+966 565 142 537', "idNumber" = '1108241579', position = 'Digital Creator', project = 'JS - WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-15', bank = 'Al Rajhi', iban = 'SA1580000419608016022225', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0140'
    OR (name ILIKE '%Azouf Sultan Alsakrani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0140' AND name ILIKE '%Azouf Sultan Alsakrani%'))
  );

-- Badr Mohamed | EMP-0006 | CTR-0132
UPDATE employees_master
SET "contractId" = 'CTR-0132', name = 'Badr Mohamed', email = 'badr.allakhmi@gmail.com', phone = '‪+966 59 782 3834‬', "idNumber" = '1115103549', position = 'Civil Engineer', project = 'Masar Badr', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-01-31', bank = 'D360', iban = 'SA7636036036069344604555', "requesterName" = 'Tahani', "poNumbers" = 'PO-32807'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0132'
    OR (name ILIKE '%Badr Mohamed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0132' AND name ILIKE '%Badr Mohamed%'))
  );

-- Tala Solimanie | EMP-0006 | CTR-0121
UPDATE employees_master
SET "contractId" = 'CTR-0121', name = 'Tala Solimanie', email = 'tsolimanie@gmail.com', phone = '+966 558899174', "idNumber" = '1115872416', position = 'Project Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2025-12-24', iban = 'SA6305000068204294644001', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0121'
    OR (name ILIKE '%Tala Solimanie%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0121' AND name ILIKE '%Tala Solimanie%'))
  );

-- Fatimah Alharbi | EMP-0006 | CTR-0137
UPDATE employees_master
SET "contractId" = 'CTR-0137', name = 'Fatimah Alharbi', email = 'fatimahadi2301@gmail.com', phone = '+966 590899211', "idNumber" = '1114872516', position = 'Project Coordinator', project = 'Italian SuperCup 25-26', status = 'expired', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2025-12-24', iban = 'SA7210000011100144334409', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0137'
    OR (name ILIKE '%Fatimah Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0137' AND name ILIKE '%Fatimah Alharbi%'))
  );

-- Abrar Abu Sham | EMP-0006 | CTR-0119
UPDATE employees_master
SET "contractId" = 'CTR-0119', name = 'Abrar Abu Sham', email = 'Abrar.Abusham@gmail.com', phone = '+966 562002655', "idNumber" = '1115575415', position = 'Content Development', project = 'Waff senior national team', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-23', "endDate" = '2026-04-22', bank = 'SNB', iban = 'SA4210000011100469011506', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34149'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0119'
    OR (name ILIKE '%Abrar Abu Sham%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0119' AND name ILIKE '%Abrar Abu Sham%'))
  );

-- Hisham Saeed Alqahtani | EMP-0006 | CTR-0155
UPDATE employees_master
SET "contractId" = 'CTR-0155', name = 'Hisham Saeed Alqahtani', email = 'Hsq2720@gmail.com', phone = '+966 599202720', "idNumber" = '1102084405', position = 'Operation Specialist', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-11-11', "endDate" = '2026-01-10', bank = 'Al Rajhi', iban = 'SA1380000447608010954163', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0155'
    OR (name ILIKE '%Hisham Saeed Alqahtani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0155' AND name ILIKE '%Hisham Saeed Alqahtani%'))
  );

-- Mohammed Saad Almowlad | EMP-0006 | CTR-0154
UPDATE employees_master
SET "contractId" = 'CTR-0154', name = 'Mohammed Saad Almowlad', email = 'moh.almowlad9@gmail.com', "idNumber" = '1101163747', position = 'Site Operation Specialist', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-10-12', "endDate" = '2025-12-11', iban = 'SA4105000068205416653000', "requesterName" = 'Tahani', "poNumbers" = 'PO-32279'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0154'
    OR (name ILIKE '%Mohammed Saad Almowlad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0154' AND name ILIKE '%Mohammed Saad Almowlad%'))
  );

-- Abdulhady Kenaid | EMP-0006 | CTR-0127
UPDATE employees_master
SET "contractId" = 'CTR-0127', name = 'Abdulhady Kenaid', email = 'abdulhady.kenaid@gmail.com', phone = '+966566576920', "idNumber" = '1120910243', position = 'Experince Site Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-09', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA7010000014300000030004', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32782'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0127'
    OR (name ILIKE '%Abdulhady Kenaid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0127' AND name ILIKE '%Abdulhady Kenaid%'))
  );

-- Hala Filimban | EMP-0006 | CTR-0126
UPDATE employees_master
SET "contractId" = 'CTR-0126', name = 'Hala Filimban', email = 'hala.hfilimban@gmail.com', phone = '+966 555702639', "idNumber" = '1118861317', position = 'Project Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2025-12-24', iban = 'SA2610000001600000488107', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0126'
    OR (name ILIKE '%Hala Filimban%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0126' AND name ILIKE '%Hala Filimban%'))
  );

-- Hammam Yaslam Bin Hawil | EMP-0006 | CTR-0115
UPDATE employees_master
SET "contractId" = 'CTR-0115', name = 'Hammam Yaslam Bin Hawil', email = 'Hammamyaslam@gmail.com', phone = '+966 545904959', "idNumber" = '2143768006', position = 'Videographer', project = 'JS - WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2026-02-15', bank = 'Al Rajhi', iban = 'SA9880000857608015452333', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0115'
    OR (name ILIKE '%Hammam Yaslam Bin Hawil%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0115' AND name ILIKE '%Hammam Yaslam Bin Hawil%'))
  );

-- Hashim Alattas | EMP-0006 | CTR-0148
UPDATE employees_master
SET "contractId" = 'CTR-0148', name = 'Hashim Alattas', email = 'hashimkalattas@gmail.com', phone = '+966544216836', position = 'Customer Experience Services Supervisor', project = 'WWL', status = 'new', "workflowStatus" = 'Docs Requested', "startDate" = '2025-12-10', "endDate" = '2025-12-31', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-33077'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0148'
    OR (name ILIKE '%Hashim Alattas%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0148' AND name ILIKE '%Hashim Alattas%'))
  );

-- Ahmed Mihi | EMP-0006 | CTR-0125
UPDATE employees_master
SET "contractId" = 'CTR-0125', name = 'Ahmed Mihi', email = 'ahmedmihi41@gmail.com', phone = '+966 565565492', "idNumber" = '1109140838', position = 'Experince Site Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-09', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA0310000015400000226707', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32782'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0125'
    OR (name ILIKE '%Ahmed Mihi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0125' AND name ILIKE '%Ahmed Mihi%'))
  );

-- Mohammed Alamri | EMP-0006 | CTR-0124
UPDATE employees_master
SET "contractId" = 'CTR-0124', name = 'Mohammed Alamri', email = 'eng.amri44@gmail.com', phone = '+966 504444304', "idNumber" = '1021315716', position = 'engineer', project = 'irqah', status = 'active', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-11-15', "endDate" = '2025-12-31', iban = 'SA3780000653608166013839', "requesterName" = 'Tahani', "poNumbers" = 'PO-32264'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0124'
    OR (name ILIKE '%Mohammed Alamri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0124' AND name ILIKE '%Mohammed Alamri%'))
  );

-- Yousef Albakry | EMP-0006 | CTR-0143
UPDATE employees_master
SET "contractId" = 'CTR-0143', name = 'Yousef Albakry', email = 'Yousef0albakry@gmail.com', phone = '+966505545297', "idNumber" = '1114616459', position = 'Videographer', project = 'JS - WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2026-02-15', bank = 'AlRajhi', iban = 'SA9780000550608016007894', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0143'
    OR (name ILIKE '%Yousef Albakry%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0143' AND name ILIKE '%Yousef Albakry%'))
  );

-- Rehab Baamer | EMP-0006 | CTR-0141
UPDATE employees_master
SET "contractId" = 'CTR-0141', name = 'Rehab Baamer', email = 'rehab@zawrag.com', phone = '+966 505656744', "idNumber" = '1002428785', position = 'Creative Director', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2026-02-24', bank = 'SNB', iban = 'SA4310000011100201090310', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0141'
    OR (name ILIKE '%Rehab Baamer%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0141' AND name ILIKE '%Rehab Baamer%'))
  );

-- Abdullah Alshehre | EMP-0006 | CTR-0123
UPDATE employees_master
SET "contractId" = 'CTR-0123', name = 'Abdullah Alshehre', email = 'Abdullah.alshehri.244@gmail.com', phone = '+966 548491688', "idNumber" = '1116999804', position = 'TLO Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA4480000126608016002791', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0123'
    OR (name ILIKE '%Abdullah Alshehre%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0123' AND name ILIKE '%Abdullah Alshehre%'))
  );

-- Nourah AlMadhi | EMP-0006 | CTR-0120
UPDATE employees_master
SET "contractId" = 'CTR-0120', name = 'Nourah AlMadhi', email = 'almadhinourah@outlook.com', phone = '+966555074224', "idNumber" = '1064422684', position = 'Social Media Account Manager', project = 'JS - WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-15', bank = 'Al Rajhi', iban = 'SA4480000425608010505110', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0120'
    OR (name ILIKE '%Nourah AlMadhi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0120' AND name ILIKE '%Nourah AlMadhi%'))
  );

-- Sara Jan | EMP-0006 | CTR-0116
UPDATE employees_master
SET "contractId" = 'CTR-0116', name = 'Sara Jan', email = 'sarah.hjan@gmail.com', phone = '+966 59 225 1201', "idNumber" = '1083071520', position = 'Barnding Manager', project = 'Spanish Super Cup', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-28', bank = 'Al Rajhi', iban = 'SA2680000694608017379372', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32408'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0116'
    OR (name ILIKE '%Sara Jan%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0116' AND name ILIKE '%Sara Jan%'))
  );

-- Samah Alasiri | EMP-0006 | CTR-0122
UPDATE employees_master
SET "contractId" = 'CTR-0122', name = 'Samah Alasiri', email = 'samah.abdo.a@gmail.com', phone = '+966 548011008', "idNumber" = '1001861325', position = 'Operation Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA7010000013392803000104', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0122'
    OR (name ILIKE '%Samah Alasiri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0122' AND name ILIKE '%Samah Alasiri%'))
  );

-- Yousef Mahdali | EMP-0006 | CTR-0114
UPDATE employees_master
SET "contractId" = 'CTR-0114', name = 'Yousef Mahdali', email = 'yousefmahdali@hotmail.com', phone = '+966540807390', "idNumber" = '1119479994', position = 'Stadiums Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA2610000014300000344009', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0114'
    OR (name ILIKE '%Yousef Mahdali%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0114' AND name ILIKE '%Yousef Mahdali%'))
  );

-- Yazeed Almorshed | EMP-0006 | CTR-0142
UPDATE employees_master
SET "contractId" = 'CTR-0142', name = 'Yazeed Almorshed', email = 'yalmoreshed@gmail.com', phone = '+966 561813510', "idNumber" = '1030495582', position = 'Digital Creator', project = 'JS - WWL', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2026-02-15', bank = 'BSF', iban = 'SA5655000000020719300492', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0142'
    OR (name ILIKE '%Yazeed Almorshed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0142' AND name ILIKE '%Yazeed Almorshed%'))
  );

-- Abdullah Alrehaili | EMP-0006 | CTR-0153
UPDATE employees_master
SET "contractId" = 'CTR-0153', name = 'Abdullah Alrehaili', email = 'abdullahar.sa.a@gmail.com', phone = '+966554410087', "idNumber" = '1125702512', position = 'Ai Engineer', project = 'WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-10', "endDate" = '2026-02-17', bank = 'Al Rajhi', iban = 'SA2880000370608016016778', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-33077'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0153'
    OR (name ILIKE '%Abdullah Alrehaili%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0153' AND name ILIKE '%Abdullah Alrehaili%'))
  );

-- Meshal Alshareef | EMP-0006 | CTR-0113
UPDATE employees_master
SET "contractId" = 'CTR-0113', name = 'Meshal Alshareef', email = 'alsharef_meshal@hotmail.com', phone = '+966 58 112 0200', "idNumber" = '1109718971', position = 'Administrative Support Coordinator', project = 'blvd hall', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA0480000991608017477341', "requesterName" = 'Tahani', "poNumbers" = 'PO-32488'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0113'
    OR (name ILIKE '%Meshal Alshareef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0113' AND name ILIKE '%Meshal Alshareef%'))
  );

-- Ahmed Abuawaf | EMP-0006 | CTR-0139
UPDATE employees_master
SET "contractId" = 'CTR-0139', name = 'Ahmed Abuawaf', email = 'Ahmad.abuawf7@gmail.com', phone = '+966 54 956 9556', position = 'PMO Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2025-11-25', "endDate" = '2025-12-24', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0139'
    OR (name ILIKE '%Ahmed Abuawaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0139' AND name ILIKE '%Ahmed Abuawaf%'))
  );

-- Dalal Albaiz | EMP-0006 | CTR-0144
UPDATE employees_master
SET "contractId" = 'CTR-0144', name = 'Dalal Albaiz', email = 'dalalwalbaiz@gmail.com', phone = '+966 532994646', "idNumber" = '1113539868', position = 'Project Coordinator', project = 'Italian SuperCup 25-26', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2025-12-24', iban = 'SA6610000058400001381409', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32762'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0144'
    OR (name ILIKE '%Dalal Albaiz%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0144' AND name ILIKE '%Dalal Albaiz%'))
  );

-- Iman Aljawi | EMP-0006 | CTR-0111
UPDATE employees_master
SET "contractId" = 'CTR-0111', name = 'Iman Aljawi', email = 'aiman.photo11@gmail.com', phone = '+966 54 175 2940', "idNumber" = '1097911158', position = 'Photographer', project = 'JS - WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-12', "endDate" = '2026-02-15', bank = 'Al ahli', iban = 'SA7010000000666942000101', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32895'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0111'
    OR (name ILIKE '%Iman Aljawi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0111' AND name ILIKE '%Iman Aljawi%'))
  );

-- Mohammed Nasser Al Asiri | EMP-0006 | CTR-0149
UPDATE employees_master
SET "contractId" = 'CTR-0149', name = 'Mohammed Nasser Al Asiri', email = 'mohammednasser.ala@hotmail.com', phone = '+966 54 141 5837', "idNumber" = '1082023126', position = 'Experience Site Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-05', "endDate" = '2026-02-28', bank = 'Al Rajhi', iban = 'SA7580000446608012000503', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32811'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0149'
    OR (name ILIKE '%Mohammed Nasser Al Asiri%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0149' AND name ILIKE '%Mohammed Nasser Al Asiri%'))
  );

-- Mohammed Duwide | EMP-0006 | CTR-0133
UPDATE employees_master
SET "contractId" = 'CTR-0133', name = 'Mohammed Duwide', email = 'm_y_d@live.com', phone = '+966 561343598', "idNumber" = '1078264247', position = 'Experince Site Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-09', "endDate" = '2026-02-28', bank = 'SNB', iban = 'SA5010000032871300000107', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-32782'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0133'
    OR (name ILIKE '%Mohammed Duwide%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0133' AND name ILIKE '%Mohammed Duwide%'))
  );

-- Taif Tahlawi | EMP-0006 | CTR-0145
UPDATE employees_master
SET "contractId" = 'CTR-0145', name = 'Taif Tahlawi', email = 'teif.tahlawi@hotmail.com', "idNumber" = '1113345746', position = 'Content Development', project = 'Waff senior national team', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-23', "endDate" = '2026-04-22', bank = 'SNB', iban = 'SA9810000011100159651502', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-34149'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0145'
    OR (name ILIKE '%Taif Tahlawi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0145' AND name ILIKE '%Taif Tahlawi%'))
  );

-- Rehab Alzanbaqi | EMP-0006 | CTR-0128
UPDATE employees_master
SET "contractId" = 'CTR-0128', name = 'Rehab Alzanbaqi', email = 'Rehabalzanbaqi@gmail.com', phone = '+966501509002', position = 'Senior Marketing Executive', project = 'JSD', status = 'active', "workflowStatus" = 'Docs Requested', "startDate" = '2025-11-23', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-33227'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0128'
    OR (name ILIKE '%Rehab Alzanbaqi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0128' AND name ILIKE '%Rehab Alzanbaqi%'))
  );

-- Majed Bin Yousef | EMP-0006 | CTR-0117
UPDATE employees_master
SET "contractId" = 'CTR-0117', name = 'Majed Bin Yousef', email = 'eng.jode@hotmail.com', "idNumber" = '1052961958', position = 'Contract Management & Business Data Analysis', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-16', "endDate" = '2025-12-31', iban = 'SA6810000030762429000106', "requesterName" = 'Tahani', "poNumbers" = 'PO-32339'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0117'
    OR (name ILIKE '%Majed Bin Yousef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0117' AND name ILIKE '%Majed Bin Yousef%'))
  );

-- Abdulrahman Alasmari | EMP-0006 | CTR-0112
UPDATE employees_master
SET "contractId" = 'CTR-0112', name = 'Abdulrahman Alasmari', email = 'dhdh199@hotmail.com', phone = '+966 545323977', "idNumber" = '1103842363', position = 'project coordinator', project = 'irqah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-25', "endDate" = '2026-01-24', bank = 'Al Rajhi', iban = 'SA2480000487608010601310', "requesterName" = 'Tahani', "poNumbers" = 'PO-32489'
WHERE "employeeId" = 'EMP-0006'
  AND (
    "contractId" = 'CTR-0112'
    OR (name ILIKE '%Abdulrahman Alasmari%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0112' AND name ILIKE '%Abdulrahman Alasmari%'))
  );

-- Hassan Alharbi | EMP-0140 | CTR-0080
UPDATE employees_master
SET "contractId" = 'CTR-0080', name = 'Hassan Alharbi', position = 'site manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-11-10', "endDate" = '2025-12-09', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0140'
  AND (
    "contractId" = 'CTR-0080'
    OR (name ILIKE '%Hassan Alharbi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0080' AND name ILIKE '%Hassan Alharbi%'))
  );

-- Rami Bana | EMP-0156 | CTR-0096
UPDATE employees_master
SET "contractId" = 'CTR-0096', name = 'Rami Bana', position = 'Project Manager', project = 'Ala Khotah', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-10', "endDate" = '2025-09-22', "requesterName" = 'Tahani', "poNumbers" = 'PO-28551'
WHERE "employeeId" = 'EMP-0156'
  AND (
    "contractId" = 'CTR-0096'
    OR (name ILIKE '%Rami Bana%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0096' AND name ILIKE '%Rami Bana%'))
  );

-- Riyadh Qumqomji | EMP-0157 | CTR-0097
UPDATE employees_master
SET "contractId" = 'CTR-0097', name = 'Riyadh Qumqomji', position = 'Guest relation officer', project = 'JYC', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-30954'
WHERE "employeeId" = 'EMP-0157'
  AND (
    "contractId" = 'CTR-0097'
    OR (name ILIKE '%Riyadh Qumqomji%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0097' AND name ILIKE '%Riyadh Qumqomji%'))
  );

-- Najwa Abdullah | EMP-0005 | CTR-0104
UPDATE employees_master
SET "contractId" = 'CTR-0104', name = 'Najwa Abdullah', email = 'najwa.gdesign@gmail.com', phone = '‪+966 56 692 9909‬', "idNumber" = '2085199954', position = 'Graphic Designer', project = 'Ala Khotah', status = 'renewal', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-14', "endDate" = '2026-06-13', bank = 'Al Rajhi', iban = 'SA1680000443608016165925', "requesterName" = 'Tahani', "poNumbers" = 'PO-34781'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0104'
    OR (name ILIKE '%Najwa Abdullah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0104' AND name ILIKE '%Najwa Abdullah%'))
  );

-- Mohammed Althobaiti | EMP-0155 | CTR-0095
UPDATE employees_master
SET "contractId" = 'CTR-0095', name = 'Mohammed Althobaiti', email = 'Engmfhmurad@gmail.com', phone = '+966545303099', "idNumber" = '1119583779', position = 'leasing coordinator', project = 'JYC', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2025-10-01', "endDate" = '2025-12-31', iban = 'SA3310000050800000211302', "requesterName" = 'Tahani', "poNumbers" = 'PO-31371'
WHERE "employeeId" = 'EMP-0155'
  AND (
    "contractId" = 'CTR-0095'
    OR (name ILIKE '%Mohammed Althobaiti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0095' AND name ILIKE '%Mohammed Althobaiti%'))
  );

-- Mohammad Al-Hashel | EMP-0141 | CTR-0081
UPDATE employees_master
SET "contractId" = 'CTR-0081', name = 'Mohammad Al-Hashel', position = 'Construction Civil Engineer', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-26', "endDate" = '2025-10-25', "requesterName" = 'Tahani', "poNumbers" = 'PO-29304'
WHERE "employeeId" = 'EMP-0141'
  AND (
    "contractId" = 'CTR-0081'
    OR (name ILIKE '%Mohammad Al-Hashel%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0081' AND name ILIKE '%Mohammad Al-Hashel%'))
  );

-- Abdulelah Shaman | EMP-0005 | CTR-0103
UPDATE employees_master
SET "contractId" = 'CTR-0103', name = 'Abdulelah Shaman', email = 'ABDULELAH.SHAMANI@GMAIL.COM', phone = '+966 553534022', "idNumber" = '1087029466', position = 'Videographer', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA2180000242608010434940', "requesterName" = 'Tahani', "poNumbers" = 'PO-32490'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0103'
    OR (name ILIKE '%Abdulelah Shaman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0103' AND name ILIKE '%Abdulelah Shaman%'))
  );

-- Fahad Albqumi | EMP-0147 | CTR-0087
UPDATE employees_master
SET "contractId" = 'CTR-0087', name = 'Fahad Albqumi', position = 'safety inspector', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-10-10', "endDate" = '2025-12-03', "requesterName" = 'Tahani', "poNumbers" = 'PO-30940'
WHERE "employeeId" = 'EMP-0147'
  AND (
    "contractId" = 'CTR-0087'
    OR (name ILIKE '%Fahad Albqumi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0087' AND name ILIKE '%Fahad Albqumi%'))
  );

-- Nouf Alajmi | EMP-0145 | CTR-0085
UPDATE employees_master
SET "contractId" = 'CTR-0085', name = 'Nouf Alajmi', position = 'Marketing manager', project = 'via riyadh', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-01', "endDate" = '2025-09-21', "requesterName" = 'Tahani', "poNumbers" = 'PO-30436'
WHERE "employeeId" = 'EMP-0145'
  AND (
    "contractId" = 'CTR-0085'
    OR (name ILIKE '%Nouf Alajmi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0085' AND name ILIKE '%Nouf Alajmi%'))
  );

-- Omar Abdulaziz Mohammed | EMP-0135 | CTR-0071
UPDATE employees_master
SET "contractId" = 'CTR-0071', name = 'Omar Abdulaziz Mohammed', position = 'Site Manager', project = 'Ala Khotah', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-08-01', "endDate" = '2025-08-08', "requesterName" = 'Tahani', "poNumbers" = 'PO-29402'
WHERE "employeeId" = 'EMP-0135'
  AND (
    "contractId" = 'CTR-0071'
    OR (name ILIKE '%Omar Abdulaziz Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0071' AND name ILIKE '%Omar Abdulaziz Mohammed%'))
  );

-- Mohammed althobaiti | EMP-0158 | CTR-0098
UPDATE employees_master
SET "contractId" = 'CTR-0098', name = 'Mohammed althobaiti', email = 'Engmfhmurad@gmail.com', phone = '+966545303099', "idNumber" = '1119583779', position = 'leasing coordinator', project = 'JYC', status = 'expired', "workflowStatus" = 'Docs Received', "startDate" = '2025-09-01', "endDate" = '2025-09-30', iban = 'SA3310000050800000211302', "requesterName" = 'Tahani', "poNumbers" = 'PO-29987'
WHERE "employeeId" = 'EMP-0158'
  AND (
    "contractId" = 'CTR-0098'
    OR (name ILIKE '%Mohammed althobaiti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0098' AND name ILIKE '%Mohammed althobaiti%'))
  );

-- Riyadh Qumqomji | EMP-0125 | CTR-0069
UPDATE employees_master
SET "contractId" = 'CTR-0069', name = 'Riyadh Qumqomji', email = 'riyadh1999b@gmail.com', phone = '+966 50 161 1858', "idNumber" = '1119465050', position = 'Guest Relation Officer', project = 'JYC', status = 'expired', "workflowStatus" = 'Docs Received', "startDate" = '2025-06-22', "endDate" = '2025-07-31', iban = 'SA5510000089100000619204', "requesterName" = 'Tahani', "poNumbers" = 'PO-28847'
WHERE "employeeId" = 'EMP-0125'
  AND (
    "contractId" = 'CTR-0069'
    OR (name ILIKE '%Riyadh Qumqomji%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0069' AND name ILIKE '%Riyadh Qumqomji%'))
  );

-- Najwa Abdullah | EMP-0163 | CTR-0108
UPDATE employees_master
SET "contractId" = 'CTR-0108', name = 'Najwa Abdullah', position = 'Graphic Designer', project = 'Beast land', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-14', "endDate" = '2025-12-13', "requesterName" = 'Tahani', "poNumbers" = 'PO-30185'
WHERE "employeeId" = 'EMP-0163'
  AND (
    "contractId" = 'CTR-0108'
    OR (name ILIKE '%Najwa Abdullah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0108' AND name ILIKE '%Najwa Abdullah%'))
  );

-- Tariq Afqi | EMP-0005 | CTR-0074
UPDATE employees_master
SET "contractId" = 'CTR-0074', name = 'Tariq Afqi', email = 'afqi.tariq@gmail.com', phone = '+966 55 332 0200', "idNumber" = '1093688826', position = 'Construction civil Engineer', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Docs Received', "startDate" = '2025-09-01', "endDate" = '2025-11-30', iban = 'SA2210000016848600000107', "requesterName" = 'Tahani', "poNumbers" = 'PO-29745'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0074'
    OR (name ILIKE '%Tariq Afqi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0074' AND name ILIKE '%Tariq Afqi%'))
  );

-- Abdulkarim Marzouq Almurshidi | EMP-0132 | CTR-0066
UPDATE employees_master
SET "contractId" = 'CTR-0066', name = 'Abdulkarim Marzouq Almurshidi', position = 'Construction civil Engineer', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-08-20', "endDate" = '2025-11-19', "requesterName" = 'Tahani', "poNumbers" = 'PO-29572'
WHERE "employeeId" = 'EMP-0132'
  AND (
    "contractId" = 'CTR-0066'
    OR (name ILIKE '%Abdulkarim Marzouq Almurshidi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0066' AND name ILIKE '%Abdulkarim Marzouq Almurshidi%'))
  );

-- Mohammed Alhashel | EMP-0142 | CTR-0082
UPDATE employees_master
SET "contractId" = 'CTR-0082', name = 'Mohammed Alhashel', position = 'construction engineer - Civil', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-26', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-30940'
WHERE "employeeId" = 'EMP-0142'
  AND (
    "contractId" = 'CTR-0082'
    OR (name ILIKE '%Mohammed Alhashel%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0082' AND name ILIKE '%Mohammed Alhashel%'))
  );

-- Nouf Alajmi | EMP-0144 | CTR-0084
UPDATE employees_master
SET "contractId" = 'CTR-0084', name = 'Nouf Alajmi', position = 'Marketing manager', project = 'via riyadh', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-31', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29608'
WHERE "employeeId" = 'EMP-0144'
  AND (
    "contractId" = 'CTR-0084'
    OR (name ILIKE '%Nouf Alajmi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0084' AND name ILIKE '%Nouf Alajmi%'))
  );

-- Weam Mohammed Iskandar | EMP-0005 | CTR-0070
UPDATE employees_master
SET "contractId" = 'CTR-0070', name = 'Weam Mohammed Iskandar', email = 'weameskander55@gmail.com', "idNumber" = '1082429224', position = 'Leasing Assistant Manager', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-01', "endDate" = '2025-12-31', iban = 'SA9710000011100515402609', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0070'
    OR (name ILIKE '%Weam Mohammed Iskandar%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0070' AND name ILIKE '%Weam Mohammed Iskandar%'))
  );

-- Abdulaziz Awad AL Jomaa | EMP-0005 | CTR-0075
UPDATE employees_master
SET "contractId" = 'CTR-0075', name = 'Abdulaziz Awad AL Jomaa', email = 'Rt1610096@gmail.com', phone = '+966 0508347454', "idNumber" = '1108036979', position = 'Site Manager', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA8680000296608016023023', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0075'
    OR (name ILIKE '%Abdulaziz Awad AL Jomaa%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0075' AND name ILIKE '%Abdulaziz Awad AL Jomaa%'))
  );

-- Abdulaziz Abaalkhail | EMP-0152 | CTR-0092
UPDATE employees_master
SET "contractId" = 'CTR-0092', name = 'Abdulaziz Abaalkhail', position = 'Construction civil Engineer', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-24', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0152'
  AND (
    "contractId" = 'CTR-0092'
    OR (name ILIKE '%Abdulaziz Abaalkhail%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0092' AND name ILIKE '%Abdulaziz Abaalkhail%'))
  );

-- Mohammed Alhabash | EMP-0154 | CTR-0094
UPDATE employees_master
SET "contractId" = 'CTR-0094', name = 'Mohammed Alhabash', email = 'shmohammed269@gmail.com', "idNumber" = '2084121322', position = 'Project Manager', project = 'WDS 2025 - 2026', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-01', "endDate" = '2026-01-31', bank = 'INMA', iban = 'SA0505000068202513484000', "requesterName" = 'Tahani', "poNumbers" = 'PO-31391'
WHERE "employeeId" = 'EMP-0154'
  AND (
    "contractId" = 'CTR-0094'
    OR (name ILIKE '%Mohammed Alhabash%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0094' AND name ILIKE '%Mohammed Alhabash%'))
  );

-- Mohammed Ehab | EMP-0005 | CTR-0099
UPDATE employees_master
SET "contractId" = 'CTR-0099', name = 'Mohammed Ehab', email = 'mohamedehab2000.me@gmail.com', phone = '+20 12 34508044', "idNumber" = 'A40735481', position = 'visualization specialist', project = 'Masar Badr', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-19', "endDate" = '2025-12-31', iban = 'EG600002011301130203000000855', "requesterName" = 'Tahani', "poNumbers" = 'PO-32265'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0099'
    OR (name ILIKE '%Mohammed Ehab%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0099' AND name ILIKE '%Mohammed Ehab%'))
  );

-- Osama Esmail | EMP-0162 | CTR-0106
UPDATE employees_master
SET "contractId" = 'CTR-0106', name = 'Osama Esmail', position = 'Motion Graphic Designer', project = 'Beast land', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-14', "endDate" = '2025-10-14', "requesterName" = 'Tahani', "poNumbers" = 'PO-30185'
WHERE "employeeId" = 'EMP-0162'
  AND (
    "contractId" = 'CTR-0106'
    OR (name ILIKE '%Osama Esmail%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0106' AND name ILIKE '%Osama Esmail%'))
  );

-- Mohammed Murad | EMP-0153 | CTR-0093
UPDATE employees_master
SET "contractId" = 'CTR-0093', name = 'Mohammed Murad', position = 'FM Coordinator', project = 'promenade', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-31', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29491'
WHERE "employeeId" = 'EMP-0153'
  AND (
    "contractId" = 'CTR-0093'
    OR (name ILIKE '%Mohammed Murad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0093' AND name ILIKE '%Mohammed Murad%'))
  );

-- Mohammed althobaiti | EMP-0131 | CTR-0065
UPDATE employees_master
SET "contractId" = 'CTR-0065', name = 'Mohammed althobaiti', email = 'Engmfhmurad@gmail.com', phone = '+966545303099', "idNumber" = '1119583779', position = 'leasing coordinator', project = 'JSD', status = 'expired', "workflowStatus" = 'Docs Received', "startDate" = '2025-07-31', "endDate" = '2025-08-31', iban = 'SA3310000050800000211302', "requesterName" = 'Tahani', "poNumbers" = 'PO-29592'
WHERE "employeeId" = 'EMP-0131'
  AND (
    "contractId" = 'CTR-0065'
    OR (name ILIKE '%Mohammed althobaiti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0065' AND name ILIKE '%Mohammed althobaiti%'))
  );

-- Nouf Alajmi | EMP-0137 | CTR-0076
UPDATE employees_master
SET "contractId" = 'CTR-0076', name = 'Nouf Alajmi', position = 'Marketing Manager', project = 'via riyadh', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-07-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-28874'
WHERE "employeeId" = 'EMP-0137'
  AND (
    "contractId" = 'CTR-0076'
    OR (name ILIKE '%Nouf Alajmi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0076' AND name ILIKE '%Nouf Alajmi%'))
  );

-- Mamduh Aldalbahy | EMP-0136 | CTR-0072
UPDATE employees_master
SET "contractId" = 'CTR-0072', name = 'Mamduh Aldalbahy', position = 'Security supervisor', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-20', "endDate" = '2025-10-19', "requesterName" = 'Tahani', "poNumbers" = 'PO-29102'
WHERE "employeeId" = 'EMP-0136'
  AND (
    "contractId" = 'CTR-0072'
    OR (name ILIKE '%Mamduh Aldalbahy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0072' AND name ILIKE '%Mamduh Aldalbahy%'))
  );

-- Mohamed El Habbash | EMP-0128 | CTR-0061
UPDATE employees_master
SET "contractId" = 'CTR-0061', name = 'Mohamed El Habbash', position = 'Project Manager', project = 'Global health', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29742'
WHERE "employeeId" = 'EMP-0128'
  AND (
    "contractId" = 'CTR-0061'
    OR (name ILIKE '%Mohamed El Habbash%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0061' AND name ILIKE '%Mohamed El Habbash%'))
  );

-- Abdulelah Shaman | EMP-0005 | CTR-0107
UPDATE employees_master
SET "contractId" = 'CTR-0107', name = 'Abdulelah Shaman', email = 'ABDULELAH.SHAMANI@GMAIL.COM', phone = '+966 553534022', "idNumber" = '1087029466', position = 'Videographer', project = 'Ala Khotah', status = 'expired', "workflowStatus" = 'Agreement Sent', "startDate" = '2025-11-04', "endDate" = '2025-11-30', iban = 'SA2180000242608010434940', "requesterName" = 'Tahani', "poNumbers" = 'PO-31910'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0107'
    OR (name ILIKE '%Abdulelah Shaman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0107' AND name ILIKE '%Abdulelah Shaman%'))
  );

-- Sami Albudairi | EMP-0160 | CTR-0101
UPDATE employees_master
SET "contractId" = 'CTR-0101', name = 'Sami Albudairi', position = 'Procurement Engineer', project = 'Beast land', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-30932'
WHERE "employeeId" = 'EMP-0160'
  AND (
    "contractId" = 'CTR-0101'
    OR (name ILIKE '%Sami Albudairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0101' AND name ILIKE '%Sami Albudairi%'))
  );

-- Abdulwahab Alabbasi | EMP-0134 | CTR-0068
UPDATE employees_master
SET "contractId" = 'CTR-0068', name = 'Abdulwahab Alabbasi', position = 'Mechanical Engineer', project = 'Blvd World', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32355'
WHERE "employeeId" = 'EMP-0134'
  AND (
    "contractId" = 'CTR-0068'
    OR (name ILIKE '%Abdulwahab Alabbasi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0068' AND name ILIKE '%Abdulwahab Alabbasi%'))
  );

-- Sami Albudairi | EMP-0161 | CTR-0105
UPDATE employees_master
SET "contractId" = 'CTR-0105', name = 'Sami Albudairi', position = 'Procurement Engineer', project = 'EWC', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-16', "endDate" = '2025-10-31', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-30932'
WHERE "employeeId" = 'EMP-0161'
  AND (
    "contractId" = 'CTR-0105'
    OR (name ILIKE '%Sami Albudairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0105' AND name ILIKE '%Sami Albudairi%'))
  );

-- Mamduh Aldalbahy | EMP-0126 | CTR-0059
UPDATE employees_master
SET "contractId" = 'CTR-0059', name = 'Mamduh Aldalbahy', email = 'Mr.mmdoo7@gmail.com', phone = '+', "idNumber" = '1073033241', position = 'Security supervisor', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2025-10-20', "endDate" = '2025-12-31', iban = 'SA3265000000240268684001', "requesterName" = 'Tahani', "poNumbers" = 'PO-31306'
WHERE "employeeId" = 'EMP-0126'
  AND (
    "contractId" = 'CTR-0059'
    OR (name ILIKE '%Mamduh Aldalbahy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0059' AND name ILIKE '%Mamduh Aldalbahy%'))
  );

-- Omar Mahbub | EMP-0123 | CTR-0102
UPDATE employees_master
SET "contractId" = 'CTR-0102', name = 'Omar Mahbub', email = 'Omahboob707@gmail.com', phone = '+', position = 'Security supervisor', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-20', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-31306'
WHERE "employeeId" = 'EMP-0123'
  AND (
    "contractId" = 'CTR-0102'
    OR (name ILIKE '%Omar Mahbub%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0102' AND name ILIKE '%Omar Mahbub%'))
  );

-- Abdulwahab Alabbasi | EMP-0124 | CTR-0062
UPDATE employees_master
SET "contractId" = 'CTR-0062', name = 'Abdulwahab Alabbasi', position = 'Mechanical Engineer', project = 'Boulevard world', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-29304'
WHERE "employeeId" = 'EMP-0124'
  AND (
    "contractId" = 'CTR-0062'
    OR (name ILIKE '%Abdulwahab Alabbasi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0062' AND name ILIKE '%Abdulwahab Alabbasi%'))
  );

-- Omar Mahbub | EMP-0122 | CTR-0079
UPDATE employees_master
SET "contractId" = 'CTR-0079', name = 'Omar Mahbub', position = 'Security Supervisor', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-20', "endDate" = '2025-10-19', "requesterName" = 'Tahani', "poNumbers" = 'PO-29102'
WHERE "employeeId" = 'EMP-0122'
  AND (
    "contractId" = 'CTR-0079'
    OR (name ILIKE '%Omar Mahbub%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0079' AND name ILIKE '%Omar Mahbub%'))
  );

-- Riyadh Qumqomji | EMP-0148 | CTR-0088
UPDATE employees_master
SET "contractId" = 'CTR-0088', name = 'Riyadh Qumqomji', position = 'Guest relation officer', project = 'JYC', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-31', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29525'
WHERE "employeeId" = 'EMP-0148'
  AND (
    "contractId" = 'CTR-0088'
    OR (name ILIKE '%Riyadh Qumqomji%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0088' AND name ILIKE '%Riyadh Qumqomji%'))
  );

-- Riyadh Qumqomji | EMP-0149 | CTR-0089
UPDATE employees_master
SET "contractId" = 'CTR-0089', name = 'Riyadh Qumqomji', position = 'Guest relation officer', project = 'JYC', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-29884'
WHERE "employeeId" = 'EMP-0149'
  AND (
    "contractId" = 'CTR-0089'
    OR (name ILIKE '%Riyadh Qumqomji%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0089' AND name ILIKE '%Riyadh Qumqomji%'))
  );

-- Omar Abdulaziz Mohammed | EMP-0146 | CTR-0086
UPDATE employees_master
SET "contractId" = 'CTR-0086', name = 'Omar Abdulaziz Mohammed', position = 'Site Manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-08-09', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29841'
WHERE "employeeId" = 'EMP-0146'
  AND (
    "contractId" = 'CTR-0086'
    OR (name ILIKE '%Omar Abdulaziz Mohammed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0086' AND name ILIKE '%Omar Abdulaziz Mohammed%'))
  );

-- Bushra Jubarah | EMP-0127 | CTR-0060
UPDATE employees_master
SET "contractId" = 'CTR-0060', name = 'Bushra Jubarah', email = 'bushra@bushrajubarah.com', phone = '‪+966 50 102 9093‬', position = 'Visual & Motion Art Lead', project = 'Beast land', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-14', "endDate" = '2025-12-13', "requesterName" = 'Tahani', "poNumbers" = 'PO-30185'
WHERE "employeeId" = 'EMP-0127'
  AND (
    "contractId" = 'CTR-0060'
    OR (name ILIKE '%Bushra Jubarah%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0060' AND name ILIKE '%Bushra Jubarah%'))
  );

-- Tariq Afqi | EMP-0005 | CTR-0073
UPDATE employees_master
SET "contractId" = 'CTR-0073', name = 'Tariq Afqi', email = 'afqi.tariq@gmail.com', phone = '+966 55 332 0200', "idNumber" = '1093688826', position = 'Construction civil Engineer', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-01', "endDate" = '2025-12-31', iban = 'SA2210000016848600000107', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0005'
  AND (
    "contractId" = 'CTR-0073'
    OR (name ILIKE '%Tariq Afqi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0073' AND name ILIKE '%Tariq Afqi%'))
  );

-- Nasreen Kamalmaz | EMP-0129 | CTR-0063
UPDATE employees_master
SET "contractId" = 'CTR-0063', name = 'Nasreen Kamalmaz', position = 'Stage Manager', project = 'BLVD', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-15', "endDate" = '2025-10-10', "requesterName" = 'Mohamed Mahmoud', "poNumbers" = 'PO-30144'
WHERE "employeeId" = 'EMP-0129'
  AND (
    "contractId" = 'CTR-0063'
    OR (name ILIKE '%Nasreen Kamalmaz%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0063' AND name ILIKE '%Nasreen Kamalmaz%'))
  );

-- Islam Nagi | EMP-0130 | CTR-0064
UPDATE employees_master
SET "contractId" = 'CTR-0064', name = 'Islam Nagi', position = 'art director', project = 'Masar Badr', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-19', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32265'
WHERE "employeeId" = 'EMP-0130'
  AND (
    "contractId" = 'CTR-0064'
    OR (name ILIKE '%Islam Nagi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0064' AND name ILIKE '%Islam Nagi%'))
  );

-- Molham Ali | EMP-0143 | CTR-0083
UPDATE employees_master
SET "contractId" = 'CTR-0083', name = 'Molham Ali', position = 'Team Liaison Officer', project = 'August Fight - EWC', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-08-01', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29001'
WHERE "employeeId" = 'EMP-0143'
  AND (
    "contractId" = 'CTR-0083'
    OR (name ILIKE '%Molham Ali%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0083' AND name ILIKE '%Molham Ali%'))
  );

-- Awrad Mufti | EMP-0150 | CTR-0090
UPDATE employees_master
SET "contractId" = 'CTR-0090', name = 'Awrad Mufti', position = 'Team Liaison Officer', project = 'August Fight - EWC', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-08-01', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29001'
WHERE "employeeId" = 'EMP-0150'
  AND (
    "contractId" = 'CTR-0090'
    OR (name ILIKE '%Awrad Mufti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0090' AND name ILIKE '%Awrad Mufti%'))
  );

-- Abdulkarim Marzouq Almurshidi | EMP-0159 | CTR-0100
UPDATE employees_master
SET "contractId" = 'CTR-0100', name = 'Abdulkarim Marzouq Almurshidi', email = 'abdulkarrem.228@gmail.com', phone = '+966545247258', "idNumber" = '1097894529', position = 'Construction Civil Engineer', project = 'Masar Badr', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2025-12-03', "endDate" = '2026-01-31', bank = 'SAB', iban = 'SA8545000000819129701001', "requesterName" = 'Tahani', "poNumbers" = 'PO-32807'
WHERE "employeeId" = 'EMP-0159'
  AND (
    "contractId" = 'CTR-0100'
    OR (name ILIKE '%Abdulkarim Marzouq Almurshidi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0100' AND name ILIKE '%Abdulkarim Marzouq Almurshidi%'))
  );

-- Mohammed Murad | EMP-0138 | CTR-0077
UPDATE employees_master
SET "contractId" = 'CTR-0077', name = 'Mohammed Murad', position = 'FM Coordinator', project = 'promenade', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-07-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-28788'
WHERE "employeeId" = 'EMP-0138'
  AND (
    "contractId" = 'CTR-0077'
    OR (name ILIKE '%Mohammed Murad%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0077' AND name ILIKE '%Mohammed Murad%'))
  );

-- Sami Albudairi | EMP-0151 | CTR-0091
UPDATE employees_master
SET "contractId" = 'CTR-0091', name = 'Sami Albudairi', email = 'eng.sammi4@gmail.com', phone = '+966 56 863 5445', "idNumber" = '1087568109', position = 'Procurement Engineer', project = 'WWL', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2026-01-01', "endDate" = '2026-03-31', bank = 'SAB', iban = 'SA7445000000810049460001', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-32652'
WHERE "employeeId" = 'EMP-0151'
  AND (
    "contractId" = 'CTR-0091'
    OR (name ILIKE '%Sami Albudairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0091' AND name ILIKE '%Sami Albudairi%'))
  );

-- Yazan Khalil | EMP-0139 | CTR-0078
UPDATE employees_master
SET "contractId" = 'CTR-0078', name = 'Yazan Khalil', position = 'Security Supervisor', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-20', "endDate" = '2025-10-19', "requesterName" = 'Tahani', "poNumbers" = 'PO-29102'
WHERE "employeeId" = 'EMP-0139'
  AND (
    "contractId" = 'CTR-0078'
    OR (name ILIKE '%Yazan Khalil%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0078' AND name ILIKE '%Yazan Khalil%'))
  );

-- Abdulaziz Abaalkhail | EMP-0133 | CTR-0067
UPDATE employees_master
SET "contractId" = 'CTR-0067', name = 'Abdulaziz Abaalkhail', position = 'Construction civil Engineer', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-08-24', "endDate" = '2025-11-23', "requesterName" = 'Tahani', "poNumbers" = 'PO-29572'
WHERE "employeeId" = 'EMP-0133'
  AND (
    "contractId" = 'CTR-0067'
    OR (name ILIKE '%Abdulaziz Abaalkhail%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0067' AND name ILIKE '%Abdulaziz Abaalkhail%'))
  );

-- Ahmed Sulaiman | EMP-0099 | CTR-0029
UPDATE employees_master
SET "contractId" = 'CTR-0029', name = 'Ahmed Sulaiman', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29875'
WHERE "employeeId" = 'EMP-0099'
  AND (
    "contractId" = 'CTR-0029'
    OR (name ILIKE '%Ahmed Sulaiman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0029' AND name ILIKE '%Ahmed Sulaiman%'))
  );

-- Abdulaziz Saleh | EMP-0092 | CTR-0018
UPDATE employees_master
SET "contractId" = 'CTR-0018', name = 'Abdulaziz Saleh', position = 'site manager', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-13', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-30940'
WHERE "employeeId" = 'EMP-0092'
  AND (
    "contractId" = 'CTR-0018'
    OR (name ILIKE '%Abdulaziz Saleh%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0018' AND name ILIKE '%Abdulaziz Saleh%'))
  );

-- Mohammed Al Qahani | EMP-0091 | CTR-0015
UPDATE employees_master
SET "contractId" = 'CTR-0015', name = 'Mohammed Al Qahani', position = 'leasing assistant manager', project = 'Boulevard world', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29453'
WHERE "employeeId" = 'EMP-0091'
  AND (
    "contractId" = 'CTR-0015'
    OR (name ILIKE '%Mohammed Al Qahani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0015' AND name ILIKE '%Mohammed Al Qahani%'))
  );

-- Mohammed Zain | EMP-0086 | CTR-0011
UPDATE employees_master
SET "contractId" = 'CTR-0011', name = 'Mohammed Zain', email = 'zan_zan87@hotmail.com', phone = '966599363351', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-28893'
WHERE "employeeId" = 'EMP-0086'
  AND (
    "contractId" = 'CTR-0011'
    OR (name ILIKE '%Mohammed Zain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0011' AND name ILIKE '%Mohammed Zain%'))
  );

-- Ahmed Sulaiman | EMP-0093 | CTR-0019
UPDATE employees_master
SET "contractId" = 'CTR-0019', name = 'Ahmed Sulaiman', email = 'ahmedsuliman11986@gmail.com', phone = '+966540301987', position = 'Zone Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-31665'
WHERE "employeeId" = 'EMP-0093'
  AND (
    "contractId" = 'CTR-0019'
    OR (name ILIKE '%Ahmed Sulaiman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0019' AND name ILIKE '%Ahmed Sulaiman%'))
  );

-- Ali Baqalb | EMP-0116 | CTR-0050
UPDATE employees_master
SET "contractId" = 'CTR-0050', name = 'Ali Baqalb', position = 'Construction Engineer', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-13', "endDate" = '2025-10-12', "requesterName" = 'Tahani', "poNumbers" = 'PO-28823'
WHERE "employeeId" = 'EMP-0116'
  AND (
    "contractId" = 'CTR-0050'
    OR (name ILIKE '%Ali Baqalb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0050' AND name ILIKE '%Ali Baqalb%'))
  );

-- Emad Almutairi | EMP-0102 | CTR-0032
UPDATE employees_master
SET "contractId" = 'CTR-0032', name = 'Emad Almutairi', email = 'hdd604@hotmail.com', phone = '966550975090', "idNumber" = '1094709183', position = 'Zone Manager', project = 'Blvd World', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-01', "endDate" = '2026-05-31', bank = 'SNB', iban = 'SA4410000026600000500307', "requesterName" = 'Tahani', "poNumbers" = 'PO-32100'
WHERE "employeeId" = 'EMP-0102'
  AND (
    "contractId" = 'CTR-0032'
    OR (name ILIKE '%Emad Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0032' AND name ILIKE '%Emad Almutairi%'))
  );

-- Ahmed Alghamdi | EMP-0088 | CTR-0013
UPDATE employees_master
SET "contractId" = 'CTR-0013', name = 'Ahmed Alghamdi', email = 'at_010@icloud.com', phone = '+966568730112', position = 'Zone Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-31665'
WHERE "employeeId" = 'EMP-0088'
  AND (
    "contractId" = 'CTR-0013'
    OR (name ILIKE '%Ahmed Alghamdi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0013' AND name ILIKE '%Ahmed Alghamdi%'))
  );

-- Nawaf Al. Ibrahim | EMP-0094 | CTR-0048
UPDATE employees_master
SET "contractId" = 'CTR-0048', name = 'Nawaf Al. Ibrahim', position = 'Retail Assistant Manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-06-01', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-28568'
WHERE "employeeId" = 'EMP-0094'
  AND (
    "contractId" = 'CTR-0048'
    OR (name ILIKE '%Nawaf Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0048' AND name ILIKE '%Nawaf Al. Ibrahim%'))
  );

-- Mohammed Althobaiti | EMP-0115 | CTR-0049
UPDATE employees_master
SET "contractId" = 'CTR-0049', name = 'Mohammed Althobaiti', email = 'Engmfhmurad@gmail.com', phone = '+966545303099', "idNumber" = '1119583779', position = 'Leasing Coordinator', project = 'JSD', status = 'expired', "workflowStatus" = 'Docs Received', "startDate" = '2025-07-01', "endDate" = '2025-07-31', iban = 'SA3310000050800000211302', "requesterName" = 'Tahani', "poNumbers" = 'PO-28763'
WHERE "employeeId" = 'EMP-0115'
  AND (
    "contractId" = 'CTR-0049'
    OR (name ILIKE '%Mohammed Althobaiti%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0049' AND name ILIKE '%Mohammed Althobaiti%'))
  );

-- Ahmed Alghamdi | EMP-0087 | CTR-0012
UPDATE employees_master
SET "contractId" = 'CTR-0012', name = 'Ahmed Alghamdi', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-28893'
WHERE "employeeId" = 'EMP-0087'
  AND (
    "contractId" = 'CTR-0012'
    OR (name ILIKE '%Ahmed Alghamdi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0012' AND name ILIKE '%Ahmed Alghamdi%'))
  );

-- Njoud Aljuaid | EMP-0096 | CTR-0025
UPDATE employees_master
SET "contractId" = 'CTR-0025', name = 'Njoud Aljuaid', position = 'retail assistant manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29875'
WHERE "employeeId" = 'EMP-0096'
  AND (
    "contractId" = 'CTR-0025'
    OR (name ILIKE '%Njoud Aljuaid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0025' AND name ILIKE '%Njoud Aljuaid%'))
  );

-- Salma Al. Ibrahim | EMP-0104 | CTR-0034
UPDATE employees_master
SET "contractId" = 'CTR-0034', name = 'Salma Al. Ibrahim', position = 'leasing assistant manager', project = 'Boulevard world', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29453'
WHERE "employeeId" = 'EMP-0104'
  AND (
    "contractId" = 'CTR-0034'
    OR (name ILIKE '%Salma Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0034' AND name ILIKE '%Salma Al. Ibrahim%'))
  );

-- Nawaf Al. Ibrahim | EMP-0110 | CTR-0043
UPDATE employees_master
SET "contractId" = 'CTR-0043', name = 'Nawaf Al. Ibrahim', position = 'leasing assistant manager', project = 'Boulevard world', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29453'
WHERE "employeeId" = 'EMP-0110'
  AND (
    "contractId" = 'CTR-0043'
    OR (name ILIKE '%Nawaf Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0043' AND name ILIKE '%Nawaf Al. Ibrahim%'))
  );

-- Ammar Hussain | EMP-0109 | CTR-0042
UPDATE employees_master
SET "contractId" = 'CTR-0042', name = 'Ammar Hussain', position = 'leasing assistant manager', project = 'Boulevard world', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29453'
WHERE "employeeId" = 'EMP-0109'
  AND (
    "contractId" = 'CTR-0042'
    OR (name ILIKE '%Ammar Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0042' AND name ILIKE '%Ammar Hussain%'))
  );

-- Mohammed Zain | EMP-0081 | CTR-0016
UPDATE employees_master
SET "contractId" = 'CTR-0016', name = 'Mohammed Zain', email = 'zan_zan87@hotmail.com', phone = '966599363351', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29875'
WHERE "employeeId" = 'EMP-0081'
  AND (
    "contractId" = 'CTR-0016'
    OR (name ILIKE '%Mohammed Zain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0016' AND name ILIKE '%Mohammed Zain%'))
  );

-- Emad Almutairi | EMP-0098 | CTR-0028
UPDATE employees_master
SET "contractId" = 'CTR-0028', name = 'Emad Almutairi', email = 'hdd604@hotmail.com', phone = '966550975090', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29875'
WHERE "employeeId" = 'EMP-0098'
  AND (
    "contractId" = 'CTR-0028'
    OR (name ILIKE '%Emad Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0028' AND name ILIKE '%Emad Almutairi%'))
  );

-- Osama Khalaf | EMP-0004 | CTR-0035
UPDATE employees_master
SET "contractId" = 'CTR-0035', name = 'Osama Khalaf', email = 'osamah883@gmail.com', phone = '‪+966 50 150 8619‬', position = 'construction engineer - Civil', project = 'Masar alhijra', status = 'renewal', "workflowStatus" = 'Pending', "startDate" = '2025-10-20', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-30940'
WHERE "employeeId" = 'EMP-0004'
  AND (
    "contractId" = 'CTR-0035'
    OR (name ILIKE '%Osama Khalaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0035' AND name ILIKE '%Osama Khalaf%'))
  );

-- Mohammed Al Qahani | EMP-0085 | CTR-0010
UPDATE employees_master
SET "contractId" = 'CTR-0010', name = 'Mohammed Al Qahani', position = 'Site Operation Specialist', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-06-01', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-28568'
WHERE "employeeId" = 'EMP-0085'
  AND (
    "contractId" = 'CTR-0010'
    OR (name ILIKE '%Mohammed Al Qahani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0010' AND name ILIKE '%Mohammed Al Qahani%'))
  );

-- Abdulaziz Ateef | EMP-0090 | CTR-0017
UPDATE employees_master
SET "contractId" = 'CTR-0017', name = 'Abdulaziz Ateef', email = 'ot.azyz@gmail.com', phone = '+9660567822205', "idNumber" = '1093633293', position = 'Zone Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Docs Received', "startDate" = '2025-11-01', "endDate" = '2025-12-31', iban = 'SA4720000009323145019940', "requesterName" = 'Tahani', "poNumbers" = 'PO-31665'
WHERE "employeeId" = 'EMP-0090'
  AND (
    "contractId" = 'CTR-0017'
    OR (name ILIKE '%Abdulaziz Ateef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0017' AND name ILIKE '%Abdulaziz Ateef%'))
  );

-- Fahad Albaqamy | EMP-0121 | CTR-0055
UPDATE employees_master
SET "contractId" = 'CTR-0055', name = 'Fahad Albaqamy', position = 'Safety Inspector', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-10', "endDate" = '2025-10-09', "requesterName" = 'Tahani', "poNumbers" = 'PO-28867'
WHERE "employeeId" = 'EMP-0121'
  AND (
    "contractId" = 'CTR-0055'
    OR (name ILIKE '%Fahad Albaqamy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0055' AND name ILIKE '%Fahad Albaqamy%'))
  );

-- Abdulrahman Majdy | EMP-0120 | CTR-0054
UPDATE employees_master
SET "contractId" = 'CTR-0054', name = 'Abdulrahman Majdy', position = 'Art Director', project = 'Indoor Forest', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-06-01', "endDate" = '2025-06-22', "requesterName" = 'Tahani', "poNumbers" = 'PO-28681'
WHERE "employeeId" = 'EMP-0120'
  AND (
    "contractId" = 'CTR-0054'
    OR (name ILIKE '%Abdulrahman Majdy%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0054' AND name ILIKE '%Abdulrahman Majdy%'))
  );

-- Abdulaziz Ateef | EMP-0079 | CTR-0027
UPDATE employees_master
SET "contractId" = 'CTR-0027', name = 'Abdulaziz Ateef', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-28893'
WHERE "employeeId" = 'EMP-0079'
  AND (
    "contractId" = 'CTR-0027'
    OR (name ILIKE '%Abdulaziz Ateef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0027' AND name ILIKE '%Abdulaziz Ateef%'))
  );

-- Rami Banna | EMP-0111 | CTR-0044
UPDATE employees_master
SET "contractId" = 'CTR-0044', name = 'Rami Banna', position = 'Project Manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-08-25', "endDate" = '2025-09-09', "requesterName" = 'Tahani', "poNumbers" = 'PO-31043'
WHERE "employeeId" = 'EMP-0111'
  AND (
    "contractId" = 'CTR-0044'
    OR (name ILIKE '%Rami Banna%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0044' AND name ILIKE '%Rami Banna%'))
  );

-- Rami Banna | EMP-0112 | CTR-0045
UPDATE employees_master
SET "contractId" = 'CTR-0045', name = 'Rami Banna', position = 'Project Manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-06-25', "endDate" = '2025-08-24', "requesterName" = 'Tahani', "poNumbers" = 'PO-29725'
WHERE "employeeId" = 'EMP-0112'
  AND (
    "contractId" = 'CTR-0045'
    OR (name ILIKE '%Rami Banna%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0045' AND name ILIKE '%Rami Banna%'))
  );

-- Abdulhadi Alrashidi | EMP-0080 | CTR-0024
UPDATE employees_master
SET "contractId" = 'CTR-0024', name = 'Abdulhadi Alrashidi', position = 'Safety Inspector', project = 'Ala Khotah', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-09-15', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29841'
WHERE "employeeId" = 'EMP-0080'
  AND (
    "contractId" = 'CTR-0024'
    OR (name ILIKE '%Abdulhadi Alrashidi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0024' AND name ILIKE '%Abdulhadi Alrashidi%'))
  );

-- Mohammed Al Qahani | EMP-0084 | CTR-0022
UPDATE employees_master
SET "contractId" = 'CTR-0022', name = 'Mohammed Al Qahani', position = 'leasing assistant manager', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0084'
  AND (
    "contractId" = 'CTR-0022'
    OR (name ILIKE '%Mohammed Al Qahani%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0022' AND name ILIKE '%Mohammed Al Qahani%'))
  );

-- Faisal Alotaibi | EMP-0083 | CTR-0021
UPDATE employees_master
SET "contractId" = 'CTR-0021', name = 'Faisal Alotaibi', email = 'fff20117@hotmail.com', phone = '+966 55 529 9045', position = 'Zone Manager', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-31665'
WHERE "employeeId" = 'EMP-0083'
  AND (
    "contractId" = 'CTR-0021'
    OR (name ILIKE '%Faisal Alotaibi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0021' AND name ILIKE '%Faisal Alotaibi%'))
  );

-- Emad Almutairi | EMP-0089 | CTR-0014
UPDATE employees_master
SET "contractId" = 'CTR-0014', name = 'Emad Almutairi', email = 'hdd604@hotmail.com', phone = '966550975090', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-28893'
WHERE "employeeId" = 'EMP-0089'
  AND (
    "contractId" = 'CTR-0014'
    OR (name ILIKE '%Emad Almutairi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0014' AND name ILIKE '%Emad Almutairi%'))
  );

-- Ali Baqalb | EMP-0082 | CTR-0020
UPDATE employees_master
SET "contractId" = 'CTR-0020', name = 'Ali Baqalb', position = 'construction engineer', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-13', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-30940'
WHERE "employeeId" = 'EMP-0082'
  AND (
    "contractId" = 'CTR-0020'
    OR (name ILIKE '%Ali Baqalb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0020' AND name ILIKE '%Ali Baqalb%'))
  );

-- Njoud Aljuaid | EMP-0078 | CTR-0009
UPDATE employees_master
SET "contractId" = 'CTR-0009', name = 'Njoud Aljuaid', position = 'Site Operation Specialist', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-28568'
WHERE "employeeId" = 'EMP-0078'
  AND (
    "contractId" = 'CTR-0009'
    OR (name ILIKE '%Njoud Aljuaid%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0009' AND name ILIKE '%Njoud Aljuaid%'))
  );

-- Abdulhadi Alrashidi | EMP-0004 | CTR-0041
UPDATE employees_master
SET "contractId" = 'CTR-0041', name = 'Abdulhadi Alrashidi', email = 'aboodeattaq@gmail.com', phone = '+966 53 603 4104', position = 'Safety Inspector', project = 'Ala Khotah', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-31665'
WHERE "employeeId" = 'EMP-0004'
  AND (
    "contractId" = 'CTR-0041'
    OR (name ILIKE '%Abdulhadi Alrashidi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0041' AND name ILIKE '%Abdulhadi Alrashidi%'))
  );

-- Saleh Baqalb | EMP-0106 | CTR-0037
UPDATE employees_master
SET "contractId" = 'CTR-0037', name = 'Saleh Baqalb', position = 'site manager', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-13', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-30940'
WHERE "employeeId" = 'EMP-0106'
  AND (
    "contractId" = 'CTR-0037'
    OR (name ILIKE '%Saleh Baqalb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0037' AND name ILIKE '%Saleh Baqalb%'))
  );

-- Abdulaziz Ateef | EMP-0074 | CTR-0056
UPDATE employees_master
SET "contractId" = 'CTR-0056', name = 'Abdulaziz Ateef', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29875'
WHERE "employeeId" = 'EMP-0074'
  AND (
    "contractId" = 'CTR-0056'
    OR (name ILIKE '%Abdulaziz Ateef%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0056' AND name ILIKE '%Abdulaziz Ateef%'))
  );

-- Ammar Hussain | EMP-0113 | CTR-0046
UPDATE employees_master
SET "contractId" = 'CTR-0046', name = 'Ammar Hussain', position = 'Retail Assistant Manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-06-01', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-28568'
WHERE "employeeId" = 'EMP-0113'
  AND (
    "contractId" = 'CTR-0046'
    OR (name ILIKE '%Ammar Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0046' AND name ILIKE '%Ammar Hussain%'))
  );

-- Ahmed Sulaiman | EMP-0114 | CTR-0047
UPDATE employees_master
SET "contractId" = 'CTR-0047', name = 'Ahmed Sulaiman', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-28893'
WHERE "employeeId" = 'EMP-0114'
  AND (
    "contractId" = 'CTR-0047'
    OR (name ILIKE '%Ahmed Sulaiman%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0047' AND name ILIKE '%Ahmed Sulaiman%'))
  );

-- Salem Bawazeer | EMP-0117 | CTR-0051
UPDATE employees_master
SET "contractId" = 'CTR-0051', name = 'Salem Bawazeer', position = 'Construction Engineer', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-13', "endDate" = '2025-10-12', "requesterName" = 'Tahani', "poNumbers" = 'PO-28823'
WHERE "employeeId" = 'EMP-0117'
  AND (
    "contractId" = 'CTR-0051'
    OR (name ILIKE '%Salem Bawazeer%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0051' AND name ILIKE '%Salem Bawazeer%'))
  );

-- Salma Al. Ibrahim | EMP-0108 | CTR-0039
UPDATE employees_master
SET "contractId" = 'CTR-0039', name = 'Salma Al. Ibrahim', position = 'leasing assistant manager', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0108'
  AND (
    "contractId" = 'CTR-0039'
    OR (name ILIKE '%Salma Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0039' AND name ILIKE '%Salma Al. Ibrahim%'))
  );

-- Abdulaziz Saleh | EMP-0118 | CTR-0052
UPDATE employees_master
SET "contractId" = 'CTR-0052', name = 'Abdulaziz Saleh', position = 'Site Manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-13', "endDate" = '2025-10-12', "requesterName" = 'Tahani', "poNumbers" = 'PO-28823'
WHERE "employeeId" = 'EMP-0118'
  AND (
    "contractId" = 'CTR-0052'
    OR (name ILIKE '%Abdulaziz Saleh%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0052' AND name ILIKE '%Abdulaziz Saleh%'))
  );

-- Osama Khalaf | EMP-0075 | CTR-0057
UPDATE employees_master
SET "contractId" = 'CTR-0057', name = 'Osama Khalaf', position = 'Construction Civil Engineer', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-20', "endDate" = '2025-10-19', "requesterName" = 'Tahani', "poNumbers" = 'PO-28946'
WHERE "employeeId" = 'EMP-0075'
  AND (
    "contractId" = 'CTR-0057'
    OR (name ILIKE '%Osama Khalaf%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0057' AND name ILIKE '%Osama Khalaf%'))
  );

-- Faisal Alotaibi | EMP-0076 | CTR-0058
UPDATE employees_master
SET "contractId" = 'CTR-0058', name = 'Faisal Alotaibi', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-01', "endDate" = '2025-09-30', "requesterName" = 'Tahani', "poNumbers" = 'PO-28893'
WHERE "employeeId" = 'EMP-0076'
  AND (
    "contractId" = 'CTR-0058'
    OR (name ILIKE '%Faisal Alotaibi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0058' AND name ILIKE '%Faisal Alotaibi%'))
  );

-- Salma Al. Ibrahim | EMP-0101 | CTR-0031
UPDATE employees_master
SET "contractId" = 'CTR-0031', name = 'Salma Al. Ibrahim', position = 'Retail Assistant Manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-06-01', "endDate" = '2025-08-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-28568'
WHERE "employeeId" = 'EMP-0101'
  AND (
    "contractId" = 'CTR-0031'
    OR (name ILIKE '%Salma Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0031' AND name ILIKE '%Salma Al. Ibrahim%'))
  );

-- Salem Bawazeer | EMP-0107 | CTR-0038
UPDATE employees_master
SET "contractId" = 'CTR-0038', name = 'Salem Bawazeer', position = 'construction engineer', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-10-13', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-30940'
WHERE "employeeId" = 'EMP-0107'
  AND (
    "contractId" = 'CTR-0038'
    OR (name ILIKE '%Salem Bawazeer%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0038' AND name ILIKE '%Salem Bawazeer%'))
  );

-- Faisal Alotaibi | EMP-0103 | CTR-0033
UPDATE employees_master
SET "contractId" = 'CTR-0033', name = 'Faisal Alotaibi', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29875'
WHERE "employeeId" = 'EMP-0103'
  AND (
    "contractId" = 'CTR-0033'
    OR (name ILIKE '%Faisal Alotaibi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0033' AND name ILIKE '%Faisal Alotaibi%'))
  );

-- Abdulhadi Alrashidi | EMP-0105 | CTR-0036
UPDATE employees_master
SET "contractId" = 'CTR-0036', name = 'Abdulhadi Alrashidi', position = 'Safety Inspector', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-06-15', "endDate" = '2025-09-14', "requesterName" = 'Tahani', "poNumbers" = 'PO-28358'
WHERE "employeeId" = 'EMP-0105'
  AND (
    "contractId" = 'CTR-0036'
    OR (name ILIKE '%Abdulhadi Alrashidi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0036' AND name ILIKE '%Abdulhadi Alrashidi%'))
  );

-- Saleh Baqalb | EMP-0119 | CTR-0053
UPDATE employees_master
SET "contractId" = 'CTR-0053', name = 'Saleh Baqalb', position = 'Site Manager', project = 'Masar alhijra', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-07-13', "endDate" = '2025-10-12', "requesterName" = 'Tahani', "poNumbers" = 'PO-28823'
WHERE "employeeId" = 'EMP-0119'
  AND (
    "contractId" = 'CTR-0053'
    OR (name ILIKE '%Saleh Baqalb%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0053' AND name ILIKE '%Saleh Baqalb%'))
  );

-- Nawaf Al. Ibrahim | EMP-0095 | CTR-0023
UPDATE employees_master
SET "contractId" = 'CTR-0023', name = 'Nawaf Al. Ibrahim', position = 'leasing assistant manager', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0095'
  AND (
    "contractId" = 'CTR-0023'
    OR (name ILIKE '%Nawaf Al. Ibrahim%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0023' AND name ILIKE '%Nawaf Al. Ibrahim%'))
  );

-- Mohammed Zain | EMP-0077 | CTR-0040
UPDATE employees_master
SET "contractId" = 'CTR-0040', name = 'Mohammed Zain', email = 'zan_zan87@hotmail.com', phone = '966599363351', "idNumber" = '2328129313', position = 'Zone Manager', project = 'Blvd World', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-11-01', "endDate" = '2026-05-31', bank = 'Alinma', iban = 'SA7105000068206922560000', "requesterName" = 'Tahani', "poNumbers" = 'PO-32100'
WHERE "employeeId" = 'EMP-0077'
  AND (
    "contractId" = 'CTR-0040'
    OR (name ILIKE '%Mohammed Zain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0040' AND name ILIKE '%Mohammed Zain%'))
  );

-- Ahmed Alghamdi | EMP-0100 | CTR-0030
UPDATE employees_master
SET "contractId" = 'CTR-0030', name = 'Ahmed Alghamdi', position = 'Zone Manager', project = 'Blvd World', status = 'expired', "workflowStatus" = 'Pending', "startDate" = '2025-10-01', "endDate" = '2025-10-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-29875'
WHERE "employeeId" = 'EMP-0100'
  AND (
    "contractId" = 'CTR-0030'
    OR (name ILIKE '%Ahmed Alghamdi%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0030' AND name ILIKE '%Ahmed Alghamdi%'))
  );

-- Ammar Hussain | EMP-0097 | CTR-0026
UPDATE employees_master
SET "contractId" = 'CTR-0026', name = 'Ammar Hussain', position = 'leasing assistant manager', project = 'Masar alhijra', status = 'active', "workflowStatus" = 'Pending', "startDate" = '2025-11-01', "endDate" = '2025-12-31', "requesterName" = 'Tahani', "poNumbers" = 'PO-32287'
WHERE "employeeId" = 'EMP-0097'
  AND (
    "contractId" = 'CTR-0026'
    OR (name ILIKE '%Ammar Hussain%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0026' AND name ILIKE '%Ammar Hussain%'))
  );

-- Atif Javed | EMP-0003 | CTR-0008
UPDATE employees_master
SET "contractId" = 'CTR-0008', name = 'Atif Javed', email = 'atifjav@hotmail.com', phone = '+92 306 1717869', "idNumber" = '33303-9966269-5', position = 'Site manager', project = 'alderiyah project', status = 'new', "workflowStatus" = 'Docs Received', "startDate" = '2025-12-01', "endDate" = '2025-12-31', bank = 'UBL', iban = 'PK13UNIL0109000335707564', "requesterName" = 'Tahani', "poNumbers" = 'PO-33025'
WHERE "employeeId" = 'EMP-0003'
  AND (
    "contractId" = 'CTR-0008'
    OR (name ILIKE '%Atif Javed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0008' AND name ILIKE '%Atif Javed%'))
  );

-- Raghad Almubark | EMP-0002 | CTR-0007
UPDATE employees_master
SET "contractId" = 'CTR-0007', name = 'Raghad Almubark', email = 'Raghad.muba@gmail.com', phone = '+966 567564644', "idNumber" = '1101404240', position = 'Experience Data Analyst', project = 'WWL', status = 'active', "workflowStatus" = 'Agreement Signed', "startDate" = '2025-12-09', "endDate" = '2026-02-16', bank = 'Inmaa', iban = 'SA7705000068201456975000', "requesterName" = 'Banan Alolayan', "poNumbers" = 'PO-33077'
WHERE "employeeId" = 'EMP-0002'
  AND (
    "contractId" = 'CTR-0007'
    OR (name ILIKE '%Raghad Almubark%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0007' AND name ILIKE '%Raghad Almubark%'))
  );

-- Alaa farouk Mohamed | EMP-0001 | CTR-0001
UPDATE employees_master
SET "contractId" = 'CTR-0001', name = 'Alaa farouk Mohamed', email = 'alaa@growthery.net', phone = '+971509449355', "idNumber" = '12345678', position = 'software engineer', project = 'test 1', status = 'new', "workflowStatus" = 'Agreement Signed', "startDate" = '2026-01-19', "endDate" = '2026-01-31', "requesterName" = 'AT', "poNumbers" = '12233'
WHERE "employeeId" = 'EMP-0001'
  AND (
    "contractId" = 'CTR-0001'
    OR (name ILIKE '%Alaa farouk Mohamed%' AND "contractId" NOT IN (SELECT DISTINCT "contractId" FROM employees_master WHERE "contractId" != 'CTR-0001' AND name ILIKE '%Alaa farouk Mohamed%'))
  );
