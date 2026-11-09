// ========================================
// SMART CLASSROOM - IOT PROTOTYPE
// ========================================

const $ = (id) => document.getElementById(id);

let toastTimer;
let doorLocked = true;

let sensorData = {
    temperature: 26.0,
    humidity: 55,
    aqi: 42,
    lux: 420
};

// Sample classroom students
const students = Array.from({ length: 40 }, (_, i) => ({
    roll: i + 1,
    name: [
        "Aarav Sharma", "Aditi Verma", "Arjun Singh",
        "Ananya Gupta", "Aditya Kumar", "Diya Patel",
        "Ishaan Mehta", "Kavya Joshi", "Krishna Rao",
        "Meera Singh", "Rohan Sharma", "Sanya Kapoor",
        "Rahul Verma", "Priya Malhotra", "Karan Gill",
        "Simran Kaur", "Vansh Gupta", "Neha Yadav",
        "Manav Arora", "Riya Sharma"
    ][i % 20] + (i >= 20 ? ` ${Math.floor(i / 20) + 1}` : ""),
    present: i < 32
}));

// ========================================
// DATE AND TIME
// ========================================

function updateDate() {
    $("currentDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}

updateDate();

// ========================================
// TOAST NOTIFICATIONS
// ========================================

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

// ========================================
// NAVIGATION
// ========================================

const pageNames = {
    dashboard: "Dashboard Overview",
    environment: "Environmental Monitoring",
    attendance: "Attendance Management",
    automation: "Intelligent Automation",
    security: "Access Control"
};

function showPage(pageId) {
    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.toggle(
            "hidden",
            section.id !== pageId
        );
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.section === pageId
        );
    });

    $("pageTitle").textContent =
        pageNames[pageId] || "Dashboard";

    if (pageId === "attendance") {
        renderStudents();
    }

    // Refresh charts when their sections become visible
    setTimeout(() => {
        if (environmentChart) environmentChart.resize();
        if (sensorChart) sensorChart.resize();
    }, 50);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.section);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

// ========================================
// ATTENDANCE MANAGEMENT
// ========================================

function getAttendance() {
    const present = students.filter(s => s.present).length;
    const absent = students.length - present;
    const percent = Math.round(
        (present / students.length) * 100
    );

    return { present, absent, percent };
}

function updateAttendance() {
    const { present, absent, percent } = getAttendance();

    $("presentCount").textContent = present;
    $("attendanceProgress").style.width = percent + "%";

    $("attendancePercent").textContent = percent + "%";
    $("legendPresent").textContent = present;
    $("legendAbsent").textContent = absent;

    $("attendancePresentCard").textContent = present;
    $("attendanceAbsentCard").textContent = absent;
    $("attendanceRateCard").textContent = percent + "%";

    $("attendanceCircle").style.background =
        `conic-gradient(
            var(--green) 0% ${percent}%,
            #293751 ${percent}% 100%
        )`;
}

function renderStudents() {
    const query = $("studentSearch").value
        .trim()
        .toLowerCase();

    const filtered = students.filter(student =>
        student.name.toLowerCase().includes(query) ||
        String(student.roll).includes(query)
    );

    $("studentTable").innerHTML = filtered.map(student => `
        <tr>
            <td>#${String(student.roll).padStart(3, "0")}</td>
            <td>${student.name}</td>
            <td>
                <span class="status ${student.present ? "present" : "absent"}">
                    ${student.present ? "Present" : "Absent"}
                </span>
            </td>
            <td>
                <button class="table-button"
                    data-roll="${student.roll}">
                    Mark ${student.present ? "Absent" : "Present"}
                </button>
            </td>
        </tr>
    `).join("");

    $("studentTable").querySelectorAll("[data-roll]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const student = students.find(
                    s => s.roll === Number(button.dataset.roll)
                );

                student.present = !student.present;

                updateAttendance();
                renderStudents();

                addActivity(
                    "Attendance updated",
                    `${student.name}: ${student.present ? "Present" : "Absent"}`,
                    "blue"
                );

                showToast(
                    `${student.name} marked ${student.present ? "present" : "absent"}`
                );
            });
        });
}

$("studentSearch").addEventListener("input", renderStudents);

$("markAllPresent").addEventListener("click", () => {
    students.forEach(student => {
        student.present = true;
    });

    updateAttendance();
    renderStudents();

    addActivity(
        "Attendance updated",
        "All 40 students marked present",
        "green"
    );

    showToast("All students marked present");
});

// ========================================
// DEVICE CONTROL
// ========================================

