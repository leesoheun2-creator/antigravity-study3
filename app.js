/**
 * 고려대학교 GPA 피드백 매니저 - app.js
 * 문과대학 사회학과 학점 분석 및 피드백 로직
 */

// 1. 도메인 데이터 정의
const GENERAL_REQUIRED = [
    { key: "academic-english", name: "Academic English", credits: 2, keywords: ["academicenglish", "어카데믹잉글리시", "어카데믹잉글리쉬", "영어", "english"] },
    { key: "탐구", name: "학문세계의탐구", credits: 3, keywords: ["학문세계의탐구", "학문세계의 탐구", "학탐"] },
    { key: "글쓰기", name: "글쓰기", credits: 3, keywords: ["글쓰기"] },
    { key: "생명과학", name: "생명과학의세계", credits: 3, keywords: ["생명과학의세계", "생명과학의 세계"] },
    { key: "sw프로그래밍", name: "SW프로그래밍의기초", credits: 3, keywords: ["sw프로그래밍의기초", "sw프로그래밍의 기초", "sw프로그래밍기초", "소프트웨어프로그래밍"] },
    { key: "데이터과학", name: "데이터과학과인공지능", credits: 3, keywords: ["데이터과학과인공지능", "데이터 과학과 인공지능", "데과인"] },
    { key: "세미나1", name: "1학년세미나1", credits: 1, keywords: ["1학년세미나1", "1학년 세미나 1", "일세1"] },
    { key: "세미나2", name: "1학년세미나2", credits: 1, keywords: ["1학년세미나2", "1학년 세미나 2", "일세2"] }
];

const MAJOR_REQUIRED = [
    { key: "상상력", name: "사회학적상상력", credits: 3, keywords: ["사회학적상상력", "사회학적 상상력", "상상력"] },
    { key: "발달사", name: "사회학발달사", credits: 3, keywords: ["사회학발달사", "사회학 발달사", "발달사"] },
    { key: "조사방법", name: "사회조사방법", credits: 3, keywords: ["사회조사방법", "사회 조사 방법", "사조방"] },
    { key: "사회통계", name: "사회통계", credits: 3, keywords: ["사회통계", "사회 통계", "사통"] }
];

const HONEY_COURSES = [
    { name: "범죄와사회", credits: 3, type: "교양선택", note: "범죄에 대한 흥미로운 사회학적 분석" },
    { name: "한국의젊은시인들", credits: 3, type: "교양선택", note: "온라인 대형강의 (MOOC) - 시 감상 중심" },
    { name: "감정과삶", credits: 3, type: "교양선택", note: "온라인 대형강의 (MOOC) - 현대인의 감정 분석" },
    { name: "자정진의여정", credits: 3, type: "교양선택", note: "온라인 대형강의 (MOOC) - 자아 성찰 기회" },
    { name: "한국의전통과문화유산", credits: 3, type: "교양선택", note: "답사 중심 및 교양 상식 획득" },
    { name: "클래식음악의이해와감상", credits: 3, type: "교양선택", note: "서양 음악사 중심의 귀가 즐거운 강의" },
    { name: "직업세계와직업탐색", credits: 2, type: "교양선택", note: "진로 고민에 적합한 2학점 패스 과목" },
    { name: "사회봉사의이론과실제", credits: 2, type: "교양선택", note: "봉사활동 연계형 꿀교양" },
    { name: "한국근현대민족운동사", credits: 3, type: "교양선택", note: "역사 흐름 분석 및 높은 학점 취득률" },
    { name: "문학과여성", credits: 3, type: "교양선택", note: "여성 문학 작품 강독 및 분석" },
    { name: "생활속의지적재산권", credits: 3, type: "교양선택", note: "법학 교양이자 실생활 팁 전수" }
];

const GRADE_VALUES = {
    "A+": 4.5, "A": 4.0, "B+": 3.5, "B": 3.0,
    "C+": 2.5, "C": 2.0, "D+": 1.5, "D": 1.0,
    "E": 0.5, "F": 0.0
};

// 2. 상태 관리 객체 (State)
let state = {
    user: null, // { id, name, password, targetGpa }
    activeSemester: "1-1",
    grades: {} // { "1-1": [ { id, name, type, isPnp, grade, credits }, ... ], "1-2": [] }
};

// 3. Helper Functions
function normalizeString(str) {
    return str.replace(/\s+/g, '').toLowerCase();
}

function checkKeywordMatch(courseName, keywords) {
    const normName = normalizeString(courseName);
    return keywords.some(keyword => normName.includes(normalizeString(keyword)));
}

function isGradePass(grade, isPnp) {
    if (isPnp) {
        return grade === "P";
    }
    // E and F are fail. D, D+, C, C+, B, B+, A, A+ are pass
    return grade !== "F" && grade !== "E";
}

// 4. UI Rendering Functions
function initApp() {
    setupEventListeners();
    checkExistingSession();
}

