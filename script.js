document.addEventListener('DOMContentLoaded', () => {

    const translations = {
        en: {
            pageTitle: "Course Schedule Builder",
            headerTitle: "Course Schedule Builder",
            settingsTitle: "Settings",
            maxCreditsLabel: "Max Credit Limit",
            updateBtn: "Update",
            formTitle: "Add / Edit Course",
            courseCodeLabel: "Course Code*",
            courseTitleLabel: "Course Title*",
            courseTeacherLabel: "Teacher Name*",
            courseUnitsLabel: "Units*",
            addSlotBtn: "Add Day/Time Slot",
            saveCourseBtn: "Save Course",
            clearFormBtn: "Clear Form",
            importBtn: "Import",
            exportAllBtn: "Export All (JSON)",
            exportSelectedBtn: "Export Selected (JSON)",
            creditTallyText: "Selected Credits: {0} / {1}",
            weekdayHeader: "Day",
            noCourses: "No courses scheduled.",
            saturday: "Saturday",
            sunday: "Sunday",
            monday: "Monday",
            tuesday: "Tuesday",
            wednesday: "Wednesday",
            thursday: "Thursday",
            friday: "Friday",
        },
        fa: {
            pageTitle: "برنامه‌ریز درسی",
            headerTitle: "برنامه‌ریز درسی",
            settingsTitle: "تنظیمات",
            maxCreditsLabel: "حداکثر تعداد واحد",
            updateBtn: "به‌روزرسانی",
            formTitle: "افزودن / ویرایش درس",
            courseCodeLabel: "کد درس*",
            courseTitleLabel: "نام درس*",
            courseTeacherLabel: "نام استاد*",
            courseUnitsLabel: "تعداد واحد*",
            addSlotBtn: "افزودن زمان‌بندی",
            saveCourseBtn: "ذخیره درس",
            clearFormBtn: "پاک کردن فرم",
            importBtn: "وارد کردن",
            exportAllBtn: "استخراج همه (JSON)",
            exportSelectedBtn: "استخراج انتخاب شده (JSON)",
            creditTallyText: "واحدهای اخذ شده: {0} / {1}",
            weekdayHeader: "روز",
            noCourses: "درسی برنامه‌ریزی نشده است.",
            saturday: "شنبه",
            sunday: "یکشنبه",
            monday: "دوشنبه",
            tuesday: "سه‌شنبه",
            wednesday: "چهارشنبه",
            thursday: "پنج‌شنبه",
            friday: "جمعه",
        }
    };

    let courses = [];
    let selectedCourseCodes = new Set();
    let currentLang = 'en';
    let settings = {
        slotSize: 15,
        maxCredits: 20,
    };

    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const maxCreditsInput = document.getElementById('maxCredits');
    const updateMaxCreditsBtn = document.getElementById('updateMaxCreditsBtn');
    const courseForm = document.getElementById('courseForm');
    const courseCodeInput = document.getElementById('courseCode');
    const courseTitleInput = document.getElementById('courseTitle');
    const courseTeacherInput = document.getElementById('courseTeacher');
    const courseUnitsInput = document.getElementById('courseUnits');
    const dayTimeContainer = document.getElementById('dayTimeContainer');
    const addDayTimeBtn = document.getElementById('addDayTimeBtn');
    const creditTally = document.getElementById('creditTally');
    const scheduleHead = document.getElementById('schedule-head');
    const scheduleBody = document.getElementById('schedule-body');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const exportSelectedBtn = document.getElementById('exportSelectedBtn');
    const importFile = document.getElementById('importFile');
    const clearFormBtn = document.getElementById('clearFormBtn');

    const applyTranslations = () => {
        const langPack = translations[currentLang];
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.getAttribute('data-translate-key');
            if (langPack[key]) {
                el.innerHTML = langPack[key];
            }
        });
        document.documentElement.lang = currentLang;
        langToggleBtn.textContent = currentLang === 'en' ? 'فارسی' : 'English';
        renderSchedule();
    };

    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'fa' : 'en';
        localStorage.setItem('schedulerLang', currentLang);
        applyTranslations();
    });

    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const saveSettings = () => {
        localStorage.setItem('schedulerSettings', JSON.stringify({ maxCredits: settings.maxCredits }));
    };

    const loadSettings = () => {
        const saved = localStorage.getItem('schedulerSettings');
        if (saved) {
            const loadedSettings = JSON.parse(saved);
            settings.maxCredits = loadedSettings.maxCredits || 18;
            maxCreditsInput.value = settings.maxCredits;
        }
        const savedLang = localStorage.getItem('schedulerLang');
        if (savedLang) {
            currentLang = savedLang;
        }
    };

    const createDayTimeEntry = (entry = {}) => {
        const WEEKDAYS_EN = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const dayOptions = WEEKDAYS_EN.map(day => {
            const translatedDay = translations[currentLang][day.toLowerCase()];
            return `<option value="${day}" ${day === entry.day ? 'selected' : ''}>${translatedDay}</option>`;
        }).join('');
        
        const div = document.createElement('div');
        div.className = 'row g-3 align-items-center day-time-entry';
        div.innerHTML = `
            <div class="col-md-3">
                <select class="form-select day-select">${dayOptions}</select>
            </div>
            <div class="col-md-3">
                <input type="time" class="form-control start-time" value="${entry.startTime || '09:00'}">
            </div>
            <div class="col-md-3">
                <input type="time" class="form-control end-time" value="${entry.endTime || '10:00'}">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm remove-day-time"><i class="bi bi-trash"></i></button>
            </div>
        `;
        div.querySelector('.remove-day-time').addEventListener('click', () => div.remove());
        dayTimeContainer.appendChild(div);
    };
    
    addDayTimeBtn.addEventListener('click', () => createDayTimeEntry());

    const clearForm = () => {
        courseForm.reset();
        dayTimeContainer.innerHTML = '';
        courseCodeInput.disabled = false;
        document.getElementById('courseEditCode').value = '';
        createDayTimeEntry();
    }
    
    clearFormBtn.addEventListener('click', clearForm);

    const renderSchedule = () => {
        const langPack = translations[currentLang];
        const WEEKDAYS_EN = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

        if (courses.length === 0) {
            scheduleHead.innerHTML = `<tr><th class="weekday-label">${langPack.weekdayHeader}</th></tr>`;
            scheduleBody.innerHTML = WEEKDAYS_EN.map(day => `<tr><td class="weekday-label">${langPack[day.toLowerCase()]}</td><td>${langPack.noCourses}</td></tr>`).join('');
            updateCreditTally();
            return;
        }
    
        let minTime = 1440, maxTime = 0;
        courses.forEach(c => c.times.forEach(t => {
            minTime = Math.min(minTime, timeToMinutes(t.startTime));
            maxTime = Math.max(maxTime, timeToMinutes(t.endTime));
        }));

        const startHour = Math.floor(minTime / 60);
        const endHour = Math.ceil(maxTime / 60);

        let headerHtml = `<tr><th class="weekday-label">${langPack.weekdayHeader}</th>`;
        const colspan = 60 / settings.slotSize;
        for (let h = startHour; h < endHour; h++) {
            headerHtml += `<th colspan="${colspan}" class="text-center">${h.toString().padStart(2, '0')}:00</th>`;
        }
        headerHtml += '</tr>';
        scheduleHead.innerHTML = headerHtml;

        // --- START OF CORRECTION ---

        // 1. Get all time slots of currently selected courses
        const selectedTimes = courses
            .filter(c => selectedCourseCodes.has(c.code))
            .flatMap(c => c.times);

        // 2. Determine which unselected courses have a conflict
        const disabledCourseCodes = new Set();
        courses
            .filter(c => !selectedCourseCodes.has(c.code)) // only check unselected courses
            .forEach(courseToCheck => {
                const hasConflict = courseToCheck.times.some(timeToCheck =>
                    selectedTimes.some(selectedTime => {
                        // Check for overlap only if they are on the same day
                        if (timeToCheck.day !== selectedTime.day) {
                            return false;
                        }
                        const start1 = timeToMinutes(timeToCheck.startTime);
                        const end1 = timeToMinutes(timeToCheck.endTime);
                        const start2 = timeToMinutes(selectedTime.startTime);
                        const end2 = timeToMinutes(selectedTime.endTime);
                        // True if they overlap
                        return Math.max(start1, start2) < Math.min(end1, end2);
                    })
                );
                if (hasConflict) {
                    disabledCourseCodes.add(courseToCheck.code);
                }
            });

        // --- END OF CORRECTION ---

        let bodyHtml = '';
        const totalSlots = (endHour - startHour) * (60 / settings.slotSize);

        WEEKDAYS_EN.forEach(day => {
            const dayMeetings = courses.flatMap(course => 
                course.times.filter(time => time.day === day).map(time => ({ ...course, ...time }))
            );

            if (dayMeetings.length === 0) {
                bodyHtml += `<tr><td class="weekday-label">${langPack[day.toLowerCase()]}</td><td colspan="${totalSlots}"></td></tr>`;
                return;
            }
            
            const subRows = [[]];
            dayMeetings.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
            dayMeetings.forEach(meeting => {
                let placed = false;
                for (let i = 0; i < subRows.length; i++) {
                    const hasOverlap = subRows[i].some(existing => 
                        Math.max(timeToMinutes(meeting.startTime), timeToMinutes(existing.startTime)) < Math.min(timeToMinutes(meeting.endTime), timeToMinutes(existing.endTime))
                    );
                    if (!hasOverlap) {
                        subRows[i].push(meeting);
                        placed = true;
                        break;
                    }
                }
                if (!placed) subRows.push([meeting]);
            });
            
            for (let i = 0; i < subRows.length; i++) {
                bodyHtml += '<tr>';
                if (i === 0) {
                    bodyHtml += `<td class="weekday-label" rowspan="${subRows.length}">${langPack[day.toLowerCase()]}</td>`;
                }
                
                const slotsInRow = new Array(totalSlots).fill(null);
                subRows[i].forEach(meeting => {
                    const startSlot = (timeToMinutes(meeting.startTime) - startHour * 60) / settings.slotSize;
                    const durationSlots = (timeToMinutes(meeting.endTime) - timeToMinutes(meeting.startTime)) / settings.slotSize;
                    
                    if (startSlot >= 0 && startSlot < totalSlots) {
                        slotsInRow[startSlot] = { meeting, colspan: durationSlots };
                        for (let j = 1; j < durationSlots; j++) {
                            if (startSlot + j < totalSlots) slotsInRow[startSlot + j] = 'occupied';
                        }
                    }
                });

                slotsInRow.forEach(slot => {
                    if (slot === 'occupied') return;
                    if (slot === null) {
                        bodyHtml += '<td></td>';
                    } else {
                        const { meeting, colspan } = slot;
                        const isSelected = selectedCourseCodes.has(meeting.code);
                        
                        // --- USE THE CORRECTED LOGIC HERE ---
                        const isDisabled = !isSelected && disabledCourseCodes.has(meeting.code);

                        const classes = `course-block ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`;
                        const tooltip = `${langPack.courseTeacherLabel.replace('*', '')}: ${meeting.teacher}\nTime: ${meeting.startTime} - ${meeting.endTime}`;
                        
                        bodyHtml += `<td colspan="${colspan}" style="position: relative;">
                            <div class="${classes}" data-code="${meeting.code}" title="${tooltip}">
                                <strong>${meeting.title}</strong><br>
                                ${meeting.code} (${meeting.units} ${langPack.courseUnitsLabel.replace('*', '').trim()})
                                <div class="block-actions">
                                    <i class="bi bi-pencil-fill edit-course" title="Edit"></i>
                                    <i class="bi bi-trash-fill delete-course" title="Delete"></i>
                                </div>
                            </div>
                        </td>`;
                    }
                });
                bodyHtml += '</tr>';
            }
        });
        scheduleBody.innerHTML = bodyHtml;
        updateCreditTally();
    };

    const updateCreditTally = () => {
        const currentCredits = [...selectedCourseCodes].reduce((sum, code) => {
            const course = courses.find(c => c.code === code);
            return sum + (course ? course.units : 0);
        }, 0);
        creditTally.textContent = translations[currentLang].creditTallyText.replace('{0}', currentCredits).replace('{1}', settings.maxCredits);
        creditTally.classList.toggle('text-danger', currentCredits > settings.maxCredits);
    };

    courseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const code = courseCodeInput.value.trim().toUpperCase();
        const title = courseTitleInput.value.trim();
        const teacher = courseTeacherInput.value.trim();
        const units = parseFloat(courseUnitsInput.value);
        const editCode = document.getElementById('courseEditCode').value;

        if (!code || !title || !teacher || isNaN(units)) {
            alert('Please fill all required fields.');
            return;
        }
        if (courses.some(c => c.code === code) && code !== editCode) {
            alert('Course code must be unique.');
            return;
        }

        const timeEntries = Array.from(dayTimeContainer.querySelectorAll('.day-time-entry')).map(row => ({
            day: row.querySelector('.day-select').value,
            startTime: row.querySelector('.start-time').value,
            endTime: row.querySelector('.end-time').value,
        }));
        
        for (const entry of timeEntries) {
            if (timeToMinutes(entry.startTime) >= timeToMinutes(entry.endTime)) {
                alert(`Error for ${entry.day}: Start time must be before end time.`);
                return;
            }
        }

        const courseData = { code, title, teacher, units, times: timeEntries };

        if (editCode) {
            const index = courses.findIndex(c => c.code === editCode);
            courses[index] = courseData;
        } else {
            courses.push(courseData);
        }

        clearForm();
        renderSchedule();
    });
    
    scheduleBody.addEventListener('click', (e) => {
        const block = e.target.closest('.course-block');
        if (!block) return;
        const code = block.dataset.code;

        if (e.target.classList.contains('delete-course')) {
            if (confirm(`Are you sure you want to delete course ${code}?`)) {
                courses = courses.filter(c => c.code !== code);
                selectedCourseCodes.delete(code);
                renderSchedule();
            }
            return;
        }

        if (e.target.classList.contains('edit-course')) {
            const course = courses.find(c => c.code === code);
            courseCodeInput.value = course.code;
            courseTitleInput.value = course.title;
            courseTeacherInput.value = course.teacher;
            courseUnitsInput.value = course.units;
            dayTimeContainer.innerHTML = '';
            course.times.forEach(t => createDayTimeEntry(t));
            document.getElementById('courseEditCode').value = course.code;
            courseCodeInput.disabled = true;
            window.scrollTo(0, 0);
            return;
        }

        if (block.classList.contains('disabled')) return;

        const course = courses.find(c => c.code === code);
        const currentCredits = [...selectedCourseCodes].reduce((sum, c) => sum + courses.find(x => x.code === c).units, 0);

        if (selectedCourseCodes.has(code)) {
            selectedCourseCodes.delete(code);
        } else {
            if (currentCredits + course.units > settings.maxCredits) {
                alert(`Adding this course exceeds the max credit limit of ${settings.maxCredits}.`);
                return;
            }
            selectedCourseCodes.add(code);
        }
        renderSchedule();
    });

    updateMaxCreditsBtn.addEventListener('click', () => {
        const newMax = parseInt(maxCreditsInput.value);
        if (newMax && newMax > 0) {
            settings.maxCredits = newMax;
            saveSettings();
            updateCreditTally();
            const originalText = updateMaxCreditsBtn.innerHTML;
            updateMaxCreditsBtn.innerHTML = 'Updated!';
            updateMaxCreditsBtn.classList.add('btn-success');
            setTimeout(() => {
                updateMaxCreditsBtn.innerHTML = originalText;
                updateMaxCreditsBtn.classList.remove('btn-success');
            }, 1500);
        } else {
            alert('Please enter a valid positive number for max credits.');
        }
    });

    const downloadJSON = (data, filename) => {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    exportAllBtn.addEventListener('click', () => downloadJSON(courses, 'all_courses.json'));
    exportSelectedBtn.addEventListener('click', () => downloadJSON(courses.filter(c => selectedCourseCodes.has(c.code)), 'selected_courses.json'));
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const imported = JSON.parse(event.target.result);
            imported.forEach(imp => { if (!courses.some(ex => ex.code === imp.code)) courses.push(imp); });
            renderSchedule();
        };
        reader.readAsText(file); e.target.value = '';
    });

    loadSettings();
    clearForm();
    applyTranslations();
});