const devices = [
    {
        id: "lightToggle",
        status: "lightStatus",
        on: "Lights are ON",
        off: "Lights are OFF",
        name: "Smart Lighting"
    },
    {
        id: "acToggle",
        status: "acStatus",
        on: "Cooling is ON",
        off: "Cooling is OFF",
        name: "Air Conditioning"
    },
    {
        id: "projectorToggle",
        status: "projectorStatus",
        on: "Projector is ON",
        off: "Projector is OFF",
        name: "Projector"
    },
    {
        id: "fanToggle",
        status: "fanStatus",
        on: "Fan is ON",
        off: "Fan is OFF",
        name: "Ventilation Fan"
    }
];

function updateEnergy() {
    let energy = 0;

    if ($("lightToggle").checked) energy += 0.4;
    if ($("acToggle").checked) energy += 1.5;
    if ($("projectorToggle").checked) energy += 0.3;
    if ($("fanToggle").checked) energy += 0.2;

    energy = Number(energy.toFixed(1));

    $("energyValue").textContent = energy.toFixed(1);
    $("energyProgress").style.width =
        Math.min((energy / 5) * 100, 100) + "%";
}

function addActivity(title, description, color = "green") {
    const list = $("activityList");

    const item = document.createElement("div");
    item.className = "activity-item";

    const symbol = color === "orange" ? "⚡" :
                   color === "blue" ? "♙" : "✓";

    item.innerHTML = `
        <span class="activity-symbol ${color}">${symbol}</span>
        <div>
            <strong></strong>
            <small></small>
        </div>
        <time>Now</time>
    `;

    item.querySelector("strong").textContent = title;
    item.querySelector("small").textContent = description;

    list.prepend(item);

    // Keep the activity list compact
    while (list.children.length > 6) {
        list.lastElementChild.remove();
    }
}

devices.forEach(device => {
    $(device.id).addEventListener("change", () => {
        const isOn = $(device.id).checked;

        $(device.status).textContent =
            isOn ? device.on : device.off;

        updateEnergy();

        addActivity(
            device.name,
            isOn ? "Device switched ON" : "Device switched OFF",
            isOn ? "green" : "orange"
        );

        showToast(
            `${device.name} ${isOn ? "turned ON" : "turned OFF"}`
        );
    });
});

// ========================================
// SENSOR SIMULATION
// ========================================

function randomBetween(min, max, decimals = 0) {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
}

function refreshSensors() {
    sensorData.temperature = randomBetween(24, 29, 1);
    sensorData.humidity = randomBetween(40, 70);
    sensorData.aqi = randomBetween(25, 100);
    sensorData.lux = randomBetween(200, 700);

    updateSensorDisplay();
    updateCharts();

    showToast("Sensor readings refreshed");
}

function updateSensorDisplay() {
    const s = sensorData;

    $("temperature").textContent =
        s.temperature.toFixed(1) + "°C";

    $("envTemperature").textContent =
        s.temperature.toFixed(1) + "°C";

    $("humidity").textContent = s.humidity + "%";
    $("aqi").textContent = "AQI: " + s.aqi;
    $("envAqi").textContent = "AQI: " + s.aqi;
    $("lux").textContent = s.lux + " lux";

    const quality = s.aqi <= 50 ? "Good" :
                    s.aqi <= 100 ? "Moderate" : "Poor";

    $("airQuality").textContent = quality;
    $("envAir").textContent = quality;
}

$("refreshSensors").addEventListener("click", refreshSensors);

// ========================================
// AUTOMATION SETTINGS
// ========================================

$("brightnessRange").addEventListener("input", event => {
    $("brightnessValue").textContent =
        event.target.value + " lux";

    updateAutomation();
});

$("targetTemperature").addEventListener("input", event => {
    $("targetValue").textContent =
        event.target.value + "°C";

    updateAutomation();
});

["autoLight", "autoClimate", "energySaving"].forEach(id => {
    $(id).addEventListener("change", updateAutomation);
});

function updateAutomation() {
    const messages = [];

    if ($("autoLight").checked) {
        messages.push("Smart lighting automation enabled.");
    } else {
        messages.push("Smart lighting automation disabled.");
    }

    if ($("autoClimate").checked) {
        messages.push("Climate control automation enabled.");
    } else {
        messages.push("Climate control automation disabled.");
    }

    if ($("energySaving").checked) {
        messages.push("Energy-saving mode enabled.");
    } else {
        messages.push("Energy-saving mode disabled.");
    }

    $("automationMessage").textContent = messages.join(" ");
}

// ========================================
// ACCESS CONTROL
// ========================================

function addAccessLog(message) {
    const item = document.createElement("div");
    item.className = "activity-item";

    item.innerHTML = `
        <span class="activity-symbol green">✓</span>
        <div>
            <strong></strong>
            <small>Classroom access control</small>
        </div>
        <time>Now</time>
    `;

    item.querySelector("strong").textContent = message;

    $("accessLog").prepend(item);

    while ($("accessLog").children.length > 8) {
        $("accessLog").lastElementChild.remove();
    }
}