function checkExistingSession() {
    const cachedUser = localStorage.getItem("gpa_manager_user");
    if (cachedUser) {
        state.user = JSON.parse(cachedUser);
        loadGradesFromStorage();
        showDashboard();
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    document.getElementById("auth-screen").classList.remove("d-none");
    document.getElementById("dashboard-screen").classList.add("d-none");
}

function showDashboard() {
    document.getElementById("auth-screen").classList.add("d-none");
    document.getElementById("dashboard-screen").classList.remove("d-none");
    
    // 프로필 업데이트
    document.getElementById("user-display-name").textContent = state.user.name;
    document.getElementById("user-display-id").textContent = `${state.user.id} 학번`;
    document.getElementById("target-gpa").value = state.user.targetGpa.toFixed(2);
    document.getElementById("grad-english-status").checked = !!state.user.englishStatus;
    document.getElementById("grad-hanja-status").checked = !!state.user.hanjaStatus;
    document.getElementById("gemini-api-key").value = state.user.apiKey || "";
    
    // 초기화 계산 및 렌더링
    updateSemesterDisplay();
}

function loadGradesFromStorage() {
    const cachedGrades = localStorage.getItem(`gpa_manager_grades_${state.user.id}`);
    if (cachedGrades) {
        state.grades = JSON.parse(cachedGrades);
    } else {
        state.grades = {
            "1-1": [], "1-2": [], "2-1": [], "2-2": [],
            "3-1": [], "3-2": [], "4-1": [], "4-2": []
        };
    }
}

function saveGradesToStorage() {
    if (state.user) {
        localStorage.setItem(`gpa_manager_grades_${state.user.id}`, JSON.stringify(state.grades));
    }
}

function updateSemesterDisplay() {
    const semNameMap = {
        "1-1": "1학년 1학기", "1-2": "1학년 2학기",
        "2-1": "2학년 1학기", "2-2": "2학년 2학기",
        "3-1": "3학년 1학기", "3-2": "3학년 2학기",
        "4-1": "4학년 1학기", "4-2": "4학년 2학기"
    };
    
    document.getElementById("selected-semester-title").textContent = semNameMap[state.activeSemester];
    renderCoursesTable();
    calculateAndAnalyze();
}

// Render course list table
function renderCoursesTable() {
    const listBody = document.getElementById("courses-list-body");
    listBody.innerHTML = "";
    
    const currentSemesterCourses = state.grades[state.activeSemester] || [];
    
    if (currentSemesterCourses.length === 0) {
        listBody.innerHTML = `
            <tr class="empty-row-placeholder">
                <td colspan="5" class="text-center">이 학기에 등록된 과목이 없습니다. 새로운 과목을 추가해 보세요!</td>
            </tr>
        `;
        return;
    }
    
    currentSemesterCourses.forEach(course => {
        const tr = document.createElement("tr");
        
        let gradeBadgeClass = "";
        let displayGrade = course.grade;
        if (course.isPnp) {
            gradeBadgeClass = course.grade === "P" ? "badge major-bg" : "badge general-bg";
            displayGrade = course.grade === "P" ? "Pass" : "Nonpass";
        } else {
            if (course.grade.startsWith("A")) gradeBadgeClass = "text-gold";
            else if (course.grade.startsWith("B")) gradeBadgeClass = "text-crimson";
        }
        
        tr.innerHTML = `
            <td><strong>${escapeHtml(course.name)}</strong></td>
            <td><span class="badge ${getCourseTypeBadgeClass(course.type)}">${course.type}</span></td>
            <td>${course.credits}학점</td>
            <td><span class="${gradeBadgeClass}" style="font-weight: 700;">${displayGrade}</span></td>
            <td class="text-center">
                <button class="btn-delete-course" data-id="${course.id}" title="과목 삭제">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        listBody.appendChild(tr);
    });
    
    // Delete event listeners
    const deleteButtons = listBody.querySelectorAll(".btn-delete-course");
    deleteButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const courseId = this.getAttribute("data-id");
            deleteCourse(courseId);
        });
    });
}

function getCourseTypeBadgeClass(type) {
    switch(type) {
        case "전공필수": return "major-bg";
        case "전공선택": return "major-bg";
        case "교양필수": return "general-bg";
        default: return "general-bg";
    }
}

// 5. Calculations and Analysis Engine
function calculateAndAnalyze() {
    const targetGpa = state.user.targetGpa;
    const currentCourses = state.grades[state.activeSemester] || [];
    
    // --- 5-1. GPA calculation for SELECTED semester ---
    let totalNormalCredits = 0;
    let weightedGradeSum = 0;
    
    currentCourses.forEach(c => {
        if (!c.isPnp) {
            const gradePoint = GRADE_VALUES[c.grade] !== undefined ? GRADE_VALUES[c.grade] : 0;
            weightedGradeSum += (gradePoint * c.credits);
            totalNormalCredits += c.credits;
        }
    });
    
    const currentGpa = totalNormalCredits > 0 ? (weightedGradeSum / totalNormalCredits) : 0.00;
    document.getElementById("current-gpa-value").textContent = currentGpa.toFixed(2);
    
    const gpaDiff = targetGpa - currentGpa;
    const comparisonDesc = document.getElementById("gpa-comparison-desc");
    if (currentCourses.length === 0) {
        comparisonDesc.textContent = `목표 GPA: ${targetGpa.toFixed(2)}`;
    } else if (gpaDiff > 0) {
        comparisonDesc.textContent = `목표까지 -${gpaDiff.toFixed(2)} 필요`;
        comparisonDesc.style.color = "var(--warning)";
    } else {
        comparisonDesc.textContent = `목표 GPA 달성! (+${Math.abs(gpaDiff).toFixed(2)})`;
        comparisonDesc.style.color = "var(--success)";
    }
    
    // --- 5-2. Graduation credits (across ALL semesters) ---
    let totalEarnedCredits = 0;
    let majorEarnedCredits = 0;
    let generalEarnedCredits = 0;
    
    // We check ALL semesters
    Object.keys(state.grades).forEach(sem => {
        const courses = state.grades[sem] || [];
        courses.forEach(c => {
            if (isGradePass(c.grade, c.isPnp)) {
                totalEarnedCredits += c.credits;
                if (c.type === "전공필수" || c.type === "전공선택") {
                    majorEarnedCredits += c.credits;
                } else if (c.type === "교양필수" || c.type === "교양선택") {
                    generalEarnedCredits += c.credits;
                }
            }
        });
    });
    
    // Display total credits / 130
    document.getElementById("total-credits-value").textContent = `${totalEarnedCredits} / 130 학점`;
    const progressPercent = Math.min(100, (totalEarnedCredits / 130) * 100);
    document.getElementById("graduation-progress-fill").style.width = `${progressPercent}%`;
    document.getElementById("graduation-progress-percent").textContent = `진행률 ${progressPercent.toFixed(1)}%`;
    
    // --- 5-3. Semester Prediction ---
    // Semester completed counting based on active select or populated semesters
    const semesterOrder = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];
    const currentSemIndex = semesterOrder.indexOf(state.activeSemester);
    const semestersPassed = currentSemIndex + 1; // e.g. end of 1-1 is 1 semester, end of 2-2 is 4 semesters
    
    const avgCreditsPerSem = semestersPassed > 0 ? (totalEarnedCredits / semestersPassed) : 0;
    const remainingCredits = Math.max(0, 130 - totalEarnedCredits);
    
    // --- 5-3. Semester Prediction & Graduation Roadmap ---
    const hasEnglish = !!state.user.englishStatus;
    const hasHanja = !!state.user.hanjaStatus;
    
    // 고려대학교 학점 제한 규칙 (한 학기 최대 18~20학점, 연 최대 38학점 -> 평균 19학점 수강 가능)
    // 이전 학기 평균이 19학점보다 크면 19학점으로 캡하고, 정보가 거의 없는 경우 표준 18.5학점으로 추정
    const effectiveAvg = avgCreditsPerSem > 5 ? Math.min(19, avgCreditsPerSem) : 18.5;
    
    let remSemesters = 0;
    if (remainingCredits > 0) {
        remSemesters = Math.ceil(remainingCredits / effectiveAvg);
    }
    
    const remainingSemVal = document.getElementById("remaining-semesters-value");
    const remainingSemDesc = document.getElementById("remaining-semesters-desc");
    const roadmapCard = document.getElementById("graduation-roadmap-feedback");
    const roadmapDetails = roadmapCard.querySelector(".feedback-details");
    
    let remYears = remSemesters / 2;
    
    // Status badges for feedback card
    const engStatusHtml = hasEnglish 
        ? `<span class="badge major-bg" style="color: var(--success); border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.05);"><i class="fa-solid fa-check"></i> 취득 완료</span>` 
        : `<span class="badge general-bg" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05);"><i class="fa-solid fa-xmark"></i> 미취득</span>`;
        
    const hanjaStatusHtml = hasHanja 
        ? `<span class="badge major-bg" style="color: var(--success); border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.05);"><i class="fa-solid fa-check"></i> 합격</span>` 
        : `<span class="badge general-bg" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05);"><i class="fa-solid fa-xmark"></i> 불합격</span>`;

    if (totalEarnedCredits === 0) {
        remainingSemVal.textContent = "약 4.0년";
        remainingSemDesc.textContent = "최대 수강 제한 19학점 기준";
        
        roadmapDetails.innerHTML = `
            성적 데이터를 등록하시면 분석이 활성화됩니다. 문과대학 졸업을 위해서는 **130학점**, **영어성적**, **한자 3급** 패스가 필수적입니다.
        `;
    } else if (remainingCredits === 0) {
        if (hasEnglish && hasHanja) {
            remainingSemVal.textContent = "0년 (졸업)";
            remainingSemDesc.textContent = "졸업 요건 100% 충족!";
            remainingSemVal.style.color = "var(--success)";
            
            roadmapDetails.innerHTML = `
                <strong class="text-gold" style="font-size: 1.05rem;"><i class="fa-solid fa-graduation-cap"></i> 졸업 축하드립니다! 🎓✨</strong><br>
                학점 요건(130학점)을 모두 완료하셨고, 필수 요건인 공인 영어성적 제출과 본교 한자능력검정시험 3급 취득이 완료되어 **즉시 졸업 가능** 상태입니다. 훌륭한 학교 생활 마무리를 응원합니다!
            `;
        } else {
            remainingSemVal.textContent = "약 0.5년 (유예)";
            remainingSemDesc.textContent = "영어/한자 취득을 위해 유예 필요";
            remainingSemVal.style.color = "var(--warning)";
            
            let missingStr = [];
            if (!hasEnglish) missingStr.push("영어성적");
            if (!hasHanja) missingStr.push("한자 3급");
            
            roadmapDetails.innerHTML = `
                <strong class="text-warning"><i class="fa-solid fa-circle-exclamation"></i> 학점 조건 충족, 기타 요건 미비 (졸업 유예 발생)</strong><br>
                졸업에 필요한 130학점은 모두 취득 완료하셨으나, 필수 요건인 **${missingStr.join(" 및 ")}**이 제출되지 않았습니다. 요건을 보완하여 심사를 받기까지 **최소 0.5년(1학기)**이 더 소요되어 졸업이 유예될 수 있으므로 조속한 준비를 권장합니다.<br>
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    영어: ${engStatusHtml} | 한자: ${hanjaStatusHtml}
                </div>
            `;
        }
    } else {
        remainingSemVal.textContent = `약 ${remYears.toFixed(1)}년`;
        remainingSemVal.style.color = "var(--text-main)";
        
        let warningText = "";
        if (!hasEnglish || !hasHanja) {
            let missingReqs = [];
            if (!hasEnglish) missingReqs.push("영어성적");
            if (!hasHanja) missingReqs.push("한자 3급");
            warningText = `<br><span class="text-crimson">⚠️ 주의:</span> 학점 취득 기간(앞으로 약 ${remSemesters}학기) 동안 미취득 상태인 **${missingReqs.join(" 및 ")}** 요건을 병행하여 취득하셔야 졸업 유예 없이 정기 졸업이 가능합니다.`;
        } else {
            warningText = `<br><span class="text-success">✨ 영어성적 및 한자 요건을 이미 충족하셨으므로, 학점 요건만 다 채우면 즉시 졸업하실 수 있습니다.</span>`;
        }
        
        remainingSemDesc.textContent = `남은 학기: 약 ${remSemesters}학기 (${hasEnglish && hasHanja ? "요건 완료" : "요건 미비"})`;
        
        roadmapDetails.innerHTML = `
            현재까지 **${totalEarnedCredits}학점**을 취득하여 졸업까지 **${remainingCredits}학점**이 남았습니다.<br>
            고려대학교 학기당 수강 제한 학점(한 학기 최대 18~20학점, 연속 수강 시 연 최대 38학점)을 반영하여 평균 ${effectiveAvg.toFixed(1)}학점씩 수강할 경우, 학점 요건 충족을 위해 **최소 ${remSemesters}학기 (약 ${remYears.toFixed(1)}년)**이 더 소요될 예정입니다.${warningText}
            <div style="margin-top: 12px; display: flex; gap: 10px; align-items: center;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">현재 인증 현황:</span>
                영어: ${engStatusHtml}
                한자: ${hanjaStatusHtml}
            </div>
        `;
    }
    
    // --- 5-4. Major / General Ratio Chart and Balance Feedback ---
    document.getElementById("major-credits-label").textContent = `전공 ${majorEarnedCredits}학점`;
    document.getElementById("general-credits-label").textContent = `교양 ${generalEarnedCredits}학점`;
    
    const totalRatioCredits = majorEarnedCredits + generalEarnedCredits;
    let majorPct = 50;
    let generalPct = 50;
    
    if (totalRatioCredits > 0) {
        majorPct = (majorEarnedCredits / totalRatioCredits) * 100;
        generalPct = (generalEarnedCredits / totalRatioCredits) * 100;
    }
    
    document.getElementById("major-ratio-fill").style.width = `${majorPct}%`;
    document.getElementById("general-ratio-fill").style.width = `${generalPct}%`;
    
    const ratioDesc = document.getElementById("major-general-ratio-desc");
    const balanceFeedbackCard = document.getElementById("balance-feedback");
    
    if (totalRatioCredits === 0) {
        ratioDesc.textContent = "이수 균형도 체크 중...";
        balanceFeedbackCard.querySelector(".feedback-details").innerHTML = "성적 데이터를 입력하시면 전공과 교양 이수 비율 균형을 분석해 드립니다.";
    } else if (totalRatioCredits < 20) {
        ratioDesc.textContent = "이수 학점이 적어 계속 추적 중";
        balanceFeedbackCard.querySelector(".feedback-details").innerHTML = `현재 이수 학점(${totalRatioCredits}학점)이 적어 균형도 분석이 보류되었습니다. 학기를 더 진행하면 피드백이 정밀해집니다.`;
    } else {
        if (majorPct > 70) {
            ratioDesc.textContent = "전공 편중 상태 ⚠️";
            balanceFeedbackCard.querySelector(".feedback-details").innerHTML = `<strong class="text-crimson">전공 이수 비율(${majorPct.toFixed(1)}%)이 상당히 높습니다!</strong> 문과대학 졸업을 위해서는 교양 요건(교필/교선) 채우기도 중요합니다. 다음 학기에는 교양 과목 수강 비중을 늘려 균형을 맞춰 보세요.`;
        } else if (generalPct > 75) {
            ratioDesc.textContent = "교양 편중 상태 ⚠️";
            balanceFeedbackCard.querySelector(".feedback-details").innerHTML = `<strong class="text-crimson">교양 이수 비율(${generalPct.toFixed(1)}%)이 지나치게 높습니다!</strong> 사회학과 전공 학점을 충분히 취득해야 졸업 요건을 충족할 수 있습니다. 다음 학기에는 전공 과목 수강을 대폭 늘리세요.`;
        } else {
            ratioDesc.textContent = "전공 / 교양 이수 균형 양호 ✨";
            balanceFeedbackCard.querySelector(".feedback-details").innerHTML = `전공(${majorPct.toFixed(1)}%)과 교양(${generalPct.toFixed(1)}%)이 아주 조화로운 비율로 이수되고 있습니다! 문과대학 사회학도다운 훌륭한 학업 설계입니다.`;
        }
    }
    
    // --- 5-5. General / Major Required Checklist Check ---
    // Extract all course names taken (that are passed)
    const passedCourses = [];
    Object.keys(state.grades).forEach(sem => {
        const courses = state.grades[sem] || [];
        courses.forEach(c => {
            if (isGradePass(c.grade, c.isPnp)) {
                passedCourses.push(c);
            }
        });
    });
    
    // A. General Required (교필) Checklist
    const genChecklistContainer = document.getElementById("general-checklist-container");
    genChecklistContainer.innerHTML = "";
    let completedGenCount = 0;
    const missingGenList = [];
    
    GENERAL_REQUIRED.forEach(req => {
        const isCompleted = passedCourses.some(c => checkKeywordMatch(c.name, req.keywords));
        if (isCompleted) completedGenCount++;
        else missingGenList.push(req.name);
        
        const item = document.createElement("div");
        item.className = `checklist-item ${isCompleted ? "checked" : "unchecked"}`;
        item.innerHTML = `
            <i class="fa-solid ${isCompleted ? "fa-circle-check" : "fa-circle-xmark"}"></i>
            <span>${req.name} (${req.credits})</span>
        `;
        genChecklistContainer.appendChild(item);
    });
    
    const genFeedbackText = document.getElementById("general-required-feedback").querySelector(".feedback-details");
    if (completedGenCount === GENERAL_REQUIRED.length) {
        genFeedbackText.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check"></i> 고려대학교 교양필수 8과목을 모두 완료하셨습니다!</span>`;
    } else {
        genFeedbackText.innerHTML = `교필 8과목 중 <strong>${completedGenCount}개</strong> 완료. <br><span class="text-crimson">더 이수해야 할 교양필수 과목:</span> <strong>${missingGenList.join(", ")}</strong>`;
    }
    
    // B. Major Required (전필) Checklist
    const majorChecklistContainer = document.getElementById("major-checklist-container");
    majorChecklistContainer.innerHTML = "";
    let completedMajorCount = 0;
    const missingMajorList = [];
    
    MAJOR_REQUIRED.forEach(req => {
        const isCompleted = passedCourses.some(c => checkKeywordMatch(c.name, req.keywords));
        if (isCompleted) completedMajorCount++;
        else missingMajorList.push(req.name);
        
        const item = document.createElement("div");
        item.className = `checklist-item ${isCompleted ? "checked" : "unchecked"}`;
        item.innerHTML = `
            <i class="fa-solid ${isCompleted ? "fa-circle-check" : "fa-circle-xmark"}"></i>
            <span>${req.name} (3)</span>
        `;
        majorChecklistContainer.appendChild(item);
    });
    
    const majorFeedbackText = document.getElementById("major-required-feedback").querySelector(".feedback-details");
    if (completedMajorCount === MAJOR_REQUIRED.length) {
        majorFeedbackText.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check"></i> 사회학과 전공필수 4과목을 모두 이수하셨습니다!</span>`;
    } else {
        majorFeedbackText.innerHTML = `전필 4과목 중 <strong>${completedMajorCount}개</strong> 완료. <br><span class="text-crimson">더 이수해야 할 전공필수 과목:</span> <strong>${missingMajorList.join(", ")}</strong>`;
    }
    
    // --- 5-6. Weak Subject Warning (영어, 심리학 취약 여부) ---
    // Scan all semesters for low grades in English or Psychology
    // Low grade = B0 or lower (GRADE_VALUE <= 3.0) or Nonpass
    const weakSubjects = [];
    
    Object.keys(state.grades).forEach(sem => {
        const courses = state.grades[sem] || [];
        courses.forEach(c => {
            const gradeVal = c.isPnp ? (c.grade === "P" ? 4.5 : 0) : (GRADE_VALUES[c.grade] || 0);
            const isLowGrade = c.isPnp ? (c.grade === "NP") : (gradeVal <= 3.0); // B0 (3.0) or below
            
            if (isLowGrade) {
                const isEnglish = checkKeywordMatch(c.name, ["영어", "english", "영작문", "회화"]);
                const isPsychology = checkKeywordMatch(c.name, ["심리", "psychology", "정신"]);
                
                if (isEnglish) {
                    weakSubjects.push({ name: c.name, sem: semNameShort(sem), grade: c.grade, type: "영어" });
                } else if (isPsychology) {
                    weakSubjects.push({ name: c.name, sem: semNameShort(sem), grade: c.grade, type: "심리학" });
                }
            }
        });
    });
    
    const weakFeedbackCard = document.getElementById("weak-subject-feedback");
    const weakFeedbackDetails = weakFeedbackCard.querySelector(".feedback-details");
    
    if (weakSubjects.length === 0) {
        weakFeedbackDetails.innerHTML = "영어/심리학 관련 과목에서 저조한 학점 기록이 없습니다. 수강 지도가 양호합니다.";
    } else {
        let warningHtml = `<span class="text-crimson"><i class="fa-solid fa-triangle-exclamation"></i> 주의 경고! 특정 과목군에서 부진한 결과가 감지되었습니다:</span><ul style="margin-top: 8px; padding-left: 16px;">`;
        weakSubjects.forEach(ws => {
            warningHtml += `<li><strong>${ws.name}</strong> (${ws.sem}, 성적: ${ws.isPnp ? "Nonpass" : ws.grade}) - [${ws.type}] 과목군</li>`;
        });
        warningHtml += `</ul><p style="margin-top: 8px;">해당 분야에서 약점을 보이고 있으므로, <strong>다음 학기 수강 신청 시에는 가급적 영어 강의나 심리학 계열 과목 선택을 피하는 것을 추천</strong>합니다.</p>`;
        weakFeedbackDetails.innerHTML = warningHtml;
    }
    
    // --- 5-7. Target GPA Gap and Honey Course (꿀교양) Recommendation ---
    const honeyCard = document.getElementById("honey-courses-recommendation");
    const honeyGpaTargetText = document.getElementById("gpa-target-feedback").querySelector(".feedback-details");
    
    if (currentCourses.length === 0) {
        honeyGpaTargetText.innerHTML = "선택 학기 과목 정보를 입력하시면 목표 GPA 대비 피드백을 제공해 드립니다.";
        honeyCard.classList.add("d-none");
    } else if (currentGpa >= targetGpa) {
        honeyGpaTargetText.innerHTML = `
            <strong class="text-gold" style="font-size: 1.05rem;">이번 학기 평점 ${currentGpa.toFixed(2)}점 달성! 🐯🎉</strong><br>
            학우님이 세우신 목표인 ${targetGpa.toFixed(2)}점을 충족하거나 넘어섰습니다! 뛰어난 학업 관리를 축하합니다.
        `;
        // Even if GPA is high, we can collapse the honey courses or hide it
        honeyCard.classList.add("d-none");
    } else {
        const diff = targetGpa - currentGpa;
        let diffDesc = "";
        let recommendationReason = "";
        
        if (diff >= 0.5) {
            diffDesc = `<strong class="text-crimson" style="font-size: 1.05rem;">목표 평점과 격차가 큽니다. (차이: ${diff.toFixed(2)}점)</strong>`;
            recommendationReason = `학우님의 학점이 목표 평점에 비해 많이 낮습니다. 평점 복구가 시급하므로 학점을 비교적 수월하게 취득할 수 있는 **아래의 고려대학교 꿀교양 과목**을 다음 학기 수강 계획에 적극 추가해 보세요!`;
        } else {
            diffDesc = `<strong class="text-warning">목표 평점에 가깝습니다! (차이: ${diff.toFixed(2)}점)</strong>`;
            recommendationReason = `조금만 더 학점을 보완하면 목표인 ${targetGpa.toFixed(2)}점에 도달할 수 있습니다! 성적을 올리기 수월한 **아래의 꿀교양 과목** 중 흥미로운 과목을 추가로 이수하는 것이 큰 도움이 됩니다.`;
        }
        
        honeyGpaTargetText.innerHTML = `${diffDesc}<br>${recommendationReason}`;
        honeyCard.classList.remove("d-none");
        
        // Render 꿀교양 list
        const honeyContainer = document.getElementById("honey-courses-container");
        honeyContainer.innerHTML = "";
        
        // Filter out honey courses that are already completed by the user
        const incompleteHoney = HONEY_COURSES.filter(honey => {
            return !passedCourses.some(c => normalizeString(c.name) === normalizeString(honey.name));
        });
        
        const coursesToDisplay = incompleteHoney.slice(0, 6); // Display up to 6 courses
        
        if (coursesToDisplay.length === 0) {
            honeyContainer.innerHTML = `<p class="text-success" style="font-size: 0.8rem; width: 100%;">축하합니다! 고려대의 모든 추천 꿀교양을 이수하셨거나 모두 도전해보셨습니다.</p>`;
        } else {
            coursesToDisplay.forEach(honey => {
                const badge = document.createElement("div");
                badge.className = "honey-course-badge";
                badge.innerHTML = `
                    <div>
                        <div style="font-weight: 700;">${honey.name} (${honey.credits}학점)</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal; margin-top: 2px;">${honey.note}</div>
                    </div>
                `;
                honeyContainer.appendChild(badge);
            });
        }
    }
}

function semNameShort(sem) {
    const map = {
        "1-1": "1-1", "1-2": "1-2", "2-1": "2-1", "2-2": "2-2",
        "3-1": "3-1", "3-2": "3-2", "4-1": "4-1", "4-2": "4-2"
    };
    return map[sem] || sem;
}

// 6. Action Handlers
function handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById("student-id").value.trim();
    const name = document.getElementById("student-name").value.trim();
    const password = document.getElementById("student-password").value.trim();
    
    if (id.length !== 10 || isNaN(id)) {
        alert("학번은 숫자 10자리로 입력해 주세요.");
        return;
    }
    
    // Check local storage for this ID
    const usersList = JSON.parse(localStorage.getItem("gpa_manager_users_all") || "{}");
    
    if (usersList[id]) {
        // User exists, verify password
        if (usersList[id].password !== password) {
            alert("입력한 학번에 등록된 비밀번호와 일치하지 않습니다. 다시 입력해 주세요.");
            return;
        }
        state.user = usersList[id];
        // Ensure default API Key is backfilled
        if (!state.user.apiKey) {
            state.user.apiKey = "AQ.Ab8RN6I4G50-zfikWUGFaFfMkUEjksWPYJOqW-kXThIhLo6ifg";
            usersList[id].apiKey = state.user.apiKey;
            localStorage.setItem("gpa_manager_users_all", JSON.stringify(usersList));
        }
    } else {
        // Create new user session
        const newUser = {
            id: id,
            name: name,
            password: password,
            targetGpa: 4.00, // Default target
            englishStatus: false,
            hanjaStatus: false,
            apiKey: "AQ.Ab8RN6I4G50-zfikWUGFaFfMkUEjksWPYJOqW-kXThIhLo6ifg"
        };
        usersList[id] = newUser;
        localStorage.setItem("gpa_manager_users_all", JSON.stringify(usersList));
        state.user = newUser;
    }
    
    localStorage.setItem("gpa_manager_user", JSON.stringify(state.user));
    loadGradesFromStorage();
    showDashboard();
}

function handleLogout() {
    localStorage.removeItem("gpa_manager_user");
    state.user = null;
    state.grades = {};
    document.getElementById("login-form").reset();
    showAuthScreen();
}

function saveUserSession() {
    if (state.user) {
        localStorage.setItem("gpa_manager_user", JSON.stringify(state.user));
        const usersList = JSON.parse(localStorage.getItem("gpa_manager_users_all") || "{}");
        if (usersList[state.user.id]) {
            usersList[state.user.id].targetGpa = state.user.targetGpa;
            usersList[state.user.id].englishStatus = state.user.englishStatus;
            usersList[state.user.id].hanjaStatus = state.user.hanjaStatus;
            localStorage.setItem("gpa_manager_users_all", JSON.stringify(usersList));
        }
    }
}

function handleSaveTarget() {
    const targetGpaVal = parseFloat(document.getElementById("target-gpa").value);
    if (isNaN(targetGpaVal) || targetGpaVal < 0 || targetGpaVal > 4.5) {
        alert("목표 GPA는 0.00에서 4.50 사이의 숫자로 입력해 주세요.");
        return;
    }
    
    state.user.targetGpa = targetGpaVal;
    saveUserSession();
    
    alert("목표 GPA가 저장되었습니다.");
    calculateAndAnalyze();
}

function handleAddCourse(e) {
    e.preventDefault();
    const courseNameInput = document.getElementById("course-name");
    const courseTypeSelect = document.getElementById("course-type");
    const isPnpCheckbox = document.getElementById("course-is-pnp");
    const gradeSelect = document.getElementById("course-grade");
    const pnpGradeSelect = document.getElementById("course-pnp-grade");
    const creditsInput = document.getElementById("course-credits");
    
    const name = courseNameInput.value.trim();
    const type = courseTypeSelect.value;
    const isPnp = isPnpCheckbox.checked;
    const credits = parseInt(creditsInput.value);
    const grade = isPnp ? pnpGradeSelect.value : gradeSelect.value;
    
    if (!name) {
        alert("과목명을 입력해 주세요.");
        return;
    }
    if (isNaN(credits) || credits < 1 || credits > 6) {
        alert("학점은 1학점부터 6학점까지 입력 가능합니다.");
        return;
    }
    
    // Create new course object
    const newCourse = {
        id: "course_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: name,
        type: type,
        isPnp: isPnp,
        grade: grade,
        credits: credits
    };
    
    if (!state.grades[state.activeSemester]) {
        state.grades[state.activeSemester] = [];
    }
    
    state.grades[state.activeSemester].push(newCourse);
    saveGradesToStorage();
    
    // UI Reset
    courseNameInput.value = "";
    isPnpCheckbox.checked = false;
    document.getElementById("grade-select-wrapper").classList.remove("d-none");
    document.getElementById("pnp-select-wrapper").classList.add("d-none");
    
    renderCoursesTable();
    calculateAndAnalyze();
}

function deleteCourse(courseId) {
    if (!state.grades[state.activeSemester]) return;
    
    state.grades[state.activeSemester] = state.grades[state.activeSemester].filter(c => c.id !== courseId);
    saveGradesToStorage();
    
    renderCoursesTable();
    calculateAndAnalyze();
}

// 7. Event Listeners Setup
function setupEventListeners() {
    // Login Submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    
    // Logout Action
    const logoutBtn = document.getElementById("btn-logout-action");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    
    // Save Target GPA
    const saveTargetBtn = document.getElementById("btn-save-target");
    if (saveTargetBtn) saveTargetBtn.addEventListener("click", handleSaveTarget);
    
    // Active Semester change
    const semSelect = document.getElementById("current-semester-select");
    if (semSelect) {
        semSelect.addEventListener("change", function() {
            state.activeSemester = this.value;
            updateSemesterDisplay();
        });
    }
    
    // P/NP Toggle logic
    const pnpCheckbox = document.getElementById("course-is-pnp");
    if (pnpCheckbox) {
        pnpCheckbox.addEventListener("change", function() {
            const gradeWrapper = document.getElementById("grade-select-wrapper");
            const pnpWrapper = document.getElementById("pnp-select-wrapper");
            
            if (this.checked) {
                gradeWrapper.classList.add("d-none");
                pnpWrapper.classList.remove("d-none");
            } else {
                gradeWrapper.classList.remove("d-none");
                pnpWrapper.classList.add("d-none");
            }
        });
    }
    
    // Add Course submission
    const addCourseForm = document.getElementById("add-course-form");
    if (addCourseForm) addCourseForm.addEventListener("submit", handleAddCourse);
    
    // English/Hanja checkbox changes
    const englishCheckbox = document.getElementById("grad-english-status");
    if (englishCheckbox) {
        englishCheckbox.addEventListener("change", function() {
            state.user.englishStatus = this.checked;
            saveUserSession();
            calculateAndAnalyze();
        });
    }
    
    const hanjaCheckbox = document.getElementById("grad-hanja-status");
    if (hanjaCheckbox) {
        hanjaCheckbox.addEventListener("change", function() {
            state.user.hanjaStatus = this.checked;
            saveUserSession();
            calculateAndAnalyze();
        });
    }
}

// Escapes HTML tags to prevent XSS
function escapeHtml(string) {
    const matchHtmlRegExp = /["'&<>]/;
    const str = '' + string;
    const match = matchHtmlRegExp.exec(str);

    if (!match) {
        return str;
    }

    let escape;
    let html = '';
    let index = 0;
    let lastIndex = 0;

    for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
            case 34: // "
                escape = '&quot;';
                break;
            case 38: // &
                escape = '&amp;';
                break;
            case 39: // '
                escape = '&#39;';
                break;
            case 60: // <
                escape = '&lt;';
                break;
            case 62: // >
                escape = '&gt;';
                break;
            default:
                continue;
        }

        if (lastIndex !== index) {
            html += str.substring(lastIndex, index);
        }

        lastIndex = index + 1;
        html += escape;
    }

    return lastIndex !== index
        ? html + str.substring(lastIndex, index)
        : html;
}

// Window load init
window.addEventListener("DOMContentLoaded", initApp);
