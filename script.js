const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".global-nav");

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  navigation.classList.toggle("open", !isOpen);
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    navigation.classList.remove("open");
  });
});

document.querySelectorAll(".clinic-photo img").forEach((image) => {
  const showPlaceholder = () => image.classList.add("image-unavailable");
  image.addEventListener("error", showPlaceholder);
  if (image.complete && image.naturalWidth === 0) showPlaceholder();
});

const schedule = {
  0: [],
  1: [["9:00", "12:00"], ["14:00", "17:00"]],
  2: [["9:00", "12:00"]],
  3: [["9:00", "12:00"], ["14:00", "17:00"]],
  4: [["9:00", "12:00"], ["13:30", "17:00"]],
  5: [["9:00", "12:00"], ["14:00", "17:00"]],
  6: [["9:00", "12:00"], ["13:30", "15:00"]]
};

function getJapaneseHolidays(year) {
  const holidays = new Set();
  const add = (month, day) => holidays.add(`${year}-${month}-${day}`);
  const nthMonday = (month, nth) => {
    const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return 1 + ((8 - firstDay) % 7) + (nth - 1) * 7;
  };

  add(1, 1);
  add(1, nthMonday(1, 2));
  add(2, 11);
  add(2, 23);
  add(3, Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  add(4, 29);
  add(5, 3);
  add(5, 4);
  add(5, 5);
  add(7, nthMonday(7, 3));
  add(8, 11);
  add(9, nthMonday(9, 3));
  add(9, Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  add(10, nthMonday(10, 2));
  add(11, 3);
  add(11, 23);

  for (let month = 1; month <= 12; month += 1) {
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 2; day < days; day += 1) {
      const previous = `${year}-${month}-${day - 1}`;
      const next = `${year}-${month}-${day + 1}`;
      if (holidays.has(previous) && holidays.has(next)) add(month, day);
    }
  }

  [...holidays].forEach((key) => {
    const [, month, day] = key.split("-").map(Number);
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() !== 0) return;
    let substituteDay = day + 1;
    while (holidays.has(`${year}-${month}-${substituteDay}`)) substituteDay += 1;
    add(month, substituteDay);
  });

  return holidays;
}

function updateTodayStatus() {
  const now = new Date();
  const japanParts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);
  const weekdayText = japanParts.find((part) => part.type === "weekday")?.value;
  const dayMap = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };
  const day = dayMap[weekdayText?.replace("曜日", "")] ?? now.getDay();
  const year = Number(japanParts.find((part) => part.type === "year")?.value);
  const month = Number(japanParts.find((part) => part.type === "month")?.value);
  const date = Number(japanParts.find((part) => part.type === "day")?.value);
  const hour = Number(japanParts.find((part) => part.type === "hour")?.value ?? now.getHours());
  const minute = Number(japanParts.find((part) => part.type === "minute")?.value ?? now.getMinutes());
  const currentMinutes = hour * 60 + minute;
  const periods = schedule[day];
  const status = document.querySelector("#today-status");
  const hours = document.querySelector("#today-hours");
  const statusDot = document.querySelector(".status-dot");
  const isHoliday = getJapaneseHolidays(year).has(`${year}-${month}-${date}`);

  if (!status || !hours) return;

  if (periods.length === 0 || isHoliday) {
    status.textContent = "本日は休診です";
    status.classList.add("closed");
    statusDot?.classList.add("closed");
    hours.innerHTML = '<div class="today-period closed"><span>午前</span>休診</div><div class="today-period closed"><span>午後</span>休診</div>';
    return;
  }

  const toMinutes = (time) => {
    const [periodHour, periodMinute] = time.split(":").map(Number);
    return periodHour * 60 + periodMinute;
  };
  const isOpen = periods.some(([start, end]) => currentMinutes >= toMinutes(start) && currentMinutes < toMinutes(end));
  status.textContent = isOpen ? "診療中" : "診療時間外";
  status.classList.toggle("closed", !isOpen);
  statusDot?.classList.toggle("closed", !isOpen);

  const morning = periods[0];
  const afternoon = periods[1];
  hours.innerHTML = `
    <div class="today-period"><span>午前</span>${morning[0]}〜${morning[1]}</div>
    <div class="today-period${afternoon ? "" : " closed"}"><span>午後</span>${afternoon ? `${afternoon[0]}〜${afternoon[1]}` : "休診"}</div>
  `;
}

updateTodayStatus();
document.querySelector("#copyright-year").textContent = new Date().getFullYear();