function updateDoor() {
    const status = $("doorStatus");
    const button = $("doorToggle");

    if (doorLocked) {
        status.textContent = "🔒 Door Locked";
        status.className = "door-status locked";
        button.textContent = "Unlock Door";
    } else {
        status.textContent = "🔓 Door Unlocked";
        status.className = "door-status unlocked";
        button.textContent = "Lock Door";
    }
}

$("doorToggle").addEventListener("click", () => {
    doorLocked = !doorLocked;

    updateDoor();

    const message = doorLocked
        ? "Door locked"
        : "Door unlocked";

    addAccessLog(message);
    showToast(message);
});

// ========================================
// CHARTS
// ========================================

const chartLabels = [
    "09:00", "09:30", "10:00",
    "10:30", "11:00", "11:30"
];

let temperatureHistory = [25, 25.5, 26, 25.8, 26.4, 26];
let humidityHistory = [52, 53, 55, 54, 56, 55];

function makeChart(canvasId, labels, datasets) {
    return new Chart($(canvasId), {
        type: "line",

        data: {
            labels,
            datasets
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    labels: {
                        color: "#9aabc6",
                        usePointStyle: true,
                        boxWidth: 8,
                        padding: 20
                    }
                }
            },

            scales: {
                x: {
                    grid: {
                        color: "#202e48"
                    },
                    ticks: {
                        color: "#8191ac"
                    },
                    border: {
                        display: false
                    }
                },

                y: {
                    grid: {
                        color: "#202e48"
                    },
                    ticks: {
                        color: "#8191ac"
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
}

let environmentChart = makeChart(
    "environmentChart",
    chartLabels,
    [
        {
            label: "Temperature (°C)",
            data: temperatureHistory,
            borderColor: "#22d3ee",
            backgroundColor: "rgba(34,211,238,0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 3
        }
    ]
);

let sensorChart = makeChart(
    "sensorChart",
    chartLabels,
    [
        {
            label: "Temperature (°C)",
            data: temperatureHistory,
            borderColor: "#22d3ee",
            tension: 0.4
        },
        {
            label: "Humidity (%)",
            data: humidityHistory,
            borderColor: "#ae8cff",
            tension: 0.4
        }
    ]
);

function updateCharts() {
    const label = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    chartLabels.push(label);
    temperatureHistory.push(sensorData.temperature);
    humidityHistory.push(sensorData.humidity);

    // Keep the last six readings
    if (chartLabels.length > 6) {
        chartLabels.shift();
        temperatureHistory.shift();
        humidityHistory.shift();
    }

    environmentChart.data.labels = [...chartLabels];
    environmentChart.data.datasets[0].data =
        [...temperatureHistory];

    sensorChart.data.labels = [...chartLabels];
    sensorChart.data.datasets[0].data =
        [...temperatureHistory];

    sensorChart.data.datasets[1].data =
        [...humidityHistory];

    environmentChart.update();
    sensorChart.update();
}

// ========================================
// AUTOMATED CLASSROOM RULES
// ========================================

function runAutomationRules() {
    // Simulate lighting automation using ambient light
    if ($("autoLight").checked) {
        const threshold = Number($("brightnessRange").value);

        if (sensorData.lux < threshold && !$("lightToggle").checked) {
            $("lightToggle").checked = true;
            $("lightStatus").textContent = "Lights are ON";
            addActivity(
                "Automated lighting",
                "Lights switched on due to low light",
                "orange"
            );
            updateEnergy();
        } else if (
            sensorData.lux >= threshold &&
            $("lightToggle").checked
        ) {
            $("lightToggle").checked = false;
            $("lightStatus").textContent = "Lights are OFF";
            addActivity(
                "Automated lighting",
                "Lights switched off due to sufficient light",
                "orange"
            );
            updateEnergy();
        }
    }

    // Simulate climate control
    if ($("autoClimate").checked) {
        const target = Number($("targetTemperature").value);

        if (
            sensorData.temperature > target &&
            !$("acToggle").checked
        ) {
            $("acToggle").checked = true;
            $("acStatus").textContent = "Cooling is ON";
            updateEnergy();
        }
    }

    // Simulate energy-saving policy
    const present = getAttendance().present;

    if ($("energySaving").checked && present === 0) {
        devices.forEach(device => {
            if (device.id !== "acToggle") {
                $(device.id).checked = false;
                $(device.status).textContent = device.off;
            }
        });

        updateEnergy();
    }
}

// ========================================
// INITIALIZATION
// ========================================

updateAttendance();
updateEnergy();
updateSensorDisplay();
updateDoor();
renderStudents();
updateAutomation();

// Update simulated readings every 15 seconds
setInterval(() => {
    sensorData.temperature = randomBetween(24, 29, 1);
    sensorData.humidity = randomBetween(40, 70);
    sensorData.aqi = randomBetween(25, 100);
    sensorData.lux = randomBetween(200, 700);

    updateSensorDisplay();
    updateCharts();
    runAutomationRules();
}, 15000);